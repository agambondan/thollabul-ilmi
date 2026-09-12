package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"github.com/spf13/viper"
)

type deactivatedByTokenCall struct {
	userID uuid.UUID
	token  string
}

type fakeNotificationRepo struct {
	deactivated        []int
	deactivatedByToken []deactivatedByTokenCall
	deleted            []int
	due                []model.NotificationSetting
	marked             []int
	tokens             []model.PushToken
	disabledUserIDs    []uuid.UUID
}

func (f *fakeNotificationRepo) FindByUser(userID uuid.UUID) ([]model.NotificationSetting, error) {
	return []model.NotificationSetting{}, nil
}

func (f *fakeNotificationRepo) UpsertMany(settings []model.NotificationSetting) ([]model.NotificationSetting, error) {
	return settings, nil
}

func (f *fakeNotificationRepo) UpsertPushToken(token model.PushToken) (model.PushToken, error) {
	return token, nil
}

func (f *fakeNotificationRepo) FindActivePushTokens(userID uuid.UUID) ([]model.PushToken, error) {
	matched := make([]model.PushToken, 0, len(f.tokens))
	for _, token := range f.tokens {
		if token.UserID == userID {
			matched = append(matched, token)
		}
	}
	return matched, nil
}

func (f *fakeNotificationRepo) FindAllActivePushTokens() ([]model.PushToken, error) {
	return f.tokens, nil
}

func (f *fakeNotificationRepo) FindAllPushTokens() ([]model.PushToken, error) {
	return f.tokens, nil
}

func (f *fakeNotificationRepo) FindPushTokensByUser(userID uuid.UUID) ([]model.PushToken, error) {
	return f.tokens, nil
}

func (f *fakeNotificationRepo) DeactivatePushToken(id int) error {
	f.deactivated = append(f.deactivated, id)
	return nil
}

func (f *fakeNotificationRepo) DeactivatePushTokenByToken(userID uuid.UUID, token string) error {
	f.deactivatedByToken = append(f.deactivatedByToken, deactivatedByTokenCall{userID: userID, token: token})
	return nil
}

func (f *fakeNotificationRepo) DeletePushToken(id int) error {
	f.deleted = append(f.deleted, id)
	return nil
}

func (f *fakeNotificationRepo) FindDue(now time.Time) ([]model.NotificationSetting, error) {
	return f.due, nil
}

func (f *fakeNotificationRepo) MarkSent(id int, sentAt time.Time) error {
	f.marked = append(f.marked, id)
	return nil
}

func (f *fakeNotificationRepo) FindDisabledUserIDs(notifType model.NotificationType) ([]uuid.UUID, error) {
	return f.disabledUserIDs, nil
}

type fakePrayerTimesService struct{}

func (f *fakePrayerTimesService) GetByDate(lat, lng float64, date time.Time, method, madhab string) (*model.PrayerTimesResponse, error) {
	return &model.PrayerTimesResponse{
		Prayers: model.PrayerTime{Dhuhr: date.Format("15:04")},
	}, nil
}

func (f *fakePrayerTimesService) GetWeekly(lat, lng float64, method, madhab string) ([]model.PrayerTimesResponse, error) {
	return nil, nil
}

func (f *fakePrayerTimesService) GetImsakiyah(lat, lng float64, year, month int, method, madhab string) (*model.ImsakiyahResponse, error) {
	return nil, nil
}

type fakeNotificationInboxRepo struct {
	created []model.UserNotification
}

func (f *fakeNotificationInboxRepo) ListByUser(userID uuid.UUID, limit int) ([]model.UserNotification, error) {
	return []model.UserNotification{}, nil
}

func (f *fakeNotificationInboxRepo) UnreadCount(userID uuid.UUID) (int64, error) {
	return 0, nil
}

func (f *fakeNotificationInboxRepo) MarkRead(id uuid.UUID, userID uuid.UUID) error {
	return nil
}

func (f *fakeNotificationInboxRepo) MarkAllRead(userID uuid.UUID) error {
	return nil
}

func (f *fakeNotificationInboxRepo) Delete(id uuid.UUID, userID uuid.UUID) error {
	return nil
}

func (f *fakeNotificationInboxRepo) Create(n model.UserNotification) (model.UserNotification, error) {
	f.created = append(f.created, n)
	return n, nil
}

func TestNotificationDispatchSendsExpoPushAndInbox(t *testing.T) {
	defer viper.Reset()

	userID := uuid.New()
	settingID := 7
	tokenID := 11
	repo := &fakeNotificationRepo{
		due: []model.NotificationSetting{{
			BaseID: model.BaseID{ID: &settingID},
			UserID: userID,
			Type:   model.NotificationTypeDailyQuran,
		}},
		tokens: []model.PushToken{{
			BaseID:   model.BaseID{ID: &tokenID},
			UserID:   userID,
			Token:    "ExponentPushToken[test-token]",
			Provider: "expo",
			IsActive: true,
		}},
	}
	inboxRepo := &fakeNotificationInboxRepo{}

	var received []map[string]interface{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("unexpected method: %s", r.Method)
		}
		if r.Header.Get("Authorization") != "Bearer secret-token" {
			t.Fatalf("missing expo access token header")
		}
		if err := json.NewDecoder(r.Body).Decode(&received); err != nil {
			t.Fatalf("decode push payload: %v", err)
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"data": []map[string]string{{"status": "ok", "id": "ticket-1"}},
		})
	}))
	defer server.Close()

	viper.Set("EXPO_PUSH_ENDPOINT", server.URL)
	viper.Set("EXPO_PUSH_ACCESS_TOKEN", "secret-token")

	svc := NewNotificationService(repo, inboxRepo, NewPrayerTimesService())
	sent, err := svc.DispatchDueReminders(time.Now())
	if err != nil {
		t.Fatalf("dispatch reminders: %v", err)
	}
	if sent != 1 {
		t.Fatalf("sent count = %d, want 1", sent)
	}
	if len(received) != 1 {
		t.Fatalf("push payload count = %d, want 1", len(received))
	}
	if got := received[0]["to"]; got != "ExponentPushToken[test-token]" {
		t.Fatalf("push recipient = %v", got)
	}
	if len(inboxRepo.created) != 1 {
		t.Fatalf("inbox count = %d, want 1", len(inboxRepo.created))
	}
	if len(repo.marked) != 1 || repo.marked[0] != settingID {
		t.Fatalf("marked sent = %v, want [%d]", repo.marked, settingID)
	}
}

func TestNotificationPushDeactivatesUnregisteredToken(t *testing.T) {
	defer viper.Reset()

	userID := uuid.New()
	tokenID := 9
	repo := &fakeNotificationRepo{
		tokens: []model.PushToken{{
			BaseID:   model.BaseID{ID: &tokenID},
			UserID:   userID,
			Token:    "ExponentPushToken[dead-token]",
			Provider: "expo",
			IsActive: true,
		}},
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"data": []map[string]interface{}{{
				"status":  "error",
				"message": "device is not registered",
				"details": map[string]string{"error": "DeviceNotRegistered"},
			}},
		})
	}))
	defer server.Close()

	viper.Set("EXPO_PUSH_ENDPOINT", server.URL)

	svc := &notificationService{repo: repo}
	sent, err := svc.sendPushReminder(
		model.NotificationSetting{UserID: userID, Type: model.NotificationTypeDoa},
		reminderMessage(model.NotificationTypeDoa),
	)
	if sent != 0 {
		t.Fatalf("push sent = %d, want 0", sent)
	}
	if err == nil {
		t.Fatalf("expected ticket error")
	}
	if len(repo.deactivated) != 1 || repo.deactivated[0] != tokenID {
		t.Fatalf("deactivated = %v, want [%d]", repo.deactivated, tokenID)
	}
}

func TestUnregisterPushTokenDeactivatesGivenToken(t *testing.T) {
	userID := uuid.New()
	repo := &fakeNotificationRepo{}
	inboxRepo := &fakeNotificationInboxRepo{}
	svc := NewNotificationService(repo, inboxRepo, NewPrayerTimesService())

	if err := svc.UnregisterPushToken(userID, "  ExponentPushToken[mine]  "); err != nil {
		t.Fatalf("UnregisterPushToken: %v", err)
	}

	if len(repo.deactivatedByToken) != 1 {
		t.Fatalf("deactivatedByToken calls = %d, want 1", len(repo.deactivatedByToken))
	}
	call := repo.deactivatedByToken[0]
	if call.userID != userID {
		t.Fatalf("deactivated userID = %v, want %v", call.userID, userID)
	}
	if call.token != "ExponentPushToken[mine]" {
		t.Fatalf("deactivated token = %q, want trimmed token", call.token)
	}
}

func TestUnregisterPushTokenRejectsEmptyToken(t *testing.T) {
	userID := uuid.New()
	repo := &fakeNotificationRepo{}
	inboxRepo := &fakeNotificationInboxRepo{}
	svc := NewNotificationService(repo, inboxRepo, NewPrayerTimesService())

	if err := svc.UnregisterPushToken(userID, "   "); err == nil {
		t.Fatalf("expected error for blank token")
	}
	if len(repo.deactivatedByToken) != 0 {
		t.Fatalf("expected no repo call for blank token, got %v", repo.deactivatedByToken)
	}
}

func TestDispatchDueAdzanPushSkipsUsersWhoDisabledAdzan(t *testing.T) {
	defer viper.Reset()

	enabledUserID := uuid.New()
	disabledUserID := uuid.New()
	enabledTokenID := 21
	disabledTokenID := 22

	repo := &fakeNotificationRepo{
		tokens: []model.PushToken{
			{
				BaseID:   model.BaseID{ID: &enabledTokenID},
				UserID:   enabledUserID,
				Token:    "ExponentPushToken[enabled]",
				Provider: "expo",
				IsActive: true,
			},
			{
				BaseID:   model.BaseID{ID: &disabledTokenID},
				UserID:   disabledUserID,
				Token:    "ExponentPushToken[disabled]",
				Provider: "expo",
				IsActive: true,
			},
		},
		disabledUserIDs: []uuid.UUID{disabledUserID},
	}

	var received []map[string]interface{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var batch []map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
			t.Fatalf("decode push payload: %v", err)
		}
		received = append(received, batch...)
		tickets := make([]map[string]string, len(batch))
		for i := range batch {
			tickets[i] = map[string]string{"status": "ok", "id": fmt.Sprintf("ticket-%d", i)}
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"data": tickets})
	}))
	defer server.Close()

	viper.Set("EXPO_PUSH_ENDPOINT", server.URL)

	svc := NewNotificationService(repo, &fakeNotificationInboxRepo{}, &fakePrayerTimesService{})
	sent, err := svc.DispatchDueAdzanPush(time.Now())
	if err != nil {
		t.Fatalf("dispatch adzan push: %v", err)
	}
	if sent != 1 {
		t.Fatalf("sent = %d, want 1", sent)
	}
	if len(received) != 1 {
		t.Fatalf("push payload count = %d, want 1", len(received))
	}
	if got := received[0]["to"]; got != "ExponentPushToken[enabled]" {
		t.Fatalf("push recipient = %v, want the opted-in user's token", got)
	}
}
