package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type LessonRepository interface {
	FindAll() ([]model.LessonModule, error)
	FindBySlug(slug string) (*model.LessonModule, error)
	FindProgress(userID uuid.UUID) ([]model.UserLessonProgress, error)
	UpsertProgress(p *model.UserLessonProgress) (*model.UserLessonProgress, error)
}

type lessonRepository struct{ db *gorm.DB }

func NewLessonRepository(db *gorm.DB) LessonRepository {
	return &lessonRepository{db}
}

func (r *lessonRepository) FindAll() ([]model.LessonModule, error) {
	var items []model.LessonModule
	err := r.db.Preload("Steps", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("step_order ASC")
	}).Order("`order` ASC, id ASC").Find(&items).Error
	return items, err
}

func (r *lessonRepository) FindBySlug(slug string) (*model.LessonModule, error) {
	var m model.LessonModule
	err := r.db.Preload("Steps", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("step_order ASC")
	}).Where("slug = ?", slug).First(&m).Error
	return &m, err
}

func (r *lessonRepository) FindProgress(userID uuid.UUID) ([]model.UserLessonProgress, error) {
	var items []model.UserLessonProgress
	err := r.db.Where("user_id = ?", userID).Find(&items).Error
	return items, err
}

func (r *lessonRepository) UpsertProgress(p *model.UserLessonProgress) (*model.UserLessonProgress, error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	err := r.db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "user_id"}, {Name: "module_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"step", "done", "updated_at"}),
	}).Create(p).Error
	return p, err
}
