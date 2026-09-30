package userdata

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type contentReportRow struct {
	ID        uuid.UUID `gorm:"primarykey"`
	UserID    uuid.UUID
	Status    string
	DeletedAt gorm.DeletedAt
}

func (contentReportRow) TableName() string {
	return "content_report"
}

func seedMemorizedSurahs(t *testing.T, db *gorm.DB, userID uuid.UUID, firstSurah int, live int, deleted int) {
	t.Helper()
	surahID := firstSurah
	for i := 0; i < live; i++ {
		seedHafalan(t, db, userID, surahID, model.HafalanMemorized)
		surahID++
	}
	for i := 0; i < deleted; i++ {
		testdb.Delete(t, db, seedHafalan(t, db, userID, surahID, model.HafalanMemorized))
		surahID++
	}
}

func TestSoftDeleteLeaderboardMyHafalanRank(t *testing.T) {
	db := testdb.Open(t, &model.HafalanProgress{})
	repo := repository.NewLeaderboardRepository(db)
	alice := uuid.New()
	bob := uuid.New()
	carol := uuid.New()
	dave := uuid.New()

	seedMemorizedSurahs(t, db, alice, 1, 3, 2)
	seedMemorizedSurahs(t, db, bob, 1, 2, 4)
	seedMemorizedSurahs(t, db, carol, 1, 0, 6)
	seedHafalan(t, db, dave, 1, model.HafalanInProgress)

	aliceRank, err := repo.MyHafalanRank(alice)
	if err != nil {
		t.Fatalf("MyHafalanRank alice: %v", err)
	}
	if aliceRank.Rank != 1 || aliceRank.Score != 3 || aliceRank.Total != 2 {
		t.Fatalf("alice must rank first on her 3 live surahs among 2 ranked users, got %#v", aliceRank)
	}

	bobRank, err := repo.MyHafalanRank(bob)
	if err != nil {
		t.Fatalf("MyHafalanRank bob: %v", err)
	}
	if bobRank.Rank != 2 || bobRank.Score != 2 || bobRank.Total != 2 {
		t.Fatalf("bob must rank second on his 2 live surahs, got %#v", bobRank)
	}

	for name, userID := range map[string]uuid.UUID{"only deleted rows": carol, "only unfinished rows": dave} {
		rank, err := repo.MyHafalanRank(userID)
		if err != nil {
			t.Fatalf("MyHafalanRank %s: %v", name, err)
		}
		if rank.Rank != 0 || rank.Score != 0 {
			t.Fatalf("user with %s must be unranked, got %#v", name, rank)
		}
	}
}

func seedResolvedReports(t *testing.T, db *gorm.DB, userID uuid.UUID, live int, deleted int) {
	t.Helper()
	for i := 0; i < live; i++ {
		create(t, db, &contentReportRow{ID: uuid.New(), UserID: userID, Status: string(model.ContentReportStatusResolved)})
	}
	for i := 0; i < deleted; i++ {
		row := &contentReportRow{ID: uuid.New(), UserID: userID, Status: string(model.ContentReportStatusResolved)}
		create(t, db, row)
		testdb.Delete(t, db, row)
	}
}

func TestSoftDeleteLeaderboardMyMushahhihRank(t *testing.T) {
	db := testdb.Open(t, &contentReportRow{})
	repo := repository.NewLeaderboardRepository(db)
	alice := uuid.New()
	bob := uuid.New()
	carol := uuid.New()

	seedResolvedReports(t, db, alice, 3, 2)
	seedResolvedReports(t, db, bob, 2, 4)
	seedResolvedReports(t, db, carol, 0, 5)
	create(t, db, &contentReportRow{ID: uuid.New(), UserID: carol, Status: string(model.ContentReportStatusPending)})

	aliceRank, err := repo.MyMushahhihRank(alice)
	if err != nil {
		t.Fatalf("MyMushahhihRank alice: %v", err)
	}
	if aliceRank.Rank != 1 || aliceRank.Score != 3 || aliceRank.Total != 2 {
		t.Fatalf("alice must rank first on her 3 live resolved reports among 2 ranked users, got %#v", aliceRank)
	}

	bobRank, err := repo.MyMushahhihRank(bob)
	if err != nil {
		t.Fatalf("MyMushahhihRank bob: %v", err)
	}
	if bobRank.Rank != 2 || bobRank.Score != 2 || bobRank.Total != 2 {
		t.Fatalf("bob must rank second on his 2 live resolved reports, got %#v", bobRank)
	}

	carolRank, err := repo.MyMushahhihRank(carol)
	if err != nil {
		t.Fatalf("MyMushahhihRank carol: %v", err)
	}
	if carolRank.Rank != 0 || carolRank.Score != 0 {
		t.Fatalf("user with only deleted resolved reports must be unranked, got %#v", carolRank)
	}
}
