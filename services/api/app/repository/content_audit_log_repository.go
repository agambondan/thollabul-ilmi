package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ContentAuditLogRepository interface {
	Create(log *model.ContentAuditLog) error
	FindAll(targetType string, page, limit int) ([]model.ContentAuditLog, int64, error)
}

type contentAuditLogRepository struct {
	db *gorm.DB
}

func NewContentAuditLogRepository(db *gorm.DB) ContentAuditLogRepository {
	return &contentAuditLogRepository{db: db}
}

func (r *contentAuditLogRepository) Create(log *model.ContentAuditLog) error {
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	return r.db.Create(log).Error
}

func (r *contentAuditLogRepository) tableNames() (calTable, uTable string) {
	calTable = "content_audit_logs"
	if r.db.Migrator().HasTable("content_audit_log") {
		calTable = "content_audit_log"
	}
	uTable = "users"
	if r.db.Migrator().HasTable("user") {
		uTable = `"user"`
	}
	return
}

type contentAuditLogRow struct {
	ID          uuid.UUID
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt
	TargetType  model.ContentReportTargetType
	TargetID    string
	TargetTitle string
	Field       string
	OldValue    string
	NewValue    string
	ReportID    *uuid.UUID
	ModifiedBy  uuid.UUID
	Reason      string

	UserID                  *uuid.UUID
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

func (r *contentAuditLogRow) toModel() model.ContentAuditLog {
	log := model.ContentAuditLog{
		TargetType:  r.TargetType,
		TargetID:    r.TargetID,
		TargetTitle: r.TargetTitle,
		Field:       r.Field,
		OldValue:    r.OldValue,
		NewValue:    r.NewValue,
		ReportID:    r.ReportID,
		ModifiedBy:  r.ModifiedBy,
		Reason:      r.Reason,
	}
	log.ID = r.ID
	log.CreatedAt = &r.CreatedAt
	log.UpdatedAt = &r.UpdatedAt
	log.DeletedAt = r.DeletedAt

	if r.UserID != nil {
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
		u.ID = *r.UserID
		u.CreatedAt = &r.UserCreatedAt
		u.UpdatedAt = &r.UserUpdatedAt
		u.DeletedAt = r.UserDeletedAt
		log.Modifier = &u
	}
	return log
}

func (r *contentAuditLogRepository) FindAll(targetType string, page, limit int) ([]model.ContentAuditLog, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	cal, u := r.tableNames()

	countQuery := "SELECT COUNT(*) FROM " + cal + " WHERE deleted_at IS NULL"
	var countArgs []interface{}
	if targetType != "" {
		countQuery += " AND target_type = ?"
		countArgs = append(countArgs, targetType)
	}

	var total int64
	if err := r.db.Raw(countQuery, countArgs...).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	selectSQL := `
		SELECT
			cal.id, cal.created_at, cal.updated_at, cal.deleted_at,
			cal.target_type, cal.target_id, cal.target_title,
			cal.field, cal.old_value, cal.new_value, cal.report_id,
			cal.modified_by, cal.reason,
			u.id AS user_id, u.name AS user_name, u.email AS user_email,
			u.role AS user_role, u.avatar AS user_avatar,
			u.preferred_lang AS user_preferred_lang, u.phone AS user_phone,
			u.verification_channel AS user_verification_channel,
			u.email_verified_at AS user_email_verified_at,
			u.phone_verified_at AS user_phone_verified_at,
			u.notify_via_email AS user_notify_via_email,
			u.notify_via_whatsapp AS user_notify_via_whatsapp,
			u.notify_via_push AS user_notify_via_push,
			u.created_at AS user_created_at, u.updated_at AS user_updated_at, u.deleted_at AS user_deleted_at
		FROM ` + cal + ` cal
		LEFT JOIN ` + u + ` u ON u.id = cal.modified_by AND u.deleted_at IS NULL
		WHERE cal.deleted_at IS NULL
	`
	var selectArgs []interface{}
	if targetType != "" {
		selectSQL += " AND cal.target_type = ?"
		selectArgs = append(selectArgs, targetType)
	}
	selectSQL += " ORDER BY cal.created_at DESC LIMIT ? OFFSET ?"
	selectArgs = append(selectArgs, limit, offset)

	var rows []contentAuditLogRow
	if err := r.db.Raw(selectSQL, selectArgs...).Scan(&rows).Error; err != nil {
		return nil, 0, err
	}

	items := make([]model.ContentAuditLog, 0, len(rows))
	for i := range rows {
		items = append(items, rows[i].toModel())
	}
	return items, total, nil
}
