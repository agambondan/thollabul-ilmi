package repository

import (
	"database/sql"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type TakhrijRepository interface {
	Save(*model.Takhrij) (*model.Takhrij, error)
	FindAll() ([]model.Takhrij, error)
	FindByID(*int) (*model.Takhrij, error)
	FindByHadithID(*int) ([]model.Takhrij, error)
	UpdateByID(*int, *model.Takhrij) (*model.Takhrij, error)
	DeleteByID(*int) error
}

type takhrijRepo struct {
	db *gorm.DB
}

func NewTakhrijRepository(db *gorm.DB) TakhrijRepository {
	return &takhrijRepo{db}
}

const takhrijSelectSQL = `
	SELECT
		t.id, t.hadith_id, t.book_id, t.nomor_hadis_kitab, t.halaman, t.jilid, t.catatan,
		b.id, b.slug, b.default_language, b.translation_id,
		bt.id, bt.idn, bt.en, bt.ar
	FROM takhrij t
	LEFT JOIN book b ON b.id = t.book_id
	LEFT JOIN translation bt ON bt.id = b.translation_id
`

func (r *takhrijRepo) scanRow(rows *sql.Rows) (*model.Takhrij, error) {
	var (
		t                                  model.Takhrij
		tID, tHadithID, tBookID            *int
		tNomor, tHalaman, tJilid, tCatatan *string
		bID, bTransID                      *int
		bSlug, bLang                       *string
		btID                               *int
		btIdn, btEn, btAr                  *string
	)

	err := rows.Scan(
		&tID, &tHadithID, &tBookID, &tNomor, &tHalaman, &tJilid, &tCatatan,
		&bID, &bSlug, &bLang, &bTransID,
		&btID, &btIdn, &btEn, &btAr,
	)
	if err != nil {
		return nil, err
	}

	t.BaseID = model.BaseID{ID: tID}
	t.HadithID = tHadithID
	t.BookID = tBookID
	t.NomorHadisKitab = tNomor
	t.Halaman = tHalaman
	t.Jilid = tJilid
	t.Catatan = tCatatan

	if bID != nil {
		t.Book = &model.Book{
			BaseID:          model.BaseID{ID: bID},
			Slug:            bSlug,
			DefaultLanguage: bLang,
			TranslationID:   bTransID,
		}
		if btID != nil {
			t.Book.Translation = &model.Translation{
				BaseID: model.BaseID{ID: btID},
				Idn:    btIdn,
				En:     btEn,
				Ar:     btAr,
			}
		}
	}

	return &t, nil
}

func (r *takhrijRepo) Save(t *model.Takhrij) (*model.Takhrij, error) {
	if err := r.db.Create(t).Error; err != nil {
		return nil, err
	}
	return t, nil
}

func (r *takhrijRepo) FindAll() ([]model.Takhrij, error) {
	rows, err := r.db.Raw(takhrijSelectSQL + " ORDER BY t.hadith_id ASC, t.id ASC LIMIT 500").Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.Takhrij
	for rows.Next() {
		item, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *item)
	}
	return list, rows.Err()
}

func (r *takhrijRepo) FindByID(id *int) (*model.Takhrij, error) {
	rows, err := r.db.Raw(takhrijSelectSQL+" WHERE t.id = ?", id).Rows()
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

func (r *takhrijRepo) FindByHadithID(hadithID *int) ([]model.Takhrij, error) {
	rows, err := r.db.Raw(takhrijSelectSQL+" WHERE t.hadith_id = ? ORDER BY t.id ASC", hadithID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.Takhrij
	for rows.Next() {
		item, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *item)
	}
	return list, rows.Err()
}

func (r *takhrijRepo) UpdateByID(id *int, t *model.Takhrij) (*model.Takhrij, error) {
	if _, err := r.FindByID(id); err != nil {
		return nil, err
	}
	t.ID = id
	if err := r.db.Updates(t).Error; err != nil {
		return nil, err
	}
	return t, nil
}

func (r *takhrijRepo) DeleteByID(id *int) error {
	if _, err := r.FindByID(id); err != nil {
		return err
	}
	return r.db.Delete(&model.Takhrij{}, id).Error
}
