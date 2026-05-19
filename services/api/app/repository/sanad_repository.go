package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type SanadRepository interface {
	Save(*model.Sanad) (*model.Sanad, error)
	FindByID(*int) (*model.Sanad, error)
	FindByHadithID(*int) ([]model.Sanad, error)
	UpdateByID(*int, *model.Sanad) (*model.Sanad, error)
	DeleteByID(*int) error

	SaveMataSanad(*model.MataSanad) (*model.MataSanad, error)
	FindMataSanadByID(*int) (*model.MataSanad, error)
	UpdateMataSanad(*int, *model.MataSanad) (*model.MataSanad, error)
	DeleteMataSanad(*int) error
}

type sanadRepo struct {
	db *gorm.DB
}

func NewSanadRepository(db *gorm.DB) SanadRepository {
	return &sanadRepo{db}
}

func (r *sanadRepo) withMataSanad(db *gorm.DB) *gorm.DB {
	return db.
		Preload("MataSanad", func(db *gorm.DB) *gorm.DB {
			return db.Order("urutan ASC")
		}).
		Preload("MataSanad.Perawi")
}

func (r *sanadRepo) Save(s *model.Sanad) (*model.Sanad, error) {
	if err := r.db.Create(s).Error; err != nil {
		return nil, err
	}
	return s, nil
}

func (r *sanadRepo) FindByID(id *int) (*model.Sanad, error) {
	var s model.Sanad
	if err := r.withMataSanad(r.db).First(&s, id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *sanadRepo) FindByHadithID(hadithID *int) ([]model.Sanad, error) {
	var list []model.Sanad
	err := r.withMataSanad(r.db).
		Where("hadith_id = ?", hadithID).
		Order("nomor_jalur ASC").
		Find(&list).Error
	return list, err
}

func (r *sanadRepo) UpdateByID(id *int, s *model.Sanad) (*model.Sanad, error) {
	if _, err := r.FindByID(id); err != nil {
		return nil, err
	}
	s.ID = id
	if err := r.db.Updates(s).Error; err != nil {
		return nil, err
	}
	return s, nil
}

func (r *sanadRepo) DeleteByID(id *int) error {
	if _, err := r.FindByID(id); err != nil {
		return err
	}
	r.db.Where("sanad_id = ?", id).Delete(&model.MataSanad{})
	return r.db.Delete(&model.Sanad{}, id).Error
}

func (r *sanadRepo) SaveMataSanad(m *model.MataSanad) (*model.MataSanad, error) {
	if err := r.db.Create(m).Error; err != nil {
		return nil, err
	}
	if err := r.db.Preload("Perawi").First(m, m.ID).Error; err != nil {
		return nil, err
	}
	return m, nil
}

func (r *sanadRepo) FindMataSanadByID(id *int) (*model.MataSanad, error) {
	var m model.MataSanad
	if err := r.db.Preload("Perawi").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *sanadRepo) UpdateMataSanad(id *int, m *model.MataSanad) (*model.MataSanad, error) {
	if _, err := r.FindMataSanadByID(id); err != nil {
		return nil, err
	}
	m.ID = id
	if err := r.db.Updates(m).Error; err != nil {
		return nil, err
	}
	return m, nil
}

func (r *sanadRepo) DeleteMataSanad(id *int) error {
	if _, err := r.FindMataSanadByID(id); err != nil {
		return err
	}
	return r.db.Delete(&model.MataSanad{}, id).Error
}
