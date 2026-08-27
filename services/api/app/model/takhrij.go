package model

// Takhrij mencatat di kitab mana saja sebuah hadith juga ditemukan.
type Takhrij struct {
	BaseID
	HadithID        *int    `json:"hadith_id,omitempty" gorm:"not null;index"`
	BookID          *int    `json:"book_id,omitempty" gorm:"index"`
	Hadith          *Hadith `json:"hadith,omitempty" gorm:"foreignKey:HadithID"`
	Book            *Book   `json:"book,omitempty" gorm:"foreignKey:BookID"`
	NomorHadisKitab *string `json:"nomor_hadis_kitab,omitempty" gorm:"type:varchar(50)"`
	Halaman         *string `json:"halaman,omitempty" gorm:"type:varchar(50)"`
	Jilid           *string `json:"jilid,omitempty" gorm:"type:varchar(50)"`
	Catatan         *string `json:"catatan,omitempty" gorm:"type:text"`
}
