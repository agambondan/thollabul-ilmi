package repository

import (
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

func (r *feedRepository) base() *gorm.DB {
	return r.db.Model(&model.FeedPost{}).Preload("Author")
}

func (r *feedRepository) FindAll(ctx *fiber.Ctx, refType model.FeedRefType, hiddenIDs []string) *paginate.Page {
	var posts []model.FeedPost
	q := r.base().Order("created_at desc")
	if refType != "" {
		q = q.Where("feed_posts.ref_type = ?", refType)
	}
	if len(hiddenIDs) > 0 {
		q = q.Where("CAST(feed_posts.id AS TEXT) NOT IN ?", hiddenIDs)
	}
	page := r.pg.With(q).Request(ctx.Request()).Response(&posts)
	return &page
}

func (r *feedRepository) FindByID(id string) (*model.FeedPost, error) {
	var post model.FeedPost
	err := r.base().Where("feed_posts.id = ?", id).First(&post).Error
	if err != nil {
		return nil, err
	}
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
