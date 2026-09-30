package rijal

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"gorm.io/gorm"
)

func seedHistory(t *testing.T) *gorm.DB {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.HistoryEvent{})

	mustCreate(t, db, &model.Translation{BaseID: baseID(1), Idn: testdb.Str("history-tr-live")})
	mustCreate(t, db, &model.Translation{BaseID: baseID(2), Idn: testdb.Str("history-tr-dead")})
	testdb.Delete(t, db, &model.Translation{BaseID: baseID(2)})

	event := func(id, yearMiladi int, slug string, category model.HistoryCategory, translationID int) {
		mustCreate(t, db, &model.HistoryEvent{
			BaseID:        baseID(id),
			YearHijri:     yearMiladi - 600,
			YearMiladi:    yearMiladi,
			Title:         slug,
			Slug:          slug,
			Category:      category,
			TranslationID: testdb.Int(translationID),
		})
	}
	event(1, 600, "ev-live", model.HistoryCategoryNabi, 1)
	event(2, 625, "ev-deleted", model.HistoryCategoryNabi, 1)
	event(3, 620, "ev-translation-dead", model.HistoryCategoryNabi, 2)
	event(4, 650, "ev-live-khulafa", model.HistoryCategoryKhulafa, 1)
	event(5, 655, "ev-deleted-khulafa", model.HistoryCategoryKhulafa, 1)
	testdb.Delete(t, db, &model.HistoryEvent{BaseID: baseID(2)})
	testdb.Delete(t, db, &model.HistoryEvent{BaseID: baseID(5)})
	return db
}

func historyIDs(list []model.HistoryEvent) []int {
	ids := make([]int, 0, len(list))
	for _, row := range list {
		ids = append(ids, *row.ID)
	}
	return ids
}

func TestSoftDeleteHistoryFindAll(t *testing.T) {
	repo := repository.NewHistoryRepository(seedHistory(t))

	all, err := repo.FindAll("", 0, 0, 50, 0)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	assertIDs(t, "FindAll", historyIDs(all), 1, 3, 4)

	for _, event := range all {
		switch *event.ID {
		case 1:
			if event.Translation == nil || str(event.Translation.Idn) != "history-tr-live" {
				t.Fatalf("FindAll: live event lost its live translation: %+v", event.Translation)
			}
		case 3:
			if event.Translation != nil {
				t.Fatalf("FindAll: soft-deleted translation leaked: %+v", event.Translation)
			}
		}
	}

	byCategory, err := repo.FindAll(string(model.HistoryCategoryNabi), 0, 0, 50, 0)
	if err != nil {
		t.Fatalf("FindAll by category: %v", err)
	}
	assertIDs(t, "FindAll(category nabi)", historyIDs(byCategory), 1, 3)

	khulafa, err := repo.FindAll(string(model.HistoryCategoryKhulafa), 0, 0, 50, 0)
	if err != nil {
		t.Fatalf("FindAll by category khulafa: %v", err)
	}
	assertIDs(t, "FindAll(category khulafa)", historyIDs(khulafa), 4)

	inRange, err := repo.FindAll("", 615, 660, 50, 0)
	if err != nil {
		t.Fatalf("FindAll by year range: %v", err)
	}
	assertIDs(t, "FindAll(year 615-660)", historyIDs(inRange), 3, 4)
}

func TestSoftDeleteHistoryFindAllPagination(t *testing.T) {
	repo := repository.NewHistoryRepository(seedHistory(t))

	page, err := repo.FindAll("", 0, 0, 2, 1)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	assertIDs(t, "FindAll(limit 2, offset 1)", historyIDs(page), 3, 4)
}

func TestSoftDeleteHistoryFindByID(t *testing.T) {
	repo := repository.NewHistoryRepository(seedHistory(t))

	for _, id := range []int{2, 5} {
		if _, err := repo.FindByID(id); !errors.Is(err, gorm.ErrRecordNotFound) {
			t.Fatalf("FindByID(soft-deleted %d): want ErrRecordNotFound, got %v", id, err)
		}
	}

	live, err := repo.FindByID(1)
	if err != nil {
		t.Fatalf("FindByID(live): %v", err)
	}
	if live.Translation == nil || str(live.Translation.Idn) != "history-tr-live" {
		t.Fatalf("FindByID(1): live event lost its live translation: %+v", live.Translation)
	}

	translationDead, err := repo.FindByID(3)
	if err != nil {
		t.Fatalf("FindByID(live, translation soft-deleted) must be found: %v", err)
	}
	if translationDead.Translation != nil {
		t.Fatalf("FindByID(3): soft-deleted translation leaked: %+v", translationDead.Translation)
	}
}

func TestSoftDeleteHistoryFindBySlug(t *testing.T) {
	repo := repository.NewHistoryRepository(seedHistory(t))

	for _, slug := range []string{"ev-deleted", "ev-deleted-khulafa"} {
		if _, err := repo.FindBySlug(slug); !errors.Is(err, gorm.ErrRecordNotFound) {
			t.Fatalf("FindBySlug(soft-deleted %q): want ErrRecordNotFound, got %v", slug, err)
		}
	}

	live, err := repo.FindBySlug("ev-live")
	if err != nil {
		t.Fatalf("FindBySlug(live): %v", err)
	}
	if live.Translation == nil || str(live.Translation.Idn) != "history-tr-live" {
		t.Fatalf("FindBySlug(ev-live): live event lost its live translation: %+v", live.Translation)
	}

	translationDead, err := repo.FindBySlug("ev-translation-dead")
	if err != nil {
		t.Fatalf("FindBySlug(live, translation soft-deleted) must be found: %v", err)
	}
	if translationDead.Translation != nil {
		t.Fatalf("FindBySlug: soft-deleted translation leaked: %+v", translationDead.Translation)
	}
}

func TestSoftDeleteHistoryUpdateRejectsDeletedRow(t *testing.T) {
	repo := repository.NewHistoryRepository(seedHistory(t))

	if _, err := repo.Update(2, &model.HistoryEvent{Title: "resurrect", Slug: "ev-deleted"}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("Update(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
}
