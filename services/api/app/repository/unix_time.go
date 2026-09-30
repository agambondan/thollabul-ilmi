package repository

import "time"

func unixNow() *int64 {
	now := time.Now().Unix()
	return &now
}
