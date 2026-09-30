package reference

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
)

type amalanFixture struct {
	repo        repository.AmalanRepository
	userID      uuid.UUID
	itemDeleted *model.AmalanItem
	itemLive    *model.AmalanItem
	itemDelTr   *model.AmalanItem
	logLive     *model.AmalanLog
}

func newAmalanFixture(t *testing.T) *amalanFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.AmalanItem{}, &model.AmalanLog{})
	live := seedTranslation(t, db, "live")
	dead := seedDeletedTranslation(t, db, "dead")

	f := &amalanFixture{repo: repository.NewAmalanRepository(db), userID: uuid.New()}

	newItem := func(category model.AmalanCategory, name string, tr *model.Translation) *model.AmalanItem {
		item := &model.AmalanItem{
			Name:          name,
			Description:   "desc " + name,
			Category:      category,
			IsActive:      true,
			TranslationID: tr.ID,
		}
		mustCreate(t, db, item)
		return item
	}
	f.itemDeleted = newItem(model.AmalanSholat, "Sholat Dhuha", live)
	f.itemLive = newItem(model.AmalanSholat, "Sholat Tahajud", live)
	f.itemDelTr = newItem(model.AmalanPuasa, "Puasa Senin", dead)
	itemWithDeletedLog := newItem(model.AmalanDzikir, "Dzikir Pagi", live)

	newLog := func(item *model.AmalanItem, date string) *model.AmalanLog {
		log := &model.AmalanLog{UserID: f.userID, AmalanItemID: *item.ID, Date: date, IsDone: true}
		mustCreate(t, db, log)
		return log
	}
	newLog(f.itemDeleted, "2026-09-05")
	f.logLive = newLog(f.itemLive, "2026-09-05")
	newLog(f.itemDelTr, "2026-09-04")
	deletedLog := newLog(itemWithDeletedLog, "2026-09-05")

	testdb.Delete(t, db, deletedLog)
	testdb.Delete(t, db, f.itemDeleted)
	return f
}

func amalanItemNames(list []model.AmalanItem) []string {
	var out []string
	for _, item := range list {
		out = append(out, item.Name)
	}
	return out
}

func TestSoftDeleteAmalanFindAllItems(t *testing.T) {
	f := newAmalanFixture(t)

	list, err := f.repo.FindAllItems()
	if err != nil {
		t.Fatalf("FindAllItems: %v", err)
	}
	requireStrings(t, "items", amalanItemNames(list), []string{"Dzikir Pagi", "Puasa Senin", "Sholat Tahajud"})
}

func TestSoftDeleteAmalanFindItemByID(t *testing.T) {
	f := newAmalanFixture(t)

	_, err := f.repo.FindItemByID(*f.itemDeleted.ID)
	requireNotFound(t, "deleted item", err)

	live, err := f.repo.FindItemByID(*f.itemLive.ID)
	if err != nil {
		t.Fatalf("FindItemByID live: %v", err)
	}
	requireTranslation(t, "live translation", live.Translation, "live")

	delTr, err := f.repo.FindItemByID(*f.itemDelTr.ID)
	if err != nil {
		t.Fatalf("FindItemByID deltr: %v", err)
	}
	requireNoTranslation(t, "deltr translation", delTr.Translation)
}

func TestSoftDeleteAmalanFindTodayStatus(t *testing.T) {
	f := newAmalanFixture(t)

	list, err := f.repo.FindTodayStatus(f.userID, "2026-09-05")
	if err != nil {
		t.Fatalf("FindTodayStatus: %v", err)
	}
	done := map[string]bool{}
	var names []string
	for _, item := range list {
		names = append(names, item.Name)
		done[item.Name] = item.IsDone
	}
	requireStrings(t, "items", names, []string{"Dzikir Pagi", "Puasa Senin", "Sholat Tahajud"})
	if !done["Sholat Tahajud"] {
		t.Fatalf("live log must mark Sholat Tahajud done")
	}
	if done["Dzikir Pagi"] {
		t.Fatalf("soft-deleted log must not mark Dzikir Pagi done")
	}
	if done["Puasa Senin"] {
		t.Fatalf("log of another date must not mark Puasa Senin done")
	}
	for _, item := range list {
		if item.Name == "Dzikir Pagi" && item.LogID != nil {
			t.Fatalf("soft-deleted log id leaked: %d", *item.LogID)
		}
	}
}

func TestSoftDeleteAmalanFindHistory(t *testing.T) {
	f := newAmalanFixture(t)

	logs, err := f.repo.FindHistory(f.userID, "2026-09-01", "2026-09-30")
	if err != nil {
		t.Fatalf("FindHistory: %v", err)
	}

	byItemID := map[int]model.AmalanLog{}
	for _, l := range logs {
		byItemID[l.AmalanItemID] = l
	}
	if len(logs) != 3 {
		t.Fatalf("want 3 live logs (live, deltr, deleted item), got %d", len(logs))
	}

	live, ok := byItemID[*f.itemLive.ID]
	if !ok || live.AmalanItem == nil {
		t.Fatalf("live log must carry its live item, got %+v", live)
	}
	requireTranslation(t, "live item translation", live.AmalanItem.Translation, "live")

	delTr, ok := byItemID[*f.itemDelTr.ID]
	if !ok || delTr.AmalanItem == nil {
		t.Fatalf("log with deleted item translation must still carry the item, got %+v", delTr)
	}
	requireNoTranslation(t, "deltr item translation", delTr.AmalanItem.Translation)

	orphan, ok := byItemID[*f.itemDeleted.ID]
	if !ok {
		t.Fatalf("live log of a soft-deleted item must still be returned")
	}
	if orphan.AmalanItem != nil {
		t.Fatalf("soft-deleted item leaked into history: %+v", orphan.AmalanItem)
	}
}
