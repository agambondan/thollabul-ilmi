package repository

import (
	"database/sql"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type QuizRepository interface {
	FindAll(page, size int) ([]model.Quiz, error)
	FindSession(quizType model.QuizType, count int) ([]model.Quiz, error)
	FindByID(id int) (*model.Quiz, error)
	SaveResult(r *model.UserQuizResult) error
	GetStats(userID uuid.UUID) (*model.QuizStats, error)
	Create(q *model.Quiz) (*model.Quiz, error)
	Update(id int, q *model.Quiz) (*model.Quiz, error)
	Delete(id int) error
}

type quizRepository struct{ db *gorm.DB }

func NewQuizRepository(db *gorm.DB) QuizRepository {
	return &quizRepository{db}
}

func (r *quizRepository) quizTableName() string {
	if r.db != nil && r.db.Migrator().HasTable("quiz") {
		return "quiz"
	}
	return "quizzes"
}

func (r *quizRepository) baseSelectSQL() string {
	tbl := r.quizTableName()
	return `
		SELECT
			q.id, q.type, q.question_text, q.correct_answer, q.options, q.explanation,
			q.difficulty, q.ref_id, q.translation_id, q.source, q.created_at, q.updated_at, q.deleted_at,
			t.id, t.idn, t.en, t.ar
		FROM ` + tbl + ` q
		LEFT JOIN translation t ON t.id = q.translation_id AND t.deleted_at IS NULL
	`
}

func scanQuizRow(scanner interface{ Scan(...interface{}) error }) (model.Quiz, error) {
	var item model.Quiz
	var tID *int
	var tIdn, tEn, tAr *string
	var createdAt, updatedAt *time.Time

	err := scanner.Scan(
		&item.ID,
		&item.Type,
		&item.QuestionText,
		&item.CorrectAnswer,
		&item.Options,
		&item.Explanation,
		&item.Difficulty,
		&item.RefID,
		&item.TranslationID,
		&item.Source,
		&createdAt,
		&updatedAt,
		&item.DeletedAt,
		&tID,
		&tIdn,
		&tEn,
		&tAr,
	)
	if err != nil {
		return item, err
	}
	item.CreatedAt = createdAt
	item.UpdatedAt = updatedAt

	if tID != nil {
		item.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}
	return item, nil
}

func scanQuizRows(rows *sql.Rows) ([]model.Quiz, error) {
	var list []model.Quiz
	for rows.Next() {
		item, err := scanQuizRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, rows.Err()
}

func (r *quizRepository) FindAll(page, size int) ([]model.Quiz, error) {
	if page < 0 {
		page = 0
	}
	if size <= 0 {
		size = 100
	}
	rows, err := r.db.Raw(r.baseSelectSQL()+` WHERE q.deleted_at IS NULL ORDER BY q.id ASC LIMIT ? OFFSET ?`, size, page*size).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanQuizRows(rows)
}

func (r *quizRepository) FindSession(quizType model.QuizType, count int) ([]model.Quiz, error) {
	if count <= 0 || count > 20 {
		count = 10
	}
	query := r.baseSelectSQL() + ` WHERE q.deleted_at IS NULL`
	var args []interface{}
	if quizType != "" {
		query += " AND q.type = ?"
		args = append(args, quizType)
	}
	query += " ORDER BY RANDOM() LIMIT ?"
	args = append(args, count)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanQuizRows(rows)
}

func (r *quizRepository) FindByID(id int) (*model.Quiz, error) {
	rows, err := r.db.Raw(r.baseSelectSQL()+` WHERE q.id = ? AND q.deleted_at IS NULL LIMIT 1`, id).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return nil, gorm.ErrRecordNotFound
	}
	item, err := scanQuizRow(rows)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *quizRepository) SaveResult(res *model.UserQuizResult) error {
	return r.db.Create(res).Error
}

func (r *quizRepository) GetStats(userID uuid.UUID) (*model.QuizStats, error) {
	var total, correct int64
	r.db.Model(&model.UserQuizResult{}).Where("user_id = ?", userID).Count(&total)
	r.db.Model(&model.UserQuizResult{}).Where("user_id = ? AND is_correct = true", userID).Count(&correct)
	acc := 0.0
	if total > 0 {
		acc = float64(correct) / float64(total) * 100
	}
	return &model.QuizStats{TotalAnswered: int(total), TotalCorrect: int(correct), Accuracy: acc}, nil
}

func (r *quizRepository) Create(q *model.Quiz) (*model.Quiz, error) {
	return q, r.db.Create(q).Error
}

func (r *quizRepository) Update(id int, q *model.Quiz) (*model.Quiz, error) {
	updates := map[string]interface{}{
		"type":           q.Type,
		"question_text":  q.QuestionText,
		"correct_answer": q.CorrectAnswer,
		"options":        q.Options,
		"explanation":    q.Explanation,
		"difficulty":     q.Difficulty,
		"source":         q.Source,
	}
	if err := r.db.Model(&model.Quiz{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *quizRepository) Delete(id int) error {
	return r.db.Delete(&model.Quiz{}, id).Error
}
