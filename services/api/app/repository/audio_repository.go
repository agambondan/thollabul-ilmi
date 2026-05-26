package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type AudioRepository interface {
	FindSurahAudioBySurahID(int) ([]model.SurahAudio, error)
	FindAyahAudioByAyahID(int) ([]model.AyahAudio, error)
	SaveSurahAudio(*model.SurahAudio) (*model.SurahAudio, error)
	SaveAyahAudio(*model.AyahAudio) (*model.AyahAudio, error)
	DeleteSurahAudio(int) error
	DeleteAyahAudio(int) error
}

type audioRepo struct {
	db *gorm.DB
}

func NewAudioRepository(db *gorm.DB) AudioRepository {
	return &audioRepo{db}
}

func (r *audioRepo) resolveSurahAudioID(surahID int) (int, error) {
	var surah struct {
		ID int
	}
	if err := r.db.Model(&model.Surah{}).
		Select("id").
		Where("number = ?", surahID).
		Limit(1).
		Scan(&surah).Error; err != nil {
		return 0, err
	}
	if surah.ID > 0 {
		return surah.ID, nil
	}
	return surahID, nil
}

func (r *audioRepo) FindSurahAudioBySurahID(surahID int) ([]model.SurahAudio, error) {
	resolvedSurahID, err := r.resolveSurahAudioID(surahID)
	if err != nil {
		return nil, err
	}

	var firstAyah struct {
		ID int
	}
	if err := r.db.Model(&model.Ayah{}).
		Select("id").
		Where("surah_id = ?", resolvedSurahID).
		Order("number ASC").
		Limit(1).
		Scan(&firstAyah).Error; err != nil {
		return nil, err
	}

	if firstAyah.ID > 0 {
		var ayahAudio []model.AyahAudio
		if err := r.db.Where("ayah_id = ?", firstAyah.ID).
			Order("qari_name ASC").
			Find(&ayahAudio).Error; err != nil {
			return nil, err
		}
		if len(ayahAudio) > 0 {
			list := make([]model.SurahAudio, 0, len(ayahAudio))
			for _, item := range ayahAudio {
				surahIDValue := resolvedSurahID
				list = append(list, model.SurahAudio{
					SurahID:  &surahIDValue,
					QariName: item.QariName,
					QariSlug: item.QariSlug,
					AudioURL: item.AudioURL,
				})
			}
			return list, nil
		}
	}

	var list []model.SurahAudio
	err = r.db.Where("surah_id = ?", resolvedSurahID).Find(&list).Error
	return list, err
}

func (r *audioRepo) FindAyahAudioByAyahID(ayahID int) ([]model.AyahAudio, error) {
	var list []model.AyahAudio
	err := r.db.Where("ayah_id = ?", ayahID).Find(&list).Error
	return list, err
}

func (r *audioRepo) SaveSurahAudio(a *model.SurahAudio) (*model.SurahAudio, error) {
	if err := r.db.Create(a).Error; err != nil {
		return nil, err
	}
	return a, nil
}

func (r *audioRepo) SaveAyahAudio(a *model.AyahAudio) (*model.AyahAudio, error) {
	if err := r.db.Create(a).Error; err != nil {
		return nil, err
	}
	return a, nil
}

func (r *audioRepo) DeleteSurahAudio(id int) error {
	return r.db.Delete(&model.SurahAudio{}, id).Error
}

func (r *audioRepo) DeleteAyahAudio(id int) error {
	return r.db.Delete(&model.AyahAudio{}, id).Error
}
