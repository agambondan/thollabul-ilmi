package collections

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type lessonFixture struct {
	db        *gorm.DB
	bookLive  *model.LibraryBook
	bookDead  *model.LibraryBook
	mLive     *model.LessonModule
	mDeadBook *model.LessonModule
	mDeleted  *model.LessonModule
	mNoSteps  *model.LessonModule
	stepLive1 *model.LessonStep
	stepDead  *model.LessonStep
	stepLive3 *model.LessonStep
}

func createLibraryBook(t *testing.T, db *gorm.DB, slug string) *model.LibraryBook {
	t.Helper()
	book := &model.LibraryBook{
		Title:  slug,
		Slug:   slug,
		Status: model.LibraryBookStatusPublished,
	}
	mustCreate(t, db, book)
	return book
}

func createLessonModule(t *testing.T, db *gorm.DB, slug string, order int, book *model.LibraryBook) *model.LessonModule {
	t.Helper()
	m := &model.LessonModule{Slug: slug, Title: slug, Order: order}
	if book != nil {
		m.RelatedBookID = book.ID
	}
	mustCreate(t, db, m)
	return m
}

func createLessonStep(t *testing.T, db *gorm.DB, m *model.LessonModule, order int) *model.LessonStep {
	t.Helper()
	s := &model.LessonStep{ModuleID: *m.ID, StepOrder: order, Kind: "theory", Title: "step", Body: "body"}
	mustCreate(t, db, s)
	return s
}

func newLessonFixture(t *testing.T) *lessonFixture {
	t.Helper()
	db := openDB(t, &model.LibraryBook{}, &model.LessonModule{}, &model.LessonStep{}, &model.UserLessonProgress{})
	f := &lessonFixture{db: db}

	f.bookLive = createLibraryBook(t, db, "book-live")
	f.bookDead = createLibraryBook(t, db, "book-dead")

	f.mDeleted = createLessonModule(t, db, "module-deleted", 1, f.bookLive)
	f.mLive = createLessonModule(t, db, "module-live", 2, f.bookLive)
	f.mDeadBook = createLessonModule(t, db, "module-dead-book", 3, f.bookDead)
	f.mNoSteps = createLessonModule(t, db, "module-no-steps", 4, nil)

	f.stepLive1 = createLessonStep(t, db, f.mLive, 1)
	f.stepDead = createLessonStep(t, db, f.mLive, 2)
	f.stepLive3 = createLessonStep(t, db, f.mLive, 3)
	createLessonStep(t, db, f.mDeadBook, 1)
	deadOnly := createLessonStep(t, db, f.mNoSteps, 1)
	createLessonStep(t, db, f.mDeleted, 1)

	testdb.Delete(t, db, f.bookDead)
	testdb.Delete(t, db, f.mDeleted)
	testdb.Delete(t, db, f.stepDead)
	testdb.Delete(t, db, deadOnly)
	return f
}

func stepIDs(steps []model.LessonStep) []int {
	ids := make([]int, 0, len(steps))
	for _, s := range steps {
		ids = append(ids, *s.ID)
	}
	return ids
}

func (f *lessonFixture) checkModules(t *testing.T, label string, byID map[int]model.LessonModule) {
	t.Helper()
	if _, ok := byID[*f.mDeleted.ID]; ok {
		t.Fatalf("%s: soft-deleted module returned", label)
	}

	live, ok := byID[*f.mLive.ID]
	if !ok {
		t.Fatalf("%s: live module missing", label)
	}
	assertIDs(t, label+": steps of live module", stepIDs(live.Steps), *f.stepLive1.ID, *f.stepLive3.ID)
	if live.RelatedBook == nil || *live.RelatedBook.ID != *f.bookLive.ID {
		t.Fatalf("%s: live module lost its live related book: %+v", label, live.RelatedBook)
	}

	deadBook, ok := byID[*f.mDeadBook.ID]
	if !ok {
		t.Fatalf("%s: live module whose related book is soft-deleted must still be returned", label)
	}
	if deadBook.RelatedBook != nil {
		t.Fatalf("%s: soft-deleted related book leaked: %+v", label, deadBook.RelatedBook)
	}
	if len(deadBook.Steps) != 1 {
		t.Fatalf("%s: live module lost its live step: %v", label, stepIDs(deadBook.Steps))
	}

	noSteps, ok := byID[*f.mNoSteps.ID]
	if !ok {
		t.Fatalf("%s: live module whose only step is soft-deleted must still be returned", label)
	}
	if len(noSteps.Steps) != 0 {
		t.Fatalf("%s: soft-deleted step leaked: %v", label, stepIDs(noSteps.Steps))
	}
	if noSteps.RelatedBook != nil {
		t.Fatalf("%s: module without related book got one: %+v", label, noSteps.RelatedBook)
	}
}

func TestSoftDeleteLessonFindAll(t *testing.T) {
	f := newLessonFixture(t)
	repo := repository.NewLessonRepository(f.db)

	modules, err := repo.FindAll()
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	if len(modules) != 3 {
		t.Fatalf("FindAll returned %d modules, want 3 live ones", len(modules))
	}
	byID := map[int]model.LessonModule{}
	for _, m := range modules {
		byID[*m.ID] = m
	}
	f.checkModules(t, "FindAll", byID)
	for _, m := range modules {
		if *m.ID == *f.mLive.ID && (len(m.Steps) != 2 || m.Steps[0].StepOrder != 1 || m.Steps[1].StepOrder != 3) {
			t.Fatalf("steps not ordered by step_order: %+v", m.Steps)
		}
	}
}

func TestSoftDeleteLessonFindBySlug(t *testing.T) {
	f := newLessonFixture(t)
	repo := repository.NewLessonRepository(f.db)

	if _, err := repo.FindBySlug(f.mDeleted.Slug); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted module must not be found by slug: err = %v", err)
	}

	byID := map[int]model.LessonModule{}
	for _, m := range []*model.LessonModule{f.mLive, f.mDeadBook, f.mNoSteps} {
		got, err := repo.FindBySlug(m.Slug)
		if err != nil {
			t.Fatalf("FindBySlug(%s): %v", m.Slug, err)
		}
		byID[*got.ID] = *got
	}
	f.checkModules(t, "FindBySlug", byID)
}

func TestSoftDeleteLessonFindByID(t *testing.T) {
	f := newLessonFixture(t)
	repo, ok := repository.NewLessonRepository(f.db).(interface {
		FindByID(int) (*model.LessonModule, error)
	})
	if !ok {
		t.Fatal("lesson repository no longer exposes FindByID")
	}

	if _, err := repo.FindByID(*f.mDeleted.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted module must not be found by id: err = %v", err)
	}

	byID := map[int]model.LessonModule{}
	for _, m := range []*model.LessonModule{f.mLive, f.mDeadBook, f.mNoSteps} {
		got, err := repo.FindByID(*m.ID)
		if err != nil {
			t.Fatalf("FindByID(%d): %v", *m.ID, err)
		}
		byID[*got.ID] = *got
	}
	f.checkModules(t, "FindByID", byID)
}

func TestSoftDeleteLessonFindProgress(t *testing.T) {
	f := newLessonFixture(t)
	repo := repository.NewLessonRepository(f.db)

	user := uuid.New()
	other := uuid.New()
	rows := []*model.UserLessonProgress{
		{BaseUUID: model.BaseUUID{ID: uuid.New()}, UserID: user, ModuleID: *f.mLive.ID, StepNum: 1, Done: true},
		{BaseUUID: model.BaseUUID{ID: uuid.New()}, UserID: user, ModuleID: *f.mLive.ID, StepNum: 2, Done: true},
		{BaseUUID: model.BaseUUID{ID: uuid.New()}, UserID: user, ModuleID: *f.mLive.ID, StepNum: 3, Done: true},
		{BaseUUID: model.BaseUUID{ID: uuid.New()}, UserID: other, ModuleID: *f.mLive.ID, StepNum: 1, Done: true},
	}
	for _, r := range rows {
		mustCreate(t, f.db, r)
	}
	testdb.Delete(t, f.db, rows[2])

	got, err := repo.FindProgress(user)
	if err != nil {
		t.Fatalf("FindProgress: %v", err)
	}
	var steps []int
	for _, p := range got {
		steps = append(steps, p.StepNum)
	}
	assertIDs(t, "progress steps", steps, 1, 2)
}
