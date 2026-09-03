package model

// AsmaUlHusna keeps the explicit Indonesian/English columns it has always had,
// AND additionally exposes a Quran-style Translation relation so frontend can
// uniformly read item.translation.{idn,en,ar,...} like other content tables.
type AsmaUlHusna struct {
	BaseID
	Number          int          `json:"number" gorm:"not null;uniqueIndex"`
	Arabic          string       `json:"arabic" gorm:"type:varchar(100);not null"`
	Transliteration string       `json:"transliteration" gorm:"type:varchar(100);not null"`
	Indonesian      string       `json:"indonesian" gorm:"type:varchar(256);not null"`
	English         string       `json:"english" gorm:"type:varchar(256);not null"`
	Meaning         string       `json:"meaning" gorm:"type:text"`
	Source          string       `json:"source,omitempty" gorm:"type:varchar(256)"`
	AudioURL        string       `json:"audio_url,omitempty" gorm:"type:varchar(512)"`
	TranslationID   *int         `json:"translation_id,omitempty" gorm:"index"`
	Translation     *Translation `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}
