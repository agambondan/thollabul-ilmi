package model

type SanadJenis string

const (
	SanadMusnad   SanadJenis = "musnad"
	SanadMursal   SanadJenis = "mursal"
	SanadMunqathi SanadJenis = "munqathi"
	SanadMudhal   SanadJenis = "mudhal"
	SanadMuallaq  SanadJenis = "muallaq"
)

type SanadStatus string

const (
	SanadMuttashil      SanadStatus = "muttashil"
	SanadMunqathiStatus SanadStatus = "munqathi"
)

type MetodePeriwayatan string

const (
	MetodeHaddatsana MetodePeriwayatan = "haddatsana"
	MetodeAkhbarana  MetodePeriwayatan = "akhbarana"
	MetodeAnanah     MetodePeriwayatan = "ananah"
	MetodeAnna       MetodePeriwayatan = "anna"
	MetodeSamitu     MetodePeriwayatan = "samitu"
	MetodeRaaytu     MetodePeriwayatan = "raaytu"
)

// Sanad adalah satu jalur rantai periwayatan untuk sebuah hadith.
// Satu hadith bisa punya lebih dari satu jalur (mutabi'/syahid).
type Sanad struct {
	BaseID
	HadithID    *int         `json:"hadith_id,omitempty" gorm:"not null;index"`
	Hadith      *Hadith      `json:"hadith,omitempty" gorm:"foreignKey:HadithID"`
	NomorJalur  *int         `json:"nomor_jalur,omitempty"`
	Jenis       *SanadJenis  `json:"jenis,omitempty" gorm:"type:varchar(20)"`
	StatusSanad *SanadStatus `json:"status_sanad,omitempty" gorm:"type:varchar(20)"`
	Catatan     *string      `json:"catatan,omitempty" gorm:"type:text"`
	MataSanad   []MataSanad  `json:"mata_sanad,omitempty" gorm:"foreignKey:SanadID"`
}

// MataSanad adalah satu mata rantai (satu perawi) dalam jalur sanad.
type MataSanad struct {
	BaseID
	SanadID  *int               `json:"sanad_id,omitempty" gorm:"not null;index"`
	PerawiID *int               `json:"perawi_id,omitempty" gorm:"not null;index"`
	Sanad    *Sanad             `json:"sanad,omitempty" gorm:"foreignKey:SanadID"`
	Perawi   *Perawi            `json:"perawi,omitempty" gorm:"foreignKey:PerawiID"`
	Urutan   *int               `json:"urutan,omitempty" gorm:"not null"`
	Metode   *MetodePeriwayatan `json:"metode,omitempty" gorm:"type:varchar(30)"`
	Catatan  *string            `json:"catatan,omitempty" gorm:"type:text"`
}
