package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserActivityRepository interface {
	Record(uuid.UUID, model.ActivityType) error
	FindByUserID(uuid.UUID) ([]model.UserActivity, error)
	FindByUserIDSince(uuid.UUID, time.Time) ([]model.UserActivity, error)
}

type userActivityRepo struct {
	db *gorm.DB
}

func NewUserActivityRepository(db *gorm.DB) UserActivityRepository {
	return &userActivityRepo{db}
}

func (r *userActivityRepo) Record(userID uuid.UUID, actType model.ActivityType) error {
	today := time.Now().Truncate(24 * time.Hour)
	activity := &model.UserActivity{
		BaseUUID:     model.BaseUUID{ID: uuid.New()},
		UserID:       userID,
		ActivityDate: today,
		Type:         actType,
		Count:        1,
	}
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "activity_date"}, {Name: "type"}},
		DoUpdates: clause.Assignments(map[string]interface{}{"count": gorm.Expr("user_activity.count + 1")}),
	}).Create(activity).Error
}

func (r *userActivityRepo) FindByUserID(userID uuid.UUID) ([]model.UserActivity, error) {
	var activities []model.UserActivity
	err := r.db.Where("user_id = ?", userID).Order("activity_date desc").Limit(365).Find(&activities).Error
	return activities, err
}

func (r *userActivityRepo) FindByUserIDSince(userID uuid.UUID, since time.Time) ([]model.UserActivity, error) {
	var activities []model.UserActivity
	err := r.db.Where("user_id = ? AND activity_date >= ?", userID, since).
		Order("activity_date desc").Find(&activities).Error
	return activities, err
}
