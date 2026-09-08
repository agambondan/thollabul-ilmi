package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type HadithAyahRepository interface {
	Save(*model.HadithAyah) (*model.HadithAyah, error)
	FindByHadithID(int) ([]model.HadithAyah, error)
	FindByAyahID(int) ([]model.HadithAyah, error)
	Delete(int) error
}

type hadithAyahRepo struct {
	db *gorm.DB
}

func NewHadithAyahRepository(db *gorm.DB) HadithAyahRepository {
	return &hadithAyahRepo{db}
}

func (r *hadithAyahRepo) Save(ha *model.HadithAyah) (*model.HadithAyah, error) {
	if err := r.db.Create(ha).Error; err != nil {
		return nil, err
	}
	return ha, nil
}

func (r *hadithAyahRepo) FindByHadithID(hadithID int) ([]model.HadithAyah, error) {
	var items []model.HadithAyah
	err := r.db.
		Preload("Ayah").Preload("Ayah.Translation").Preload("Ayah.Surah").
		Where("hadith_id = ?", hadithID).
		Order("ayah_id asc").
		Find(&items).Error
	return items, err
}

func (r *hadithAyahRepo) FindByAyahID(ayahID int) ([]model.HadithAyah, error) {
	var items []model.HadithAyah
	err := r.db.
		Preload("Hadith").Preload("Hadith.Translation").
		Preload("Hadith.Book").Preload("Hadith.Book.Translation").
		Where("ayah_id = ?", ayahID).
		Order("hadith_id asc").
		Find(&items).Error
	return items, err
}

func (r *hadithAyahRepo) Delete(id int) error {
	return r.db.Delete(&model.HadithAyah{}, id).Error
}
