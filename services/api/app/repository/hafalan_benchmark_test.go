package repository

import (
	"fmt"
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func setupHafalanBenchmarkDB(b *testing.B) (*gorm.DB, uuid.UUID) {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.Surah{}, &model.HafalanProgress{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	userID := uuid.New()

	for i := 1; i <= 30; i++ {
		tr := &model.Translation{
			Idn: strptrOrNil(fmt.Sprintf("Surah %d", i)),
			Ar:  strptrOrNil("سورة"),
		}
		db.Create(tr)

		surah := &model.Surah{
			Number:        lib.Intptr(i),
			Slug:          strptrOrNil(fmt.Sprintf("surah-%d", i)),
			TranslationID: tr.ID,
		}
		db.Create(surah)

		h := &model.HafalanProgress{
			BaseUUID: model.BaseUUID{ID: uuid.New()},
			UserID:   userID,
			SurahID:  *surah.ID,
			Status:   model.HafalanMemorized,
		}
		db.Create(h)
	}

	return db, userID
}

func findHafalanByUserIDPreload(db *gorm.DB, userID uuid.UUID) ([]model.HafalanProgress, error) {
	var list []model.HafalanProgress
	err := db.Preload("Surah").Preload("Surah.Translation").
		Where("user_id = ?", userID).
		Order("surah_id asc").
		Find(&list).Error
	return list, err
}

func BenchmarkHafalan_GORM_Preload(b *testing.B) {
	db, userID := setupHafalanBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := findHafalanByUserIDPreload(db, userID)
		if err != nil || len(list) != 30 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkHafalan_Native_RawScan(b *testing.B) {
	db, userID := setupHafalanBenchmarkDB(b)
	repo := NewHafalanRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := repo.FindByUserID(userID)
		if err != nil || len(list) != 30 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
