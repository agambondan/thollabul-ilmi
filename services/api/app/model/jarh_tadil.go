package model

type JarhTadilJenis string

const (
	JenisTadil JarhTadilJenis = "tadil"
	JenisJarh  JarhTadilJenis = "jarh"
)

// JarhTadil menyimpan penilaian ulama terhadap seorang perawi.
// Tingkat ta'dil: 1=tsiqah tsiqah, 2=tsiqah, 3=shaduq, 4=la ba'sa bihi, 5=maqbul
// Tingkat jarh:   1=layyin, 2=dhaif, 3=matruk, 4=muttaham bil kadzib, 5=kadzdzab
type JarhTadil struct {
	BaseID
	PerawiID      *int            `json:"perawi_id,omitempty" gorm:"not null;index"`
	PenilaiID     *int            `json:"penilai_id,omitempty" gorm:"not null;index"`
	Perawi        *Perawi         `json:"perawi,omitempty" gorm:"foreignKey:PerawiID"`
	Penilai       *Perawi         `json:"penilai,omitempty" gorm:"foreignKey:PenilaiID"`
	JenisNilai    *JarhTadilJenis `json:"jenis_nilai,omitempty" gorm:"type:varchar(10);not null;index"`
	Tingkat       *int            `json:"tingkat,omitempty" gorm:"not null;check:tingkat >= 1 AND tingkat <= 7"`
	TeksNilai     *string         `json:"-" gorm:"type:varchar(255)"`
	Sumber        *string         `json:"sumber,omitempty" gorm:"type:varchar(255)"`
	Halaman       *string         `json:"halaman,omitempty" gorm:"type:varchar(50)"`
	Catatan       *string         `json:"-" gorm:"type:text"`
	TranslationID *int            `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation    `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}
