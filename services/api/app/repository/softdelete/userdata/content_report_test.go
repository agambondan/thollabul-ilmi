package userdata

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

func seedContentReport(t *testing.T, db *gorm.DB, userID uuid.UUID, title string, status model.ContentReportStatus, target model.ContentReportTargetType, age int) *model.ContentReport {
	t.Helper()
	createdAt := time.Date(2026, time.September, 1, 0, 0, 0, 0, time.UTC).Add(time.Duration(age) * time.Hour)
	report := &model.ContentReport{
		BaseUUID:    model.BaseUUID{ID: uuid.New(), BaseTime: model.BaseTime{CreatedAt: &createdAt, UpdatedAt: &createdAt}},
		UserID:      userID,
		TargetType:  target,
		TargetID:    "1",
		TargetTitle: title,
		Category:    model.ContentReportCategoryTypo,
		Description: "description " + title,
		Status:      status,
	}
	create(t, db, report)
	return report
}

func contentReportTitles(reports []model.ContentReport) []string {
	out := make([]string, 0, len(reports))
	for _, report := range reports {
		out = append(out, report.TargetTitle)
	}
	return out
}

type contentReportFixture struct {
	db   *gorm.DB
	repo repository.ContentReportRepository

	alice *model.User
	bob   *model.User
	carol *model.User

	aliceLive     *model.ContentReport
	aliceDeleted  *model.ContentReport
	aliceResolved *model.ContentReport
	bobLive       *model.ContentReport
	carolOrphan   *model.ContentReport
}

func newContentReportFixture(t *testing.T) *contentReportFixture {
	t.Helper()
	db := testdb.Open(t, &model.User{}, &model.ContentReport{})
	f := &contentReportFixture{
		db:    db,
		repo:  repository.NewContentReportRepository(db),
		alice: seedUser(t, db, "alice"),
		bob:   seedUser(t, db, "bob"),
		carol: seedUser(t, db, "carol"),
	}

	f.aliceLive = seedContentReport(t, db, f.alice.ID, "alice pending", model.ContentReportStatusPending, model.ContentReportTargetQuran, 1)
	f.aliceDeleted = seedContentReport(t, db, f.alice.ID, "alice deleted", model.ContentReportStatusPending, model.ContentReportTargetQuran, 9)
	f.aliceResolved = seedContentReport(t, db, f.alice.ID, "alice resolved", model.ContentReportStatusResolved, model.ContentReportTargetHadith, 2)
	f.bobLive = seedContentReport(t, db, f.bob.ID, "bob pending", model.ContentReportStatusPending, model.ContentReportTargetQuran, 3)
	f.carolOrphan = seedContentReport(t, db, f.carol.ID, "carol pending", model.ContentReportStatusPending, model.ContentReportTargetFiqh, 4)

	testdb.Delete(t, db, f.aliceDeleted)
	testdb.Delete(t, db, f.carol)
	return f
}

func TestSoftDeleteContentReportFindByID(t *testing.T) {
	f := newContentReportFixture(t)

	live, err := f.repo.FindByID(f.aliceLive.ID.String())
	if err != nil {
		t.Fatalf("FindByID live: %v", err)
	}
	if live.TargetTitle != "alice pending" || live.User == nil || live.User.ID != f.alice.ID || live.User.Name == nil || *live.User.Name != "alice" {
		t.Fatalf("live report should carry its live reporter: %#v", live)
	}

	if _, err := f.repo.FindByID(f.aliceDeleted.ID.String()); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted report must be not found, got err=%v", err)
	}

	orphan, err := f.repo.FindByID(f.carolOrphan.ID.String())
	if err != nil {
		t.Fatalf("live report of a soft-deleted reporter must still be found: %v", err)
	}
	if orphan.User == nil || orphan.User.ID != uuid.Nil || orphan.User.Name != nil || orphan.User.Email != nil {
		t.Fatalf("soft-deleted reporter leaked through report: %#v", orphan.User)
	}
}

func TestSoftDeleteContentReportFindAll(t *testing.T) {
	f := newContentReportFixture(t)

	items, total, err := f.repo.FindAll("", "", 1, 20)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	wantTitles := []string{"alice pending", "alice resolved", "bob pending", "carol pending"}
	if total != int64(len(wantTitles)) || !equalStrings(contentReportTitles(items), wantTitles) {
		t.Fatalf("expected live reports only (total=%d), got total=%d titles=%v", len(wantTitles), total, contentReportTitles(items))
	}
	for _, item := range items {
		if item.TargetTitle == "carol pending" && (item.User == nil || item.User.Name != nil || item.User.ID != uuid.Nil) {
			t.Fatalf("soft-deleted reporter leaked through report: %#v", item.User)
		}
	}

	pending, pendingTotal, err := f.repo.FindAll(model.ContentReportStatusPending, "", 1, 20)
	if err != nil {
		t.Fatalf("FindAll pending: %v", err)
	}
	if pendingTotal != 3 || !equalStrings(contentReportTitles(pending), []string{"alice pending", "bob pending", "carol pending"}) {
		t.Fatalf("pending filter leaked a deleted report: total=%d titles=%v", pendingTotal, contentReportTitles(pending))
	}

	quran, quranTotal, err := f.repo.FindAll("", model.ContentReportTargetQuran, 1, 20)
	if err != nil {
		t.Fatalf("FindAll quran: %v", err)
	}
	if quranTotal != 2 || !equalStrings(contentReportTitles(quran), []string{"alice pending", "bob pending"}) {
		t.Fatalf("target filter leaked a deleted report: total=%d titles=%v", quranTotal, contentReportTitles(quran))
	}

	paged, pagedTotal, err := f.repo.FindAll("", "", 1, 2)
	if err != nil {
		t.Fatalf("FindAll paged: %v", err)
	}
	if pagedTotal != 4 || len(paged) != 2 {
		t.Fatalf("paging must count and fill from live rows only: total=%d items=%v", pagedTotal, contentReportTitles(paged))
	}
}

func TestSoftDeleteContentReportFindByUser(t *testing.T) {
	f := newContentReportFixture(t)

	items, total, err := f.repo.FindByUser(f.alice.ID, 1, 20)
	if err != nil {
		t.Fatalf("FindByUser: %v", err)
	}
	if total != 2 || !equalStrings(contentReportTitles(items), []string{"alice pending", "alice resolved"}) {
		t.Fatalf("expected alice's live reports only, got total=%d titles=%v", total, contentReportTitles(items))
	}
	for _, item := range items {
		if item.UserID != f.alice.ID {
			t.Fatalf("report of another user leaked: %#v", item)
		}
	}

	bobs, bobTotal, err := f.repo.FindByUser(f.bob.ID, 1, 20)
	if err != nil {
		t.Fatalf("FindByUser bob: %v", err)
	}
	if bobTotal != 1 || !equalStrings(contentReportTitles(bobs), []string{"bob pending"}) {
		t.Fatalf("expected only bob's report, got total=%d titles=%v", bobTotal, contentReportTitles(bobs))
	}
}

func TestSoftDeleteContentReportUpdateStatusIgnoresDeletedReport(t *testing.T) {
	f := newContentReportFixture(t)

	if _, err := f.repo.UpdateStatus(f.aliceDeleted.ID.String(), model.ContentReportStatusRejected, "note", f.bob.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("updating a soft-deleted report must report not found, got err=%v", err)
	}

	var stored model.ContentReport
	if err := f.db.Unscoped().First(&stored, "id = ?", f.aliceDeleted.ID).Error; err != nil {
		t.Fatalf("reload deleted report: %v", err)
	}
	if stored.Status != model.ContentReportStatusPending || stored.AdminNote != "" {
		t.Fatalf("soft-deleted report must stay untouched, got %#v", stored)
	}
}
