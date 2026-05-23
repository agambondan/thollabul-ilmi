package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type DailyReminderRepository interface {
	FindAll(reminderType, lang string, activeOnly bool, limit, offset int) ([]model.DailyReminder, error)
	FindByID(int) (*model.DailyReminder, error)
	Create(*model.DailyReminder) (*model.DailyReminder, error)
	Update(int, *model.DailyReminder) (*model.DailyReminder, error)
	Delete(int) error
}

type dailyReminderRepo struct {
	db *gorm.DB
}

func NewDailyReminderRepository(db *gorm.DB) DailyReminderRepository {
	return &dailyReminderRepo{db}
}

func (r *dailyReminderRepo) FindAll(reminderType, lang string, activeOnly bool, limit, offset int) ([]model.DailyReminder, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	query := r.db.Model(&model.DailyReminder{})
	if reminderType != "" {
		query = query.Where("type = ?", reminderType)
	}
	if lang != "" {
		query = query.Where("lang = ?", lang)
	}
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	var list []model.DailyReminder
	err := query.Order("display_order ASC, id ASC").Limit(limit).Offset(offset).Find(&list).Error
	return list, err
}

func (r *dailyReminderRepo) FindByID(id int) (*model.DailyReminder, error) {
	var item model.DailyReminder
	if err := r.db.First(&item, id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *dailyReminderRepo) Create(item *model.DailyReminder) (*model.DailyReminder, error) {
	requestedActive := item.IsActive
	if err := r.db.Select("*").Create(item).Error; err != nil {
		return nil, err
	}
	if !requestedActive {
		if err := r.db.Model(&model.DailyReminder{}).Where("id = ?", *item.ID).Update("is_active", false).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(*item.ID)
}

func (r *dailyReminderRepo) Update(id int, item *model.DailyReminder) (*model.DailyReminder, error) {
	var existing model.DailyReminder
	if err := r.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	if err := r.db.Model(&existing).Updates(map[string]interface{}{
		"type":          item.Type,
		"title":         item.Title,
		"text":          item.Text,
		"author":        item.Author,
		"source":        item.Source,
		"lang":          item.Lang,
		"is_active":     item.IsActive,
		"display_order": item.DisplayOrder,
	}).Error; err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *dailyReminderRepo) Delete(id int) error {
	return r.db.Delete(&model.DailyReminder{}, id).Error
}
