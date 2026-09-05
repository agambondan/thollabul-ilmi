package model

type SirohCategory struct {
	BaseID
	Title         string         `json:"title" gorm:"type:varchar(256);not null"`
	Slug          string         `json:"slug" gorm:"type:varchar(256);uniqueIndex;not null"`
	Order         int            `json:"order" gorm:"default:0"`
	Contents      []SirohContent `json:"contents,omitempty" gorm:"foreignKey:CategoryID;-:migration"`
	TranslationID *int           `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation   `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}

type SirohContent struct {
	BaseID
	CategoryID    *int           `json:"category_id,omitempty" gorm:"not null;index"`
	Title         string         `json:"title" gorm:"type:varchar(256);not null"`
	Slug          string         `json:"slug" gorm:"type:varchar(256);uniqueIndex;not null"`
	Content       string         `json:"content" gorm:"type:text;not null"`
	Source        string         `json:"source,omitempty" gorm:"type:varchar(512)"`
	Order         int            `json:"order" gorm:"default:0"`
	Category      *SirohCategory `json:"category,omitempty"`
	TranslationID *int           `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation   `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}
