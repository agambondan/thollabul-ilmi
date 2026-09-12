package repository

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func newNotificationTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.PushToken{}, &model.NotificationSetting{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	return db
}

func TestUpsertPushTokenReassignsSharedDeviceToNewUser(t *testing.T) {
	db := newNotificationTestDB(t)
	repo := NewNotificationRepository(db)

	userA := uuid.New()
	userB := uuid.New()
	sharedToken := "ExponentPushToken[shared-device]"

	if _, err := repo.UpsertPushToken(model.PushToken{
		UserID:   userA,
		Token:    sharedToken,
		Platform: "android",
		Provider: "expo",
	}); err != nil {
		t.Fatalf("upsert for user A: %v", err)
	}

	// User B logs in on the same physical device without user A ever
	// unregistering (network failure, app killed, etc.) — this must not
	// leave both accounts subscribed to the same push token.
	if _, err := repo.UpsertPushToken(model.PushToken{
		UserID:   userB,
		Token:    sharedToken,
		Platform: "android",
		Provider: "expo",
	}); err != nil {
		t.Fatalf("upsert for user B: %v", err)
	}

	activeForA, err := repo.FindActivePushTokens(userA)
	if err != nil {
		t.Fatalf("find active for A: %v", err)
	}
	if len(activeForA) != 0 {
		t.Fatalf("user A should have no active tokens left, got %d", len(activeForA))
	}

	activeForB, err := repo.FindActivePushTokens(userB)
	if err != nil {
		t.Fatalf("find active for B: %v", err)
	}
	if len(activeForB) != 1 || activeForB[0].Token != sharedToken {
		t.Fatalf("user B should hold the active shared token, got %#v", activeForB)
	}

	all, err := repo.FindAllActivePushTokens()
	if err != nil {
		t.Fatalf("find all active: %v", err)
	}
	if len(all) != 1 {
		t.Fatalf("expected exactly one active row for the shared token across all users, got %d", len(all))
	}
}

func TestUpsertPushTokenSameUserDoesNotDeactivateItself(t *testing.T) {
	db := newNotificationTestDB(t)
	repo := NewNotificationRepository(db)

	userA := uuid.New()
	token := "ExponentPushToken[mine]"

	if _, err := repo.UpsertPushToken(model.PushToken{
		UserID:   userA,
		Token:    token,
		Platform: "android",
		Provider: "expo",
	}); err != nil {
		t.Fatalf("first upsert: %v", err)
	}
	if _, err := repo.UpsertPushToken(model.PushToken{
		UserID:   userA,
		Token:    token,
		Platform: "ios",
		Provider: "expo",
	}); err != nil {
		t.Fatalf("second upsert: %v", err)
	}

	active, err := repo.FindActivePushTokens(userA)
	if err != nil {
		t.Fatalf("find active: %v", err)
	}
	if len(active) != 1 {
		t.Fatalf("expected exactly one row for the same user re-registering, got %d", len(active))
	}
	if active[0].Platform != "ios" {
		t.Fatalf("expected re-registration to update platform, got %q", active[0].Platform)
	}
}

func TestFindDisabledUserIDsReturnsOnlyExplicitOptOuts(t *testing.T) {
	db := newNotificationTestDB(t)
	repo := NewNotificationRepository(db)

	optedOutUser := uuid.New()
	optedInUser := uuid.New()
	otherTypeOptedOutUser := uuid.New()

	settings := []model.NotificationSetting{
		{UserID: optedOutUser, Type: model.NotificationTypeAdzan, Time: "04:30", IsActive: false},
		{UserID: optedInUser, Type: model.NotificationTypeAdzan, Time: "04:30", IsActive: true},
		{UserID: otherTypeOptedOutUser, Type: model.NotificationTypeDoa, Time: "04:30", IsActive: false},
	}
	if _, err := repo.UpsertMany(settings); err != nil {
		t.Fatalf("seed settings: %v", err)
	}

	disabled, err := repo.FindDisabledUserIDs(model.NotificationTypeAdzan)
	if err != nil {
		t.Fatalf("find disabled user ids: %v", err)
	}
	if len(disabled) != 1 || disabled[0] != optedOutUser {
		t.Fatalf("disabled user ids = %v, want [%v]", disabled, optedOutUser)
	}
}
