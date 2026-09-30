package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FeedRepository interface {
	FindAll(*fiber.Ctx, model.FeedRefType, []string) *paginate.Page
	FindByID(string) (*model.FeedPost, error)
	Create(*model.FeedPost) (*model.FeedPost, error)
	Delete(string, *uuid.UUID) error
	IncrementLikes(string) error
}

type feedRepository struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewFeedRepository(db *gorm.DB, pg *paginate.Pagination) FeedRepository {
	return &feedRepository{db, pg}
}

func (r *feedRepository) feedPostTableName() string {
	if r.db != nil && r.db.Migrator().HasTable("feed_post") {
		return "feed_post"
	}
	return "feed_posts"
}

func (r *feedRepository) userTableName() string {
	if r.db != nil && r.db.Migrator().HasTable("user") {
		return `"user"`
	}
	return "users"
}

type feedPostRow struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	RefType   model.FeedRefType
	RefID     int
	Caption   string
	Likes     int
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt

	AuthorID                  *uuid.UUID
	AuthorName                *string
	AuthorEmail               *string
	AuthorRole                *model.UserRole
	AuthorAvatar              *string
	AuthorPreferredLang       *string
	AuthorPhone               *string
	AuthorVerificationChannel *string
	AuthorEmailVerifiedAt     *time.Time
	AuthorPhoneVerifiedAt     *time.Time
	AuthorNotifyViaEmail      bool
	AuthorNotifyViaWhatsapp   bool
	AuthorNotifyViaPush       bool
	AuthorCreatedAt           time.Time
	AuthorUpdatedAt           time.Time
	AuthorDeletedAt           gorm.DeletedAt
}

func (r *feedPostRow) toModel() model.FeedPost {
	post := model.FeedPost{
		UserID:  r.UserID,
		RefType: r.RefType,
		RefID:   r.RefID,
		Caption: r.Caption,
		Likes:   r.Likes,
	}
	post.ID = r.ID
	post.CreatedAt = &r.CreatedAt
	post.UpdatedAt = &r.UpdatedAt
	post.DeletedAt = r.DeletedAt

	if r.AuthorID != nil {
		u := model.User{
			Name:                r.AuthorName,
			Email:               r.AuthorEmail,
			Avatar:              r.AuthorAvatar,
			PreferredLang:       r.AuthorPreferredLang,
			Phone:               r.AuthorPhone,
			VerificationChannel: r.AuthorVerificationChannel,
			EmailVerifiedAt:     r.AuthorEmailVerifiedAt,
			PhoneVerifiedAt:     r.AuthorPhoneVerifiedAt,
			NotifyViaEmail:      r.AuthorNotifyViaEmail,
			NotifyViaWhatsapp:   r.AuthorNotifyViaWhatsapp,
			NotifyViaPush:       r.AuthorNotifyViaPush,
		}
		if r.AuthorRole != nil {
			u.Role = *r.AuthorRole
		}
		u.ID = *r.AuthorID
		u.CreatedAt = &r.AuthorCreatedAt
		u.UpdatedAt = &r.AuthorUpdatedAt
		u.DeletedAt = r.AuthorDeletedAt
		post.Author = &u
	}
	return post
}

func (r *feedRepository) baseSelect() string {
	fp := r.feedPostTableName()
	u := r.userTableName()
	return `
		SELECT
			fp.id, fp.user_id, fp.ref_type, fp.ref_id, fp.caption, fp.likes, fp.created_at, fp.updated_at, fp.deleted_at,
			u.id AS author_id, u.name AS author_name, u.email AS author_email, u.role AS author_role,
			u.avatar AS author_avatar, u.preferred_lang AS author_preferred_lang, u.phone AS author_phone,
			u.verification_channel AS author_verification_channel, u.email_verified_at AS author_email_verified_at,
			u.phone_verified_at AS author_phone_verified_at, u.notify_via_email AS author_notify_via_email,
			u.notify_via_whatsapp AS author_notify_via_whatsapp, u.notify_via_push AS author_notify_via_push,
			u.created_at AS author_created_at, u.updated_at AS author_updated_at, u.deleted_at AS author_deleted_at
		FROM ` + fp + ` fp
		LEFT JOIN ` + u + ` u ON u.id = fp.user_id AND u.deleted_at IS NULL
	`
}

func (r *feedRepository) base() *gorm.DB {
	return r.db.Model(&model.FeedPost{})
}

func (r *feedRepository) FindAll(ctx *fiber.Ctx, refType model.FeedRefType, hiddenIDs []string) *paginate.Page {
	var posts []model.FeedPost
	q := r.base().Order("created_at desc")
	if refType != "" {
		q = q.Where("ref_type = ?", refType)
	}
	if len(hiddenIDs) > 0 {
		q = q.Where("CAST(id AS TEXT) NOT IN ?", hiddenIDs)
	}
	page := r.pg.With(q).Request(ctx.Request()).Response(&posts)
	return &page
}

func (r *feedRepository) FindByID(id string) (*model.FeedPost, error) {
	var row feedPostRow
	err := r.db.Raw(r.baseSelect()+" WHERE fp.id = ? AND fp.deleted_at IS NULL LIMIT 1", id).Scan(&row).Error
	if err != nil {
		return nil, err
	}
	if row.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	post := row.toModel()
	return &post, nil
}

func (r *feedRepository) Create(post *model.FeedPost) (*model.FeedPost, error) {
	if err := r.db.Clauses(clause.OnConflict{
		DoNothing: true,
	}).Create(post).Error; err != nil {
		return nil, err
	}
	return r.FindByID(post.ID.String())
}

func (r *feedRepository) Delete(id string, userID *uuid.UUID) error {
	q := r.db.Where("id = ?", id)
	if userID != nil {
		q = q.Where("user_id = ?", *userID)
	}
	return deleteResultError(q.Delete(&model.FeedPost{}))
}

func (r *feedRepository) IncrementLikes(id string) error {
	return r.db.Model(&model.FeedPost{}).Where("id = ?", id).
		UpdateColumn("likes", gorm.Expr("likes + 1")).Error
}
