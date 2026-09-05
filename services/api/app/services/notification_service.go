package service

import (
	"context"
	"fmt"
	"log/slog"
	"math"
	"strings"
	"sync"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
	"github.com/spf13/viper"
)

type NotificationService interface {
	FindSettings(userID uuid.UUID) ([]model.NotificationSetting, error)
	FindPushTokenStatus(userID uuid.UUID) (model.PushTokenStatusResponse, error)
	UpsertSettings(userID uuid.UUID, req *model.NotificationSettingsUpsertRequest) ([]model.NotificationSetting, error)
	RegisterPushToken(userID uuid.UUID, req *model.PushTokenRegisterRequest) (model.PushToken, error)
	SendTestPush(userID uuid.UUID) (model.PushTestResponse, error)
	BroadcastPush(adminID uuid.UUID, req *model.BroadcastPushRequest) (model.BroadcastPushResponse, error)
	DispatchDueReminders(now time.Time) (int, error)
	DispatchDueAdzanPush(now time.Time) (int, error)
	StartReminderScheduler(ctx context.Context, interval time.Duration)
	SendPushToUser(userID uuid.UUID, title, body, notifURL string) (int, error)
}

type notificationService struct {
	inboxRepo       repository.NotificationInboxRepository
	repo            repository.NotificationRepository
	prayerTimesSvc  PrayerTimesService
	adzanSentMap    sync.Map
}

func NewNotificationService(repo repository.NotificationRepository, inboxRepo repository.NotificationInboxRepository, prayerTimesSvc PrayerTimesService) NotificationService {
	return &notificationService{
		repo:           repo,
		inboxRepo:      inboxRepo,
		prayerTimesSvc: prayerTimesSvc,
	}
}

func (s *notificationService) FindSettings(userID uuid.UUID) ([]model.NotificationSetting, error) {
	return s.repo.FindByUser(userID)
}

func (s *notificationService) FindPushTokenStatus(userID uuid.UUID) (model.PushTokenStatusResponse, error) {
	tokens, err := s.repo.FindPushTokensByUser(userID)
	if err != nil {
		return model.PushTokenStatusResponse{}, err
	}

	items := make([]model.PushTokenStatus, 0, len(tokens))
	activeCount := 0
	for _, token := range tokens {
		if token.IsActive {
			activeCount++
		}
		items = append(items, model.PushTokenStatus{
			DeviceID:    token.DeviceID,
			ID:          token.ID,
			IsActive:    token.IsActive,
			LastSeenAt:  token.LastSeenAt,
			Platform:    token.Platform,
			Provider:    token.Provider,
			TokenSuffix: tokenSuffix(token.Token),
		})
	}

	return model.PushTokenStatusResponse{
		Items:       items,
		HasActive:   activeCount > 0,
		ActiveCount: activeCount,
	}, nil
}

func (s *notificationService) UpsertSettings(userID uuid.UUID, req *model.NotificationSettingsUpsertRequest) ([]model.NotificationSetting, error) {
	unique := map[model.NotificationType]model.NotificationSettingRequest{}
	for _, setting := range req.Settings {
		unique[setting.Type] = setting
	}

	items := make([]model.NotificationSetting, 0, len(unique))
	for _, setting := range unique {
		normalizedTime, err := normalizeReminderTime(setting.Time)
		if err != nil {
			return nil, err
		}
		active := true
		if setting.IsActive != nil {
			active = *setting.IsActive
		}
		items = append(items, model.NotificationSetting{
			UserID:   userID,
			Type:     setting.Type,
			Time:     normalizedTime,
			IsActive: active,
		})
	}

	return s.repo.UpsertMany(items)
}

func (s *notificationService) RegisterPushToken(userID uuid.UUID, req *model.PushTokenRegisterRequest) (model.PushToken, error) {
	token := strings.TrimSpace(req.Token)
	platform := strings.ToLower(strings.TrimSpace(req.Platform))
	if token == "" {
		return model.PushToken{}, fmt.Errorf("token is required")
	}
	if platform == "" {
		return model.PushToken{}, fmt.Errorf("platform is required")
	}

	provider := strings.ToLower(strings.TrimSpace(req.Provider))
	if provider == "" {
		provider = "expo"
	}

	return s.repo.UpsertPushToken(model.PushToken{
		UserID:          userID,
		Token:           token,
		Platform:        platform,
		Provider:        provider,
		DeviceID:        strings.TrimSpace(req.DeviceID),
		KeyP256DH:       strings.TrimSpace(req.KeyP256DH),
		KeyAuth:         strings.TrimSpace(req.KeyAuth),
		Latitude:        req.Latitude,
		Longitude:       req.Longitude,
		CityName:        strings.TrimSpace(req.CityName),
		Timezone:        strings.TrimSpace(req.Timezone),
		TzOffsetMinutes: req.TzOffsetMinutes,
	})
}

func (s *notificationService) SendTestPush(userID uuid.UUID) (model.PushTestResponse, error) {
	content := reminderContent{
		Title:       "Tes Push Thullaabul Ilmi",
		Description: "Push native berhasil aktif di perangkat ini.",
		EmailHTML:   "",
	}
	sent, err := s.sendPushToUser(userID, model.NotificationTypeDoa, content)
	if err != nil {
		return model.PushTestResponse{}, err
	}
	if sent == 0 {
		return model.PushTestResponse{}, fmt.Errorf("tidak ada push token aktif — daftarkan perangkat terlebih dahulu")
	}
	if s.inboxRepo != nil {
		_, _ = s.inboxRepo.Create(model.UserNotification{
			UserID: userID,
			Title:  content.Title,
			Body:   content.Description,
			Type:   model.NotificationTypeDoa,
			RefID:  "push-test",
		})
	}
	return model.PushTestResponse{Message: "test push sent", Sent: sent}, nil
}

func (s *notificationService) BroadcastPush(adminID uuid.UUID, req *model.BroadcastPushRequest) (model.BroadcastPushResponse, error) {
	title := strings.TrimSpace(req.Title)
	body := strings.TrimSpace(req.Body)
	if title == "" || body == "" {
		return model.BroadcastPushResponse{}, fmt.Errorf("title and body are required")
	}
	notifURL := strings.TrimSpace(req.URL)
	if notifURL == "" {
		notifURL = "/"
	}
	tokens, err := s.repo.FindAllActivePushTokens()
	if err != nil {
		return model.BroadcastPushResponse{}, err
	}
	sent := 0
	seenUsers := map[uuid.UUID]bool{}
	for _, token := range tokens {
		if !token.IsActive {
			continue
		}
		switch strings.ToLower(token.Provider) {
		case "web":
			if token.KeyP256DH == "" || token.KeyAuth == "" {
				continue
			}
			if err := s.sendWebPushCustom(token, title, body, notifURL, model.NotificationTypeDoa); err != nil {
				slog.Warn("web push broadcast failed", "admin_id", adminID, "user_id", token.UserID, "err", err)
				continue
			}
			sent++
			seenUsers[token.UserID] = true
		case "expo":
			if !isDeliverableExpoPushToken(token) {
				continue
			}
			content := reminderContent{Title: title, Description: body}
			if sentOne, err := s.sendPushToUser(token.UserID, model.NotificationTypeDoa, content); err != nil {
				slog.Warn("expo push broadcast failed", "admin_id", adminID, "user_id", token.UserID, "err", err)
			} else if sentOne > 0 {
				sent += sentOne
				seenUsers[token.UserID] = true
			}
		}
	}
	if s.inboxRepo != nil {
		for userID := range seenUsers {
			_, _ = s.inboxRepo.Create(model.UserNotification{
				UserID: userID,
				Title:  title,
				Body:   body,
				Type:   model.NotificationTypeDoa,
				RefID:  "admin-broadcast",
			})
		}
	}
	return model.BroadcastPushResponse{Message: "broadcast push sent", Sent: sent, Tokens: len(tokens)}, nil
}

func (s *notificationService) DispatchDueReminders(now time.Time) (int, error) {
	items, err := s.repo.FindDue(now)
	if err != nil {
		return 0, err
	}

	sent := 0
	for _, setting := range items {
		content := reminderMessage(setting.Type)
		delivered := false

		if s.inboxRepo != nil {
			if _, err := s.inboxRepo.Create(model.UserNotification{
				UserID: setting.UserID,
				Title:  content.Title,
				Body:   content.Description,
				Type:   setting.Type,
			}); err != nil {
				slog.Warn("notification inbox create failed", "user_id", setting.UserID, "type", setting.Type, "err", err)
			} else {
				delivered = true
			}
		}

		if setting.User != nil && setting.User.Email != nil && strings.TrimSpace(*setting.User.Email) != "" {
			if err := lib.SendHTMLEmail(*setting.User.Email, content.Title, content.EmailHTML); err != nil {
				slog.Warn("notification email reminder failed", "user_id", setting.UserID, "type", setting.Type, "err", err)
			} else {
				delivered = true
			}
		}

		pushSent, err := s.sendPushReminder(setting, content)
		if err != nil {
			slog.Warn("notification push reminder failed", "user_id", setting.UserID, "type", setting.Type, "err", err)
		}
		if pushSent > 0 {
			delivered = true
		}

		if !delivered {
			continue
		}
		if setting.ID != nil {
			if err := s.repo.MarkSent(*setting.ID, now); err != nil {
				slog.Warn("notification mark-sent failed", "id", *setting.ID, "err", err)
			}
		}
		sent++
	}

	return sent, nil
}

func (s *notificationService) DispatchDueAdzanPush(now time.Time) (int, error) {
	if s.prayerTimesSvc == nil || s.repo == nil {
		return 0, nil
	}

	tokens, err := s.repo.FindAllActivePushTokens()
	if err != nil {
		return 0, err
	}

	sent := 0
	type prayerMatch struct {
		Name string
		Key  string
	}

	for _, token := range tokens {
		if !token.IsActive {
			continue
		}

		lat := -6.2088
		lng := 106.8456
		if token.Latitude != nil && token.Longitude != nil {
			lat = *token.Latitude
			lng = *token.Longitude
		}

		loc := resolveTokenTimeLocation(token)
		localNow := now.In(loc)
		currentTimeStr := localNow.Format("15:04")

		ptResp, err := s.prayerTimesSvc.GetByDate(lat, lng, localNow, "kemenag", "shafi")
		if err != nil || ptResp == nil {
			continue
		}

		prayers := ptResp.Prayers
		var match *prayerMatch

		switch currentTimeStr {
		case prayers.Fajr:
			match = &prayerMatch{Name: "Subuh", Key: "fajr"}
		case prayers.Dhuhr:
			match = &prayerMatch{Name: "Dzuhur", Key: "dhuhr"}
		case prayers.Asr:
			match = &prayerMatch{Name: "Ashar", Key: "asr"}
		case prayers.Maghrib:
			match = &prayerMatch{Name: "Maghrib", Key: "maghrib"}
		case prayers.Isha:
			match = &prayerMatch{Name: "Isya", Key: "isha"}
		}

		if match == nil {
			continue
		}

		// Deduplicate: the scheduler runs every minute, and the prayer time
		// string (e.g. "04:30") will match the same token for at least two
		// consecutive ticks. Without this guard, every active token would get
		// the adzan push twice.
		dedupKey := fmt.Sprintf("%d:%s:%s", token.ID, localNow.Format("2006-01-02"), match.Key)
		if _, alreadySent := s.adzanSentMap.Load(dedupKey); alreadySent {
			continue
		}

		cityName := token.CityName
		if cityName == "" {
			cityName = "wilayah Anda"
		}

		title := fmt.Sprintf("Waktunya Sholat %s", match.Name)
		body := fmt.Sprintf("Telah masuk waktu sholat %s untuk %s dan sekitarnya.", match.Name, cityName)

		delivered := false
		switch strings.ToLower(token.Provider) {
		case "web":
			if token.KeyP256DH == "" || token.KeyAuth == "" {
				continue
			}
			if err := s.sendWebPushCustom(token, title, body, "/jadwal-sholat", model.NotificationTypeAdzan); err == nil {
				delivered = true
				sent++
			}
		case "expo":
			if isDeliverableExpoPushToken(token) {
				content := reminderContent{Title: title, Description: body}
				if n, err := s.sendPushToUser(token.UserID, model.NotificationTypeAdzan, content); err == nil && n > 0 {
					delivered = true
					sent += n
				}
			}
		}

		if delivered {
			s.adzanSentMap.Store(dedupKey, localNow.Unix())
			s.pruneAdzanSentMap()
		}
	}

	return sent, nil
}

func (s *notificationService) StartReminderScheduler(ctx context.Context, interval time.Duration) {
	if interval <= 0 {
		interval = time.Minute
	}
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			if _, err := s.DispatchDueReminders(time.Now()); err != nil {
				slog.Error("notification scheduler error", "err", err)
			}
			if _, err := s.DispatchDueAdzanPush(time.Now()); err != nil {
				slog.Error("adzan push scheduler error", "err", err)
			}
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
}

func (s *notificationService) pruneAdzanSentMap() {
	cutoff := time.Now().Add(-24 * time.Hour).Unix()
	s.adzanSentMap.Range(func(k, v any) bool {
		if ts, ok := v.(int64); ok && ts < cutoff {
			s.adzanSentMap.Delete(k)
		}
		return true
	})
}

func resolveTokenTimeLocation(token model.PushToken) *time.Location {
	if token.Timezone != "" {
		if loc, err := time.LoadLocation(token.Timezone); err == nil && loc != nil {
			return loc
		}
	}

	if token.TzOffsetMinutes != nil {
		offsetSeconds := *token.TzOffsetMinutes * 60
		return time.FixedZone(fmt.Sprintf("UTC%+d", *token.TzOffsetMinutes/60), offsetSeconds)
	}

	// Fallback based on longitude
	lng := 106.8456
	if token.Longitude != nil {
		lng = *token.Longitude
	}

	tzHours := 7 // WIB
	if lng >= 120.0 && lng < 135.0 {
		tzHours = 8 // WITA
	} else if lng >= 135.0 {
		tzHours = 9 // WIT
	} else if lng < 95.0 {
		tzHours = int(math.Round(lng / 15.0))
	}

	return time.FixedZone(fmt.Sprintf("UTC%+d", tzHours), tzHours*3600)
}

func normalizeReminderTime(value string) (string, error) {
	parsed, err := time.Parse("15:04", value)
	if err != nil {
		return "", fmt.Errorf("time must use HH:MM format")
	}
	return parsed.Format("15:04"), nil
}

func tokenSuffix(token string) string {
	if len(token) <= 10 {
		return token
	}
	return token[len(token)-10:]
}

type reminderContent struct {
	Description string
	EmailHTML   string
	Title       string
}

func reminderMessage(notificationType model.NotificationType) reminderContent {
	appURL := viper.GetString("APP_URL")
	if appURL == "" {
		appURL = "https://tholabul-ilmi.app"
	}

	title := "Pengingat Harian"
	description := "Waktunya kembali membaca dan menjaga rutinitas harian Anda."
	switch notificationType {
	case model.NotificationTypeDailyQuran:
		title = "Pengingat Baca Al-Quran"
		description = "Hari ini waktu yang baik untuk membaca beberapa ayat Al-Quran dan melanjutkan konsistensi tilawah Anda."
	case model.NotificationTypeDailyHadith:
		title = "Pengingat Baca Hadith"
		description = "Luangkan waktu untuk membaca satu hadith dan mengambil satu pelajaran praktis darinya."
	case model.NotificationTypeDoa:
		title = "Pengingat Doa Harian"
		description = "Perbarui dzikir dan doa harian Anda untuk menjaga hati tetap terhubung."
	case model.NotificationTypeStreakRisk:
		title = "Streak Hampir Putus!"
		description = "Jangan sampai streak ibadah kamu putus. Luangkan waktu sejenak untuk menjaga konsistensi."
	case model.NotificationTypeAdzan:
		title = "Waktunya Sholat!"
		description = "Sudah masuk waktu sholat. Segera tunaikan sholat tepat waktu."
	}

	body := fmt.Sprintf(`
<p>Assalamu'alaikum,</p>
<p><strong>%s</strong></p>
<p>%s</p>
<p>Buka aplikasi: <a href="%s">%s</a></p>
`, title, description, appURL, appURL)

	return reminderContent{
		Description: description,
		EmailHTML:   body,
		Title:       title,
	}
}
