package repository

import (
	"errors"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BookmarkRepository interface {
	Save(*model.Bookmark) (*model.Bookmark, error)
	FindByUserID(uuid.UUID) ([]model.Bookmark, error)
	FindByID(uuid.UUID) (*model.Bookmark, error)
	FindByUserAndSlug(userID uuid.UUID, refType model.BookmarkType, slug string) (*model.Bookmark, error)
	UpdateMeta(id, userID uuid.UUID, color, label *string) (*model.Bookmark, error)
	DeleteByID(uuid.UUID, uuid.UUID) error
}

type bookmarkRepo struct {
	db *gorm.DB
}

func NewBookmarkRepository(db *gorm.DB) BookmarkRepository {
	return &bookmarkRepo{db}
}

func (r *bookmarkRepo) Save(b *model.Bookmark) (*model.Bookmark, error) {
	var existing model.Bookmark
	err := r.db.Unscoped().
		Where("user_id = ? AND ref_type = ? AND ref_id = ?", b.UserID, b.RefType, b.RefID).
		First(&existing).Error
	if err == nil {
		if existing.DeletedAt.Valid {
			if err := r.db.Unscoped().Model(&existing).Updates(map[string]interface{}{
				"deleted_at": nil,
				"ref_slug":   b.RefSlug,
				"color":      b.Color,
				"label":      b.Label,
			}).Error; err != nil {
				return nil, err
			}
			return r.FindByID(existing.ID)
		}
		return nil, gorm.ErrDuplicatedKey
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	if err := r.db.Create(b).Error; err != nil {
		return nil, err
	}
	return b, nil
}

func (r *bookmarkRepo) FindByUserID(userID uuid.UUID) ([]model.Bookmark, error) {
	var bookmarks []model.Bookmark
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Limit(200).Find(&bookmarks).Error
	return bookmarks, err
}

func (r *bookmarkRepo) FindByID(id uuid.UUID) (*model.Bookmark, error) {
	var b model.Bookmark
	if err := r.db.First(&b, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *bookmarkRepo) FindByUserAndSlug(userID uuid.UUID, refType model.BookmarkType, slug string) (*model.Bookmark, error) {
	var b model.Bookmark
	err := r.db.First(&b, "user_id = ? AND ref_type = ? AND ref_slug = ?", userID, refType, slug).Error
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *bookmarkRepo) UpdateMeta(id, userID uuid.UUID, color, label *string) (*model.Bookmark, error) {
	var b model.Bookmark
	if err := r.db.First(&b, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		return nil, err
	}
	updates := map[string]interface{}{}
	if color != nil {
		updates["color"] = *color
	}
	if label != nil {
		updates["label"] = *label
	}
	if len(updates) == 0 {
		return &b, nil
	}
	if err := r.db.Model(&b).Updates(updates).Error; err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *bookmarkRepo) DeleteByID(id, userID uuid.UUID) error {
	return deleteResultError(r.db.Unscoped().Where("id = ? AND user_id = ?", id, userID).Delete(&model.Bookmark{}))
}
