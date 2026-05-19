package model

type TokohTarikh struct {
	BaseID
	Nama          string       `json:"nama" gorm:"type:varchar(256);not null;uniqueIndex"`
	Era           string       `json:"era" gorm:"type:varchar(100);index"` // Sahabat, Tabi'in, Tabi'ut Tabi'in, dll
	TahunLahir    string       `json:"tahun_lahir,omitempty" gorm:"type:varchar(20)"`
	TahunWafat    string       `json:"tahun_wafat,omitempty" gorm:"type:varchar(20)"`
	Biografi      string       `json:"-" gorm:"type:text;not null"`
	Kontribusi    string       `json:"-" gorm:"type:text"`
	Kategori      string       `json:"kategori" gorm:"type:varchar(100);index"` // ulama, ilmuwan, sahabat, khalifah, dll
	ImageURL      string       `json:"image_url,omitempty" gorm:"type:varchar(500)"`
	TranslationID *int         `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}

type CreateTokohTarikhRequest struct {
	Nama       string `json:"nama" validate:"required"`
	Era        string `json:"era"`
	TahunLahir string `json:"tahun_lahir"`
	TahunWafat string `json:"tahun_wafat"`
	Biografi   string `json:"biografi"`
	Kontribusi string `json:"kontribusi"`
	Kategori   string `json:"kategori"`
	ImageURL   string `json:"image_url"`
}
