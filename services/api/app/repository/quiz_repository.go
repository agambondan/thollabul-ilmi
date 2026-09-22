package repository

import (
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

func (r *quizRepository) FindAll(page, size int) ([]model.Quiz, error) {
	if page < 0 {
		page = 0
	}
	if size <= 0 {
		size = 100
	}
	var items []model.Quiz
	err := r.db.Preload("Translation").
		Order("id ASC").
		Offset(page * size).
		Limit(size).
		Find(&items).Error
	return items, err
}

func (r *quizRepository) FindSession(quizType model.QuizType, count int) ([]model.Quiz, error) {
	var items []model.Quiz
	q := r.db.Preload("Translation").Order("RANDOM()")
	if quizType != "" {
		q = q.Where("type = ?", quizType)
	}
	if count <= 0 || count > 20 {
		count = 10
	}
	return items, q.Limit(count).Find(&items).Error
}

func (r *quizRepository) FindByID(id int) (*model.Quiz, error) {
	var item model.Quiz
	return &item, r.db.Preload("Translation").First(&item, id).Error
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
