package model

type Munasabah struct {
	BaseID
	AyahFromID  *int   `json:"ayah_from_id" gorm:"not null;index"`
	AyahToID    *int   `json:"ayah_to_id" gorm:"not null;index"`
	Description string `json:"description" gorm:"type:text;not null"`
	AyahFrom    *Ayah  `json:"ayah_from,omitempty" gorm:"foreignKey:AyahFromID;references:ID"`
	AyahTo      *Ayah  `json:"ayah_to,omitempty" gorm:"foreignKey:AyahToID;references:ID"`
}

type CreateMunasabahRequest struct {
	AyahFromID  int    `json:"ayah_from_id" validate:"required"`
	AyahToID    int    `json:"ayah_to_id" validate:"required"`
	Description string `json:"description" validate:"required"`
}
