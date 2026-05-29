package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type GoalRepository interface {
	Create(g *model.StudyGoal) (*model.StudyGoal, error)
	FindByUserID(userID uuid.UUID) ([]model.StudyGoal, error)
	FindByID(id int, userID uuid.UUID) (*model.StudyGoal, error)
	Update(id int, userID uuid.UUID, g *model.StudyGoal) (*model.StudyGoal, error)
	Delete(id int, userID uuid.UUID) error
}

type goalRepository struct {
	db *gorm.DB
}

func NewGoalRepository(db *gorm.DB) GoalRepository {
	return &goalRepository{db}
}

func (r *goalRepository) Create(g *model.StudyGoal) (*model.StudyGoal, error) {
	err := r.db.Create(g).Error
	return g, err
}

func (r *goalRepository) FindByUserID(userID uuid.UUID) ([]model.StudyGoal, error) {
	var list []model.StudyGoal
	err := r.db.Where("user_id = ?", userID).Order("is_completed, end_date, id").Find(&list).Error
	return list, err
}

func (r *goalRepository) FindByID(id int, userID uuid.UUID) (*model.StudyGoal, error) {
	var g model.StudyGoal
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&g).Error
	return &g, err
}

func (r *goalRepository) Update(id int, userID uuid.UUID, g *model.StudyGoal) (*model.StudyGoal, error) {
	var existing model.StudyGoal
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&existing).Error; err != nil {
		return nil, err
	}
	err := r.db.Model(&existing).Updates(g).Error
	return &existing, err
}

func (r *goalRepository) Delete(id int, userID uuid.UUID) error {
	return deleteResultError(r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.StudyGoal{}))
}
