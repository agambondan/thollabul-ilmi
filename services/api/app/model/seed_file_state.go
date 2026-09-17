package model

import "time"

type SeedFileState struct {
	BaseID
	Name        string    `json:"name" gorm:"uniqueIndex;size:255"`
	LastModTime time.Time `json:"last_mod_time"`
	LastSize    int64     `json:"last_size"`
}
