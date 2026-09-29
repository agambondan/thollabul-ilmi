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

func setupPerawiBenchmarkDB(b *testing.B) *gorm.DB {
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

	for i := 1; i <= 10; i++ {
		guruID := 10 + i
		guru := &model.Perawi{
			BaseID:    model.BaseID{ID: &guruID},
			NamaLatin: strptrOrNil(fmt.Sprintf("Guru %d", i)),
			NamaArab:  strptrOrNil("شيخ"),
		}
		db.Create(guru)
		db.Exec("INSERT INTO perawi_guru (guru_id, murid_id) VALUES (?, ?)", guruID, targetPerawiID)
	}

	for i := 1; i <= 10; i++ {
		muridID := 100 + i
		murid := &model.Perawi{
			BaseID:    model.BaseID{ID: &muridID},
			NamaLatin: strptrOrNil(fmt.Sprintf("Murid %d", i)),
			NamaArab:  strptrOrNil("طالب"),
		}
		db.Create(murid)
		db.Exec("INSERT INTO perawi_guru (guru_id, murid_id) VALUES (?, ?)", targetPerawiID, muridID)
	}

	for i := 1; i <= 20; i++ {
		penilaiID := 200 + i
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

func findPerawiByIDPreload(db *gorm.DB, id *int) (*model.Perawi, error) {
	var p model.Perawi
	err := db.
		Preload("JarhTadil").
		Preload("JarhTadil.Penilai").
		Preload("JarhTadil.Translation").
		Preload("Translation").
		Preload("Guru").
		Preload("Murid").
		First(&p, id).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func BenchmarkPerawi_GORM_Preload(b *testing.B) {
	db := setupPerawiBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	perawiID := 1
	for i := 0; i < b.N; i++ {
		p, err := findPerawiByIDPreload(db, &perawiID)
		if err != nil || p == nil || p.ID == nil || *p.ID != 1 {
			b.Fatalf("preload failed: err=%v, id=%v", err, p)
		}
	}
}

func BenchmarkPerawi_Native_RawScan(b *testing.B) {
	db := setupPerawiBenchmarkDB(b)
	repo := NewPerawiRepository(db, nil)
	b.ResetTimer()
	b.ReportAllocs()

	perawiID := 1
	for i := 0; i < b.N; i++ {
		p, err := repo.FindByID(&perawiID)
		if err != nil || p == nil || p.ID == nil || *p.ID != 1 {
			b.Fatalf("native raw scan failed: err=%v, id=%v", err, p)
		}
	}
}