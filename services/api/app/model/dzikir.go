package model

type DzikirCategory string

const (
	DzikirPagi          DzikirCategory = "pagi"
	DzikirPetang        DzikirCategory = "petang"
	DzikirSetelahSholat DzikirCategory = "setelah_sholat"
	DzikirTidur         DzikirCategory = "tidur"
	DzikirSafar         DzikirCategory = "safar"
	DzikirUmum          DzikirCategory = "dzikir_umum"
)

// Dzikir adopts the Quran-style Translation relation pattern.
// Bilingual fields (title, transliteration, meaning, Arabic) live on the Translation row.
// Fadhilah is dzikir-specific so it gets its own bilingual columns.
// Legacy string columns are kept in DB for backward compat but hidden from JSON output.
type Dzikir struct {
	BaseID
	Category        DzikirCategory `json:"category" gorm:"type:varchar(50);not null;uniqueIndex:idx_dzikir_category_title"`
	Occasion        string         `json:"occasion,omitempty" gorm:"type:varchar(100);index"`
	Title           string         `json:"-" gorm:"type:varchar(256);not null;uniqueIndex:idx_dzikir_category_title"`
	Arabic          string         `json:"-" gorm:"type:text;not null"`
	Transliteration string         `json:"-" gorm:"type:text"`
	TranslationText string         `json:"-" gorm:"column:translation;type:text;not null"`
	Count           int            `json:"count" gorm:"default:1"`
	Fadhilah        string         `json:"-" gorm:"type:text"`
	FadhilahIdn     string         `json:"fadhilah_idn,omitempty" gorm:"type:text"`
	FadhilahEn      string         `json:"fadhilah_en,omitempty" gorm:"type:text"`
	Source          string         `json:"source" gorm:"type:varchar(256)"`
	AudioURL        string         `json:"audio_url,omitempty" gorm:"type:varchar(500)"`
	TranslationID   *int           `json:"translation_id,omitempty" gorm:"index"`
	Translation     *Translation   `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}
