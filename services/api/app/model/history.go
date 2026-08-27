package model

type HistoryCategory string

const (
	HistoryCategoryNabi      HistoryCategory = "nabi"
	HistoryCategoryKhulafa   HistoryCategory = "khulafa"
	HistoryCategoryDinasti   HistoryCategory = "dinasti"
	HistoryCategoryUlama     HistoryCategory = "ulama"
	HistoryCategoryPeristiwa HistoryCategory = "peristiwa"
)

type HistoryEvent struct {
	BaseID
	YearHijri     int             `json:"year_hijri" gorm:"index"`
	YearMiladi    int             `json:"year_miladi" gorm:"index"`
	Title         string          `json:"-" gorm:"type:varchar(256);not null"`
	Slug          string          `json:"slug" gorm:"type:varchar(256);uniqueIndex;not null"`
	Description   string          `json:"-" gorm:"type:text"`
	Category      HistoryCategory `json:"category" gorm:"type:varchar(50);index"`
	IsSignificant bool            `json:"is_significant" gorm:"default:false"`
	TranslationID *int            `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation    `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}

type CreateHistoryEventRequest struct {
	YearHijri     int             `json:"year_hijri"`
	YearMiladi    int             `json:"year_miladi"`
	Title         string          `json:"title" validate:"required"`
	Slug          string          `json:"slug" validate:"required"`
	Description   string          `json:"description"`
	Category      HistoryCategory `json:"category"`
	IsSignificant bool            `json:"is_significant"`
}
