package model

type DoaCategory string

const (
	DoaCategoryPagi                DoaCategory = "pagi"
	DoaCategoryPetang              DoaCategory = "petang"
	DoaCategoryMakan               DoaCategory = "makan"
	DoaCategoryTidur               DoaCategory = "tidur"
	DoaCategoryBangun              DoaCategory = "bangun"
	DoaCategoryKamarMandi          DoaCategory = "kamar_mandi"
	DoaCategoryMasjid              DoaCategory = "masjid"
	DoaCategorySafar               DoaCategory = "safar"
	DoaCategoryBelajar             DoaCategory = "belajar"
	DoaCategoryWudhu               DoaCategory = "wudhu"
	DoaCategoryPakaian             DoaCategory = "pakaian"
	DoaCategoryRumah               DoaCategory = "rumah"
	DoaCategorySakit               DoaCategory = "sakit"
	DoaCategoryKeluarga            DoaCategory = "keluarga"
	DoaCategoryHujan               DoaCategory = "hujan"
	DoaCategoryPuasa               DoaCategory = "puasa"
	DoaCategoryJenazah             DoaCategory = "jenazah"
	DoaCategoryDzikirPagi          DoaCategory = "dzikir_pagi"
	DoaCategoryDzikirPetang        DoaCategory = "dzikir_petang"
	DoaCategoryDzikirSetelahSholat DoaCategory = "dzikir_setelah_sholat"
	DoaCategoryDzikirTidur         DoaCategory = "dzikir_tidur"
	DoaCategoryIstighfar           DoaCategory = "istighfar"
	DoaCategorySholawat            DoaCategory = "sholawat"
	DoaCategoryUmum                DoaCategory = "umum"
)

// Doa adopts the Quran-style Translation relation pattern.
// Bilingual fields (title, transliteration, meaning, Arabic) live on the Translation row.
// Legacy string columns are kept in DB for backward compat but hidden from JSON output.
type Doa struct {
	BaseID
	Category        DoaCategory  `json:"category" gorm:"type:varchar(100);not null;uniqueIndex:idx_doa_category_title"`
	Title           string       `json:"title,omitempty" gorm:"type:varchar(256);not null;uniqueIndex:idx_doa_category_title"`
	Arabic          string       `json:"arabic,omitempty" gorm:"type:text;not null"`
	Transliteration string       `json:"transliteration,omitempty" gorm:"type:text"`
	TranslationText string       `json:"translation,omitempty" gorm:"column:translation;type:text;not null"`
	Source          string       `json:"source" gorm:"type:varchar(256)"`
	AudioURL        string       `json:"audio_url,omitempty" gorm:"type:varchar(500)"`
	TranslationID   *int         `json:"translation_id,omitempty" gorm:"index"`
	Translation     *Translation `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}
