package model

type LocationCategory string

const (
	LocationCity     LocationCategory = "kota"
	LocationMosque   LocationCategory = "masjid"
	LocationSite     LocationCategory = "situs"
	LocationUniversity LocationCategory = "universitas"
)

type Location struct {
	BaseID
	Name        string  `json:"name" gorm:"type:varchar(256);not null;uniqueIndex"`
	Description string  `json:"description" gorm:"type:text"`
	Latitude    float64 `json:"latitude" gorm:"type:decimal(10,7);not null;index"`
	Longitude   float64 `json:"longitude" gorm:"type:decimal(10,7);not null;index"`
	Category    string  `json:"category" gorm:"type:varchar(50);index"`
	Era         string  `json:"era" gorm:"type:varchar(100);index"`
	ImageURL    string  `json:"image_url,omitempty" gorm:"type:varchar(500)"`
	TokohIDs    string  `json:"tokoh_ids,omitempty" gorm:"type:varchar(255)"`
}

type CreateLocationRequest struct {
	Name        string  `json:"name" validate:"required"`
	Description string  `json:"description"`
	Latitude    float64 `json:"latitude" validate:"required"`
	Longitude   float64 `json:"longitude" validate:"required"`
	Category    string  `json:"category"`
	Era         string  `json:"era"`
	ImageURL    string  `json:"image_url"`
	TokohIDs    string  `json:"tokoh_ids"`
}
