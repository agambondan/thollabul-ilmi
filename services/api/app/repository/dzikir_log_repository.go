package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DzikirLogRepository interface {
	Save(*model.DzikirLog) (*model.DzikirLog, error)
	FindByUserIDAndDate(userID uuid.UUID, date string) ([]model.DzikirLog, error)
	FindByUserIDDateAndDzikirID(userID uuid.UUID, date string, dzikirID int) (*model.DzikirLog, error)
	DeleteByID(id, userID uuid.UUID) error
}

type dzikirLogRepo struct {
	db *gorm.DB
}

func NewDzikirLogRepository(db *gorm.DB) DzikirLogRepository {
	return &dzikirLogRepo{db}
}

func (r *dzikirLogRepo) Save(log *model.DzikirLog) (*model.DzikirLog, error) {
	if err := r.db.Create(log).Error; err != nil {
		return nil, err
	}
	return log, nil
}

func (r *dzikirLogRepo) FindByUserIDAndDate(userID uuid.UUID, date string) ([]model.DzikirLog, error) {
	var list []model.DzikirLog
	err := r.db.Where("user_id = ? AND log_date = ?", userID, date).Find(&list).Error
	return list, err
}

func (r *dzikirLogRepo) FindByUserIDDateAndDzikirID(userID uuid.UUID, date string, dzikirID int) (*model.DzikirLog, error) {
	var log model.DzikirLog
	err := r.db.Where("user_id = ? AND log_date = ? AND dzikir_id = ?", userID, date, dzikirID).First(&log).Error
	if err != nil {
		return nil, err
	}
	return &log, nil
}

func (r *dzikirLogRepo) DeleteByID(id, userID uuid.UUID) error {
	return deleteResultError(r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.DzikirLog{}))
}
