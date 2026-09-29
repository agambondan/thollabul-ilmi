package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ContentReportRepository interface {
	Create(report *model.ContentReport) (*model.ContentReport, error)
	FindByID(id string) (*model.ContentReport, error)
	FindAll(status model.ContentReportStatus, targetType model.ContentReportTargetType, page, limit int) ([]model.ContentReport, int64, error)
	UpdateStatus(id string, status model.ContentReportStatus, adminNote string, reviewerID uuid.UUID) (*model.ContentReport, error)
	FindByUser(userID uuid.UUID, page, limit int) ([]model.ContentReport, int64, error)
}

type contentReportRepository struct {
	db *gorm.DB
}

func NewContentReportRepository(db *gorm.DB) ContentReportRepository {
	return &contentReportRepository{db: db}
}

type contentReportRow struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	TargetType   model.ContentReportTargetType
	TargetID     string
	TargetTitle  string
	Category     model.ContentReportCategory
	Description  string
	Correction   string
	Status       model.ContentReportStatus
	AdminNote    string
	ReviewedBy   *uuid.UUID
	ReviewedAt   *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    gorm.DeletedAt

	UserID2         uuid.UUID
	UserName        *string
	UserEmail       *string
	UserRole        model.UserRole
	UserAvatar      *string
	UserPreferredLang *string
	UserPhone       *string
	UserVerificationChannel *string
	UserEmailVerifiedAt *time.Time
	UserPhoneVerifiedAt *time.Time
	UserNotifyViaEmail bool
	UserNotifyViaWhatsapp bool
	UserNotifyViaPush bool
	UserCreatedAt    time.Time
	UserUpdatedAt    time.Time
	UserDeletedAt    gorm.DeletedAt
}

func (r *contentReportRepository) tableNames() (crTable, uTable string) {
	crTable = "content_reports"
	if r.db.Migrator().HasTable("content_report") {
		crTable = "content_report"
	}
	uTable = "users"
	if r.db.Migrator().HasTable("user") {
		uTable = `"user"`
	}
	return
}

func (r *contentReportRepository) selectSQL() string {
	cr, u := r.tableNames()
	return `
		SELECT
			cr.id, cr.user_id, cr.target_type, cr.target_id, cr.target_title,
			cr.category, cr.description, cr.correction, cr.status,
			cr.admin_note, cr.reviewed_by, cr.reviewed_at,
			cr.created_at, cr.updated_at, cr.deleted_at,
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
		FROM ` + cr + ` cr
		LEFT JOIN ` + u + ` u ON u.id = cr.user_id
	`
}

func (r *contentReportRow) toModel() model.ContentReport {
	cr := model.ContentReport{
		UserID:      r.UserID,
		TargetType:  r.TargetType,
		TargetID:    r.TargetID,
		TargetTitle: r.TargetTitle,
		Category:    r.Category,
		Description: r.Description,
		Correction:  r.Correction,
		Status:      r.Status,
		AdminNote:   r.AdminNote,
		ReviewedBy:  r.ReviewedBy,
		ReviewedAt:  r.ReviewedAt,
	}
	cr.ID = r.ID
	cr.CreatedAt = &r.CreatedAt
	cr.UpdatedAt = &r.UpdatedAt
	cr.DeletedAt = r.DeletedAt

	cr.User = &model.User{
		Name:                 r.UserName,
		Email:                r.UserEmail,
		Role:                 r.UserRole,
		Avatar:               r.UserAvatar,
		PreferredLang:        r.UserPreferredLang,
		Phone:                r.UserPhone,
		VerificationChannel:  r.UserVerificationChannel,
		EmailVerifiedAt:      r.UserEmailVerifiedAt,
		PhoneVerifiedAt:      r.UserPhoneVerifiedAt,
		NotifyViaEmail:       r.UserNotifyViaEmail,
		NotifyViaWhatsapp:    r.UserNotifyViaWhatsapp,
		NotifyViaPush:        r.UserNotifyViaPush,
	}
	cr.User.ID = r.UserID2
	cr.User.CreatedAt = &r.UserCreatedAt
	cr.User.UpdatedAt = &r.UserUpdatedAt
	cr.User.DeletedAt = r.UserDeletedAt

	return cr
}

func (r *contentReportRepository) Create(report *model.ContentReport) (*model.ContentReport, error) {
	if report.ID == uuid.Nil {
		report.ID = uuid.New()
	}
	if report.Status == "" {
		report.Status = model.ContentReportStatusPending
	}
	err := r.db.Create(report).Error
	if err != nil {
		return nil, err
	}
	return r.FindByID(report.ID.String())
}

func (r *contentReportRepository) FindByID(id string) (*model.ContentReport, error) {
	var row contentReportRow
	err := r.db.Raw(r.selectSQL()+`
		WHERE cr.id = ?
		LIMIT 1
	`, id).Scan(&row).Error
	if err != nil {
		return nil, err
	}
	if row.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	cr := row.toModel()
	return &cr, nil
}

func (r *contentReportRepository) FindAll(status model.ContentReportStatus, targetType model.ContentReportTargetType, page, limit int) ([]model.ContentReport, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	crTable, _ := r.tableNames()
	query := "WHERE 1=1"
	var args []interface{}
	if status != "" {
		query += " AND cr.status = ?"
		args = append(args, status)
	}
	if targetType != "" {
		query += " AND cr.target_type = ?"
		args = append(args, targetType)
	}

	var total int64
	err := r.db.Raw("SELECT count(*) FROM "+crTable+" cr "+query, args...).Scan(&total).Error
	if err != nil {
		return nil, 0, err
	}

	var rows []contentReportRow
	err = r.db.Raw(r.selectSQL()+query+`
		ORDER BY cr.created_at DESC
		LIMIT ? OFFSET ?
	`, append(args, limit, offset)...).Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	items := make([]model.ContentReport, len(rows))
	for i := range rows {
		items[i] = rows[i].toModel()
	}
	return items, total, nil
}

func (r *contentReportRepository) UpdateStatus(id string, status model.ContentReportStatus, adminNote string, reviewerID uuid.UUID) (*model.ContentReport, error) {
	now := time.Now()
	updates := map[string]interface{}{
		"status":      status,
		"admin_note":  adminNote,
		"reviewed_by": reviewerID,
		"reviewed_at": &now,
	}
	err := r.db.Model(&model.ContentReport{}).Where("id = ?", id).Updates(updates).Error
	if err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *contentReportRepository) FindByUser(userID uuid.UUID, page, limit int) ([]model.ContentReport, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	crTable, _ := r.tableNames()
	var total int64
	err := r.db.Raw("SELECT count(*) FROM "+crTable+" WHERE user_id = ?", userID).Scan(&total).Error
	if err != nil {
		return nil, 0, err
	}

	var rows []contentReportRow
	err = r.db.Raw(r.selectSQL()+`
		WHERE cr.user_id = ?
		ORDER BY cr.created_at DESC
		LIMIT ? OFFSET ?
	`, userID, limit, offset).Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	items := make([]model.ContentReport, len(rows))
	for i := range rows {
		items[i] = rows[i].toModel()
	}
	return items, total, nil
}