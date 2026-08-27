package model

type PerawiTabaqah string

const (
	TabaqahSahabat       PerawiTabaqah = "sahabat"
	TabaqahTabiin        PerawiTabaqah = "tabiin"
	TabaqahTabiutTabiin  PerawiTabaqah = "tabiut_tabiin"
	TabaqahAtbautTabiin  PerawiTabaqah = "atbaut_tabiin"
	TabaqahTabaqahKelima PerawiTabaqah = "tabaqah_5"
	TabaqahTabaqahKeenam PerawiTabaqah = "tabaqah_6"
	TabaqahTabaqahKetuju PerawiTabaqah = "tabaqah_7"
)

type PerawiStatus string

const (
	StatusTsiqahTsiqah PerawiStatus = "tsiqah_tsiqah"
	StatusTsiqah       PerawiStatus = "tsiqah"
	StatusShaduq       PerawiStatus = "shaduq"
	StatusLaBaasaBihi  PerawiStatus = "la_baasa_bihi"
	StatusMaqbul       PerawiStatus = "maqbul"
	StatusMajhul       PerawiStatus = "majhul"
	StatusLayyin       PerawiStatus = "layyin"
	StatusDhaif        PerawiStatus = "dhaif"
	StatusMatruk       PerawiStatus = "matruk"
	StatusKadzdzab     PerawiStatus = "kadzdzab"
)

type Perawi struct {
	BaseID
	NamaArab      *string      `json:"nama_arab,omitempty" gorm:"type:varchar(255);not null;index"`
	NamaLatin     *string      `json:"nama_latin,omitempty" gorm:"type:varchar(255);not null;index"`
	NamaLengkap   *string      `json:"nama_lengkap,omitempty" gorm:"type:text"`
	Kunyah        *string      `json:"kunyah,omitempty" gorm:"type:varchar(100)"`
	Laqab         *string      `json:"laqab,omitempty" gorm:"type:varchar(100)"`
	Nisbah        *string      `json:"nisbah,omitempty" gorm:"type:varchar(100)"`
	TahunLahir    *int         `json:"tahun_lahir,omitempty"`
	TahunWafat    *int         `json:"tahun_wafat,omitempty"`
	TahunHijri    *bool        `json:"tahun_hijri,omitempty" gorm:"default:true"`
	TempatLahir   *string      `json:"tempat_lahir,omitempty" gorm:"type:varchar(100)"`
	TempatWafat   *string      `json:"tempat_wafat,omitempty" gorm:"type:varchar(100)"`
	Tabaqah       *string      `json:"tabaqah,omitempty" gorm:"type:varchar(50);index"`
	Status        *string      `json:"status,omitempty" gorm:"type:varchar(30);index"`
	Biografis     *string      `json:"-" gorm:"type:text"`
	TranslationID *int         `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`

	Guru      []Perawi    `json:"guru,omitempty" gorm:"many2many:perawi_guru;joinForeignKey:MuridID;joinReferences:GuruID"`
	Murid     []Perawi    `json:"murid,omitempty" gorm:"many2many:perawi_guru;joinForeignKey:GuruID;joinReferences:MuridID"`
	JarhTadil []JarhTadil `json:"jarh_tadil,omitempty" gorm:"foreignKey:PerawiID"`
}

// PerawiGuru is the join table for guru-murid relationship
type PerawiGuru struct {
	GuruID  *int `json:"guru_id,omitempty" gorm:"primaryKey"`
	MuridID *int `json:"murid_id,omitempty" gorm:"primaryKey"`
}
