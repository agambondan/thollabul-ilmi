//go:build postgres

package repository

import (
	"fmt"
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func newLeaderboardTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	pass := getEnv("DB_PASS", "postgres")
	name := getEnv("DB_NAME", "thullabul_ilmi")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
		host, port, user, pass, name)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Silent),
		SkipDefaultTransaction:                   true,
		NamingStrategy:                           schema.NamingStrategy{SingularTable: true},
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		t.Fatalf("open postgres: %v", err)
	}

	if err := db.AutoMigrate(
		&model.User{},
		&model.UserActivity{},
		&model.HafalanProgress{},
		&model.ContentReport{},
	); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	db.Exec(`TRUNCATE TABLE "user", user_activity, hafalan_progress, content_report RESTART IDENTITY CASCADE`)
	return db
}

func createTestUser(t *testing.T, db *gorm.DB, name string) uuid.UUID {
	t.Helper()
	u := &model.User{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		Name:     &name,
		Password: strPtr("secret"),
	}
	if err := db.Create(u).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	return u.ID
}

func TestPostgresLeaderboardTopStreak(t *testing.T) {
	db := newLeaderboardTestDB(t)
	repo := NewLeaderboardRepository(db)

	alice := createTestUser(t, db, "Alice")
	bob := createTestUser(t, db, "Bob")
	carol := createTestUser(t, db, "Carol")
	dan := createTestUser(t, db, "Dan")

	baseDate := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	// Alice: 5 consecutive days (streak 5)
	for i := 0; i < 5; i++ {
		db.Create(&model.UserActivity{
			BaseUUID:     model.BaseUUID{ID: uuid.New()},
			UserID:       alice,
			ActivityDate: baseDate.AddDate(0, 0, i),
			Type:         model.ActivityQuran,
		})
	}
	// Bob: 3 consecutive days (streak 3)
	for i := 0; i < 3; i++ {
		db.Create(&model.UserActivity{
			BaseUUID:     model.BaseUUID{ID: uuid.New()},
			UserID:       bob,
			ActivityDate: baseDate.AddDate(0, 0, i),
			Type:         model.ActivityHadith,
		})
	}
	// Carol: 1 day (streak 1) + 1 deleted activity
	db.Create(&model.UserActivity{
		BaseUUID:     model.BaseUUID{ID: uuid.New()},
		UserID:       carol,
		ActivityDate: baseDate,
		Type:         model.ActivityDoa,
	})
	deletedAct := &model.UserActivity{
		BaseUUID:     model.BaseUUID{ID: uuid.New()},
		UserID:       carol,
		ActivityDate: baseDate.AddDate(0, 0, 1),
		Type:         model.ActivityDoa,
	}
	db.Create(deletedAct)
	db.Delete(deletedAct)

	// Dan: 10 days but Dan is soft-deleted user
	for i := 0; i < 10; i++ {
		db.Create(&model.UserActivity{
			BaseUUID:     model.BaseUUID{ID: uuid.New()},
			UserID:       dan,
			ActivityDate: baseDate.AddDate(0, 0, i),
			Type:         model.ActivityQuran,
		})
	}
	db.Delete(&model.User{BaseUUID: model.BaseUUID{ID: dan}})

	entries, err := repo.TopStreak(10)
	if err != nil {
		t.Fatalf("TopStreak: %v", err)
	}
	if len(entries) != 3 {
		t.Fatalf("expected 3 entries, got %d: %+v", len(entries), entries)
	}
	if entries[0].UserID != alice.String() || entries[0].Score != 5 || entries[0].Rank != 1 {
		t.Fatalf("rank 1 should be alice (5), got %+v", entries[0])
	}
	if entries[1].UserID != bob.String() || entries[1].Score != 3 || entries[1].Rank != 2 {
		t.Fatalf("rank 2 should be bob (3), got %+v", entries[1])
	}
	if entries[2].UserID != carol.String() || entries[2].Score != 1 || entries[2].Rank != 3 {
		t.Fatalf("rank 3 should be carol (1), got %+v", entries[2])
	}
	for _, e := range entries {
		if e.Name == "" {
			t.Fatalf("entry should have anonymized pseudonym, got empty: %+v", e)
		}
	}
}

func TestPostgresLeaderboardMyStreakRank(t *testing.T) {
	db := newLeaderboardTestDB(t)
	repo := NewLeaderboardRepository(db)

	alice := createTestUser(t, db, "Alice")
	bob := createTestUser(t, db, "Bob")
	carol := createTestUser(t, db, "Carol")
	nobody := uuid.New()

	baseDate := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	for i := 0; i < 5; i++ {
		db.Create(&model.UserActivity{
			BaseUUID:     model.BaseUUID{ID: uuid.New()},
			UserID:       alice,
			ActivityDate: baseDate.AddDate(0, 0, i),
			Type:         model.ActivityQuran,
		})
	}
	for i := 0; i < 3; i++ {
		db.Create(&model.UserActivity{
			BaseUUID:     model.BaseUUID{ID: uuid.New()},
			UserID:       bob,
			ActivityDate: baseDate.AddDate(0, 0, i),
			Type:         model.ActivityHadith,
		})
	}
	db.Create(&model.UserActivity{
		BaseUUID:     model.BaseUUID{ID: uuid.New()},
		UserID:       carol,
		ActivityDate: baseDate,
		Type:         model.ActivityDoa,
	})

	aliceRank, err := repo.MyStreakRank(alice)
	if err != nil {
		t.Fatalf("MyStreakRank alice: %v", err)
	}
	if aliceRank.Rank != 1 || aliceRank.Score != 5 || aliceRank.Total != 3 {
		t.Fatalf("alice rank: want rank 1 score 5 total 3, got %+v", aliceRank)
	}

	bobRank, err := repo.MyStreakRank(bob)
	if err != nil {
		t.Fatalf("MyStreakRank bob: %v", err)
	}
	if bobRank.Rank != 2 || bobRank.Score != 3 || bobRank.Total != 3 {
		t.Fatalf("bob rank: want rank 2 score 3 total 3, got %+v", bobRank)
	}

	nobodyRank, err := repo.MyStreakRank(nobody)
	if err != nil {
		t.Fatalf("MyStreakRank nobody: %v", err)
	}
	if nobodyRank.Rank != 0 || nobodyRank.Score != 0 {
		t.Fatalf("unranked user should have rank 0 score 0, got %+v", nobodyRank)
	}
}

func TestPostgresLeaderboardTopHafalan(t *testing.T) {
	db := newLeaderboardTestDB(t)
	repo := NewLeaderboardRepository(db)

	alice := createTestUser(t, db, "Alice")
	bob := createTestUser(t, db, "Bob")
	carol := createTestUser(t, db, "Carol")

	// Alice: 3 memorized
	for s := 1; s <= 3; s++ {
		db.Create(&model.HafalanProgress{
			BaseUUID: model.BaseUUID{ID: uuid.New()},
			UserID:   alice,
			SurahID:  s,
			Status:   model.HafalanMemorized,
		})
	}
	// Bob: 2 memorized + 1 in_progress
	for s := 1; s <= 2; s++ {
		db.Create(&model.HafalanProgress{
			BaseUUID: model.BaseUUID{ID: uuid.New()},
			UserID:   bob,
			SurahID:  s,
			Status:   model.HafalanMemorized,
		})
	}
	db.Create(&model.HafalanProgress{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   bob,
		SurahID:  3,
		Status:   model.HafalanInProgress,
	})
	// Carol: 1 memorized but Carol is soft-deleted
	db.Create(&model.HafalanProgress{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   carol,
		SurahID:  1,
		Status:   model.HafalanMemorized,
	})
	db.Delete(&model.User{BaseUUID: model.BaseUUID{ID: carol}})

	entries, err := repo.TopHafalan(10)
	if err != nil {
		t.Fatalf("TopHafalan: %v", err)
	}
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d: %+v", len(entries), entries)
	}
	if entries[0].UserID != alice.String() || entries[0].Score != 3 || entries[0].Rank != 1 {
		t.Fatalf("rank 1 should be alice (3), got %+v", entries[0])
	}
	if entries[1].UserID != bob.String() || entries[1].Score != 2 || entries[1].Rank != 2 {
		t.Fatalf("rank 2 should be bob (2), got %+v", entries[1])
	}
}

func TestPostgresLeaderboardTopMushahhih(t *testing.T) {
	db := newLeaderboardTestDB(t)
	repo := NewLeaderboardRepository(db)

	alice := createTestUser(t, db, "Alice")
	bob := createTestUser(t, db, "Bob")
	carol := createTestUser(t, db, "Carol")

	// Alice: 4 resolved
	for i := 0; i < 4; i++ {
		db.Create(&model.ContentReport{
			BaseUUID: model.BaseUUID{ID: uuid.New()},
			UserID:   alice,
			Status:   model.ContentReportStatusResolved,
		})
	}
	// Bob: 2 resolved + 1 pending
	for i := 0; i < 2; i++ {
		db.Create(&model.ContentReport{
			BaseUUID: model.BaseUUID{ID: uuid.New()},
			UserID:   bob,
			Status:   model.ContentReportStatusResolved,
		})
	}
	db.Create(&model.ContentReport{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   bob,
		Status:   model.ContentReportStatusPending,
	})
	// Carol: 10 resolved but Carol is soft-deleted
	for i := 0; i < 10; i++ {
		db.Create(&model.ContentReport{
			BaseUUID: model.BaseUUID{ID: uuid.New()},
			UserID:   carol,
			Status:   model.ContentReportStatusResolved,
		})
	}
	db.Delete(&model.User{BaseUUID: model.BaseUUID{ID: carol}})

	entries, err := repo.TopMushahhih(10)
	if err != nil {
		t.Fatalf("TopMushahhih: %v", err)
	}
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d: %+v", len(entries), entries)
	}
	if entries[0].UserID != alice.String() || entries[0].Score != 4 || entries[0].Rank != 1 {
		t.Fatalf("rank 1 should be alice (4), got %+v", entries[0])
	}
	if entries[1].UserID != bob.String() || entries[1].Score != 2 || entries[1].Rank != 2 {
		t.Fatalf("rank 2 should be bob (2), got %+v", entries[1])
	}
}

func TestPostgresLeaderboardMyHafalanRank(t *testing.T) {
	db := newLeaderboardTestDB(t)
	repo := NewLeaderboardRepository(db)

	alice := createTestUser(t, db, "Alice")
	bob := createTestUser(t, db, "Bob")
	carol := createTestUser(t, db, "Carol")

	for s := 1; s <= 3; s++ {
		db.Create(&model.HafalanProgress{
			BaseUUID: model.BaseUUID{ID: uuid.New()},
			UserID:   alice,
			SurahID:  s,
			Status:   model.HafalanMemorized,
		})
	}
	for s := 1; s <= 2; s++ {
		db.Create(&model.HafalanProgress{
			BaseUUID: model.BaseUUID{ID: uuid.New()},
			UserID:   bob,
			SurahID:  s,
			Status:   model.HafalanMemorized,
		})
	}
	db.Create(&model.HafalanProgress{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   carol,
		SurahID:  1,
		Status:   model.HafalanInProgress,
	})

	aliceRank, err := repo.MyHafalanRank(alice)
	if err != nil {
		t.Fatalf("MyHafalanRank alice: %v", err)
	}
	if aliceRank.Rank != 1 || aliceRank.Score != 3 || aliceRank.Total != 2 {
		t.Fatalf("alice rank: want rank 1 score 3 total 2, got %+v", aliceRank)
	}

	bobRank, err := repo.MyHafalanRank(bob)
	if err != nil {
		t.Fatalf("MyHafalanRank bob: %v", err)
	}
	if bobRank.Rank != 2 || bobRank.Score != 2 || bobRank.Total != 2 {
		t.Fatalf("bob rank: want rank 2 score 2 total 2, got %+v", bobRank)
	}

	carolRank, err := repo.MyHafalanRank(carol)
	if err != nil {
		t.Fatalf("MyHafalanRank carol: %v", err)
	}
	if carolRank.Rank != 0 || carolRank.Score != 0 {
		t.Fatalf("unranked user should have rank 0 score 0, got %+v", carolRank)
	}
}

func TestPostgresLeaderboardMyMushahhihRank(t *testing.T) {
	db := newLeaderboardTestDB(t)
	repo := NewLeaderboardRepository(db)

	alice := createTestUser(t, db, "Alice")
	bob := createTestUser(t, db, "Bob")
	carol := createTestUser(t, db, "Carol")

	for i := 0; i < 4; i++ {
		db.Create(&model.ContentReport{
			BaseUUID: model.BaseUUID{ID: uuid.New()},
			UserID:   alice,
			Status:   model.ContentReportStatusResolved,
		})
	}
	for i := 0; i < 2; i++ {
		db.Create(&model.ContentReport{
			BaseUUID: model.BaseUUID{ID: uuid.New()},
			UserID:   bob,
			Status:   model.ContentReportStatusResolved,
		})
	}
	db.Create(&model.ContentReport{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   carol,
		Status:   model.ContentReportStatusPending,
	})

	aliceRank, err := repo.MyMushahhihRank(alice)
	if err != nil {
		t.Fatalf("MyMushahhihRank alice: %v", err)
	}
	if aliceRank.Rank != 1 || aliceRank.Score != 4 || aliceRank.Total != 2 {
		t.Fatalf("alice rank: want rank 1 score 4 total 2, got %+v", aliceRank)
	}

	bobRank, err := repo.MyMushahhihRank(bob)
	if err != nil {
		t.Fatalf("MyMushahhihRank bob: %v", err)
	}
	if bobRank.Rank != 2 || bobRank.Score != 2 || bobRank.Total != 2 {
		t.Fatalf("bob rank: want rank 2 score 2 total 2, got %+v", bobRank)
	}

	carolRank, err := repo.MyMushahhihRank(carol)
	if err != nil {
		t.Fatalf("MyMushahhihRank carol: %v", err)
	}
	if carolRank.Rank != 0 || carolRank.Score != 0 {
		t.Fatalf("unranked user should have rank 0 score 0, got %+v", carolRank)
	}
}
