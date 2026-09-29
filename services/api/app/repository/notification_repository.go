package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type NotificationRepository interface {
	FindByUser(userID uuid.UUID) ([]model.NotificationSetting, error)
	UpsertMany(settings []model.NotificationSetting) ([]model.NotificationSetting, error)
	UpsertPushToken(token model.PushToken) (model.PushToken, error)
	FindActivePushTokens(userID uuid.UUID) ([]model.PushToken, error)
	FindAllActivePushTokens() ([]model.PushToken, error)
	FindAllPushTokens() ([]model.PushToken, error)
	FindPushTokensByUser(userID uuid.UUID) ([]model.PushToken, error)
	DeactivatePushToken(id int) error
	DeactivatePushTokenByToken(userID uuid.UUID, token string) error
	DeletePushToken(id int) error
	FindDue(now time.Time) ([]model.NotificationSetting, error)
	MarkSent(id int, sentAt time.Time) error
	FindDisabledUserIDs(notifType model.NotificationType) ([]uuid.UUID, error)
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db}
}

func (r *notificationRepository) userTableName() string {
	if r.db.Migrator().HasTable("user") {
		return `"user"`
	}
	return "users"
}

func (r *notificationRepository) pushTokenTableName() string {
	if r.db.Migrator().HasTable("push_token") {
		return "push_token"
	}
	return "push_tokens"
}

func (r *notificationRepository) notifSettingTableName() string {
	if r.db.Migrator().HasTable("notification_setting") {
		return "notification_setting"
	}
	return "notification_settings"
}

func (r *notificationRepository) FindByUser(userID uuid.UUID) ([]model.NotificationSetting, error) {
	var items []model.NotificationSetting
	err := r.db.Where("user_id = ?", userID).Order("type ASC").Find(&items).Error
	return items, err
}

func (r *notificationRepository) UpsertMany(settings []model.NotificationSetting) ([]model.NotificationSetting, error) {
	if len(settings) == 0 {
		return []model.NotificationSetting{}, nil
	}
	err := r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "type"}},
		DoUpdates: clause.AssignmentColumns([]string{"time", "is_active", "updated_at"}),
	}).Create(&settings).Error
	if err != nil {
		return nil, err
	}
	return r.FindByUser(settings[0].UserID)
}

func (r *notificationRepository) UpsertPushToken(token model.PushToken) (model.PushToken, error) {
	now := time.Now()
	token.LastSeenAt = now
	token.IsActive = true
	return token, r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.PushToken{}).
			Where("token = ? AND user_id <> ?", token.Token, token.UserID).
			Update("is_active", false).Error; err != nil {
			return err
		}

		return tx.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "user_id"}, {Name: "token"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"platform":          token.Platform,
				"provider":          token.Provider,
				"device_id":         token.DeviceID,
				"key_p256_dh":       token.KeyP256DH,
				"key_auth":          token.KeyAuth,
				"latitude":          token.Latitude,
				"longitude":         token.Longitude,
				"city_name":         token.CityName,
				"timezone":          token.Timezone,
				"tz_offset_minutes": token.TzOffsetMinutes,
				"is_active":         true,
				"last_seen_at":      now,
				"updated_at":        now,
			}),
		}).Create(&token).Error
	})
}

func (r *notificationRepository) FindActivePushTokens(userID uuid.UUID) ([]model.PushToken, error) {
	var items []model.PushToken
	err := r.db.
		Where("user_id = ? AND is_active = true", userID).
		Order("last_seen_at DESC").
		Limit(20).
		Find(&items).Error
	return items, err
}

type pushTokenRow struct {
	ID              *int
	CreatedAt       *time.Time
	UpdatedAt       *time.Time
	UserID          uuid.UUID
	Token           string
	Platform        string
	Provider        string
	DeviceID        string
	KeyP256DH       string
	KeyAuth         string
	Latitude        *float64
	Longitude       *float64
	CityName        string
	Timezone        string
	TzOffsetMinutes *int
	IsActive        bool
	LastSeenAt      time.Time

	UserID2                 *uuid.UUID
	UserName                *string
	UserEmail               *string
	UserRole                *model.UserRole
	UserAvatar              *string
	UserPreferredLang       *string
	UserPhone               *string
	UserVerificationChannel *string
	UserEmailVerifiedAt     *time.Time
	UserPhoneVerifiedAt     *time.Time
	UserNotifyViaEmail      bool
	UserNotifyViaWhatsapp   bool
	UserNotifyViaPush       bool
	UserCreatedAt           time.Time
	UserUpdatedAt           time.Time
	UserDeletedAt           gorm.DeletedAt
}

func (r *pushTokenRow) toModel() model.PushToken {
	pt := model.PushToken{
		UserID:          r.UserID,
		Token:           r.Token,
		Platform:        r.Platform,
		Provider:        r.Provider,
		DeviceID:        r.DeviceID,
		KeyP256DH:       r.KeyP256DH,
		KeyAuth:         r.KeyAuth,
		Latitude:        r.Latitude,
		Longitude:       r.Longitude,
		CityName:        r.CityName,
		Timezone:        r.Timezone,
		TzOffsetMinutes: r.TzOffsetMinutes,
		IsActive:        r.IsActive,
		LastSeenAt:      r.LastSeenAt,
	}
	pt.ID = r.ID
	pt.CreatedAt = r.CreatedAt
	pt.UpdatedAt = r.UpdatedAt

	if r.UserID2 != nil {
		u := model.User{
			Name:                r.UserName,
			Email:               r.UserEmail,
			Avatar:              r.UserAvatar,
			PreferredLang:       r.UserPreferredLang,
			Phone:               r.UserPhone,
			VerificationChannel: r.UserVerificationChannel,
			EmailVerifiedAt:     r.UserEmailVerifiedAt,
			PhoneVerifiedAt:     r.UserPhoneVerifiedAt,
			NotifyViaEmail:      r.UserNotifyViaEmail,
			NotifyViaWhatsapp:   r.UserNotifyViaWhatsapp,
			NotifyViaPush:       r.UserNotifyViaPush,
		}
		if r.UserRole != nil {
			u.Role = *r.UserRole
		}
		u.ID = *r.UserID2
		u.CreatedAt = &r.UserCreatedAt
		u.UpdatedAt = &r.UserUpdatedAt
		u.DeletedAt = r.UserDeletedAt
		pt.User = &u
	}
	return pt
}

func (r *notificationRepository) pushTokenSelectSQL() string {
	pt := r.pushTokenTableName()
	u := r.userTableName()
	return `
		SELECT
			pt.id, pt.created_at, pt.updated_at,
			pt.user_id, pt.token, pt.platform, pt.provider, pt.device_id,
			pt.key_p256_dh, pt.key_auth, pt.latitude, pt.longitude,
			pt.city_name, pt.timezone, pt.tz_offset_minutes, pt.is_active, pt.last_seen_at,
			u.id AS user_id2, u.name AS user_name, u.email AS user_email,
			u.role AS user_role, u.avatar AS user_avatar,
			u.preferred_lang AS user_preferred_lang, u.phone AS user_phone,
			u.verification_channel AS user_verification_channel,
			u.email_verified_at AS user_email_verified_at,
			u.phone_verified_at AS user_phone_verified_at,
			u.notify_via_email AS user_notify_via_email,
			u.notify_via_whatsapp AS user_notify_via_whatsapp,
			u.notify_via_push AS user_notify_via_push,
			u.created_at AS user_created_at, u.updated_at AS user_updated_at, u.deleted_at AS user_deleted_at
		FROM ` + pt + ` pt
		LEFT JOIN ` + u + ` u ON u.id = pt.user_id
	`
}

func (r *notificationRepository) FindAllActivePushTokens() ([]model.PushToken, error) {
	query := r.pushTokenSelectSQL() + " WHERE pt.is_active = true ORDER BY pt.last_seen_at DESC LIMIT 1000"
	var rows []pushTokenRow
	if err := r.db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]model.PushToken, 0, len(rows))
	for i := range rows {
		items = append(items, rows[i].toModel())
	}
	return items, nil
}

func (r *notificationRepository) FindAllPushTokens() ([]model.PushToken, error) {
	query := r.pushTokenSelectSQL() + " ORDER BY pt.last_seen_at DESC LIMIT 500"
	var rows []pushTokenRow
	if err := r.db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]model.PushToken, 0, len(rows))
	for i := range rows {
		items = append(items, rows[i].toModel())
	}
	return items, nil
}

func (r *notificationRepository) DeletePushToken(id int) error {
	return r.db.Delete(&model.PushToken{}, id).Error
}

func (r *notificationRepository) FindPushTokensByUser(userID uuid.UUID) ([]model.PushToken, error) {
	var items []model.PushToken
	err := r.db.
		Where("user_id = ?", userID).
		Order("last_seen_at DESC").
		Limit(20).
		Find(&items).Error
	return items, err
}

func (r *notificationRepository) DeactivatePushToken(id int) error {
	return r.db.Model(&model.PushToken{}).Where("id = ?", id).Update("is_active", false).Error
}

func (r *notificationRepository) DeactivatePushTokenByToken(userID uuid.UUID, token string) error {
	return r.db.Model(&model.PushToken{}).
		Where("user_id = ? AND token = ?", userID, token).
		Update("is_active", false).Error
}

type notifSettingRow struct {
	ID         *int
	CreatedAt  *time.Time
	UpdatedAt  *time.Time
	UserID     uuid.UUID
	Type       model.NotificationType
	Time       string
	IsActive   bool
	LastSentAt *time.Time

	UserID2                 *uuid.UUID
	UserName                *string
	UserEmail               *string
	UserRole                *model.UserRole
	UserAvatar              *string
	UserPreferredLang       *string
	UserPhone               *string
	UserVerificationChannel *string
	UserEmailVerifiedAt     *time.Time
	UserPhoneVerifiedAt     *time.Time
	UserNotifyViaEmail      bool
	UserNotifyViaWhatsapp   bool
	UserNotifyViaPush       bool
	UserCreatedAt           time.Time
	UserUpdatedAt           time.Time
	UserDeletedAt           gorm.DeletedAt
}

func (r *notifSettingRow) toModel() model.NotificationSetting {
	ns := model.NotificationSetting{
		UserID:     r.UserID,
		Type:       r.Type,
		Time:       r.Time,
		IsActive:   r.IsActive,
		LastSentAt: r.LastSentAt,
	}
	ns.ID = r.ID
	ns.CreatedAt = r.CreatedAt
	ns.UpdatedAt = r.UpdatedAt

	if r.UserID2 != nil {
		u := model.User{
			Name:                r.UserName,
			Email:               r.UserEmail,
			Avatar:              r.UserAvatar,
			PreferredLang:       r.UserPreferredLang,
			Phone:               r.UserPhone,
			VerificationChannel: r.UserVerificationChannel,
			EmailVerifiedAt:     r.UserEmailVerifiedAt,
			PhoneVerifiedAt:     r.UserPhoneVerifiedAt,
			NotifyViaEmail:      r.UserNotifyViaEmail,
			NotifyViaWhatsapp:   r.UserNotifyViaWhatsapp,
			NotifyViaPush:       r.UserNotifyViaPush,
		}
		if r.UserRole != nil {
			u.Role = *r.UserRole
		}
		u.ID = *r.UserID2
		u.CreatedAt = &r.UserCreatedAt
		u.UpdatedAt = &r.UserUpdatedAt
		u.DeletedAt = r.UserDeletedAt
		ns.User = &u
	}
	return ns
}

func (r *notificationRepository) FindDue(now time.Time) ([]model.NotificationSetting, error) {
	ns := r.notifSettingTableName()
	u := r.userTableName()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	query := `
		SELECT
			ns.id, ns.created_at, ns.updated_at,
			ns.user_id, ns.type, ns.time, ns.is_active, ns.last_sent_at,
			u.id AS user_id2, u.name AS user_name, u.email AS user_email,
			u.role AS user_role, u.avatar AS user_avatar,
			u.preferred_lang AS user_preferred_lang, u.phone AS user_phone,
			u.verification_channel AS user_verification_channel,
			u.email_verified_at AS user_email_verified_at,
			u.phone_verified_at AS user_phone_verified_at,
			u.notify_via_email AS user_notify_via_email,
			u.notify_via_whatsapp AS user_notify_via_whatsapp,
			u.notify_via_push AS user_notify_via_push,
			u.created_at AS user_created_at, u.updated_at AS user_updated_at, u.deleted_at AS user_deleted_at
		FROM ` + ns + ` ns
		LEFT JOIN ` + u + ` u ON u.id = ns.user_id
		WHERE ns.is_active = true AND ns.time = ? AND (ns.last_sent_at IS NULL OR ns.last_sent_at < ?)
		ORDER BY ns.type ASC
	`
	var rows []notifSettingRow
	if err := r.db.Raw(query, now.Format("15:04"), startOfDay).Scan(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]model.NotificationSetting, 0, len(rows))
	for i := range rows {
		items = append(items, rows[i].toModel())
	}
	return items, nil
}

func (r *notificationRepository) MarkSent(id int, sentAt time.Time) error {
	return r.db.Model(&model.NotificationSetting{}).Where("id = ?", id).Update("last_sent_at", sentAt).Error
}

func (r *notificationRepository) FindDisabledUserIDs(notifType model.NotificationType) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	err := r.db.Model(&model.NotificationSetting{}).
		Where("type = ? AND is_active = false", notifType).
		Pluck("user_id", &ids).Error
	return ids, err
}

// Inbox repository

type NotificationInboxRepository interface {
	ListByUser(userID uuid.UUID, limit int) ([]model.UserNotification, error)
	UnreadCount(userID uuid.UUID) (int64, error)
	MarkRead(id uuid.UUID, userID uuid.UUID) error
	MarkAllRead(userID uuid.UUID) error
	Delete(id uuid.UUID, userID uuid.UUID) error
	Create(n model.UserNotification) (model.UserNotification, error)
}

type notificationInboxRepository struct {
	db *gorm.DB
}

func NewNotificationInboxRepository(db *gorm.DB) NotificationInboxRepository {
	return &notificationInboxRepository{db}
}

func (r *notificationInboxRepository) ListByUser(userID uuid.UUID, limit int) ([]model.UserNotification, error) {
	var items []model.UserNotification
	q := r.db.Where("user_id = ?", userID).Order("created_at DESC")
	if limit > 0 {
		q = q.Limit(limit)
	}
	return items, q.Find(&items).Error
}

func (r *notificationInboxRepository) UnreadCount(userID uuid.UUID) (int64, error) {
	var count int64
	return count, r.db.Model(&model.UserNotification{}).Where("user_id = ? AND is_read = false", userID).Count(&count).Error
}

func (r *notificationInboxRepository) MarkRead(id uuid.UUID, userID uuid.UUID) error {
	return r.db.Model(&model.UserNotification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("is_read", true).Error
}

func (r *notificationInboxRepository) MarkAllRead(userID uuid.UUID) error {
	return r.db.Model(&model.UserNotification{}).
		Where("user_id = ? AND is_read = false", userID).
		Update("is_read", true).Error
}

func (r *notificationInboxRepository) Delete(id uuid.UUID, userID uuid.UUID) error {
	return deleteResultError(r.db.
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&model.UserNotification{}))
}

func (r *notificationInboxRepository) Create(n model.UserNotification) (model.UserNotification, error) {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	if n.Channel == "" {
		n.Channel = "inbox"
	}
	if n.Priority == "" {
		n.Priority = "normal"
	}
	if n.Status == "" {
		n.Status = "created"
	}
	if n.Status == "sent" && n.SentAt == nil {
		now := time.Now()
		n.SentAt = &now
	}
	return n, r.db.Create(&n).Error
}
