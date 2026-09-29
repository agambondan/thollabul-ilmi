package repository

import (
	"fmt"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func setupJarhTadilBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.Perawi{}, &model.JarhTadil{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	targetPerawiID := 1
	targetPerawi := &model.Perawi{
		BaseID:    model.BaseID{ID: &targetPerawiID},
		NamaLatin: strptrOrNil("Imam Malik bin Anas"),
		NamaArab:  strptrOrNil("مالك بن أنس"),
	}
	db.Create(targetPerawi)

	for i := 1; i <= 20; i++ {
		penilaiID := 100 + i
		penilai := &model.Perawi{
			BaseID:    model.BaseID{ID: &penilaiID},
			NamaLatin: strptrOrNil(fmt.Sprintf("Penilai %d", i)),
			NamaArab:  strptrOrNil("عالم"),
		}
		db.Create(penilai)

		tr := &model.Translation{Idn: strptrOrNil("Penilaian")}
		db.Create(tr)

		jenis := model.JenisTadil
		tingkat := 1
		jt := &model.JarhTadil{
			PerawiID:      targetPerawi.ID,
			PenilaiID:     penilai.ID,
			JenisNilai:    &jenis,
			Tingkat:       &tingkat,
			TeksNilai:     strptrOrNil("Imam Daril Hijrah"),
			Sumber:        strptrOrNil("Tahdzib at-Tahdzib"),
			TranslationID: tr.ID,
		}
		db.Create(jt)
	}

	return db
}

func findJarhTadilByPerawiIDPreload(db *gorm.DB, perawiID *int) ([]model.JarhTadil, error) {
	var list []model.JarhTadil
	err := db.
		Preload("Perawi").
		Preload("Penilai").
		Preload("Translation").
		Where("perawi_id = ?", perawiID).
		Order("id").
		Find(&list).Error
	return list, err
}

func BenchmarkJarhTadil_GORM_Preload(b *testing.B) {
	db := setupJarhTadilBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	perawiID := 1
	for b.Loop() {
		list, err := findJarhTadilByPerawiIDPreload(db, &perawiID)
		if err != nil || len(list) != 20 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkJarhTadil_Native_RawScan(b *testing.B) {
	db := setupJarhTadilBenchmarkDB(b)
	repo := NewJarhTadilRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	perawiID := 1
	for b.Loop() {
		list, err := repo.FindByPerawiID(&perawiID)
		if err != nil || len(list) != 20 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
