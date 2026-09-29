package repository

import (
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

func (r *lessonRepository) FindAll() ([]model.LessonModule, error) {
	var modules []model.LessonModule
	err := r.db.Raw(`
		SELECT
			lm.id, lm.slug, lm.title, lm.description, lm.category, lm.level,
			lm.estimated_minutes, lm.icon, lm."order", lm.related_book_id,
			lm.created_at, lm.updated_at, lm.deleted_at
		FROM lesson_modules lm
		ORDER BY lm."order" ASC, lm.id ASC
	`).Scan(&modules).Error
	if err != nil {
		return nil, err
	}

	if len(modules) == 0 {
		return modules, nil
	}

	moduleIDs := make([]int, len(modules))
	for i, m := range modules {
		moduleIDs[i] = *m.ID
	}

	var steps []model.LessonStep
	err = r.db.Raw(`
		SELECT
			ls.id, ls.module_id, ls.step_order, ls.kind, ls.title, ls.body,
			ls.arabic, ls.latin, ls.translation, ls.dalil, ls.tip, ls.audio_url,
			ls.created_at, ls.updated_at, ls.deleted_at
		FROM lesson_steps ls
		WHERE ls.module_id IN (?)
		ORDER BY ls.module_id, ls.step_order ASC
	`, moduleIDs).Scan(&steps).Error
	if err != nil {
		return nil, err
	}

	relatedBookIDs := make([]int, 0)
	for _, m := range modules {
		if m.RelatedBookID != nil {
			relatedBookIDs = append(relatedBookIDs, *m.RelatedBookID)
		}
	}

	var books []model.LibraryBook
	if len(relatedBookIDs) > 0 {
		err = r.db.Raw(`
			SELECT
				lb.id, lb.title, lb.slug, lb.author, lb.description, lb.category,
				lb.level, lb.language, lb.format, lb.source_type, lb.source_url,
				lb.cover_url, lb.file_name, lb.file_mime_type, lb.file_size_bytes,
				lb.file_object_key, lb.cover_object_key, lb.file_url, lb.checksum_sha256,
				lb.license, lb.license_status, lb.source_note, lb.is_source_verified,
				lb.pages, lb.tags, lb.status, lb.extraction_status, lb.extraction_error,
				lb.created_at, lb.updated_at, lb.deleted_at
			FROM library_books lb
			WHERE lb.id IN (?)
		`, relatedBookIDs).Scan(&books).Error
		if err != nil {
			return nil, err
		}
	}

	stepMap := make(map[int][]model.LessonStep)
	for _, s := range steps {
		stepMap[s.ModuleID] = append(stepMap[s.ModuleID], s)
	}

	bookMap := make(map[int]model.LibraryBook)
	for _, b := range books {
		bookMap[*b.ID] = b
	}

	for i := range modules {
		if modules[i].ID != nil {
			modules[i].Steps = stepMap[*modules[i].ID]
		}
		if modules[i].RelatedBookID != nil {
			if b, ok := bookMap[*modules[i].RelatedBookID]; ok {
				modules[i].RelatedBook = &b
			}
		}
	}

	return modules, nil
}

func (r *lessonRepository) FindBySlug(slug string) (*model.LessonModule, error) {
	var module model.LessonModule
	err := r.db.Raw(`
		SELECT
			lm.id, lm.slug, lm.title, lm.description, lm.category, lm.level,
			lm.estimated_minutes, lm.icon, lm."order", lm.related_book_id,
			lm.created_at, lm.updated_at, lm.deleted_at
		FROM lesson_modules lm
		WHERE lm.slug = ?
	`, slug).Scan(&module).Error
	if err != nil {
		return nil, err
	}
	if module.ID == nil {
		return nil, gorm.ErrRecordNotFound
	}

	var steps []model.LessonStep
	err = r.db.Raw(`
		SELECT
			ls.id, ls.module_id, ls.step_order, ls.kind, ls.title, ls.body,
			ls.arabic, ls.latin, ls.translation, ls.dalil, ls.tip, ls.audio_url,
			ls.created_at, ls.updated_at, ls.deleted_at
		FROM lesson_steps ls
		WHERE ls.module_id = ?
		ORDER BY ls.step_order ASC
	`, *module.ID).Scan(&steps).Error
	if err != nil {
		return nil, err
	}
	module.Steps = steps

	if module.RelatedBookID != nil {
		var book model.LibraryBook
		err = r.db.Raw(`
			SELECT
				lb.id, lb.title, lb.slug, lb.author, lb.description, lb.category,
				lb.level, lb.language, lb.format, lb.source_type, lb.source_url,
				lb.cover_url, lb.file_name, lb.file_mime_type, lb.file_size_bytes,
				lb.file_object_key, lb.cover_object_key, lb.file_url, lb.checksum_sha256,
				lb.license, lb.license_status, lb.source_note, lb.is_source_verified,
				lb.pages, lb.tags, lb.status, lb.extraction_status, lb.extraction_error,
				lb.created_at, lb.updated_at, lb.deleted_at
			FROM library_books lb
			WHERE lb.id = ?
		`, *module.RelatedBookID).Scan(&book).Error
		if err != nil {
			return nil, err
		}
		module.RelatedBook = &book
	}

	return &module, nil
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
	var module model.LessonModule
	err := r.db.Raw(`
		SELECT
			lm.id, lm.slug, lm.title, lm.description, lm.category, lm.level,
			lm.estimated_minutes, lm.icon, lm."order", lm.related_book_id,
			lm.created_at, lm.updated_at, lm.deleted_at
		FROM lesson_modules lm
		WHERE lm.id = ?
	`, id).Scan(&module).Error
	if err != nil {
		return nil, err
	}
	if module.ID == nil {
		return nil, gorm.ErrRecordNotFound
	}

	var steps []model.LessonStep
	err = r.db.Raw(`
		SELECT
			ls.id, ls.module_id, ls.step_order, ls.kind, ls.title, ls.body,
			ls.arabic, ls.latin, ls.translation, ls.dalil, ls.tip, ls.audio_url,
			ls.created_at, ls.updated_at, ls.deleted_at
		FROM lesson_steps ls
		WHERE ls.module_id = ?
		ORDER BY ls.step_order ASC
	`, id).Scan(&steps).Error
	if err != nil {
		return nil, err
	}
	module.Steps = steps

	if module.RelatedBookID != nil {
		var book model.LibraryBook
		err = r.db.Raw(`
			SELECT
				lb.id, lb.title, lb.slug, lb.author, lb.description, lb.category,
				lb.level, lb.language, lb.format, lb.source_type, lb.source_url,
				lb.cover_url, lb.file_name, lb.file_mime_type, lb.file_size_bytes,
				lb.file_object_key, lb.cover_object_key, lb.file_url, lb.checksum_sha256,
				lb.license, lb.license_status, lb.source_note, lb.is_source_verified,
				lb.pages, lb.tags, lb.status, lb.extraction_status, lb.extraction_error,
				lb.created_at, lb.updated_at, lb.deleted_at
			FROM library_books lb
			WHERE lb.id = ?
		`, *module.RelatedBookID).Scan(&book).Error
		if err != nil {
			return nil, err
		}
		module.RelatedBook = &book
	}

	return &module, nil
}