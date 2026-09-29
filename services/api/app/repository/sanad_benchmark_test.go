package repository

import (
	"fmt"
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func setupSanadBenchmarkDB(b *testing.B) (*gorm.DB, int) {
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

	if err := db.AutoMigrate(&model.Perawi{}, &model.Sanad{}, &model.MataSanad{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	var perawis []*model.Perawi
	for i := 1; i <= 10; i++ {
		p := &model.Perawi{
			NamaLatin: strptrOrNil(fmt.Sprintf("Perawi %d", i)),
			NamaArab:  strptrOrNil("راوي"),
			Tabaqah:   strptrOrNil("sahabat"),
			Status:    strptrOrNil("tsiqah"),
		}
		db.Create(p)
		perawis = append(perawis, p)
	}

	hadithID := 1
	for j := 1; j <= 5; j++ {
		s := &model.Sanad{
			HadithID:   &hadithID,
			NomorJalur: lib.Intptr(j),
			Jenis:      (*model.SanadJenis)(strptrOrNil(string(model.SanadMusnad))),
		}
		db.Create(s)

		for u := 1; u <= 5; u++ {
			pIdx := (j + u) % len(perawis)
			m := &model.MataSanad{
				SanadID:  s.ID,
				PerawiID: perawis[pIdx].ID,
				Urutan:   lib.Intptr(u),
				Metode:   (*model.MetodePeriwayatan)(strptrOrNil(string(model.MetodeHaddatsana))),
			}
			db.Create(m)
		}
	}

	return db, hadithID
}

func findSanadByHadithIDPreload(db *gorm.DB, hadithID int) ([]model.Sanad, error) {
	var list []model.Sanad
	err := db.Preload("MataSanad", func(db *gorm.DB) *gorm.DB {
		return db.Order("urutan ASC")
	}).Preload("MataSanad.Perawi").
		Where("hadith_id = ?", hadithID).
		Order("nomor_jalur ASC").
		Find(&list).Error
	return list, err
}

func BenchmarkSanad_GORM_Preload(b *testing.B) {
	db, hadithID := setupSanadBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := findSanadByHadithIDPreload(db, hadithID)
		if err != nil || len(list) != 5 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkSanad_Native_RawScan(b *testing.B) {
	db, hadithID := setupSanadBenchmarkDB(b)
	repo := NewSanadRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := repo.FindByHadithID(&hadithID)
		if err != nil || len(list) != 5 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
