package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ForumRepository interface {
	CreateQuestion(*model.ForumQuestion) error
	FindQuestions(page, limit int, search, tag string) ([]model.ForumQuestion, int64, error)
	FindQuestionBySlug(string) (*model.ForumQuestion, error)
	FindQuestionByID(uuid.UUID) (*model.ForumQuestion, error)
	IncrementView(uuid.UUID) error
	UpdateQuestion(*model.ForumQuestion) error
	DeleteQuestion(uuid.UUID, uuid.UUID) error

	CreateAnswer(*model.ForumAnswer) error
	FindAnswersByQuestion(uuid.UUID) ([]model.ForumAnswer, error)
	FindAnswerByID(uuid.UUID) (*model.ForumAnswer, error)
	AcceptAnswer(answerID, questionID, userID uuid.UUID) error
	DeleteAnswer(uuid.UUID, uuid.UUID) error

	FindVote(userID, targetID uuid.UUID, targetType string) (*model.ForumVote, error)
	CreateVote(*model.ForumVote) error
	DeleteVote(uuid.UUID) error
}

type forumRepo struct {
	db *gorm.DB
}

func NewForumRepository(db *gorm.DB) ForumRepository {
	return &forumRepo{db}
}

func (r *forumRepo) CreateQuestion(q *model.ForumQuestion) error {
	return r.db.Create(q).Error
}

func (r *forumRepo) FindQuestions(page, limit int, search, tag string) ([]model.ForumQuestion, int64, error) {
	var questions []model.ForumQuestion
	var total int64
	query := r.db.Model(&model.ForumQuestion{}).Preload("User")
	if search != "" {
		query = query.Where("title ILIKE ? OR body ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if tag != "" {
		query = query.Where("tags ILIKE ?", "%"+tag+"%")
	}
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := query.Order("created_at desc").Offset((page - 1) * limit).Limit(limit).Find(&questions).Error
	return questions, total, err
}

func (r *forumRepo) FindQuestionBySlug(slug string) (*model.ForumQuestion, error) {
	var q model.ForumQuestion
	err := r.db.Preload("User").Preload("Answers").Preload("Answers.User").
		Where("slug = ?", slug).First(&q).Error
	if err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *forumRepo) FindQuestionByID(id uuid.UUID) (*model.ForumQuestion, error) {
	var q model.ForumQuestion
	err := r.db.Where("id = ?", id).First(&q).Error
	if err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *forumRepo) IncrementView(id uuid.UUID) error {
	return r.db.Model(&model.ForumQuestion{}).Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

func (r *forumRepo) UpdateQuestion(q *model.ForumQuestion) error {
	return r.db.Save(q).Error
}

func (r *forumRepo) DeleteQuestion(id, userID uuid.UUID) error {
	return deleteResultError(r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.ForumQuestion{}))
}

func (r *forumRepo) CreateAnswer(a *model.ForumAnswer) error {
	return r.db.Create(a).Error
}

func (r *forumRepo) FindAnswersByQuestion(questionID uuid.UUID) ([]model.ForumAnswer, error) {
	var answers []model.ForumAnswer
	err := r.db.Preload("User").Where("question_id = ?", questionID).
		Order("is_accepted desc, vote_count desc, created_at asc").Find(&answers).Error
	return answers, err
}

func (r *forumRepo) FindAnswerByID(id uuid.UUID) (*model.ForumAnswer, error) {
	var a model.ForumAnswer
	err := r.db.First(&a, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *forumRepo) AcceptAnswer(answerID, questionID, userID uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.ForumAnswer{}).Where("question_id = ?", questionID).
			Update("is_accepted", false).Error; err != nil {
			return err
		}
		if err := tx.Model(&model.ForumAnswer{}).Where("id = ? AND question_id = ?", answerID, questionID).
			Updates(map[string]interface{}{"is_accepted": true}).Error; err != nil {
			return err
		}
		return tx.Model(&model.ForumQuestion{}).Where("id = ?", questionID).
			Updates(map[string]interface{}{"is_answered": true, "best_answer_id": answerID}).Error
	})
}

func (r *forumRepo) DeleteAnswer(id, userID uuid.UUID) error {
	return deleteResultError(r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.ForumAnswer{}))
}

func (r *forumRepo) FindVote(userID, targetID uuid.UUID, targetType string) (*model.ForumVote, error) {
	var v model.ForumVote
	err := r.db.Where("user_id = ? AND target_id = ? AND target_type = ?", userID, targetID, targetType).
		First(&v).Error
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *forumRepo) CreateVote(v *model.ForumVote) error {
	return r.db.Create(v).Error
}

func (r *forumRepo) DeleteVote(id uuid.UUID) error {
	return r.db.Delete(&model.ForumVote{}, id).Error
}
