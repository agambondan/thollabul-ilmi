package repository

import (
	"fmt"
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func setupAchievementBenchmarkDB(b *testing.B) (*gorm.DB, uuid.UUID) {
	b.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=private"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		b.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(&model.Achievement{}, &model.UserAchievement{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	userID := uuid.New()

	for i := 1; i <= 20; i++ {
		ach := &model.Achievement{
			Code:        fmt.Sprintf("ach_%d", i),
			Name:        fmt.Sprintf("Achievement %d", i),
			NameEn:      fmt.Sprintf("Achievement En %d", i),
			Description: fmt.Sprintf("Desc %d", i),
			DescEn:      fmt.Sprintf("Desc En %d", i),
			Icon:        "🏆",
			Category:    "general",
			Threshold:   i,
		}
		db.Create(ach)

		ua := &model.UserAchievement{
			BaseUUID:      model.BaseUUID{ID: uuid.New()},
			UserID:        userID,
			AchievementID: *ach.ID,
			EarnedAt:      time.Now().Add(-time.Duration(i) * time.Hour),
		}
		db.Create(ua)
	}

	return db, userID
}

func findUserAchievementsPreload(db *gorm.DB, userID uuid.UUID) ([]model.UserAchievement, error) {
	var list []model.UserAchievement
	err := db.Preload("Achievement").
		Where("user_id = ?", userID).
		Order("earned_at desc").
		Find(&list).Error
	return list, err
}

func BenchmarkAchievement_GORM_Preload(b *testing.B) {
	db, userID := setupAchievementBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := findUserAchievementsPreload(db, userID)
		if err != nil || len(list) != 20 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkAchievement_Native_RawScan(b *testing.B) {
	db, userID := setupAchievementBenchmarkDB(b)
	repo := NewAchievementRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := repo.FindUserAchievements(userID)
		if err != nil || len(list) != 20 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
