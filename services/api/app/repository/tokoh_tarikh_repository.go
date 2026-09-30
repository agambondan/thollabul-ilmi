package repository

import (
	"database/sql"
	"strings"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type TokohTarikhRepository interface {
	Save(*model.TokohTarikh) (*model.TokohTarikh, error)
	Update(id int, t *model.TokohTarikh) (*model.TokohTarikh, error)
	FindAll(search, era, kategori string, limit, offset int) ([]model.TokohTarikh, int64, error)
	FindByID(int) (*model.TokohTarikh, error)
	Delete(int) error
}

type tokohTarikhRepo struct{ db *gorm.DB }

func NewTokohTarikhRepository(db *gorm.DB) TokohTarikhRepository { return &tokohTarikhRepo{db} }

const tokohTarikhSelectSQL = `
	SELECT
		tt.id, tt.nama, tt.era, tt.tahun_lahir, tt.tahun_wafat, tt.biografi, tt.kontribusi, tt.kategori, tt.image_url, tt.source, tt.translation_id,
		t.id, t.idn, t.en, t.ar
	FROM tokoh_tarikh tt
	LEFT JOIN translation t ON t.id = tt.translation_id AND t.deleted_at IS NULL
`

func scanTokohTarikhRow(rows *sql.Rows) (*model.TokohTarikh, error) {
	var (
		tt                                       model.TokohTarikh
		ttID, ttTransID                          *int
		ttNama, ttEra, ttThnLahir, ttThnWafat    *string
		ttBio, ttKontribusi, ttKat, ttImg, ttSrc *string
		tID                                      *int
		tIdn, tEn, tAr                           *string
	)

	err := rows.Scan(
		&ttID, &ttNama, &ttEra, &ttThnLahir, &ttThnWafat, &ttBio, &ttKontribusi, &ttKat, &ttImg, &ttSrc, &ttTransID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return nil, err
	}

	tt.BaseID = model.BaseID{ID: ttID}
	if ttNama != nil {
		tt.Nama = *ttNama
	}
	if ttEra != nil {
		tt.Era = *ttEra
	}
	if ttThnLahir != nil {
		tt.TahunLahir = *ttThnLahir
	}
	if ttThnWafat != nil {
		tt.TahunWafat = *ttThnWafat
	}
	if ttBio != nil {
		tt.Biografi = *ttBio
	}
	if ttKontribusi != nil {
		tt.Kontribusi = *ttKontribusi
	}
	if ttKat != nil {
		tt.Kategori = *ttKat
	}
	if ttImg != nil {
		tt.ImageURL = *ttImg
	}
	if ttSrc != nil {
		tt.Source = *ttSrc
	}
	tt.TranslationID = ttTransID

	if tID != nil {
		tt.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}

	return &tt, nil
}

func (r *tokohTarikhRepo) Save(t *model.TokohTarikh) (*model.TokohTarikh, error) {
	if err := r.db.Create(t).Error; err != nil {
		return nil, err
	}
	return t, nil
}

func (r *tokohTarikhRepo) Update(id int, t *model.TokohTarikh) (*model.TokohTarikh, error) {
	if err := r.db.Model(&model.TokohTarikh{}).Where("id = ?", id).Updates(t).Error; err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *tokohTarikhRepo) FindAll(search, era, kategori string, limit, offset int) ([]model.TokohTarikh, int64, error) {
	var total int64
	countQuery := r.db.Model(&model.TokohTarikh{})
	if search != "" {
		q := "%" + search + "%"
		countQuery = countQuery.Where("nama ILIKE ? OR biografi ILIKE ?", q, q)
	}
	if era != "" {
		countQuery = countQuery.Where("era = ?", era)
	}
	if kategori != "" {
		countQuery = countQuery.Where("kategori = ?", kategori)
	}
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	query := tokohTarikhSelectSQL
	conditions := []string{"tt.deleted_at IS NULL"}
	var args []interface{}

	if search != "" {
		q := "%" + search + "%"
		conditions = append(conditions, "(tt.nama ILIKE ? OR tt.biografi ILIKE ?)")
		args = append(args, q, q)
	}
	if era != "" {
		conditions = append(conditions, "tt.era = ?")
		args = append(args, era)
	}
	if kategori != "" {
		conditions = append(conditions, "tt.kategori = ?")
		args = append(args, kategori)
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY tt.id ASC"
	if limit > 0 {
		query += " LIMIT ? OFFSET ?"
		args = append(args, limit, offset)
	}

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []model.TokohTarikh
	for rows.Next() {
		item, err := scanTokohTarikhRow(rows)
		if err != nil {
			return nil, 0, err
		}
		list = append(list, *item)
	}
	return list, total, rows.Err()
}

func (r *tokohTarikhRepo) FindByID(id int) (*model.TokohTarikh, error) {
	rows, err := r.db.Raw(tokohTarikhSelectSQL+" WHERE tt.id = ? AND tt.deleted_at IS NULL", id).Rows()
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
	return scanTokohTarikhRow(rows)
}

func (r *tokohTarikhRepo) Delete(id int) error {
	return r.db.Delete(&model.TokohTarikh{}, id).Error
}
