package userdata

import (
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func seedContentAuditLog(t *testing.T, db *gorm.DB, modifiedBy uuid.UUID, title string, target model.ContentReportTargetType, age int) *model.ContentAuditLog {
	t.Helper()
	createdAt := time.Date(2026, time.September, 1, 0, 0, 0, 0, time.UTC).Add(time.Duration(age) * time.Hour)
	entry := &model.ContentAuditLog{
		BaseUUID:    model.BaseUUID{ID: uuid.New(), BaseTime: model.BaseTime{CreatedAt: &createdAt, UpdatedAt: &createdAt}},
		TargetType:  target,
		TargetID:    "1",
		TargetTitle: title,
		Field:       "translation",
		OldValue:    "old",
		NewValue:    "new",
		ModifiedBy:  modifiedBy,
		Reason:      "reason " + title,
	}
	create(t, db, entry)
	return entry
}

func contentAuditLogTitles(entries []model.ContentAuditLog) []string {
	out := make([]string, 0, len(entries))
	for _, entry := range entries {
		out = append(out, entry.TargetTitle)
	}
	return out
}

func TestSoftDeleteContentAuditLogFindAll(t *testing.T) {
	db := testdb.Open(t, &model.User{}, &model.ContentAuditLog{})
	repo := repository.NewContentAuditLogRepository(db)
	editor := seedUser(t, db, "editor")
	formerEditor := seedUser(t, db, "former-editor")

	seedContentAuditLog(t, db, editor.ID, "quran live", model.ContentReportTargetQuran, 1)
	deleted := seedContentAuditLog(t, db, editor.ID, "quran deleted", model.ContentReportTargetQuran, 9)
	seedContentAuditLog(t, db, formerEditor.ID, "hadith by former editor", model.ContentReportTargetHadith, 2)
	seedContentAuditLog(t, db, editor.ID, "hadith live", model.ContentReportTargetHadith, 3)
	testdb.Delete(t, db, deleted)
	testdb.Delete(t, db, formerEditor)

	items, total, err := repo.FindAll("", 1, 20)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	wantTitles := []string{"quran live", "hadith by former editor", "hadith live"}
	if total != int64(len(wantTitles)) || !equalStrings(contentAuditLogTitles(items), wantTitles) {
		t.Fatalf("expected live entries only (total=%d), got total=%d titles=%v", len(wantTitles), total, contentAuditLogTitles(items))
	}

	for _, item := range items {
		switch item.TargetTitle {
		case "quran live", "hadith live":
			if item.Modifier == nil || item.Modifier.ID != editor.ID {
				t.Fatalf("entry %q should carry its live modifier: %#v", item.TargetTitle, item.Modifier)
			}
		case "hadith by former editor":
			if item.Modifier != nil {
				t.Fatalf("soft-deleted modifier leaked through audit entry: %#v", item.Modifier)
			}
		}
	}

	quran, quranTotal, err := repo.FindAll("quran", 1, 20)
	if err != nil {
		t.Fatalf("FindAll quran: %v", err)
	}
	if quranTotal != 1 || !equalStrings(contentAuditLogTitles(quran), []string{"quran live"}) {
		t.Fatalf("target filter leaked a deleted entry: total=%d titles=%v", quranTotal, contentAuditLogTitles(quran))
	}

	hadith, hadithTotal, err := repo.FindAll("hadith", 1, 20)
	if err != nil {
		t.Fatalf("FindAll hadith: %v", err)
	}
	if hadithTotal != 2 || len(hadith) != 2 {
		t.Fatalf("unexpected hadith entries: total=%d titles=%v", hadithTotal, contentAuditLogTitles(hadith))
	}

	paged, pagedTotal, err := repo.FindAll("", 1, 2)
	if err != nil {
		t.Fatalf("FindAll paged: %v", err)
	}
	if pagedTotal != 3 || len(paged) != 2 {
		t.Fatalf("paging must count and fill from live rows only: total=%d items=%v", pagedTotal, contentAuditLogTitles(paged))
	}
}
