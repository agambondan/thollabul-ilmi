package repository

import (
	"database/sql"
	"fmt"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type TafsirRepository interface {
	FindByAyahID(int) (*model.Tafsir, error)
	FindBySurahNumber(int, int, int) ([]model.Tafsir, error)
	Search(string, int, int) ([]model.Tafsir, error)
	Save(*model.Tafsir) (*model.Tafsir, error)
	UpdateByAyahID(int, *model.Tafsir) (*model.Tafsir, error)
}

type tafsirRepo struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewTafsirRepository(db *gorm.DB, pg *paginate.Pagination) TafsirRepository {
	return &tafsirRepo{db, pg}
}

const tafsirSelectSQL = `
	SELECT
		t.id, t.ayah_id, t.kemenag_translation_id, t.ibnu_katsir_translation_id, t.ibnu_katsir_en_translation_id,
		kt.id, kt.idn, kt.en, kt.ar,
		ikt.id, ikt.idn, ikt.en, ikt.ar,
		iket.id, iket.idn, iket.en, iket.ar,
		a.id, a.number, a.page, a.juz_number, a.surah_id, a.translation_id,
		at.id, at.idn, at.en, at.ar,
		s.id, s.number, s.slug, s.revelation_type, s.translation_id,
		st.id, st.idn, st.en, st.ar
	FROM tafsir t
	LEFT JOIN translation kt ON kt.id = t.kemenag_translation_id
	LEFT JOIN translation ikt ON ikt.id = t.ibnu_katsir_translation_id
	LEFT JOIN translation iket ON iket.id = t.ibnu_katsir_en_translation_id
	LEFT JOIN ayah a ON a.id = t.ayah_id
	LEFT JOIN translation at ON at.id = a.translation_id
	LEFT JOIN surah s ON s.id = a.surah_id
	LEFT JOIN translation st ON st.id = s.translation_id
`

func (r *tafsirRepo) scanRow(rows *sql.Rows) (*model.Tafsir, error) {
	var (
		t                                model.Tafsir
		ktID, iktID, iketID              *int
		ktIdn, ktEn, ktAr                *string
		iktIdn, iktEn, iktAr             *string
		iketIdn, iketEn, iketAr          *string
		aID, aNumber, aPage, aJuz, aSurah, aTransID *int
		atID                             *int
		atIdn, atEn, atAr                *string
		sID, sNumber, sTransID           *int
		sSlug, sRev                      *string
		stID                             *int
		stIdn, stEn, stAr                *string
	)

	err := rows.Scan(
		&t.ID, &t.AyahID, &t.KemenagTranslationID, &t.IbnuKatsirTranslationID, &t.IbnuKatsirEnTranslationID,
		&ktID, &ktIdn, &ktEn, &ktAr,
		&iktID, &iktIdn, &iktEn, &iktAr,
		&iketID, &iketIdn, &iketEn, &iketAr,
		&aID, &aNumber, &aPage, &aJuz, &aSurah, &aTransID,
		&atID, &atIdn, &atEn, &atAr,
		&sID, &sNumber, &sSlug, &sRev, &sTransID,
		&stID, &stIdn, &stEn, &stAr,
	)
	if err != nil {
		return nil, err
	}

	if ktID != nil {
		t.KemenagTranslation = model.Translation{BaseID: model.BaseID{ID: ktID}, Idn: ktIdn, En: ktEn, Ar: ktAr}
	}
	if iktID != nil {
		t.IbnuKatsirTranslation = model.Translation{BaseID: model.BaseID{ID: iktID}, Idn: iktIdn, En: iktEn, Ar: iktAr}
	}
	if iketID != nil {
		t.IbnuKatsirEnTranslation = model.Translation{BaseID: model.BaseID{ID: iketID}, Idn: iketIdn, En: iketEn, Ar: iketAr}
	}

	if aID != nil {
		t.Ayah = &model.Ayah{
			BaseID:        model.BaseID{ID: aID},
			Number:        aNumber,
			Page:          aPage,
			JuzNumber:     aJuz,
			SurahID:       aSurah,
			TranslationID: aTransID,
		}
		if atID != nil {
			t.Ayah.Translation = &model.Translation{BaseID: model.BaseID{ID: atID}, Idn: atIdn, En: atEn, Ar: atAr}
		}
		if sID != nil {
			t.Ayah.Surah = &model.Surah{
				BaseID:         model.BaseID{ID: sID},
				Number:         sNumber,
				Slug:           sSlug,
				RevelationType: sRev,
				TranslationID:  sTransID,
			}
			if stID != nil {
				t.Ayah.Surah.Translation = &model.Translation{BaseID: model.BaseID{ID: stID}, Idn: stIdn, En: stEn, Ar: stAr}
			}
		}
	}

	return &t, nil
}

func (r *tafsirRepo) FindByAyahID(ayahID int) (*model.Tafsir, error) {
	sqlStr := tafsirSelectSQL + " WHERE t.ayah_id = ? LIMIT 1"
	rows, err := r.db.Raw(sqlStr, ayahID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, gorm.ErrRecordNotFound
	}
	return r.scanRow(rows)
}

func (r *tafsirRepo) FindBySurahNumber(surahNumber, limit, offset int) ([]model.Tafsir, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	sqlStr := fmt.Sprintf(`
		%s
		WHERE s.number = ?
		ORDER BY a.number ASC
		LIMIT ? OFFSET ?
	`, tafsirSelectSQL)

	rows, err := r.db.Raw(sqlStr, surahNumber, limit, offset).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.Tafsir
	for rows.Next() {
		t, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *t)
	}
	return list, rows.Err()
}

func (r *tafsirRepo) Save(t *model.Tafsir) (*model.Tafsir, error) {
	if err := r.db.Create(t).Error; err != nil {
		return nil, err
	}
	return t, nil
}

func (r *tafsirRepo) UpdateByAyahID(ayahID int, t *model.Tafsir) (*model.Tafsir, error) {
	if err := r.db.Model(&model.Tafsir{}).Where("ayah_id = ?", ayahID).Updates(t).Error; err != nil {
		return nil, err
	}
	return r.FindByAyahID(ayahID)
}

func (r *tafsirRepo) Search(query string, limit, offset int) ([]model.Tafsir, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	like := "%" + query + "%"

	sqlStr := fmt.Sprintf(`
		%s
		WHERE kt.idn ILIKE ? OR kt.en ILIKE ?
		   OR ikt.idn ILIKE ? OR ikt.en ILIKE ?
		   OR iket.idn ILIKE ? OR iket.en ILIKE ?
		LIMIT ? OFFSET ?
	`, tafsirSelectSQL)

	rows, err := r.db.Raw(sqlStr, like, like, like, like, like, like, limit, offset).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.Tafsir
	for rows.Next() {
		t, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *t)
	}
	return list, rows.Err()
}
