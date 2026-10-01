package repository

import (
	"database/sql"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type AsbabunNuzulRepository interface {
	FindAll(page, size int) ([]model.AsbabunNuzul, error)
	FindByAyahID(ayahID int) ([]model.AsbabunNuzul, error)
	FindBySurahNumber(surahNumber, limit, offset int) ([]model.AsbabunNuzul, error)
	FindByID(id int) (*model.AsbabunNuzul, error)
	FindAyahIDsByReferences(refs []model.AyahReference) ([]int, error)
	Create(a *model.AsbabunNuzul) (*model.AsbabunNuzul, error)
	CreateWithAyahs(a *model.AsbabunNuzul, ayahIDs []int) (*model.AsbabunNuzul, error)
	Update(id int, a *model.AsbabunNuzul) (*model.AsbabunNuzul, error)
	UpdateWithAyahs(id int, a *model.AsbabunNuzul, ayahIDs []int) (*model.AsbabunNuzul, error)
	Delete(id int) error
}

type asbabunNuzulRepository struct{ db *gorm.DB }

func NewAsbabunNuzulRepository(db *gorm.DB) AsbabunNuzulRepository {
	return &asbabunNuzulRepository{db}
}

const asbabunNuzulSelectSQL = `
	SELECT
		an.id, an.title, an.narrator, an.content, an.source, an.display_ref, an.translation_id,
		ant.id, ant.idn, ant.en, ant.ar,
		ay.id, ay.number, ay.page, ay.juz_number, ay.surah_id, ay.translation_id,
		ayt.id, ayt.idn, ayt.en, ayt.ar,
		s.id, s.number, s.slug, s.revelation_type, s.translation_id,
		st.id, st.idn, st.en, st.ar
	FROM asbabun_nuzul an
	LEFT JOIN translation ant ON ant.id = an.translation_id AND ant.deleted_at IS NULL
	LEFT JOIN asbabun_nuzul_ayahs ana ON ana.asbabun_nuzul_id = an.id
	LEFT JOIN ayah ay ON ay.id = ana.ayah_id AND ay.deleted_at IS NULL
	LEFT JOIN translation ayt ON ayt.id = ay.translation_id AND ayt.deleted_at IS NULL
	LEFT JOIN surah s ON s.id = ay.surah_id AND s.deleted_at IS NULL
	LEFT JOIN translation st ON st.id = s.translation_id AND st.deleted_at IS NULL
`

func scanAsbabunNuzulRows(rows *sql.Rows, preserveOrder []int) ([]model.AsbabunNuzul, error) {
	var (
		order     []int
		itemsMap  = make(map[int]*model.AsbabunNuzul)
		seenAyahs = make(map[int]map[int]bool)
	)

	for rows.Next() {
		var (
			anID                           *int
			anTitle, anNarrator, anContent *string
			anSource, anDisplayRef         *string
			anTransID                      *int
			antID                          *int
			antIdn, antEn, antAr           *string
			ayID, ayNumber, ayPage, ayJuz  *int
			aySurahID, ayTransID           *int
			aytID                          *int
			aytIdn, aytEn, aytAr           *string
			sID, sNumber, sTransID         *int
			sSlug, sRev                    *string
			stID                           *int
			stIdn, stEn, stAr              *string
		)

		err := rows.Scan(
			&anID, &anTitle, &anNarrator, &anContent, &anSource, &anDisplayRef, &anTransID,
			&antID, &antIdn, &antEn, &antAr,
			&ayID, &ayNumber, &ayPage, &ayJuz, &aySurahID, &ayTransID,
			&aytID, &aytIdn, &aytEn, &aytAr,
			&sID, &sNumber, &sSlug, &sRev, &sTransID,
			&stID, &stIdn, &stEn, &stAr,
		)
		if err != nil {
			return nil, err
		}
		if anID == nil {
			continue
		}

		item, exists := itemsMap[*anID]
		if !exists {
			item = &model.AsbabunNuzul{
				BaseID:        model.BaseID{ID: anID},
				TranslationID: anTransID,
				Ayahs:         []model.Ayah{},
			}
			if anTitle != nil {
				item.Title = *anTitle
			}
			if anNarrator != nil {
				item.Narrator = *anNarrator
			}
			if anContent != nil {
				item.Content = *anContent
			}
			if anSource != nil {
				item.Source = *anSource
			}
			if anDisplayRef != nil {
				item.DisplayRef = *anDisplayRef
			}
			if antID != nil {
				item.Translation = &model.Translation{
					BaseID: model.BaseID{ID: antID},
					Idn:    antIdn,
					En:     antEn,
					Ar:     antAr,
				}
			}
			itemsMap[*anID] = item
			order = append(order, *anID)
			seenAyahs[*anID] = make(map[int]bool)
		}

		if ayID != nil && !seenAyahs[*anID][*ayID] {
			seenAyahs[*anID][*ayID] = true
			ayah := model.Ayah{
				BaseID:        model.BaseID{ID: ayID},
				Number:        ayNumber,
				Page:          ayPage,
				JuzNumber:     ayJuz,
				SurahID:       aySurahID,
				TranslationID: ayTransID,
			}
			if aytID != nil {
				ayah.Translation = &model.Translation{
					BaseID: model.BaseID{ID: aytID},
					Idn:    aytIdn,
					En:     aytEn,
					Ar:     aytAr,
				}
			}
			if sID != nil {
				ayah.Surah = &model.Surah{
					BaseID:         model.BaseID{ID: sID},
					Number:         sNumber,
					Slug:           sSlug,
					RevelationType: sRev,
					TranslationID:  sTransID,
				}
				if stID != nil {
					ayah.Surah.Translation = &model.Translation{
						BaseID: model.BaseID{ID: stID},
						Idn:    stIdn,
						En:     stEn,
						Ar:     stAr,
					}
				}
			}
			item.Ayahs = append(item.Ayahs, ayah)
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	finalOrder := order
	if len(preserveOrder) > 0 {
		finalOrder = preserveOrder
	}

	result := make([]model.AsbabunNuzul, 0, len(finalOrder))
	for _, id := range finalOrder {
		if item, ok := itemsMap[id]; ok {
			result = append(result, *item)
		}
	}
	return result, nil
}

func (r *asbabunNuzulRepository) FindAll(page, size int) ([]model.AsbabunNuzul, error) {
	if page < 0 {
		page = 0
	}
	if size <= 0 {
		size = 100
	}

	var ids []int
	if err := r.db.Raw("SELECT id FROM asbabun_nuzul WHERE deleted_at IS NULL ORDER BY id ASC LIMIT ? OFFSET ?", size, page*size).Scan(&ids).Error; err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return []model.AsbabunNuzul{}, nil
	}

	rows, err := r.db.Raw(asbabunNuzulSelectSQL+" WHERE an.deleted_at IS NULL AND an.id IN (?) ORDER BY an.id ASC, ay.number ASC", ids).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanAsbabunNuzulRows(rows, ids)
}

func (r *asbabunNuzulRepository) FindByAyahID(ayahID int) ([]model.AsbabunNuzul, error) {
	var ids []int
	if err := r.db.Raw("SELECT DISTINCT ana.asbabun_nuzul_id FROM asbabun_nuzul_ayahs ana JOIN ayah ay ON ay.id = ana.ayah_id AND ay.deleted_at IS NULL WHERE ana.ayah_id = ? ORDER BY ana.asbabun_nuzul_id ASC", ayahID).Scan(&ids).Error; err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return []model.AsbabunNuzul{}, nil
	}

	rows, err := r.db.Raw(asbabunNuzulSelectSQL+" WHERE an.deleted_at IS NULL AND an.id IN (?) ORDER BY an.id ASC, ay.number ASC", ids).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanAsbabunNuzulRows(rows, ids)
}

func (r *asbabunNuzulRepository) FindBySurahNumber(surahNumber, limit, offset int) ([]model.AsbabunNuzul, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	var ids []int
	idQuery := `
		SELECT an.id
		FROM asbabun_nuzul an
		JOIN asbabun_nuzul_ayahs j ON j.asbabun_nuzul_id = an.id
		JOIN ayah ay ON ay.id = j.ayah_id AND ay.deleted_at IS NULL
		JOIN surah s ON s.id = ay.surah_id AND s.deleted_at IS NULL
		WHERE an.deleted_at IS NULL AND s.number = ?
		GROUP BY an.id
		ORDER BY MIN(ay.number) ASC
		LIMIT ? OFFSET ?
	`
	if err := r.db.Raw(idQuery, surahNumber, limit, offset).Scan(&ids).Error; err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return []model.AsbabunNuzul{}, nil
	}

	rows, err := r.db.Raw(asbabunNuzulSelectSQL+" WHERE an.deleted_at IS NULL AND an.id IN (?) ORDER BY ay.number ASC", ids).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanAsbabunNuzulRows(rows, ids)
}

func (r *asbabunNuzulRepository) FindByID(id int) (*model.AsbabunNuzul, error) {
	rows, err := r.db.Raw(asbabunNuzulSelectSQL+" WHERE an.deleted_at IS NULL AND an.id = ? ORDER BY ay.number ASC", id).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items, err := scanAsbabunNuzulRows(rows, []int{id})
	if err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &items[0], nil
}

func (r *asbabunNuzulRepository) FindAyahIDsByReferences(refs []model.AyahReference) ([]int, error) {
	ids := make([]int, 0, len(refs))
	seen := map[int]bool{}
	for _, ref := range refs {
		if ref.SurahNumber <= 0 || ref.AyahNumber <= 0 {
			continue
		}
		key := ref.SurahNumber*10000 + ref.AyahNumber
		if seen[key] {
			continue
		}
		seen[key] = true

		var ayah model.Ayah
		if err := r.db.
			Select("ayah.id").
			Joins("JOIN surah ON surah.id = ayah.surah_id AND surah.deleted_at IS NULL").
			Where("surah.number = ? AND ayah.number = ?", ref.SurahNumber, ref.AyahNumber).
			First(&ayah).Error; err != nil {
			return nil, err
		}
		if ayah.ID != nil {
			ids = append(ids, *ayah.ID)
		}
	}
	return ids, nil
}

func (r *asbabunNuzulRepository) Create(a *model.AsbabunNuzul) (*model.AsbabunNuzul, error) {
	return a, r.db.Create(a).Error
}

func (r *asbabunNuzulRepository) CreateWithAyahs(a *model.AsbabunNuzul, ayahIDs []int) (*model.AsbabunNuzul, error) {
	tx := r.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	trID, err := upsertContentTranslation(tx, a.TranslationID, a.Title, "", "", a.Content)
	if err != nil {
		tx.Rollback()
		return nil, err
	}
	a.TranslationID = trID

	if err := tx.Omit("Ayahs.*").Create(a).Error; err != nil {
		tx.Rollback()
		return nil, err
	}
	if err := replaceAsbabunNuzulAyahs(tx, a, ayahIDs); err != nil {
		tx.Rollback()
		return nil, err
	}
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}
	if a.ID == nil {
		return a, nil
	}
	return r.FindByID(*a.ID)
}

func (r *asbabunNuzulRepository) Update(id int, a *model.AsbabunNuzul) (*model.AsbabunNuzul, error) {
	return a, r.db.Model(&model.AsbabunNuzul{}).Where("id = ?", id).Updates(a).Error
}

func (r *asbabunNuzulRepository) UpdateWithAyahs(id int, a *model.AsbabunNuzul, ayahIDs []int) (*model.AsbabunNuzul, error) {
	var existing model.AsbabunNuzul
	if err := r.db.First(&existing, id).Error; err != nil {
		return nil, err
	}

	tx := r.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	trID, err := upsertContentTranslation(tx, existing.TranslationID, a.Title, "", "", a.Content)
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Model(&existing).Updates(map[string]interface{}{
		"title":          a.Title,
		"narrator":       a.Narrator,
		"content":        a.Content,
		"source":         a.Source,
		"display_ref":    a.DisplayRef,
		"translation_id": trID,
	}).Error; err != nil {
		tx.Rollback()
		return nil, err
	}
	if err := replaceAsbabunNuzulAyahs(tx, &existing, ayahIDs); err != nil {
		tx.Rollback()
		return nil, err
	}
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *asbabunNuzulRepository) Delete(id int) error {
	return r.db.Delete(&model.AsbabunNuzul{}, id).Error
}

func replaceAsbabunNuzulAyahs(db *gorm.DB, item *model.AsbabunNuzul, ayahIDs []int) error {
	ids := uniquePositiveInts(ayahIDs)
	ayahs := make([]model.Ayah, 0)
	if len(ids) > 0 {
		if err := db.Where("id IN ?", ids).Find(&ayahs).Error; err != nil {
			return err
		}
	}
	return db.Model(item).Association("Ayahs").Replace(ayahs)
}

func uniquePositiveInts(values []int) []int {
	seen := map[int]bool{}
	result := make([]int, 0, len(values))
	for _, value := range values {
		if value <= 0 || seen[value] {
			continue
		}
		seen[value] = true
		result = append(result, value)
	}
	return result
}
