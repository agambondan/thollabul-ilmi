package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type LibraryBookProgressRepository interface {
	Upsert(progress *model.LibraryBookProgress) (*model.LibraryBookProgress, error)
	FindByUserID(userID uuid.UUID) ([]model.LibraryBookProgress, error)
	FindByUserIDAndBookID(userID uuid.UUID, bookID int) (*model.LibraryBookProgress, error)
}

type libraryBookProgressRepo struct {
	db *gorm.DB
}

func NewLibraryBookProgressRepository(db *gorm.DB) LibraryBookProgressRepository {
	return &libraryBookProgressRepo{db: db}
}

func (r *libraryBookProgressRepo) Upsert(progress *model.LibraryBookProgress) (*model.LibraryBookProgress, error) {
	err := r.db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "user_id"}, {Name: "library_book_id"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"status",
			"current_page",
			"note",
			"last_studied_at",
			"updated_at",
		}),
	}).Create(progress).Error
	if err != nil {
		return nil, err
	}
	return r.FindByUserIDAndBookID(progress.UserID, progress.LibraryBookID)
}

const libraryProgressSelectSQL = `
SELECT
    lbp.id, lbp.created_at, lbp.updated_at, lbp.user_id, lbp.library_book_id,
    lbp.status, lbp.current_page, lbp.note, lbp.last_studied_at,
    lb.id as lb_id, lb.created_at as lb_created_at, lb.updated_at as lb_updated_at,
    lb.title, lb.slug, lb.author, lb.description, lb.category, lb.level,
    lb.language, lb.format, lb.source_type, lb.source_url, lb.cover_url,
    lb.file_name, lb.file_mime_type, lb.file_size_bytes, lb.file_object_key,
    lb.cover_object_key, lb.file_url, lb.checksum_sha256, lb.license,
    lb.license_status, lb.source_note, lb.is_source_verified, lb.pages,
    lb.tags, lb.status as lb_status, lb.extraction_status, lb.extraction_error
FROM library_book_progress lbp
JOIN library_book lb ON lb.id = lbp.library_book_id
WHERE lbp.user_id = ?
ORDER BY lbp.updated_at DESC
`

func (r *libraryBookProgressRepo) FindByUserID(userID uuid.UUID) ([]model.LibraryBookProgress, error) {
	rows, err := r.db.Raw(libraryProgressSelectSQL, userID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var progress []model.LibraryBookProgress
	for rows.Next() {
		var p model.LibraryBookProgress
		var b model.LibraryBook
		if err := rows.Scan(
			&p.ID, &p.CreatedAt, &p.UpdatedAt, &p.UserID, &p.LibraryBookID,
			&p.Status, &p.CurrentPage, &p.Note, &p.LastStudiedAt,
			&b.ID, &b.CreatedAt, &b.UpdatedAt,
			&b.Title, &b.Slug, &b.Author, &b.Description, &b.Category, &b.Level,
			&b.Language, &b.Format, &b.SourceType, &b.SourceURL, &b.CoverURL,
			&b.FileName, &b.FileMimeType, &b.FileSizeBytes, &b.FileObjectKey,
			&b.CoverObjectKey, &b.FileURL, &b.ChecksumSHA256, &b.License,
			&b.LicenseStatus, &b.SourceNote, &b.IsSourceVerified, &b.Pages,
			&b.Tags, &b.Status, &b.ExtractionStatus, &b.ExtractionError,
		); err != nil {
			return nil, err
		}
		p.Book = &b
		progress = append(progress, p)
	}
	return progress, rows.Err()
}

const libraryProgressByUserAndBookSQL = libraryProgressSelectSQL + " AND lbp.library_book_id = ? LIMIT 1"

func (r *libraryBookProgressRepo) FindByUserIDAndBookID(userID uuid.UUID, bookID int) (*model.LibraryBookProgress, error) {
	rows, err := r.db.Raw(libraryProgressByUserAndBookSQL, userID, bookID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return nil, gorm.ErrRecordNotFound
	}

	var p model.LibraryBookProgress
	var b model.LibraryBook
	if err := rows.Scan(
		&p.ID, &p.CreatedAt, &p.UpdatedAt, &p.UserID, &p.LibraryBookID,
		&p.Status, &p.CurrentPage, &p.Note, &p.LastStudiedAt,
		&b.ID, &b.CreatedAt, &b.UpdatedAt,
		&b.Title, &b.Slug, &b.Author, &b.Description, &b.Category, &b.Level,
		&b.Language, &b.Format, &b.SourceType, &b.SourceURL, &b.CoverURL,
		&b.FileName, &b.FileMimeType, &b.FileSizeBytes, &b.FileObjectKey,
		&b.CoverObjectKey, &b.FileURL, &b.ChecksumSHA256, &b.License,
		&b.LicenseStatus, &b.SourceNote, &b.IsSourceVerified, &b.Pages,
		&b.Tags, &b.Status, &b.ExtractionStatus, &b.ExtractionError,
	); err != nil {
		return nil, err
	}
	p.Book = &b
	return &p, nil
}