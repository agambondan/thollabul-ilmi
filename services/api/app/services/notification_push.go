package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"github.com/spf13/viper"
)

const defaultExpoPushEndpoint = "https://exp.host/--/api/v2/push/send"

type expoPushMessage struct {
	To        string                 `json:"to"`
	Title     string                 `json:"title"`
	Body      string                 `json:"body"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Sound     string                 `json:"sound,omitempty"`
	ChannelID string                 `json:"channelId,omitempty"`
}

type expoPushTicket struct {
	Status  string            `json:"status"`
	ID      string            `json:"id,omitempty"`
	Message string            `json:"message,omitempty"`
	Details map[string]string `json:"details,omitempty"`
}

type expoPushError struct {
	Code    string                 `json:"code,omitempty"`
	Message string                 `json:"message,omitempty"`
	Details map[string]interface{} `json:"details,omitempty"`
}

type expoPushResponse struct {
	Data   json.RawMessage `json:"data,omitempty"`
	Errors []expoPushError `json:"errors,omitempty"`
}

func (s *notificationService) sendPushReminder(setting model.NotificationSetting, content reminderContent) (int, error) {
	return s.sendPushToUser(setting.UserID, setting.Type, content)
}

func (s *notificationService) sendPushToUser(userID uuid.UUID, notificationType model.NotificationType, content reminderContent) (int, error) {
	if strings.EqualFold(viper.GetString("EXPO_PUSH_ENABLED"), "false") {
		return 0, nil
	}
	if s.repo == nil {
		return 0, nil
	}

	tokens, err := s.repo.FindActivePushTokens(userID)
	if err != nil {
		return 0, err
	}

	expoMessages := make([]expoPushMessage, 0, len(tokens))
	expoTokenIDs := make([]int, 0, len(tokens))
	sent := 0

	for _, token := range tokens {
		if !token.IsActive {
			continue
		}

		switch strings.ToLower(token.Provider) {
		case "expo":
			if !isValidExpoToken(token.Token) {
				continue
			}
			tokenID := 0
			if token.ID != nil {
				tokenID = *token.ID
			}
			expoTokenIDs = append(expoTokenIDs, tokenID)
			expoMessages = append(expoMessages, expoPushMessage{
				To:        token.Token,
				Title:     content.Title,
				Body:      content.Description,
				Sound:     "default",
				ChannelID: viper.GetString("EXPO_PUSH_CHANNEL_ID"),
				Data: map[string]interface{}{
					"type":              "daily_reminder",
					"notification_type": notificationType,
				},
			})

		case "web":
			if token.KeyP256DH == "" || token.KeyAuth == "" {
				continue
			}
			if err := s.sendWebPush(token, content.Title, content.Description, notificationType); err != nil {
				slog.Warn("web push send failed", "user_id", userID, "err", err)
				continue
			}
			sent++
		}
	}

	if len(expoMessages) > 0 {
		expoSent, err := s.sendExpoBatches(expoMessages, expoTokenIDs)
		if err != nil {
			return sent, err
		}
		sent += expoSent
	}

	return sent, nil
}

func isValidExpoToken(token string) bool {
	return strings.HasPrefix(token, "ExponentPushToken[") || strings.HasPrefix(token, "ExpoPushToken[")
}

func isDeliverableExpoPushToken(token model.PushToken) bool {
	return token.IsActive && strings.EqualFold(token.Provider, "expo") && isValidExpoToken(token.Token)
}

func (s *notificationService) sendWebPush(token model.PushToken, title, body string, notificationType model.NotificationType) error {
	return s.sendWebPushCustom(token, title, body, "/", notificationType)
}

func (s *notificationService) sendWebPushCustom(token model.PushToken, title, body, notifURL string, notificationType model.NotificationType) error {
	vapidPublicKey := strings.TrimSpace(viper.GetString("VAPID_PUBLIC_KEY"))
	vapidPrivateKey := strings.TrimSpace(viper.GetString("VAPID_PRIVATE_KEY"))
	vapidSubject := strings.TrimSpace(viper.GetString("VAPID_SUBJECT"))
	if vapidPublicKey == "" || vapidPrivateKey == "" {
		return fmt.Errorf("VAPID keys not configured")
	}
	if vapidSubject == "" {
		vapidSubject = "mailto:notifications@thollabul-ilmi.app"
	}
	if notifURL == "" {
		notifURL = "/"
	}

	payload, err := json.Marshal(map[string]interface{}{
		"title": title,
		"body":  body,
		"url":   notifURL,
		"data": map[string]interface{}{
			"type":              "broadcast",
			"notification_type": notificationType,
			"url":               notifURL,
		},
	})
	if err != nil {
		return err
	}

	sub := &webpush.Subscription{
		Endpoint: token.Token,
		Keys: webpush.Keys{
			P256dh: token.KeyP256DH,
			Auth:   token.KeyAuth,
		},
	}

	resp, err := webpush.SendNotification(payload, sub, &webpush.Options{
		Subscriber:      vapidSubject,
		VAPIDPublicKey:  vapidPublicKey,
		VAPIDPrivateKey: vapidPrivateKey,
		TTL:             86400,
		Urgency:         webpush.UrgencyHigh,
	})
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusGone || resp.StatusCode == http.StatusNotFound {
		if token.ID != nil {
			if deactErr := s.repo.DeactivatePushToken(*token.ID); deactErr != nil {
				slog.Warn("failed to deactivate expired web push token", "token_id", *token.ID, "err", deactErr)
			}
		}
		return fmt.Errorf("web push endpoint expired (HTTP %d)", resp.StatusCode)
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("web push failed (HTTP %d)", resp.StatusCode)
	}

	return nil
}

func (s *notificationService) sendExpoBatches(messages []expoPushMessage, tokenIDs []int) (int, error) {
	sent := 0
	for start := 0; start < len(messages); start += 100 {
		end := start + 100
		if end > len(messages) {
			end = len(messages)
		}
		batchSent, err := s.sendExpoPushBatch(messages[start:end], tokenIDs[start:end])
		if err != nil {
			return sent, err
		}
		sent += batchSent
	}
	return sent, nil
}

func (s *notificationService) sendExpoPushBatch(messages []expoPushMessage, tokenIDs []int) (int, error) {
	endpoint := strings.TrimSpace(viper.GetString("EXPO_PUSH_ENDPOINT"))
	if endpoint == "" {
		endpoint = defaultExpoPushEndpoint
	}

	body, err := json.Marshal(messages)
	if err != nil {
		return 0, err
	}

	timeout := viper.GetDuration("EXPO_PUSH_TIMEOUT")
	if timeout <= 0 {
		if seconds := viper.GetInt("EXPO_PUSH_TIMEOUT_SECONDS"); seconds > 0 {
			timeout = time.Duration(seconds) * time.Second
		} else {
			timeout = 10 * time.Second
		}
	}

	client := &http.Client{Timeout: timeout}
	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		sent, retry, err := s.sendExpoPushRequest(client, endpoint, body, tokenIDs)
		if err == nil || !retry {
			return sent, err
		}
		lastErr = err
		time.Sleep(time.Duration(attempt+1) * 500 * time.Millisecond)
	}
	if lastErr != nil {
		return 0, lastErr
	}
	return 0, nil
}

func (s *notificationService) sendExpoPushRequest(client *http.Client, endpoint string, body []byte, tokenIDs []int) (int, bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), client.Timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return 0, false, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	if accessToken := strings.TrimSpace(viper.GetString("EXPO_PUSH_ACCESS_TOKEN")); accessToken != "" {
		req.Header.Set("Authorization", "Bearer "+accessToken)
	}

	resp, err := client.Do(req)
	if err != nil {
		return 0, true, err
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, false, err
	}

	if resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode >= http.StatusInternalServerError {
		return 0, true, fmt.Errorf("expo push temporary failure: %s", resp.Status)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return 0, false, fmt.Errorf("expo push failed: %s: %s", resp.Status, strings.TrimSpace(string(responseBody)))
	}

	var parsed expoPushResponse
	if err := json.Unmarshal(responseBody, &parsed); err != nil {
		return 0, false, err
	}
	if len(parsed.Errors) > 0 {
		return 0, false, fmt.Errorf("expo push rejected request: %s", parsed.Errors[0].Message)
	}

	tickets, err := parseExpoTickets(parsed.Data)
	if err != nil {
		return 0, false, err
	}

	sent := 0
	for index, ticket := range tickets {
		if ticket.Status == "ok" {
			sent++
			continue
		}
		if ticket.Details["error"] == "DeviceNotRegistered" && index < len(tokenIDs) && tokenIDs[index] > 0 {
			if err := s.repo.DeactivatePushToken(tokenIDs[index]); err != nil {
				return sent, false, err
			}
		}
		if ticket.Message != "" {
			return sent, false, fmt.Errorf("expo push ticket error: %s", ticket.Message)
		}
	}

	return sent, false, nil
}

func parseExpoTickets(data json.RawMessage) ([]expoPushTicket, error) {
	trimmed := bytes.TrimSpace(data)
	if len(trimmed) == 0 || bytes.Equal(trimmed, []byte("null")) {
		return []expoPushTicket{}, nil
	}

	if trimmed[0] == '[' {
		var tickets []expoPushTicket
		if err := json.Unmarshal(trimmed, &tickets); err != nil {
			return nil, err
		}
		return tickets, nil
	}

	var ticket expoPushTicket
	if err := json.Unmarshal(trimmed, &ticket); err != nil {
		return nil, err
	}
	return []expoPushTicket{ticket}, nil
}
