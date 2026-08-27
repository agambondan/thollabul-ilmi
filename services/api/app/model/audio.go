package model

type SurahAudio struct {
	BaseID
	SurahID  *int   `json:"surah_id,omitempty" gorm:"not null;uniqueIndex:idx_surah_audio_qari"`
	QariName string `json:"qari_name" gorm:"type:varchar(256);not null"`
	QariSlug string `json:"qari_slug" gorm:"type:varchar(100);not null;uniqueIndex:idx_surah_audio_qari"`
	AudioURL string `json:"audio_url" gorm:"type:varchar(512);not null"`
	Surah    *Surah `json:"surah,omitempty"`
}

type AyahAudio struct {
	BaseID
	AyahID   *int   `json:"ayah_id,omitempty" gorm:"not null;uniqueIndex:idx_ayah_audio_qari"`
	QariName string `json:"qari_name" gorm:"type:varchar(256);not null"`
	QariSlug string `json:"qari_slug" gorm:"type:varchar(100);not null;uniqueIndex:idx_ayah_audio_qari"`
	AudioURL string `json:"audio_url" gorm:"type:varchar(512);not null"`
	Ayah     *Ayah  `json:"ayah,omitempty"`
}
