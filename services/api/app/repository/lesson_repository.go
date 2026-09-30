package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type LessonRepository interface {
	FindAll() ([]model.LessonModule, error)
	FindBySlug(slug string) (*model.LessonModule, error)
	FindProgress(userID uuid.UUID) ([]model.UserLessonProgress, error)
	UpsertProgress(p *model.UserLessonProgress) (*model.UserLessonProgress, error)
	CreateModule(m *model.LessonModule) (*model.LessonModule, error)
	UpdateModule(id int, m *model.LessonModule) (*model.LessonModule, error)
	DeleteModule(id int) error
}

type lessonRepository struct{ db *gorm.DB }

func NewLessonRepository(db *gorm.DB) LessonRepository {
	return &lessonRepository{db}
}

type lessonJoinRow struct {
	ID               *int
	Slug             string
	Title            string
	Description      string
	Category         string
	Level            string
	EstimatedMinutes int
	Icon             string
	Order            int
	RelatedBookID    *int
	CreatedAt        *time.Time
	UpdatedAt        *time.Time
	DeletedAt        gorm.DeletedAt

	StepID          *int
	StepModuleID    *int
	StepStepOrder   *int
	StepKind        *string
	StepTitle       *string
	StepBody        *string
	StepArabic      *string
	StepLatin       *string
	StepTranslation *string
	StepDalil       *string
	StepTip         *string
	StepAudioURL    *string
	StepCreatedAt   *time.Time
	StepUpdatedAt   *time.Time
	StepDeletedAt   gorm.DeletedAt

	BookID               *int
	BookTitle            *string
	BookSlug             *string
	BookAuthor           *string
	BookDescription      *string
	BookCategory         *string
	BookLevel            *string
	BookLanguage         *string
	BookFormat           *model.LibraryBookFormat
	BookSourceType       *model.LibraryBookSourceType
	BookSourceURL        *string
	BookCoverURL         *string
	BookFileName         *string
	BookFileMimeType     *string
	BookFileSizeBytes    *int64
	BookFileObjectKey    *string
	BookCoverObjectKey   *string
	BookFileURL          *string
	BookChecksumSHA256   *string
	BookLicense          *string
	BookLicenseStatus    *model.LibraryBookLicenseStatus
	BookSourceNote       *string
	BookIsSourceVerified *bool
	BookPages            *int
	BookTags             *string
	BookStatus           *model.LibraryBookStatus
	BookExtractionStatus *model.LibraryBookExtractStatus
	BookExtractionError  *string
	BookCreatedAt        *time.Time
	BookUpdatedAt        *time.Time
	BookDeletedAt        gorm.DeletedAt
}

const lessonJoinSelectSQL = `
	SELECT
		lm.id, lm.slug, lm.title, lm.description, lm.category, lm.level,
		lm.estimated_minutes, lm.icon, lm."order", lm.related_book_id,
		lm.created_at, lm.updated_at, lm.deleted_at,
		ls.id AS step_id, ls.module_id AS step_module_id, ls.step_order AS step_step_order,
		ls.kind AS step_kind, ls.title AS step_title, ls.body AS step_body,
		ls.arabic AS step_arabic, ls.latin AS step_latin, ls.translation AS step_translation,
		ls.dalil AS step_dalil, ls.tip AS step_tip, ls.audio_url AS step_audio_url,
		ls.created_at AS step_created_at, ls.updated_at AS step_updated_at, ls.deleted_at AS step_deleted_at,
		lb.id AS book_id, lb.title AS book_title, lb.slug AS book_slug, lb.author AS book_author,
		lb.description AS book_description, lb.category AS book_category, lb.level AS book_level,
		lb.language AS book_language, lb.format AS book_format, lb.source_type AS book_source_type,
		lb.source_url AS book_source_url, lb.cover_url AS book_cover_url, lb.file_name AS book_file_name,
		lb.file_mime_type AS book_file_mime_type, lb.file_size_bytes AS book_file_size_bytes,
		lb.file_object_key AS book_file_object_key, lb.cover_object_key AS book_cover_object_key,
		lb.file_url AS book_file_url, lb.checksum_sha256 AS book_checksum_sha256,
		lb.license AS book_license, lb.license_status AS book_license_status,
		lb.source_note AS book_source_note, lb.is_source_verified AS book_is_source_verified,
		lb.pages AS book_pages, lb.tags AS book_tags, lb.status AS book_status,
		lb.extraction_status AS book_extraction_status, lb.extraction_error AS book_extraction_error,
		lb.created_at AS book_created_at, lb.updated_at AS book_updated_at, lb.deleted_at AS book_deleted_at
	FROM lesson_module lm
	LEFT JOIN lesson_step ls ON ls.module_id = lm.id AND ls.deleted_at IS NULL
	LEFT JOIN library_book lb ON lb.id = lm.related_book_id AND lb.deleted_at IS NULL
`

func foldLessonModules(rows []lessonJoinRow) []model.LessonModule {
	if len(rows) == 0 {
		return []model.LessonModule{}
	}

	moduleMap := make(map[int]*model.LessonModule)
	var orderedModules []*model.LessonModule

	for _, r := range rows {
		if r.ID == nil {
			continue
		}
		mod, exists := moduleMap[*r.ID]
		if !exists {
			mod = &model.LessonModule{
				Slug:             r.Slug,
				Title:            r.Title,
				Description:      r.Description,
				Category:         r.Category,
				Level:            r.Level,
				EstimatedMinutes: r.EstimatedMinutes,
				Icon:             r.Icon,
				Order:            r.Order,
				RelatedBookID:    r.RelatedBookID,
				Steps:            make([]model.LessonStep, 0),
			}
			mod.ID = r.ID
			mod.CreatedAt = r.CreatedAt
			mod.UpdatedAt = r.UpdatedAt
			mod.DeletedAt = r.DeletedAt

			if r.BookID != nil {
				b := &model.LibraryBook{
					Title:            stringValue(r.BookTitle),
					Slug:             stringValue(r.BookSlug),
					Author:           stringValue(r.BookAuthor),
					Description:      stringValue(r.BookDescription),
					Category:         stringValue(r.BookCategory),
					Level:            stringValue(r.BookLevel),
					Language:         stringValue(r.BookLanguage),
					SourceURL:        stringValue(r.BookSourceURL),
					CoverURL:         stringValue(r.BookCoverURL),
					FileName:         stringValue(r.BookFileName),
					FileMimeType:     stringValue(r.BookFileMimeType),
					FileObjectKey:    stringValue(r.BookFileObjectKey),
					CoverObjectKey:   stringValue(r.BookCoverObjectKey),
					FileURL:          stringValue(r.BookFileURL),
					ChecksumSHA256:   stringValue(r.BookChecksumSHA256),
					License:          stringValue(r.BookLicense),
					SourceNote:       stringValue(r.BookSourceNote),
					Tags:             stringValue(r.BookTags),
					ExtractionError:  stringValue(r.BookExtractionError),
				}
				b.ID = r.BookID
				if r.BookFormat != nil {
					b.Format = *r.BookFormat
				}
				if r.BookSourceType != nil {
					b.SourceType = *r.BookSourceType
				}
				if r.BookFileSizeBytes != nil {
					b.FileSizeBytes = *r.BookFileSizeBytes
				}
				if r.BookLicenseStatus != nil {
					b.LicenseStatus = *r.BookLicenseStatus
				}
				if r.BookIsSourceVerified != nil {
					b.IsSourceVerified = *r.BookIsSourceVerified
				}
				if r.BookPages != nil {
					b.Pages = *r.BookPages
				}
				if r.BookStatus != nil {
					b.Status = *r.BookStatus
				}
				if r.BookExtractionStatus != nil {
					b.ExtractionStatus = *r.BookExtractionStatus
				}
				b.CreatedAt = r.BookCreatedAt
				b.UpdatedAt = r.BookUpdatedAt
				b.DeletedAt = r.BookDeletedAt
				mod.RelatedBook = b
			}

			moduleMap[*r.ID] = mod
			orderedModules = append(orderedModules, mod)
		}

		if r.StepID != nil {
			step := model.LessonStep{
				ModuleID:    intValue(r.StepModuleID),
				StepOrder:   intValue(r.StepStepOrder),
				Kind:        stringValue(r.StepKind),
				Title:       stringValue(r.StepTitle),
				Body:        stringValue(r.StepBody),
				Arabic:      stringValue(r.StepArabic),
				Latin:       stringValue(r.StepLatin),
				Translation: stringValue(r.StepTranslation),
				Dalil:       stringValue(r.StepDalil),
				Tip:         stringValue(r.StepTip),
				AudioURL:    stringValue(r.StepAudioURL),
			}
			step.ID = r.StepID
			step.CreatedAt = r.StepCreatedAt
			step.UpdatedAt = r.StepUpdatedAt
			step.DeletedAt = r.StepDeletedAt
			mod.Steps = append(mod.Steps, step)
		}
	}

	res := make([]model.LessonModule, len(orderedModules))
	for i, m := range orderedModules {
		res[i] = *m
	}
	return res
}

func (r *lessonRepository) FindAll() ([]model.LessonModule, error) {
	var rows []lessonJoinRow
	err := r.db.Raw(lessonJoinSelectSQL + `
		WHERE lm.deleted_at IS NULL
		ORDER BY lm."order" ASC, lm.id ASC, ls.step_order ASC
	`).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return foldLessonModules(rows), nil
}

func (r *lessonRepository) FindBySlug(slug string) (*model.LessonModule, error) {
	var rows []lessonJoinRow
	err := r.db.Raw(lessonJoinSelectSQL+`
		WHERE lm.slug = ? AND lm.deleted_at IS NULL
		ORDER BY ls.step_order ASC
	`, slug).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	modules := foldLessonModules(rows)
	if len(modules) == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &modules[0], nil
}

func (r *lessonRepository) FindProgress(userID uuid.UUID) ([]model.UserLessonProgress, error) {
	var items []model.UserLessonProgress
	err := r.db.Where("user_id = ?", userID).Find(&items).Error
	return items, err
}

func (r *lessonRepository) UpsertProgress(p *model.UserLessonProgress) (*model.UserLessonProgress, error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	err := r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "module_id"}, {Name: "step_num"}},
		DoUpdates: clause.AssignmentColumns([]string{"done", "updated_at"}),
	}).Create(p).Error
	return p, err
}

func (r *lessonRepository) CreateModule(m *model.LessonModule) (*model.LessonModule, error) {
	if err := r.db.Omit("Steps").Create(m).Error; err != nil {
		return nil, err
	}
	if len(m.Steps) > 0 {
		for i := range m.Steps {
			m.Steps[i].ModuleID = *m.ID
		}
		if err := r.db.Create(&m.Steps).Error; err != nil {
			return nil, err
		}
	}
	return r.FindBySlug(m.Slug)
}

func (r *lessonRepository) UpdateModule(id int, m *model.LessonModule) (*model.LessonModule, error) {
	if err := r.db.Model(&model.LessonModule{}).Where("id = ?", id).Updates(map[string]interface{}{
		"slug": m.Slug, "title": m.Title, "description": m.Description, "icon": m.Icon, "\"order\"": m.Order,
		"related_book_id": m.RelatedBookID,
	}).Error; err != nil {
		return nil, err
	}
	if len(m.Steps) > 0 {
		if err := r.db.Where("module_id = ?", id).Delete(&model.LessonStep{}).Error; err != nil {
			return nil, err
		}
		for i := range m.Steps {
			m.Steps[i].ModuleID = id
		}
		if err := r.db.Create(&m.Steps).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(id)
}

func (r *lessonRepository) DeleteModule(id int) error {
	if err := r.db.Where("module_id = ?", id).Delete(&model.LessonStep{}).Error; err != nil {
		return err
	}
	return r.db.Delete(&model.LessonModule{}, id).Error
}

func (r *lessonRepository) FindByID(id int) (*model.LessonModule, error) {
	var rows []lessonJoinRow
	err := r.db.Raw(lessonJoinSelectSQL+`
		WHERE lm.id = ? AND lm.deleted_at IS NULL
		ORDER BY ls.step_order ASC
	`, id).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	modules := foldLessonModules(rows)
	if len(modules) == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &modules[0], nil
}

func stringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func intValue(i *int) int {
	if i == nil {
		return 0
	}
	return *i
}
