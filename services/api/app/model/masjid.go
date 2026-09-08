package model

type Masjid struct {
	BaseID
	Name        string  `json:"name" gorm:"type:varchar(256);not null;uniqueIndex"`
	Description string  `json:"description" gorm:"type:text"`
	Address     string  `json:"address" gorm:"type:varchar(512)"`
	District    string  `json:"district" gorm:"type:varchar(100);index"`
	City        string  `json:"city" gorm:"type:varchar(100);not null;index"`
	Province    string  `json:"province" gorm:"type:varchar(100);index"`
	Latitude    float64 `json:"latitude" gorm:"type:decimal(10,7);not null;index"`
	Longitude   float64 `json:"longitude" gorm:"type:decimal(10,7);not null;index"`
	Phone       string  `json:"phone" gorm:"type:varchar(50)"`
	Capacity    int     `json:"capacity" gorm:"type:int;default:0"`
	Facilities  string  `json:"facilities" gorm:"type:text"`
	ImageURL    string  `json:"image_url,omitempty" gorm:"type:varchar(500)"`
	Website     string  `json:"website" gorm:"type:varchar(256)"`
	IsActive    bool    `json:"is_active" gorm:"type:boolean;default:true;index"`
}

type CreateMasjidRequest struct {
	Name        string  `json:"name" validate:"required"`
	Description string  `json:"description"`
	Address     string  `json:"address" validate:"required"`
	District    string  `json:"district"`
	City        string  `json:"city" validate:"required"`
	Province    string  `json:"province"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Phone       string  `json:"phone"`
	Capacity    int     `json:"capacity"`
	Facilities  string  `json:"facilities"`
	ImageURL    string  `json:"image_url"`
	Website     string  `json:"website"`
	IsActive    bool    `json:"is_active"`
}

type UpdateMasjidRequest struct {
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	Address     *string  `json:"address"`
	District    *string  `json:"district"`
	City        *string  `json:"city"`
	Province    *string  `json:"province"`
	Latitude    *float64 `json:"latitude"`
	Longitude   *float64 `json:"longitude"`
	Phone       *string  `json:"phone"`
	Capacity    *int     `json:"capacity"`
	Facilities  *string  `json:"facilities"`
	ImageURL    *string  `json:"image_url"`
	Website     *string  `json:"website"`
	IsActive    *bool    `json:"is_active"`
}

type MasjidDistance struct {
	Masjid   `json:",inline"`
	Distance float64 `json:"distance_km" gorm:"column:distance_km"`
}

type RadioIslamic struct {
	BaseID
	Name        string `json:"name" gorm:"type:varchar(256);not null;uniqueIndex"`
	Frequency   string `json:"frequency" gorm:"type:varchar(50);not null;index"`
	City        string `json:"city" gorm:"type:varchar(100);not null;index"`
	Province    string `json:"province" gorm:"type:varchar(100);index"`
	StreamURL   string `json:"stream_url" gorm:"type:varchar(512)"`
	Description string `json:"description" gorm:"type:text"`
	LogoURL     string `json:"logo_url,omitempty" gorm:"type:varchar(500)"`
	Website     string `json:"website" gorm:"type:varchar(256)"`
	IsActive    bool   `json:"is_active" gorm:"type:boolean;default:true;index"`
	Tags        string `json:"tags" gorm:"type:varchar(256)"`
}

type CreateRadioIslamicRequest struct {
	Name        string `json:"name" validate:"required"`
	Frequency   string `json:"frequency" validate:"required"`
	City        string `json:"city" validate:"required"`
	Province    string `json:"province"`
	StreamURL   string `json:"stream_url"`
	Description string `json:"description"`
	LogoURL     string `json:"logo_url"`
	Website     string `json:"website"`
	IsActive    bool   `json:"is_active"`
	Tags        string `json:"tags"`
}

type UpdateRadioIslamicRequest struct {
	Name        *string `json:"name"`
	Frequency   *string `json:"frequency"`
	City        *string `json:"city"`
	Province    *string `json:"province"`
	StreamURL   *string `json:"stream_url"`
	Description *string `json:"description"`
	LogoURL     *string `json:"logo_url"`
	Website     *string `json:"website"`
	IsActive    *bool   `json:"is_active"`
	Tags        *string `json:"tags"`
}
