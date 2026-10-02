package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type NotificationTemplateRepository interface {
	FindAll() ([]model.NotificationTemplate, error)
	FindByID(int) (*model.NotificationTemplate, error)
	FindByCode(string) (*model.NotificationTemplate, error)
	Save(*model.NotificationTemplate) (*model.NotificationTemplate, error)
	Update(int, *model.NotificationTemplate) (*model.NotificationTemplate, error)
	Delete(int) error
}

type notificationTemplateRepo struct{ db *gorm.DB }

func NewNotificationTemplateRepository(db *gorm.DB) NotificationTemplateRepository {
	return &notificationTemplateRepo{db}
}

func (r *notificationTemplateRepo) FindAll() ([]model.NotificationTemplate, error) {
	var items []model.NotificationTemplate
	err := r.db.Find(&items).Error
	return items, err
}

func (r *notificationTemplateRepo) FindByID(id int) (*model.NotificationTemplate, error) {
	var t model.NotificationTemplate
	err := r.db.Where("id = ?", id).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *notificationTemplateRepo) FindByCode(code string) (*model.NotificationTemplate, error) {
	var t model.NotificationTemplate
	err := r.db.Where("code = ?", code).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *notificationTemplateRepo) Save(t *model.NotificationTemplate) (*model.NotificationTemplate, error) {
	if err := r.db.Create(t).Error; err != nil {
		return nil, err
	}
	return t, nil
}

func (r *notificationTemplateRepo) Update(id int, t *model.NotificationTemplate) (*model.NotificationTemplate, error) {
	if _, err := r.FindByID(id); err != nil {
		return nil, err
	}
	t.ID = &id
	if err := r.db.Model(&model.NotificationTemplate{}).Where("id = ?", id).Updates(t).Error; err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *notificationTemplateRepo) Delete(id int) error {
	return r.db.Delete(&model.NotificationTemplate{}, id).Error
}
