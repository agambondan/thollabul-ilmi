package service

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"github.com/spf13/viper"
)

type fakeNotificationRepo struct {
	deactivated []int
	due         []model.NotificationSetting
	marked      []int
	tokens      []model.PushToken
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
	return f.tokens, nil
}

func (f *fakeNotificationRepo) FindPushTokensByUser(userID uuid.UUID) ([]model.PushToken, error) {
	return f.tokens, nil
}

func (f *fakeNotificationRepo) DeactivatePushToken(id int) error {
	f.deactivated = append(f.deactivated, id)
	return nil
}

func (f *fakeNotificationRepo) FindDue(now time.Time) ([]model.NotificationSetting, error) {
	return f.due, nil
}

func (f *fakeNotificationRepo) MarkSent(id int, sentAt time.Time) error {
	f.marked = append(f.marked, id)
	return nil
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

	svc := NewNotificationService(repo, inboxRepo)
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
