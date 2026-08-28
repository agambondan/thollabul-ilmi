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
	CreateModule(m *model.LessonModule) (*model.LessonModule, error)
	UpdateModule(id int, m *model.LessonModule) (*model.LessonModule, error)
	DeleteModule(id int) error
}

type lessonRepository struct{ db *gorm.DB }

func NewLessonRepository(db *gorm.DB) LessonRepository {
	return &lessonRepository{db}
}

func (r *lessonRepository) FindAll() ([]model.LessonModule, error) {
	var items []model.LessonModule
	err := r.db.Preload("Steps", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("step_order ASC")
	}).Order("\"order\" ASC, id ASC").Find(&items).Error
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
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "module_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"step_num", "done", "updated_at"}),
	}).Create(p).Error
	return p, err
}

func (r *lessonRepository) CreateModule(m *model.LessonModule) (*model.LessonModule, error) {
	if err := r.db.Omit("Steps").Create(m).Error; err != nil {
		return nil, err
	}
	if len(m.Steps) > 0 {
		for i := range m.Steps {
			m.Steps[i].ModuleID = *m.ID
		}
		if err := r.db.Create(&m.Steps).Error; err != nil {
			return nil, err
		}
	}
	return r.FindBySlug(m.Slug)
}

func (r *lessonRepository) UpdateModule(id int, m *model.LessonModule) (*model.LessonModule, error) {
	if err := r.db.Model(&model.LessonModule{}).Where("id = ?", id).Updates(map[string]interface{}{
		"slug": m.Slug, "title": m.Title, "description": m.Description, "icon": m.Icon, "\"order\"": m.Order,
	}).Error; err != nil {
		return nil, err
	}
	if len(m.Steps) > 0 {
		if err := r.db.Where("module_id = ?", id).Delete(&model.LessonStep{}).Error; err != nil {
			return nil, err
		}
		for i := range m.Steps {
			m.Steps[i].ModuleID = id
		}
		if err := r.db.Create(&m.Steps).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(id)
}

func (r *lessonRepository) DeleteModule(id int) error {
	if err := r.db.Where("module_id = ?", id).Delete(&model.LessonStep{}).Error; err != nil {
		return err
	}
	return r.db.Delete(&model.LessonModule{}, id).Error
}

func (r *lessonRepository) FindByID(id int) (*model.LessonModule, error) {
	var m model.LessonModule
	err := r.db.Preload("Steps", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("step_order ASC")
	}).First(&m, id).Error
	return &m, err
}
