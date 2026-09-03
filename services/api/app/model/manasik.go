package model

type ManasikType string

const (
	ManasikTypeHaji  ManasikType = "haji"
	ManasikTypeUmrah ManasikType = "umrah"
)

type ManasikStep struct {
	BaseID
	Type            ManasikType  `json:"type" gorm:"type:varchar(20);not null;uniqueIndex:idx_manasik_type_step"`
	StepOrder       int          `json:"step_order" gorm:"not null;uniqueIndex:idx_manasik_type_step"`
	Title           string       `json:"-" gorm:"type:varchar(256);not null"`
	Description     string       `json:"description,omitempty" gorm:"type:text"`
	Arabic          string       `json:"-" gorm:"type:text"`
	Transliteration string       `json:"-" gorm:"type:text"`
	TranslationText string       `json:"-" gorm:"column:translation;type:text"`
	Notes           string       `json:"notes,omitempty" gorm:"type:text"`
	Source          string       `json:"source,omitempty" gorm:"type:varchar(256)"`
	IsWajib         bool         `json:"is_wajib" gorm:"default:false"`
	TranslationID   *int         `json:"translation_id,omitempty" gorm:"index"`
	Translation     *Translation `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}
