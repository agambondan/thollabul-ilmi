package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type RadioIslamicRepository interface {
	Save(*model.RadioIslamic) (*model.RadioIslamic, error)
	Update(int, *model.RadioIslamic) (*model.RadioIslamic, error)
	FindAll(search, city, province string, limit, offset int) ([]model.RadioIslamic, int64, error)
	FindByID(int) (*model.RadioIslamic, error)
	Delete(int) error
}

type radioIslamicRepo struct{ db *gorm.DB }

func NewRadioIslamicRepository(db *gorm.DB) RadioIslamicRepository {
	return &radioIslamicRepo{db}
}

func (r *radioIslamicRepo) Save(rad *model.RadioIslamic) (*model.RadioIslamic, error) {
	if err := r.db.Create(rad).Error; err != nil {
		return nil, err
	}
	return rad, nil
}

func (r *radioIslamicRepo) Update(id int, rad *model.RadioIslamic) (*model.RadioIslamic, error) {
	err := r.db.Model(&model.RadioIslamic{}).Where("id = ?", id).
		Select("Name", "Frequency", "City", "Province", "StreamURL", "Description", "LogoURL", "Website", "IsActive", "Tags").
		Updates(rad).Error
	if err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *radioIslamicRepo) FindAll(search, city, province string, limit, offset int) ([]model.RadioIslamic, int64, error) {
	var list []model.RadioIslamic
	var total int64
	query := r.db.Model(&model.RadioIslamic{}).Where("is_active = ?", true)

	if search != "" {
		q := "%" + search + "%"
		query = query.Where("name ILIKE ? OR frequency ILIKE ? OR description ILIKE ? OR tags ILIKE ?", q, q, q, q)
	}
	if city != "" {
		query = query.Where("city ILIKE ?", "%"+city+"%")
	}
	if province != "" {
		query = query.Where("province ILIKE ?", "%"+province+"%")
	}

	query.Count(&total)
	err := query.Order("city asc, frequency asc, name asc").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *radioIslamicRepo) FindByID(id int) (*model.RadioIslamic, error) {
	var rad model.RadioIslamic
	err := r.db.First(&rad, id).Error
	if err != nil {
		return nil, err
	}
	return &rad, nil
}

func (r *radioIslamicRepo) Delete(id int) error {
	return r.db.Delete(&model.RadioIslamic{}, id).Error
}
