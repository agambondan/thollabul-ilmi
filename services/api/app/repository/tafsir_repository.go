package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type TafsirRepository interface {
	FindByAyahID(int) (*model.Tafsir, error)
	FindBySurahNumber(int, int, int) ([]model.Tafsir, error)
	Search(string, int, int) ([]model.Tafsir, error)
	Save(*model.Tafsir) (*model.Tafsir, error)
	UpdateByAyahID(int, *model.Tafsir) (*model.Tafsir, error)
}

type tafsirRepo struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewTafsirRepository(db *gorm.DB, pg *paginate.Pagination) TafsirRepository {
	return &tafsirRepo{db, pg}
}

func (r *tafsirRepo) FindByAyahID(ayahID int) (*model.Tafsir, error) {
	var t model.Tafsir
	err := r.db.
		Preload("KemenagTranslation").
		Preload("IbnuKatsirTranslation").
		Preload("IbnuKatsirEnTranslation").
		Preload("Ayah").Preload("Ayah.Translation").Preload("Ayah.Surah").
		Where("ayah_id = ?", ayahID).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *tafsirRepo) FindBySurahNumber(surahNumber, limit, offset int) ([]model.Tafsir, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	var list []model.Tafsir
	err := r.db.
		Preload("KemenagTranslation").
		Preload("IbnuKatsirTranslation").
		Preload("IbnuKatsirEnTranslation").
		Preload("Ayah").Preload("Ayah.Translation").
		Joins("JOIN ayah ON ayah.id = tafsir.ayah_id").
		Joins("JOIN surah ON surah.id = ayah.surah_id").
		Where("surah.number = ?", surahNumber).
		Order("ayah.number asc").
		Limit(limit).
		Offset(offset).
		Find(&list).Error
	return list, err
}

func (r *tafsirRepo) Save(t *model.Tafsir) (*model.Tafsir, error) {
	if err := r.db.Create(t).Error; err != nil {
		return nil, err
	}
	return t, nil
}

func (r *tafsirRepo) UpdateByAyahID(ayahID int, t *model.Tafsir) (*model.Tafsir, error) {
	if err := r.db.Model(&model.Tafsir{}).Where("ayah_id = ?", ayahID).Updates(t).Error; err != nil {
		return nil, err
	}
	return r.FindByAyahID(ayahID)
}

func (r *tafsirRepo) Search(query string, limit, offset int) ([]model.Tafsir, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var list []model.Tafsir
	err := r.db.
		Preload("KemenagTranslation").
		Preload("IbnuKatsirTranslation").
		Preload("IbnuKatsirEnTranslation").
		Preload("Ayah").Preload("Ayah.Translation").Preload("Ayah.Surah").
		Joins("LEFT JOIN translation AS kemenag_t ON kemenag_t.id = tafsir.kemenag_translation_id").
		Joins("LEFT JOIN translation AS ibnu_katsir_t ON ibnu_katsir_t.id = tafsir.ibnu_katsir_translation_id").
		Where("kemenag_t.idn ILIKE ? OR kemenag_t.en ILIKE ? OR ibnu_katsir_t.idn ILIKE ? OR ibnu_katsir_t.en ILIKE ?",
			"%"+query+"%", "%"+query+"%", "%"+query+"%", "%"+query+"%").
		Limit(limit).
		Offset(offset).
		Find(&list).Error
	return list, err
}
