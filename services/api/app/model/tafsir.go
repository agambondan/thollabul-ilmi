package model

// Tafsir menyimpan teks tafsir dari berbagai sumber untuk setiap ayat.
//
// Catatan kolom legacy:
//   - kemenag_translation_id → sebenarnya berisi Tafsir Jalalain (ID)
//   - ibnu_katsir_translation_id → sebenarnya berisi Tafsir Quraish Shihab (ID)
//     Translation record-nya juga diisi:
//     En → Tafsir Ibnu Katsir (English) dari data/ibnukatsir/
//     Idn → TafsirWeb (ID) dari data/tafsirweb/
type Tafsir struct {
	BaseID
	AyahID                    *int        `json:"ayah_id,omitempty" gorm:"uniqueIndex"`
	KemenagTranslationID      *int        `json:"kemenag_translation_id,omitempty"`        // Legacy: sebenarnya Jalalain (ID)
	IbnuKatsirTranslationID   *int        `json:"ibnu_katsir_translation_id,omitempty"`    // Legacy: sebenarnya Quraish Shihab (ID)
	IbnuKatsirEnTranslationID *int        `json:"ibnu_katsir_en_translation_id,omitempty"` // Tafsir Ibnu Katsir (English) — field terpisah
	KemenagTranslation        Translation `json:"kemenag,omitempty" gorm:"foreignKey:KemenagTranslationID"`
	IbnuKatsirTranslation     Translation `json:"ibnu_katsir,omitempty" gorm:"foreignKey:IbnuKatsirTranslationID"`
	IbnuKatsirEnTranslation   Translation `json:"ibnu_katsir_en,omitempty" gorm:"foreignKey:IbnuKatsirEnTranslationID"`
	Ayah                      *Ayah       `json:"ayah,omitempty"`
}
