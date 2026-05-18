package repository

import (
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

func (r *perawiRepo) withRelations(db *gorm.DB) *gorm.DB {
	return db.Preload("JarhTadil").Preload("JarhTadil.Penilai").Preload("Translation")
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
	var p model.Perawi
	if err := r.withRelations(r.db).
		Preload("Guru").Preload("Murid").
		First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
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
	var list []model.Perawi
	err := r.db.Joins("JOIN perawi_guru ON perawi_guru.guru_id = perawi.id").
		Where("perawi_guru.murid_id = ?", id).Find(&list).Error
	return list, err
}

func (r *perawiRepo) FindMurid(id *int) ([]model.Perawi, error) {
	var list []model.Perawi
	err := r.db.Joins("JOIN perawi_guru ON perawi_guru.murid_id = perawi.id").
		Where("perawi_guru.guru_id = ?", id).Find(&list).Error
	return list, err
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
