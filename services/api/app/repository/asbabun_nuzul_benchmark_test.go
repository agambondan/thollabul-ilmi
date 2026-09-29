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

func setupAsbabunNuzulBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.Surah{}, &model.Ayah{}, &model.AsbabunNuzul{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	surahNum := 2
	surahID := 1
	surahTr := &model.Translation{Idn: strptrOrNil("Al-Baqarah"), Ar: strptrOrNil("البقرة")}
	db.Create(surahTr)
	surah := &model.Surah{BaseID: model.BaseID{ID: &surahID}, Number: &surahNum, TranslationID: surahTr.ID}
	db.Create(surah)

	for i := 1; i <= 30; i++ {
		ayahNum := i
		ayahID := i
		ayahTr := &model.Translation{Idn: strptrOrNil(fmt.Sprintf("Ayat %d", i)), Ar: strptrOrNil("آية")}
		if err := db.Create(ayahTr).Error; err != nil {
			b.Fatalf("create ayah tr: %v", err)
		}
		ayah := &model.Ayah{BaseID: model.BaseID{ID: &ayahID}, Number: &ayahNum, SurahID: surah.ID, TranslationID: ayahTr.ID}
		if err := db.Create(ayah).Error; err != nil {
			b.Fatalf("create ayah: %v", err)
		}

		tr := &model.Translation{Idn: strptrOrNil("Sebab turun"), Ar: strptrOrNil("سبب النزول")}
		if err := db.Create(tr).Error; err != nil {
			b.Fatalf("create asbab tr: %v", err)
		}

		asbabID := i
		asbab := &model.AsbabunNuzul{
			BaseID:        model.BaseID{ID: &asbabID},
			Title:         fmt.Sprintf("Riwayat %d", i),
			Content:       "Riwayat ringkas",
			Source:        "Lubabun Nuqul",
			DisplayRef:    fmt.Sprintf("QS 2:%d", i),
			TranslationID: tr.ID,
		}
		if err := db.Omit("Ayahs.*").Create(asbab).Error; err != nil {
			b.Fatalf("create asbab: %v", err)
		}

		if err := db.Exec("INSERT INTO asbabun_nuzul_ayahs (asbabun_nuzul_id, ayah_id) VALUES (?, ?)", asbabID, ayahID).Error; err != nil {
			b.Fatalf("insert join: %v", err)
		}
	}

	return db
}

func findAsbabunBySurahNumberPreload(db *gorm.DB, surahNumber, limit, offset int) ([]model.AsbabunNuzul, error) {
	var list []model.AsbabunNuzul
	err := db.
		Preload("Translation").
		Preload("Ayahs").
		Preload("Ayahs.Surah").
		Preload("Ayahs.Surah.Translation").
		Preload("Ayahs.Translation").
		Joins("JOIN asbabun_nuzul_ayahs j ON j.asbabun_nuzul_id = asbabun_nuzul.id").
		Joins("JOIN ayah ON ayah.id = j.ayah_id").
		Joins("JOIN surah ON surah.id = ayah.surah_id").
		Where("surah.number = ?", surahNumber).
		Group("asbabun_nuzul.id").
		Order("MIN(ayah.number) ASC").
		Limit(limit).
		Offset(offset).
		Find(&list).Error
	return list, err
}

func BenchmarkAsbabunNuzul_GORM_Preload(b *testing.B) {
	db := setupAsbabunNuzulBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := findAsbabunBySurahNumberPreload(db, 2, 30, 0)
		if err != nil || len(list) != 30 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkAsbabunNuzul_Native_RawScan(b *testing.B) {
	db := setupAsbabunNuzulBenchmarkDB(b)
	repo := NewAsbabunNuzulRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := repo.FindBySurahNumber(2, 30, 0)
		if err != nil || len(list) != 30 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
