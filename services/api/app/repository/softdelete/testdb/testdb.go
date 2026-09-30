package testdb

import (
	"fmt"
	"strings"
	"sync/atomic"
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

var counter atomic.Int64

func Open(t *testing.T, models ...interface{}) *gorm.DB {
	t.Helper()
	name := strings.NewReplacer("/", "_", " ", "_").Replace(t.Name())
	dsn := fmt.Sprintf("file:softdelete_%s_%d?mode=memory&cache=shared", name, counter.Add(1))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("sql db: %v", err)
	}
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { _ = sqlDB.Close() })
	if len(models) > 0 {
		if err := db.AutoMigrate(models...); err != nil {
			t.Fatalf("migrate: %v", err)
		}
	}
	return db
}

func Str(value string) *string {
	return &value
}

func Int(value int) *int {
	return &value
}

func Delete(t *testing.T, db *gorm.DB, value interface{}) {
	t.Helper()
	if err := db.Delete(value).Error; err != nil {
		t.Fatalf("soft delete: %v", err)
	}
}
