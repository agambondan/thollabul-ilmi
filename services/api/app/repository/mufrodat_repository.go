package repository

import (
	"database/sql"
	"fmt"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type MufrodatRepository interface {
	FindByAyahID(int) ([]model.Mufrodat, error)
	FindBySurahNumber(int) ([]model.Mufrodat, error)
	FindBySurahAndAyahNumber(int, int) ([]model.Mufrodat, error)
	FindByPage(int) ([]model.Mufrodat, error)
	FindByRootWord(string) ([]model.Mufrodat, error)
}

type mufrodatRepo struct {
	db *gorm.DB
}

func NewMufrodatRepository(db *gorm.DB) MufrodatRepository {
	return &mufrodatRepo{db}
}

const mufrodatSelectSQL = `
	SELECT
		m.id, m.ayah_id, m.word_index, m.arabic, m.transliteration, m.indonesian, m.root_word, m.part_of_speech,
		a.id, a.number, a.page, a.juz_number, a.surah_id, a.translation_id,
		at.id, at.idn, at.en, at.ar,
		s.id, s.number, s.slug, s.revelation_type, s.translation_id
	FROM mufrodat m
	LEFT JOIN ayah a ON a.id = m.ayah_id
	LEFT JOIN translation at ON at.id = a.translation_id
	LEFT JOIN surah s ON s.id = a.surah_id
`

func (r *mufrodatRepo) scanRow(rows *sql.Rows) (*model.Mufrodat, error) {
	var (
		m                             model.Mufrodat
		aID, aNumber, aPage, aJuz     *int
		aSurah, aTransID              *int
		atID                          *int
		atIdn, atEn, atAr             *string
		sID, sNumber, sTransID        *int
		sSlug, sRev                   *string
	)

	err := rows.Scan(
		&m.ID, &m.AyahID, &m.WordIndex, &m.Arabic, &m.Transliteration, &m.Indonesian, &m.RootWord, &m.PartOfSpeech,
		&aID, &aNumber, &aPage, &aJuz, &aSurah, &aTransID,
		&atID, &atIdn, &atEn, &atAr,
		&sID, &sNumber, &sSlug, &sRev, &sTransID,
	)
	if err != nil {
		return nil, err
	}

	if aID != nil {
		m.Ayah = &model.Ayah{
			BaseID:        model.BaseID{ID: aID},
			Number:        aNumber,
			Page:          aPage,
			JuzNumber:     aJuz,
			SurahID:       aSurah,
			TranslationID: aTransID,
		}
		if atID != nil {
			m.Ayah.Translation = &model.Translation{
				BaseID: model.BaseID{ID: atID},
				Idn:    atIdn,
				En:     atEn,
				Ar:     atAr,
			}
		}
		if sID != nil {
			m.Ayah.Surah = &model.Surah{
				BaseID:         model.BaseID{ID: sID},
				Number:         sNumber,
				Slug:           sSlug,
				RevelationType: sRev,
				TranslationID:  sTransID,
			}
		}
	}

	return &m, nil
}

func (r *mufrodatRepo) execute(sqlStr string, args ...interface{}) ([]model.Mufrodat, error) {
	rows, err := r.db.Raw(sqlStr, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.Mufrodat
	for rows.Next() {
		item, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	return items, rows.Err()
}

func (r *mufrodatRepo) FindByAyahID(ayahID int) ([]model.Mufrodat, error) {
	sqlStr := fmt.Sprintf("%s WHERE m.ayah_id = ? ORDER BY m.word_index ASC", mufrodatSelectSQL)
	return r.execute(sqlStr, ayahID)
}

func (r *mufrodatRepo) FindBySurahNumber(surahNumber int) ([]model.Mufrodat, error) {
	sqlStr := fmt.Sprintf("%s WHERE s.number = ? ORDER BY a.number ASC, m.word_index ASC", mufrodatSelectSQL)
	return r.execute(sqlStr, surahNumber)
}

func (r *mufrodatRepo) FindBySurahAndAyahNumber(surahNumber, ayahNumber int) ([]model.Mufrodat, error) {
	sqlStr := fmt.Sprintf("%s WHERE s.number = ? AND a.number = ? ORDER BY m.word_index ASC", mufrodatSelectSQL)
	return r.execute(sqlStr, surahNumber, ayahNumber)
}

func (r *mufrodatRepo) FindByPage(pageNumber int) ([]model.Mufrodat, error) {
	sqlStr := fmt.Sprintf("%s WHERE a.page = ? ORDER BY a.surah_id ASC, a.number ASC, m.word_index ASC", mufrodatSelectSQL)
	return r.execute(sqlStr, pageNumber)
}

func (r *mufrodatRepo) FindByRootWord(rootWord string) ([]model.Mufrodat, error) {
	sqlStr := fmt.Sprintf("%s WHERE m.root_word ILIKE ? ORDER BY m.ayah_id ASC, m.word_index ASC", mufrodatSelectSQL)
	return r.execute(sqlStr, "%"+rootWord+"%")
}
