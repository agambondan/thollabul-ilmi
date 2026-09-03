package model

import "github.com/google/uuid"

type ZakatJenis string

const (
	ZakatMaal        ZakatJenis = "maal"
	ZakatFitrah      ZakatJenis = "fitrah"
	ZakatPerdagangan ZakatJenis = "perdagangan"
	ZakatPertanian   ZakatJenis = "pertanian"
	ZakatEmasPerak   ZakatJenis = "emas_perak"
	// "profesi" intentionally has no constant: the calculator no longer
	// offers it (zakat on salaried income is a modern ijtihad, not one of
	// the classical categories this app calculates). The string value can
	// still appear on rows saved before this change — nothing here
	// enforces a whitelist, so old history rows keep reading back fine.
)

type KalkulasiZakat struct {
	BaseUUID
	UserID       uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	Jenis        ZakatJenis `json:"jenis" gorm:"type:varchar(50);not null"`
	NamaJenis    string     `json:"nama_jenis" gorm:"type:varchar(100)"`
	JumlahZakat  float64    `json:"jumlah_zakat" gorm:"not null;default:0"`
	NilaiHarta   float64    `json:"nilai_harta" gorm:"default:0"`
	Nisab        float64    `json:"nisab" gorm:"default:0"`
	Rate         float64    `json:"rate" gorm:"default:2.5"`
	Haul         bool       `json:"haul" gorm:"default:true"`
	Catatan      string     `json:"catatan,omitempty" gorm:"type:varchar(500)"`
	SudahDibayar bool       `json:"sudah_dibayar" gorm:"default:false"`
	TanggalBayar string     `json:"tanggal_bayar,omitempty" gorm:"type:varchar(10)"`
}

type CreateKalkulasiZakatRequest struct {
	Jenis        ZakatJenis `json:"jenis" validate:"required"`
	NamaJenis    string     `json:"nama_jenis"`
	JumlahZakat  float64    `json:"jumlah_zakat" validate:"min=0"`
	NilaiHarta   float64    `json:"nilai_harta"`
	Nisab        float64    `json:"nisab"`
	Rate         float64    `json:"rate"`
	Haul         bool       `json:"haul"`
	Catatan      string     `json:"catatan"`
	SudahDibayar bool       `json:"sudah_dibayar"`
	TanggalBayar string     `json:"tanggal_bayar"`
}
