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

func seedNotificationSetting(t *testing.T, db *gorm.DB, userID uuid.UUID, notifType model.NotificationType, at string, active bool) *model.NotificationSetting {
	t.Helper()
	setting := &model.NotificationSetting{
		UserID:   userID,
		Type:     notifType,
		Time:     at,
		IsActive: active,
	}
	create(t, db, setting)
	return setting
}

func seedPushToken(t *testing.T, db *gorm.DB, userID uuid.UUID, token string, active bool, minutesAgo int) *model.PushToken {
	t.Helper()
	pushToken := &model.PushToken{
		UserID:     userID,
		Token:      token,
		Platform:   "android",
		Provider:   "expo",
		IsActive:   active,
		LastSeenAt: time.Date(2026, time.September, 30, 12, 0, 0, 0, time.UTC).Add(-time.Duration(minutesAgo) * time.Minute),
	}
	create(t, db, pushToken)
	if !active {
		if err := db.Model(pushToken).Update("is_active", false).Error; err != nil {
			t.Fatalf("deactivate token: %v", err)
		}
	}
	return pushToken
}

func notificationSettingTypes(settings []model.NotificationSetting) []string {
	out := make([]string, 0, len(settings))
	for _, setting := range settings {
		out = append(out, string(setting.Type))
	}
	return out
}

func pushTokenValues(tokens []model.PushToken) []string {
	out := make([]string, 0, len(tokens))
	for _, token := range tokens {
		out = append(out, token.Token)
	}
	return out
}

func TestSoftDeleteNotificationFindByUser(t *testing.T) {
	db := testdb.Open(t, &model.User{}, &model.NotificationSetting{})
	repo := repository.NewNotificationRepository(db)
	alice := uuid.New()
	bob := uuid.New()

	seedNotificationSetting(t, db, alice, model.NotificationTypeDailyQuran, "05:00", true)
	testdb.Delete(t, db, seedNotificationSetting(t, db, alice, model.NotificationTypeDoa, "06:00", true))
	seedNotificationSetting(t, db, alice, model.NotificationTypeMurojaah, "20:00", false)
	seedNotificationSetting(t, db, bob, model.NotificationTypeDailyHadith, "07:00", true)

	got, err := repo.FindByUser(alice)
	if err != nil {
		t.Fatalf("FindByUser: %v", err)
	}
	want := []string{string(model.NotificationTypeDailyQuran), string(model.NotificationTypeMurojaah)}
	if !equalStrings(notificationSettingTypes(got), want) {
		t.Fatalf("expected alice's live settings only, got %v", notificationSettingTypes(got))
	}
}

func TestSoftDeleteNotificationFindDisabledUserIDs(t *testing.T) {
	db := testdb.Open(t, &model.User{}, &model.NotificationSetting{})
	repo := repository.NewNotificationRepository(db)
	alice := uuid.New()
	bob := uuid.New()
	carol := uuid.New()

	seedNotificationSetting(t, db, alice, model.NotificationTypeDailyQuran, "05:00", false)
	testdb.Delete(t, db, seedNotificationSetting(t, db, bob, model.NotificationTypeDailyQuran, "05:00", false))
	seedNotificationSetting(t, db, carol, model.NotificationTypeDailyQuran, "05:00", true)

	got, err := repo.FindDisabledUserIDs(model.NotificationTypeDailyQuran)
	if err != nil {
		t.Fatalf("FindDisabledUserIDs: %v", err)
	}
	if len(got) != 1 || got[0] != alice {
		t.Fatalf("only alice has a live disabled setting, got %v", got)
	}
}

func TestSoftDeleteNotificationFindDue(t *testing.T) {
	db := testdb.Open(t, &model.User{}, &model.NotificationSetting{})
	repo := repository.NewNotificationRepository(db)
	alice := seedUser(t, db, "alice")
	bob := seedUser(t, db, "bob")
	carol := seedUser(t, db, "carol")

	seedNotificationSetting(t, db, alice.ID, model.NotificationTypeDailyQuran, "07:00", true)
	testdb.Delete(t, db, seedNotificationSetting(t, db, bob.ID, model.NotificationTypeDailyQuran, "07:00", true))
	seedNotificationSetting(t, db, carol.ID, model.NotificationTypeDailyHadith, "07:00", true)
	testdb.Delete(t, db, carol)

	now := time.Date(2026, time.October, 1, 7, 0, 0, 0, time.UTC)
	got, err := repo.FindDue(now)
	if err != nil {
		t.Fatalf("FindDue: %v", err)
	}

	byUser := map[uuid.UUID]model.NotificationSetting{}
	for _, setting := range got {
		byUser[setting.UserID] = setting
	}
	if len(got) != 2 {
		t.Fatalf("expected alice's and carol's live settings, got %#v", got)
	}
	if _, leaked := byUser[bob.ID]; leaked {
		t.Fatalf("soft-deleted setting leaked: %#v", got)
	}
	if due := byUser[alice.ID]; due.User == nil || due.User.ID != alice.ID {
		t.Fatalf("live setting should carry its live user: %#v", due)
	}
	due, ok := byUser[carol.ID]
	if !ok {
		t.Fatalf("live setting of a soft-deleted user must still be due")
	}
	if due.User != nil {
		t.Fatalf("soft-deleted user leaked through setting: %#v", due.User)
	}
}

type pushTokenFixture struct {
	repo repository.NotificationRepository

	alice *model.User
	bob   *model.User
	carol *model.User
}

func newPushTokenFixture(t *testing.T) *pushTokenFixture {
	t.Helper()
	db := testdb.Open(t, &model.User{}, &model.PushToken{})
	f := &pushTokenFixture{
		repo:  repository.NewNotificationRepository(db),
		alice: seedUser(t, db, "alice"),
		bob:   seedUser(t, db, "bob"),
		carol: seedUser(t, db, "carol"),
	}

	seedPushToken(t, db, f.alice.ID, "alice-live", true, 1)
	testdb.Delete(t, db, seedPushToken(t, db, f.alice.ID, "alice-deleted", true, 2))
	seedPushToken(t, db, f.alice.ID, "alice-inactive", false, 3)
	seedPushToken(t, db, f.bob.ID, "bob-live", true, 4)
	seedPushToken(t, db, f.carol.ID, "carol-live", true, 5)
	testdb.Delete(t, db, f.carol)
	return f
}

func TestSoftDeleteNotificationPushTokensByUser(t *testing.T) {
	f := newPushTokenFixture(t)

	active, err := f.repo.FindActivePushTokens(f.alice.ID)
	if err != nil {
		t.Fatalf("FindActivePushTokens: %v", err)
	}
	if !equalStrings(pushTokenValues(active), []string{"alice-live"}) {
		t.Fatalf("expected alice's live active token only, got %v", pushTokenValues(active))
	}

	all, err := f.repo.FindPushTokensByUser(f.alice.ID)
	if err != nil {
		t.Fatalf("FindPushTokensByUser: %v", err)
	}
	if !equalStrings(pushTokenValues(all), []string{"alice-live", "alice-inactive"}) {
		t.Fatalf("expected alice's live tokens only, got %v", pushTokenValues(all))
	}
}

func TestSoftDeleteNotificationFindAllActivePushTokens(t *testing.T) {
	f := newPushTokenFixture(t)

	got, err := f.repo.FindAllActivePushTokens()
	if err != nil {
		t.Fatalf("FindAllActivePushTokens: %v", err)
	}
	if !equalStrings(pushTokenValues(got), []string{"alice-live", "bob-live", "carol-live"}) {
		t.Fatalf("expected live active tokens only, got %v", pushTokenValues(got))
	}

	byToken := map[string]model.PushToken{}
	for _, token := range got {
		byToken[token.Token] = token
	}
	if token := byToken["alice-live"]; token.User == nil || token.User.ID != f.alice.ID {
		t.Fatalf("live token should carry its live user: %#v", token)
	}
	if token := byToken["carol-live"]; token.User != nil {
		t.Fatalf("soft-deleted user leaked through token: %#v", token.User)
	}
}

func TestSoftDeleteNotificationFindAllPushTokens(t *testing.T) {
	f := newPushTokenFixture(t)

	got, err := f.repo.FindAllPushTokens()
	if err != nil {
		t.Fatalf("FindAllPushTokens: %v", err)
	}
	if !equalStrings(pushTokenValues(got), []string{"alice-live", "alice-inactive", "bob-live", "carol-live"}) {
		t.Fatalf("expected live tokens only, got %v", pushTokenValues(got))
	}

	byToken := map[string]model.PushToken{}
	for _, token := range got {
		byToken[token.Token] = token
	}
	if token := byToken["bob-live"]; token.User == nil || token.User.ID != f.bob.ID {
		t.Fatalf("live token should carry its live user: %#v", token)
	}
	if token := byToken["carol-live"]; token.User != nil {
		t.Fatalf("soft-deleted user leaked through token: %#v", token.User)
	}
}

func seedUserNotification(t *testing.T, db *gorm.DB, userID uuid.UUID, title string, read bool, age int) *model.UserNotification {
	t.Helper()
	createdAt := time.Date(2026, time.September, 1, 0, 0, 0, 0, time.UTC).Add(time.Duration(age) * time.Hour)
	notification := &model.UserNotification{
		BaseUUID: model.BaseUUID{ID: uuid.New(), BaseTime: model.BaseTime{CreatedAt: &createdAt, UpdatedAt: &createdAt}},
		UserID:   userID,
		Title:    title,
		Body:     "body " + title,
		Type:     model.NotificationTypeDailyQuran,
		Channel:  "inbox",
		Priority: "normal",
		Status:   "created",
		IsRead:   read,
	}
	create(t, db, notification)
	return notification
}

func inboxTitles(items []model.UserNotification) []string {
	out := make([]string, 0, len(items))
	for _, item := range items {
		out = append(out, item.Title)
	}
	return out
}

func TestSoftDeleteNotificationInboxListAndUnreadCount(t *testing.T) {
	db := testdb.Open(t, &model.UserNotification{})
	repo := repository.NewNotificationInboxRepository(db)
	alice := uuid.New()
	bob := uuid.New()

	seedUserNotification(t, db, alice, "alice unread", false, 1)
	testdb.Delete(t, db, seedUserNotification(t, db, alice, "alice deleted unread", false, 9))
	seedUserNotification(t, db, alice, "alice read", true, 2)
	seedUserNotification(t, db, bob, "bob unread", false, 3)

	got, err := repo.ListByUser(alice, 0)
	if err != nil {
		t.Fatalf("ListByUser: %v", err)
	}
	if !equalStrings(inboxTitles(got), []string{"alice unread", "alice read"}) {
		t.Fatalf("expected alice's live notifications only, got %v", inboxTitles(got))
	}

	limited, err := repo.ListByUser(alice, 1)
	if err != nil {
		t.Fatalf("ListByUser limited: %v", err)
	}
	if !equalStrings(inboxTitles(limited), []string{"alice read"}) {
		t.Fatalf("limit must count live rows only, got %v", inboxTitles(limited))
	}

	unread, err := repo.UnreadCount(alice)
	if err != nil {
		t.Fatalf("UnreadCount: %v", err)
	}
	if unread != 1 {
		t.Fatalf("soft-deleted notification counted as unread: got %d, want 1", unread)
	}

	bobUnread, err := repo.UnreadCount(bob)
	if err != nil {
		t.Fatalf("UnreadCount bob: %v", err)
	}
	if bobUnread != 1 {
		t.Fatalf("expected 1 unread for bob, got %d", bobUnread)
	}
}
