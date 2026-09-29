package repository

import (
	"database/sql"
	"fmt"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type MunasabahRepository interface {
	Save(*model.Munasabah) (*model.Munasabah, error)
	FindByAyahID(int) ([]model.Munasabah, error)
	Delete(int) error
}

type munasabahRepo struct{ db *gorm.DB }

func NewMunasabahRepository(db *gorm.DB) MunasabahRepository { return &munasabahRepo{db} }

const munasabahSelectSQL = `
	SELECT
		m.id, m.ayah_from_id, m.ayah_to_id, m.description,
		af.id, af.number, af.page, af.juz_number, af.surah_id, af.translation_id,
		aft.id, aft.idn, aft.en, aft.ar,
		sf.id, sf.number, sf.slug, sf.revelation_type, sf.translation_id,
		sft.id, sft.idn, sft.en, sft.ar,
		at.id, at.number, at.page, at.juz_number, at.surah_id, at.translation_id,
		att.id, att.idn, att.en, att.ar,
		st.id, st.number, st.slug, st.revelation_type, st.translation_id,
		stt.id, stt.idn, stt.en, stt.ar
	FROM munasabah m
	LEFT JOIN ayah af ON af.id = m.ayah_from_id
	LEFT JOIN translation aft ON aft.id = af.translation_id
	LEFT JOIN surah sf ON sf.id = af.surah_id
	LEFT JOIN translation sft ON sft.id = sf.translation_id
	LEFT JOIN ayah at ON at.id = m.ayah_to_id
	LEFT JOIN translation att ON att.id = at.translation_id
	LEFT JOIN surah st ON st.id = at.surah_id
	LEFT JOIN translation stt ON stt.id = st.translation_id
`

func (r *munasabahRepo) scanRow(rows *sql.Rows) (*model.Munasabah, error) {
	var (
		m                            model.Munasabah
		afID, afNumber, afPage, afJuz, afSurah, afTransID *int
		aftID                        *int
		aftIdn, aftEn, aftAr         *string
		sfID, sfNumber, sfTransID    *int
		sfSlug, sfRev                *string
		sftID                        *int
		sftIdn, sftEn, sftAr         *string
		atID, atNumber, atPage, atJuz, atSurah, atTransID *int
		attID                        *int
		attIdn, attEn, attAr         *string
		stID, stNumber, stTransID    *int
		stSlug, stRev                *string
		sttID                        *int
		sttIdn, sttEn, sttAr         *string
	)

	err := rows.Scan(
		&m.ID, &m.AyahFromID, &m.AyahToID, &m.Description,
		&afID, &afNumber, &afPage, &afJuz, &afSurah, &afTransID,
		&aftID, &aftIdn, &aftEn, &aftAr,
		&sfID, &sfNumber, &sfSlug, &sfRev, &sfTransID,
		&sftID, &sftIdn, &sftEn, &sftAr,
		&atID, &atNumber, &atPage, &atJuz, &atSurah, &atTransID,
		&attID, &attIdn, &attEn, &attAr,
		&stID, &stNumber, &stSlug, &stRev, &stTransID,
		&sttID, &sttIdn, &sttEn, &sttAr,
	)
	if err != nil {
		return nil, err
	}

	if afID != nil {
		m.AyahFrom = &model.Ayah{
			BaseID:        model.BaseID{ID: afID},
			Number:        afNumber,
			Page:          afPage,
			JuzNumber:     afJuz,
			SurahID:       afSurah,
			TranslationID: afTransID,
		}
		if aftID != nil {
			m.AyahFrom.Translation = &model.Translation{BaseID: model.BaseID{ID: aftID}, Idn: aftIdn, En: aftEn, Ar: aftAr}
		}
		if sfID != nil {
			m.AyahFrom.Surah = &model.Surah{
				BaseID:         model.BaseID{ID: sfID},
				Number:         sfNumber,
				Slug:           sfSlug,
				RevelationType: sfRev,
				TranslationID:  sfTransID,
			}
			if sftID != nil {
				m.AyahFrom.Surah.Translation = &model.Translation{BaseID: model.BaseID{ID: sftID}, Idn: sftIdn, En: sftEn, Ar: sftAr}
			}
		}
	}

	if atID != nil {
		m.AyahTo = &model.Ayah{
			BaseID:        model.BaseID{ID: atID},
			Number:        atNumber,
			Page:          atPage,
			JuzNumber:     atJuz,
			SurahID:       atSurah,
			TranslationID: atTransID,
		}
		if attID != nil {
			m.AyahTo.Translation = &model.Translation{BaseID: model.BaseID{ID: attID}, Idn: attIdn, En: attEn, Ar: attAr}
		}
		if stID != nil {
			m.AyahTo.Surah = &model.Surah{
				BaseID:         model.BaseID{ID: stID},
				Number:         stNumber,
				Slug:           stSlug,
				RevelationType: stRev,
				TranslationID:  stTransID,
			}
			if sttID != nil {
				m.AyahTo.Surah.Translation = &model.Translation{BaseID: model.BaseID{ID: sttID}, Idn: sttIdn, En: sttEn, Ar: sttAr}
			}
		}
	}

	return &m, nil
}

func (r *munasabahRepo) Save(m *model.Munasabah) (*model.Munasabah, error) {
	if err := r.db.Create(m).Error; err != nil {
		return nil, err
	}
	return m, nil
}

func (r *munasabahRepo) FindByAyahID(ayahID int) ([]model.Munasabah, error) {
	sqlStr := fmt.Sprintf("%s WHERE m.ayah_from_id = ? OR m.ayah_to_id = ? ORDER BY m.id ASC", munasabahSelectSQL)
	rows, err := r.db.Raw(sqlStr, ayahID, ayahID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.Munasabah
	for rows.Next() {
		m, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *m)
	}
	return items, rows.Err()
}

func (r *munasabahRepo) Delete(id int) error {
	return r.db.Delete(&model.Munasabah{}, id).Error
}