package model

// HadithGrade derajat keshahihan hadits.
type HadithGrade string

const (
	HadithGradeShahih           HadithGrade = "shahih"
	HadithGradeShahihLighairihi HadithGrade = "shahih_lighairihi"
	HadithGradeHasan            HadithGrade = "hasan"
	HadithGradeHasanLighairihi  HadithGrade = "hasan_lighairihi"
	HadithGradeHasanShahih      HadithGrade = "hasan_shahih"
	HadithGradeDhaif            HadithGrade = "dhaif"
	HadithGradeDhaifJiddan      HadithGrade = "dhaif_jiddan"
	HadithGradeMunkar           HadithGrade = "munkar"
	HadithGradeMaudhu           HadithGrade = "maudhu"
	HadithGradeMatruk           HadithGrade = "matruk"
	HadithGradeMajhul           HadithGrade = "majhul"
)

type Hadith struct {
	BaseID
	DefaultLanguage *string       `gorm:"default:Ar"`
	Number          *int          `json:"number,omitempty" gorm:"index"`
	BookID          *int          `json:"book_id,omitempty" gorm:"index"`
	ThemeID         *int          `json:"theme_id,omitempty" gorm:"index"`
	ChapterID       *int          `json:"chapter_id,omitempty" gorm:"index"`
	TranslationID   *int          `json:"translation_id,omitempty" gorm:"index"`
	Book            *Book         `json:"book,omitempty"`
	Theme           *Theme        `json:"theme,omitempty"`
	Chapter         *Chapter      `json:"chapter,omitempty"`
	Translation     *Translation  `json:"translation,omitempty"`
	Media           []HadithAsset `json:"media,omitempty"`

	// Grading & authentication
	Grade      *HadithGrade `json:"grade,omitempty" gorm:"type:varchar(30);index"`
	ShahihBy   *string      `json:"shahih_by,omitempty" gorm:"type:text"`
	DhaifBy    *string      `json:"dhaif_by,omitempty" gorm:"type:text"`
	GradeNotes *string      `json:"grade_notes,omitempty" gorm:"type:text"`

	// Sanad (chain of narrators)
	Sanad *string `json:"sanad,omitempty" gorm:"type:text"`
}

type HadithAsset struct {
	BaseID
	HadithID     *int        `json:"hadith_id,omitempty"`
	MultimediaID *int        `json:"multimedia_id,omitempty"`
	Hadith       *Hadith     `json:"-"`
	Multimedia   *Multimedia `json:"multimedia"`
}
