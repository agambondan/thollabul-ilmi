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

func setupQuizBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.Quiz{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	for i := 1; i <= 30; i++ {
		tr := &model.Translation{
			Idn: strptrOrNil(fmt.Sprintf("Soal %d", i)),
			Ar:  strptrOrNil("سؤال"),
		}
		db.Create(tr)

		quiz := &model.Quiz{
			Type:          model.QuizTypeFiqh,
			QuestionText:  fmt.Sprintf("Pertanyaan fiqh nomor %d?", i),
			CorrectAnswer: "Jawaban A",
			Options:       `["Jawaban A", "Jawaban B", "Jawaban C", "Jawaban D"]`,
			Explanation:   "Penjelasan detail.",
			Difficulty:    "medium",
			TranslationID: tr.ID,
			Source:        "Fathul Qorib",
		}
		db.Create(quiz)
	}

	return db
}

func findQuizAllPreload(db *gorm.DB, page, size int) ([]model.Quiz, error) {
	var items []model.Quiz
	err := db.Preload("Translation").
		Order("id ASC").
		Offset(page * size).
		Limit(size).
		Find(&items).Error
	return items, err
}

func BenchmarkQuiz_GORM_Preload(b *testing.B) {
	db := setupQuizBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := findQuizAllPreload(db, 0, 30)
		if err != nil || len(list) != 30 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkQuiz_Native_RawScan(b *testing.B) {
	db := setupQuizBenchmarkDB(b)
	repo := NewQuizRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := repo.FindAll(0, 30)
		if err != nil || len(list) != 30 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
