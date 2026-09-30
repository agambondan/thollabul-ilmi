package reference

import (
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
)

type achievementFixture struct {
	repo                repository.AchievementRepository
	userID              uuid.UUID
	achDeleted          *model.Achievement
	achLive             *model.Achievement
	achOfDeletedAward   *model.Achievement
	achDeletedEarned    *model.Achievement
	deletedPointsUserID uuid.UUID
}

func newAchievementFixture(t *testing.T) *achievementFixture {
	t.Helper()
	db := testdb.Open(t, &model.Achievement{}, &model.UserAchievement{}, &model.UserPoints{})

	f := &achievementFixture{
		repo:   repository.NewAchievementRepository(db),
		userID: uuid.New(),
	}

	newAchievement := func(code string) *model.Achievement {
		a := &model.Achievement{Code: code, Name: "name " + code, NameEn: "en " + code, Threshold: 1}
		mustCreate(t, db, a)
		return a
	}
	f.achDeleted = newAchievement("deleted")
	f.achLive = newAchievement("live")
	f.achOfDeletedAward = newAchievement("award-deleted")
	f.achDeletedEarned = newAchievement("deleted-but-earned")

	now := time.Now()
	award := func(a *model.Achievement, earnedAgo time.Duration) *model.UserAchievement {
		ua := &model.UserAchievement{
			BaseUUID:      model.BaseUUID{ID: uuid.New()},
			UserID:        f.userID,
			AchievementID: *a.ID,
			EarnedAt:      now.Add(-earnedAgo),
		}
		mustCreate(t, db, ua)
		return ua
	}
	award(f.achLive, time.Hour)
	deletedAward := award(f.achOfDeletedAward, 2*time.Hour)
	award(f.achDeletedEarned, 3*time.Hour)

	testdb.Delete(t, db, f.achDeleted)
	testdb.Delete(t, db, f.achDeletedEarned)
	testdb.Delete(t, db, deletedAward)

	mustCreate(t, db, &model.UserPoints{BaseUUID: model.BaseUUID{ID: uuid.New()}, UserID: f.userID, TotalPoints: 50})
	f.deletedPointsUserID = uuid.New()
	deletedPoints := &model.UserPoints{BaseUUID: model.BaseUUID{ID: uuid.New()}, UserID: f.deletedPointsUserID, TotalPoints: 999}
	mustCreate(t, db, deletedPoints)
	testdb.Delete(t, db, deletedPoints)
	return f
}

func achievementCodes(list []model.Achievement) []string {
	var out []string
	for _, a := range list {
		out = append(out, a.Code)
	}
	return out
}

func TestSoftDeleteAchievementFindAll(t *testing.T) {
	f := newAchievementFixture(t)

	list, err := f.repo.FindAll()
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	requireStrings(t, "achievements", achievementCodes(list), []string{"live", "award-deleted"})
}

func TestSoftDeleteAchievementFindByID(t *testing.T) {
	f := newAchievementFixture(t)

	_, err := f.repo.FindByID(*f.achDeleted.ID)
	requireNotFound(t, "deleted achievement", err)

	live, err := f.repo.FindByID(*f.achLive.ID)
	if err != nil {
		t.Fatalf("FindByID live: %v", err)
	}
	if live.Code != "live" {
		t.Fatalf("FindByID live: got %q", live.Code)
	}
}

func TestSoftDeleteAchievementFindByCode(t *testing.T) {
	f := newAchievementFixture(t)

	_, err := f.repo.FindByCode("deleted")
	requireNotFound(t, "deleted achievement", err)

	live, err := f.repo.FindByCode("live")
	if err != nil {
		t.Fatalf("FindByCode live: %v", err)
	}
	if *live.ID != *f.achLive.ID {
		t.Fatalf("FindByCode live: got id %d", *live.ID)
	}
}

func TestSoftDeleteAchievementFindUserAchievements(t *testing.T) {
	f := newAchievementFixture(t)

	list, err := f.repo.FindUserAchievements(f.userID)
	if err != nil {
		t.Fatalf("FindUserAchievements: %v", err)
	}
	var codes []string
	for _, ua := range list {
		codes = append(codes, ua.Achievement.Code)
	}
	requireStrings(t, "user achievements", codes, []string{"live"})
}

func TestSoftDeleteAchievementHasEarned(t *testing.T) {
	f := newAchievementFixture(t)

	if !f.repo.HasEarned(f.userID, *f.achLive.ID) {
		t.Fatalf("live award must count as earned")
	}
	if f.repo.HasEarned(f.userID, *f.achOfDeletedAward.ID) {
		t.Fatalf("soft-deleted award must not count as earned")
	}
}

func TestSoftDeleteAchievementGetPoints(t *testing.T) {
	f := newAchievementFixture(t)

	live, err := f.repo.GetPoints(f.userID)
	if err != nil {
		t.Fatalf("GetPoints live: %v", err)
	}
	if live.TotalPoints != 50 {
		t.Fatalf("GetPoints live: got %d, want 50", live.TotalPoints)
	}

	deleted, err := f.repo.GetPoints(f.deletedPointsUserID)
	if err == nil && deleted.TotalPoints == 999 {
		t.Fatalf("soft-deleted points row leaked: %+v", deleted)
	}
}
