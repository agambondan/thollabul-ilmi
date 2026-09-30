package repository

import (
	"database/sql"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type PerawiRepository interface {
	Save(*model.Perawi) (*model.Perawi, error)
	FindAll(*fiber.Ctx) *paginate.Page
	FindByID(*int) (*model.Perawi, error)
	FindByTabaqah(*fiber.Ctx, string) *paginate.Page
	Search(*fiber.Ctx, string) *paginate.Page
	FindGuru(*int) ([]model.Perawi, error)
	FindMurid(*int) ([]model.Perawi, error)
	FindHadiths(*fiber.Ctx, *int) *paginate.Page
	UpdateByID(*int, *model.Perawi) (*model.Perawi, error)
	DeleteByID(*int) error
	Count() (*int64, error)
}

type perawiRepo struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewPerawiRepository(db *gorm.DB, pg *paginate.Pagination) PerawiRepository {
	return &perawiRepo{db, pg}
}

const perawiSelectSQL = `
	SELECT
		p.id, p.nama_arab, p.nama_latin, p.nama_lengkap, p.kunyah, p.laqab, p.nisbah,
		p.tahun_lahir, p.tahun_wafat, p.tahun_hijri, p.tempat_lahir, p.tempat_wafat,
		p.tabaqah, p.status, p.biografis, p.translation_id,
		t.id, t.idn, t.en, t.ar
	FROM perawi p
	LEFT JOIN translation t ON t.id = p.translation_id AND t.deleted_at IS NULL
`

func scanPerawiRow(rows *sql.Rows) (*model.Perawi, error) {
	var (
		p                                   model.Perawi
		pID                                 *int
		pNamaArab, pNamaLatin, pNamaLengkap *string
		pKunyah, pLaqab, pNisbah            *string
		pThnLahir, pThnWafat                *int
		pThnHijri                           *bool
		pTmpLahir, pTmpWafat                *string
		pTabaqah, pStatus, pBio             *string
		pTransID                            *int
		tID                                 *int
		tIdn, tEn, tAr                      *string
	)

	err := rows.Scan(
		&pID, &pNamaArab, &pNamaLatin, &pNamaLengkap, &pKunyah, &pLaqab, &pNisbah,
		&pThnLahir, &pThnWafat, &pThnHijri, &pTmpLahir, &pTmpWafat,
		&pTabaqah, &pStatus, &pBio, &pTransID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return nil, err
	}

	p.BaseID = model.BaseID{ID: pID}
	p.NamaArab = pNamaArab
	p.NamaLatin = pNamaLatin
	p.NamaLengkap = pNamaLengkap
	p.Kunyah = pKunyah
	p.Laqab = pLaqab
	p.Nisbah = pNisbah
	p.TahunLahir = pThnLahir
	p.TahunWafat = pThnWafat
	p.TahunHijri = pThnHijri
	p.TempatLahir = pTmpLahir
	p.TempatWafat = pTmpWafat
	p.Tabaqah = pTabaqah
	p.Status = pStatus
	p.Biografis = pBio
	p.TranslationID = pTransID

	if tID != nil {
		p.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}

	return &p, nil
}

func (r *perawiRepo) withListJoins(db *gorm.DB) *gorm.DB {
	return db.Joins("Translation")
}

func (r *perawiRepo) Save(p *model.Perawi) (*model.Perawi, error) {
	if err := r.db.Create(p).Error; err != nil {
		return nil, err
	}
	return p, nil
}

func (r *perawiRepo) FindAll(ctx *fiber.Ctx) *paginate.Page {
	var list []model.Perawi
	mod := r.withListJoins(r.db.Model(&model.Perawi{})).Order("id")
	page := r.pg.With(mod).Request(ctx.Request()).Response(&list)
	return &page
}

func (r *perawiRepo) FindByID(id *int) (*model.Perawi, error) {
	rows, err := r.db.Raw(perawiSelectSQL+" WHERE p.id = ? AND p.deleted_at IS NULL", id).Rows()
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
	p, err := scanPerawiRow(rows)
	if err != nil {
		return nil, err
	}
	rows.Close()

	guru, err := r.FindGuru(id)
	if err == nil {
		p.Guru = guru
	}

	murid, err := r.FindMurid(id)
	if err == nil {
		p.Murid = murid
	}

	jtRows, err := r.db.Raw(jarhTadilSelectSQL+" WHERE jt.perawi_id = ? AND jt.deleted_at IS NULL ORDER BY jt.id ASC", id).Rows()
	if err == nil {
		defer jtRows.Close()
		for jtRows.Next() {
			jt, err := scanJarhTadilRow(jtRows)
			if err == nil && jt != nil {
				p.JarhTadil = append(p.JarhTadil, *jt)
			}
		}
	}

	return p, nil
}

func (r *perawiRepo) FindByTabaqah(ctx *fiber.Ctx, tabaqah string) *paginate.Page {
	var list []model.Perawi
	mod := r.withListJoins(r.db.Model(&model.Perawi{})).Where("tabaqah = ?", tabaqah).Order("id")
	page := r.pg.With(mod).Request(ctx.Request()).Response(&list)
	return &page
}

func (r *perawiRepo) Search(ctx *fiber.Ctx, q string) *paginate.Page {
	var list []model.Perawi
	like := "%" + q + "%"
	mod := r.withListJoins(r.db.Model(&model.Perawi{})).
		Where("nama_latin ILIKE ? OR nama_arab ILIKE ? OR nama_lengkap ILIKE ?", like, like, like).
		Order("id")
	page := r.pg.With(mod).Request(ctx.Request()).Response(&list)
	return &page
}

func (r *perawiRepo) FindGuru(id *int) ([]model.Perawi, error) {
	query := perawiSelectSQL + `
		JOIN perawi_guru pg ON pg.guru_id = p.id
		WHERE pg.murid_id = ? AND p.deleted_at IS NULL
		ORDER BY p.id ASC
	`
	rows, err := r.db.Raw(query, id).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.Perawi
	for rows.Next() {
		p, err := scanPerawiRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *p)
	}
	return list, rows.Err()
}

func (r *perawiRepo) FindMurid(id *int) ([]model.Perawi, error) {
	query := perawiSelectSQL + `
		JOIN perawi_guru pg ON pg.murid_id = p.id
		WHERE pg.guru_id = ? AND p.deleted_at IS NULL
		ORDER BY p.id ASC
	`
	rows, err := r.db.Raw(query, id).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.Perawi
	for rows.Next() {
		p, err := scanPerawiRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *p)
	}
	return list, rows.Err()
}

func (r *perawiRepo) FindHadiths(ctx *fiber.Ctx, id *int) *paginate.Page {
	var hadiths []model.Hadith
	p, err := r.FindByID(id)
	query := r.db.Model(&model.Hadith{}).
		Joins("Book").Joins("Book.Translation").
		Joins("Translation")
	if err == nil && p != nil && p.NamaLatin != nil && *p.NamaLatin != "" {
		like := "%" + *p.NamaLatin + "%"
		query = query.Where("(hadith.id IN (SELECT DISTINCT sanad.hadith_id FROM sanad JOIN mata_sanad ON mata_sanad.sanad_id = sanad.id AND mata_sanad.deleted_at IS NULL WHERE mata_sanad.perawi_id = ? AND sanad.deleted_at IS NULL) OR hadith.sanad ILIKE ?)", *id, like)
	} else {
		query = query.Where("hadith.id IN (SELECT DISTINCT sanad.hadith_id FROM sanad JOIN mata_sanad ON mata_sanad.sanad_id = sanad.id AND mata_sanad.deleted_at IS NULL WHERE mata_sanad.perawi_id = ? AND sanad.deleted_at IS NULL)", *id)
	}
	query = query.Order("hadith.id ASC")
	page := r.pg.With(query).Request(ctx.Request()).Response(&hadiths)
	return &page
}

func (r *perawiRepo) UpdateByID(id *int, p *model.Perawi) (*model.Perawi, error) {
	if _, err := r.FindByID(id); err != nil {
		return nil, err
	}
	p.ID = id
	if err := r.db.Updates(p).Error; err != nil {
		return nil, err
	}
	return p, nil
}

func (r *perawiRepo) DeleteByID(id *int) error {
	if _, err := r.FindByID(id); err != nil {
		return err
	}
	return r.db.Delete(&model.Perawi{}, id).Error
}

func (r *perawiRepo) Count() (*int64, error) {
	var count int64
	r.db.Model(&model.Perawi{}).Count(&count)
	return &count, nil
}
