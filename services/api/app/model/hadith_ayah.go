package model

type HadithAyah struct {
	BaseID
	HadithID *int    `json:"hadith_id" gorm:"not null;uniqueIndex:idx_hadith_ayah"`
	AyahID   *int    `json:"ayah_id" gorm:"not null;uniqueIndex:idx_hadith_ayah"`
	Catatan  string  `json:"catatan,omitempty" gorm:"type:varchar(500)"`
	Hadith   *Hadith `json:"hadith,omitempty"`
	Ayah     *Ayah   `json:"ayah,omitempty"`
}

type CreateHadithAyahRequest struct {
	HadithID int    `json:"hadith_id" validate:"required"`
	AyahID   int    `json:"ayah_id" validate:"required"`
	Catatan  string `json:"catatan"`
}
