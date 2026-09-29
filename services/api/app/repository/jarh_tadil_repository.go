package repository

import (
	"database/sql"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type JarhTadilRepository interface {
	Save(*model.JarhTadil) (*model.JarhTadil, error)
	FindAll(limit, offset int) ([]model.JarhTadil, error)
	FindByID(*int) (*model.JarhTadil, error)
	FindByPerawiID(*int) ([]model.JarhTadil, error)
	UpdateByID(*int, *model.JarhTadil) (*model.JarhTadil, error)
	DeleteByID(*int) error
}

type jarhTadilRepo struct {
	db *gorm.DB
}

func NewJarhTadilRepository(db *gorm.DB) JarhTadilRepository {
	return &jarhTadilRepo{db}
}

const jarhTadilSelectSQL = `
	SELECT
		jt.id, jt.perawi_id, jt.penilai_id, jt.jenis_nilai, jt.tingkat, jt.teks_nilai, jt.sumber, jt.halaman, jt.catatan, jt.translation_id,
		p.id, p.nama_arab, p.nama_latin, p.nama_lengkap, p.kunyah, p.laqab, p.nisbah,
		p.tahun_lahir, p.tahun_wafat, p.tahun_hijri, p.tempat_lahir, p.tempat_wafat,
		p.tabaqah, p.status, p.biografis, p.translation_id,
		pen.id, pen.nama_arab, pen.nama_latin, pen.nama_lengkap, pen.kunyah, pen.laqab, pen.nisbah,
		pen.tahun_lahir, pen.tahun_wafat, pen.tahun_hijri, pen.tempat_lahir, pen.tempat_wafat,
		pen.tabaqah, pen.status, pen.biografis, pen.translation_id,
		t.id, t.idn, t.en, t.ar
	FROM jarh_tadil jt
	LEFT JOIN perawi p ON p.id = jt.perawi_id
	LEFT JOIN perawi pen ON pen.id = jt.penilai_id
	LEFT JOIN translation t ON t.id = jt.translation_id
`

func scanJarhTadilRow(rows *sql.Rows) (*model.JarhTadil, error) {
	var (
		j                                         model.JarhTadil
		pID, penID                                *int
		pNamaArab, pNamaLatin, pNamaLengkap       *string
		pKunyah, pLaqab, pNisbah                  *string
		pThnLahir, pThnWafat                      *int
		pThnHijri                                 *bool
		pTmpLahir, pTmpWafat                      *string
		pTabaqah, pStatus, pBio                   *string
		pTransID                                  *int
		penNamaArab, penNamaLatin, penNamaLengkap *string
		penKunyah, penLaqab, penNisbah            *string
		penThnLahir, penThnWafat                  *int
		penThnHijri                               *bool
		penTmpLahir, penTmpWafat                  *string
		penTabaqah, penStatus, penBio             *string
		penTransID                                *int
		tID                                       *int
		tIdn, tEn, tAr                            *string
	)

	err := rows.Scan(
		&j.ID, &j.PerawiID, &j.PenilaiID, &j.JenisNilai, &j.Tingkat, &j.TeksNilai, &j.Sumber, &j.Halaman, &j.Catatan, &j.TranslationID,
		&pID, &pNamaArab, &pNamaLatin, &pNamaLengkap, &pKunyah, &pLaqab, &pNisbah,
		&pThnLahir, &pThnWafat, &pThnHijri, &pTmpLahir, &pTmpWafat,
		&pTabaqah, &pStatus, &pBio, &pTransID,
		&penID, &penNamaArab, &penNamaLatin, &penNamaLengkap, &penKunyah, &penLaqab, &penNisbah,
		&penThnLahir, &penThnWafat, &penThnHijri, &penTmpLahir, &penTmpWafat,
		&penTabaqah, &penStatus, &penBio, &penTransID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return nil, err
	}

	if pID != nil {
		j.Perawi = &model.Perawi{
			BaseID:        model.BaseID{ID: pID},
			NamaArab:      pNamaArab,
			NamaLatin:     pNamaLatin,
			NamaLengkap:   pNamaLengkap,
			Kunyah:        pKunyah,
			Laqab:         pLaqab,
			Nisbah:        pNisbah,
			TahunLahir:    pThnLahir,
			TahunWafat:    pThnWafat,
			TahunHijri:    pThnHijri,
			TempatLahir:   pTmpLahir,
			TempatWafat:   pTmpWafat,
			Tabaqah:       pTabaqah,
			Status:        pStatus,
			Biografis:     pBio,
			TranslationID: pTransID,
		}
	}

	if penID != nil {
		j.Penilai = &model.Perawi{
			BaseID:        model.BaseID{ID: penID},
			NamaArab:      penNamaArab,
			NamaLatin:     penNamaLatin,
			NamaLengkap:   penNamaLengkap,
			Kunyah:        penKunyah,
			Laqab:         penLaqab,
			Nisbah:        penNisbah,
			TahunLahir:    penThnLahir,
			TahunWafat:    penThnWafat,
			TahunHijri:    penThnHijri,
			TempatLahir:   penTmpLahir,
			TempatWafat:   penTmpWafat,
			Tabaqah:       penTabaqah,
			Status:        penStatus,
			Biografis:     penBio,
			TranslationID: penTransID,
		}
	}

	if tID != nil {
		j.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}

	return &j, nil
}

func (r *jarhTadilRepo) scanRow(rows *sql.Rows) (*model.JarhTadil, error) {
	return scanJarhTadilRow(rows)
}

func (r *jarhTadilRepo) Save(j *model.JarhTadil) (*model.JarhTadil, error) {
	if err := r.db.Create(j).Error; err != nil {
		return nil, err
	}
	return j, nil
}

func (r *jarhTadilRepo) FindAll(limit, offset int) ([]model.JarhTadil, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	rows, err := r.db.Raw(jarhTadilSelectSQL+" ORDER BY jt.id ASC LIMIT ? OFFSET ?", limit, offset).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.JarhTadil
	for rows.Next() {
		item, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *item)
	}
	return list, rows.Err()
}

func (r *jarhTadilRepo) FindByID(id *int) (*model.JarhTadil, error) {
	rows, err := r.db.Raw(jarhTadilSelectSQL+" WHERE jt.id = ?", id).Rows()
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
	return r.scanRow(rows)
}

func (r *jarhTadilRepo) FindByPerawiID(perawiID *int) ([]model.JarhTadil, error) {
	rows, err := r.db.Raw(jarhTadilSelectSQL+" WHERE jt.perawi_id = ? ORDER BY jt.id ASC", perawiID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.JarhTadil
	for rows.Next() {
		item, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *item)
	}
	return list, rows.Err()
}

func (r *jarhTadilRepo) UpdateByID(id *int, j *model.JarhTadil) (*model.JarhTadil, error) {
	if _, err := r.FindByID(id); err != nil {
		return nil, err
	}
	j.ID = id
	if err := r.db.Updates(j).Error; err != nil {
		return nil, err
	}
	return j, nil
}

func (r *jarhTadilRepo) DeleteByID(id *int) error {
	if _, err := r.FindByID(id); err != nil {
		return err
	}
	return r.db.Delete(&model.JarhTadil{}, id).Error
}
