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

func setupLessonBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.LibraryBook{}, &model.LessonModule{}, &model.LessonStep{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	book := &model.LibraryBook{
		Title:  "Kitab At-Tauhid",
		Slug:   "kitab-at-tauhid",
		Author: "Syaikh Muhammad bin Abdul Wahhab",
		Status: model.LibraryBookStatusPublished,
	}
	db.Create(book)

	for i := 1; i <= 10; i++ {
		module := &model.LessonModule{
			Slug:             fmt.Sprintf("module-%d", i),
			Title:            fmt.Sprintf("Pelajaran Modul %d", i),
			Description:      "Deskripsi pelajaran tauhid.",
			Category:         "akidah",
			Level:            "dasar",
			EstimatedMinutes: 15,
			Order:            i,
			RelatedBookID:    book.ID,
		}
		db.Create(module)

		for s := 1; s <= 5; s++ {
			step := &model.LessonStep{
				ModuleID:    *module.ID,
				StepOrder:   s,
				Kind:        "theory",
				Title:       fmt.Sprintf("Langkah %d.%d", i, s),
				Body:        "Penjelasan materi langkah pembelajaran secara terperinci.",
				Arabic:      "لا إله إلا الله",
				Translation: "Tiada sesembahan yang berhak disembah selain Allah",
				Dalil:       "QS. Muhammad: 19",
			}
			db.Create(step)
		}
	}

	return db
}

func findLessonAllPreload(db *gorm.DB) ([]model.LessonModule, error) {
	var items []model.LessonModule
	err := db.Preload("Steps", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("step_order ASC")
	}).Preload("RelatedBook").Order("\"order\" ASC, id ASC").Find(&items).Error
	return items, err
}

func BenchmarkLesson_GORM_Preload(b *testing.B) {
	db := setupLessonBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := findLessonAllPreload(db)
		if err != nil || len(list) != 10 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkLesson_Native_RawScan(b *testing.B) {
	db := setupLessonBenchmarkDB(b)
	repo := NewLessonRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := repo.FindAll()
		if err != nil || len(list) != 10 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
