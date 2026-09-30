package collections

import (
	"errors"
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type quizFixture struct {
	db        *gorm.DB
	live      *model.Quiz
	liveDead  *model.Quiz
	noTr      *model.Quiz
	deleted   *model.Quiz
	extraDead []*model.Quiz
}

func createQuiz(t *testing.T, db *gorm.DB, quizType model.QuizType, question string, tr *model.Translation) *model.Quiz {
	t.Helper()
	q := &model.Quiz{
		Type:          quizType,
		QuestionText:  question,
		CorrectAnswer: "A",
		Options:       `["A","B"]`,
		Difficulty:    "medium",
	}
	if tr != nil {
		q.TranslationID = tr.ID
	}
	mustCreate(t, db, q)
	return q
}

func newQuizFixture(t *testing.T) *quizFixture {
	t.Helper()
	db := openDB(t, &model.Translation{}, &model.Quiz{}, &model.UserQuizResult{})
	f := &quizFixture{db: db}

	f.live = createQuiz(t, db, model.QuizTypeFiqh, "live", newTranslation(t, db, "Soal hidup"))
	deadTr := newTranslation(t, db, "Terjemahan soal terhapus")
	f.liveDead = createQuiz(t, db, model.QuizTypeSirah, "live-dead-translation", deadTr)
	f.deleted = createQuiz(t, db, model.QuizTypeFiqh, "deleted", newTranslation(t, db, "Soal terhapus"))
	f.noTr = createQuiz(t, db, model.QuizTypeFiqh, "live-no-translation", nil)
	for i := 0; i < 12; i++ {
		kind := model.QuizTypeFiqh
		if i%2 == 1 {
			kind = model.QuizTypeSirah
		}
		f.extraDead = append(f.extraDead, createQuiz(t, db, kind, "extra-deleted", newTranslation(t, db, "Soal terhapus tambahan")))
	}

	testdb.Delete(t, db, deadTr)
	testdb.Delete(t, db, f.deleted)
	for _, q := range f.extraDead {
		testdb.Delete(t, db, q)
	}
	return f
}

func quizIDs(quizzes []model.Quiz) []int {
	ids := make([]int, 0, len(quizzes))
	for _, q := range quizzes {
		ids = append(ids, *q.ID)
	}
	return ids
}

func TestSoftDeleteQuizFindAll(t *testing.T) {
	f := newQuizFixture(t)
	repo := repository.NewQuizRepository(f.db)

	all, err := repo.FindAll(0, 100)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	assertIDs(t, "quizzes", quizIDs(all), *f.live.ID, *f.liveDead.ID, *f.noTr.ID)
	for _, q := range all {
		switch *q.ID {
		case *f.live.ID:
			if q.Translation == nil {
				t.Fatal("live quiz lost its live translation")
			}
		case *f.liveDead.ID:
			if q.Translation != nil {
				t.Fatalf("soft-deleted translation leaked on live quiz: %+v", q.Translation)
			}
		}
	}

	firstPage, err := repo.FindAll(0, 2)
	if err != nil {
		t.Fatalf("FindAll first page: %v", err)
	}
	assertIDs(t, "first page", quizIDs(firstPage), *f.live.ID, *f.liveDead.ID)
	secondPage, err := repo.FindAll(1, 2)
	if err != nil {
		t.Fatalf("FindAll second page: %v", err)
	}
	assertIDs(t, "second page", quizIDs(secondPage), *f.noTr.ID)
}

func TestSoftDeleteQuizFindSession(t *testing.T) {
	f := newQuizFixture(t)
	repo := repository.NewQuizRepository(f.db)

	mixed, err := repo.FindSession("", 10)
	if err != nil {
		t.Fatalf("FindSession any type: %v", err)
	}
	assertIDs(t, "session any type", quizIDs(mixed), *f.live.ID, *f.liveDead.ID, *f.noTr.ID)
	for _, q := range mixed {
		if *q.ID == *f.liveDead.ID && q.Translation != nil {
			t.Fatalf("soft-deleted translation leaked on live quiz: %+v", q.Translation)
		}
	}

	fiqh, err := repo.FindSession(model.QuizTypeFiqh, 10)
	if err != nil {
		t.Fatalf("FindSession fiqh: %v", err)
	}
	assertIDs(t, "session fiqh", quizIDs(fiqh), *f.live.ID, *f.noTr.ID)
}

func TestSoftDeleteQuizFindByID(t *testing.T) {
	f := newQuizFixture(t)
	repo := repository.NewQuizRepository(f.db)

	if _, err := repo.FindByID(*f.deleted.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted quiz must not be found by id: err = %v", err)
	}

	live, err := repo.FindByID(*f.live.ID)
	if err != nil {
		t.Fatalf("FindByID live quiz: %v", err)
	}
	if live.Translation == nil {
		t.Fatal("live quiz lost its live translation")
	}

	orphan, err := repo.FindByID(*f.liveDead.ID)
	if err != nil {
		t.Fatalf("a live quiz whose translation is soft-deleted must still be found: %v", err)
	}
	if orphan.Translation != nil {
		t.Fatalf("soft-deleted translation leaked on live quiz: %+v", orphan.Translation)
	}
}

func TestSoftDeleteQuizGetStats(t *testing.T) {
	f := newQuizFixture(t)
	repo := repository.NewQuizRepository(f.db)

	user := uuid.New()
	other := uuid.New()
	now := time.Now()
	results := []*model.UserQuizResult{
		{UserID: user, QuizID: *f.live.ID, IsCorrect: true, AnsweredAt: now},
		{UserID: user, QuizID: *f.live.ID, IsCorrect: false, AnsweredAt: now},
		{UserID: user, QuizID: *f.live.ID, IsCorrect: true, AnsweredAt: now},
		{UserID: user, QuizID: *f.live.ID, IsCorrect: true, AnsweredAt: now},
		{UserID: other, QuizID: *f.live.ID, IsCorrect: true, AnsweredAt: now},
	}
	for _, r := range results {
		mustCreate(t, f.db, r)
	}
	testdb.Delete(t, f.db, results[2])
	testdb.Delete(t, f.db, results[3])

	stats, err := repo.GetStats(user)
	if err != nil {
		t.Fatalf("GetStats: %v", err)
	}
	if stats.TotalAnswered != 2 || stats.TotalCorrect != 1 || stats.Accuracy != 50 {
		t.Fatalf("stats include soft-deleted results: %+v, want answered=2 correct=1 accuracy=50", stats)
	}
}
