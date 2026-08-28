package model

type TermCategory string

const (
	TermCategoryFiqh        TermCategory = "fiqh"
	TermCategoryAqidah      TermCategory = "aqidah"
	TermCategoryTasawuf     TermCategory = "tasawuf"
	TermCategoryUlumulQuran TermCategory = "ulumul_quran"
	TermCategoryHadith      TermCategory = "hadith"
	TermCategoryKosakata    TermCategory = "kosakata"
	TermCategoryLainnya     TermCategory = "lainnya"
)

type IslamicTerm struct {
	BaseID
	Term       string       `json:"term" gorm:"type:varchar(256);uniqueIndex;not null"`
	Category   TermCategory `json:"category" gorm:"type:varchar(50);index"`
	Definition string       `json:"definition" gorm:"type:text;not null"`
	Example    string       `json:"example" gorm:"type:text"`
	Source     string       `json:"source" gorm:"type:varchar(256)"`
	Origin     string       `json:"origin" gorm:"type:varchar(100)"`
	// Arabic vocabulary fields. Empty for terminology entries, filled for the
	// "kosakata" category so /kamus can show the script and the trilateral root.
	Arabic        string       `json:"arabic" gorm:"type:varchar(128)"`
	Latin         string       `json:"latin" gorm:"type:varchar(128)"`
	Root          string       `json:"root" gorm:"type:varchar(128);index"`
	TranslationID *int         `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}

type CreateIslamicTermRequest struct {
	Term       string       `json:"term" validate:"required"`
	Category   TermCategory `json:"category"`
	Definition string       `json:"definition" validate:"required"`
	Example    string       `json:"example"`
	Source     string       `json:"source"`
	Origin     string       `json:"origin"`
}
