package repository

import (
	"database/sql"
	"fmt"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type HadithAyahRepository interface {
	Save(*model.HadithAyah) (*model.HadithAyah, error)
	FindAll() ([]model.HadithAyah, error)
	FindByID(int) (*model.HadithAyah, error)
	FindByHadithID(int) ([]model.HadithAyah, error)
	FindByAyahID(int) ([]model.HadithAyah, error)
	Update(int, *model.HadithAyah) (*model.HadithAyah, error)
	Delete(int) error
}

type hadithAyahRepo struct {
	db *gorm.DB
}

func NewHadithAyahRepository(db *gorm.DB) HadithAyahRepository {
	return &hadithAyahRepo{db}
}

const hadithAyahSelectSQL = `
	SELECT
		ha.id, ha.hadith_id, ha.ayah_id, ha.catatan,
		h.id, h.number, h.book_id, h.theme_id, h.chapter_id, h.translation_id, h.grade,
		ht.id, ht.idn, ht.en, ht.ar,
		b.id, b.slug, b.translation_id,
		bt.id, bt.idn, bt.en, bt.ar,
		a.id, a.number, a.page, a.juz_number, a.surah_id, a.translation_id,
		at.id, at.idn, at.en, at.ar,
		s.id, s.number, s.slug, s.revelation_type, s.translation_id,
		st.id, st.idn, st.en, st.ar
	FROM hadith_ayah ha
	LEFT JOIN hadith h ON h.id = ha.hadith_id AND h.deleted_at IS NULL
	LEFT JOIN translation ht ON ht.id = h.translation_id AND ht.deleted_at IS NULL
	LEFT JOIN book b ON b.id = h.book_id AND b.deleted_at IS NULL
	LEFT JOIN translation bt ON bt.id = b.translation_id AND bt.deleted_at IS NULL
	LEFT JOIN ayah a ON a.id = ha.ayah_id AND a.deleted_at IS NULL
	LEFT JOIN translation at ON at.id = a.translation_id AND at.deleted_at IS NULL
	LEFT JOIN surah s ON s.id = a.surah_id AND s.deleted_at IS NULL
	LEFT JOIN translation st ON st.id = s.translation_id AND st.deleted_at IS NULL
`

func (r *hadithAyahRepo) scanRow(rows *sql.Rows) (*model.HadithAyah, error) {
	var (
		ha                              model.HadithAyah
		hID, hNumber, hBookID, hThemeID, hChapterID, hTransID *int
		hGrade                          *string
		htID                            *int
		htIdn, htEn, htAr               *string
		bID                             *int
		bSlug                           *string
		bTransID                        *int
		btID                            *int
		btIdn, btEn, btAr               *string
		aID, aNumber, aPage, aJuz, aSurah, aTransID *int
		atID                            *int
		atIdn, atEn, atAr               *string
		sID, sNumber, sTransID          *int
		sSlug, sRev                     *string
		stID                            *int
		stIdn, stEn, stAr               *string
	)

	err := rows.Scan(
		&ha.ID, &ha.HadithID, &ha.AyahID, &ha.Catatan,
		&hID, &hNumber, &hBookID, &hThemeID, &hChapterID, &hTransID, &hGrade,
		&htID, &htIdn, &htEn, &htAr,
		&bID, &bSlug, &bTransID,
		&btID, &btIdn, &btEn, &btAr,
		&aID, &aNumber, &aPage, &aJuz, &aSurah, &aTransID,
		&atID, &atIdn, &atEn, &atAr,
		&sID, &sNumber, &sSlug, &sRev, &sTransID,
		&stID, &stIdn, &stEn, &stAr,
	)
	if err != nil {
		return nil, err
	}

	if hID != nil {
		ha.Hadith = &model.Hadith{
			BaseID:          model.BaseID{ID: hID},
			Number:          hNumber,
			BookID:          hBookID,
			ThemeID:         hThemeID,
			ChapterID:       hChapterID,
			TranslationID:   hTransID,
			Grade:           (*model.HadithGrade)(hGrade),
		}
		if htID != nil {
			ha.Hadith.Translation = &model.Translation{BaseID: model.BaseID{ID: htID}, Idn: htIdn, En: htEn, Ar: htAr}
		}
		if bID != nil {
			ha.Hadith.Book = &model.Book{
				BaseID:         model.BaseID{ID: bID},
				Slug:           bSlug,
				TranslationID:  bTransID,
			}
			if btID != nil {
				ha.Hadith.Book.Translation = &model.Translation{BaseID: model.BaseID{ID: btID}, Idn: btIdn, En: btEn, Ar: btAr}
			}
		}
	}

	if aID != nil {
		ha.Ayah = &model.Ayah{
			BaseID:        model.BaseID{ID: aID},
			Number:        aNumber,
			Page:          aPage,
			JuzNumber:     aJuz,
			SurahID:       aSurah,
			TranslationID: aTransID,
		}
		if atID != nil {
			ha.Ayah.Translation = &model.Translation{BaseID: model.BaseID{ID: atID}, Idn: atIdn, En: atEn, Ar: atAr}
		}
		if sID != nil {
			ha.Ayah.Surah = &model.Surah{
				BaseID:         model.BaseID{ID: sID},
				Number:         sNumber,
				Slug:           sSlug,
				RevelationType: sRev,
				TranslationID:  sTransID,
			}
			if stID != nil {
				ha.Ayah.Surah.Translation = &model.Translation{BaseID: model.BaseID{ID: stID}, Idn: stIdn, En: stEn, Ar: stAr}
			}
		}
	}

	return &ha, nil
}

func (r *hadithAyahRepo) Save(ha *model.HadithAyah) (*model.HadithAyah, error) {
	if err := r.db.Create(ha).Error; err != nil {
		return nil, err
	}
	return ha, nil
}

func (r *hadithAyahRepo) FindAll() ([]model.HadithAyah, error) {
	var list []model.HadithAyah
	err := r.db.Order("hadith_id, id").Limit(500).Find(&list).Error
	return list, err
}

func (r *hadithAyahRepo) FindByID(id int) (*model.HadithAyah, error) {
	var ha model.HadithAyah
	if err := r.db.First(&ha, id).Error; err != nil {
		return nil, err
	}
	return &ha, nil
}

func (r *hadithAyahRepo) Update(id int, ha *model.HadithAyah) (*model.HadithAyah, error) {
	if _, err := r.FindByID(id); err != nil {
		return nil, err
	}
	ha.ID = &id
	if err := r.db.Updates(ha).Error; err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *hadithAyahRepo) FindByHadithID(hadithID int) ([]model.HadithAyah, error) {
	sqlStr := fmt.Sprintf("%s WHERE ha.deleted_at IS NULL AND ha.hadith_id = ? ORDER BY ha.ayah_id ASC", hadithAyahSelectSQL)
	rows, err := r.db.Raw(sqlStr, hadithID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.HadithAyah
	for rows.Next() {
		item, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	return items, rows.Err()
}

func (r *hadithAyahRepo) FindByAyahID(ayahID int) ([]model.HadithAyah, error) {
	sqlStr := fmt.Sprintf("%s WHERE ha.deleted_at IS NULL AND ha.ayah_id = ? ORDER BY ha.hadith_id ASC", hadithAyahSelectSQL)
	rows, err := r.db.Raw(sqlStr, ayahID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.HadithAyah
	for rows.Next() {
		item, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	return items, rows.Err()
}

func (r *hadithAyahRepo) Delete(id int) error {
	return r.db.Delete(&model.HadithAyah{}, id).Error
}