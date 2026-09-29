package middlewares

import (
	"testing"

	dto "github.com/prometheus/client_model/go"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type metricsTestModel struct {
	ID   uint `gorm:"primarykey"`
	Name string
}

func dbQueryDurationSampleCount(t *testing.T) uint64 {
	t.Helper()
	m := &dto.Metric{}
	if err := dbQueryDuration.Write(m); err != nil {
		t.Fatalf("failed to read dbQueryDuration: %v", err)
	}
	return m.GetHistogram().GetSampleCount()
}

func TestRegisterDBMetricsObservesQueryDuration(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&metricsTestModel{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	if err := RegisterDBMetrics(db); err != nil {
		t.Fatalf("RegisterDBMetrics returned error: %v", err)
	}

	before := dbQueryDurationSampleCount(t)

	if err := db.Create(&metricsTestModel{Name: "test"}).Error; err != nil {
		t.Fatalf("create failed: %v", err)
	}
	var out metricsTestModel
	if err := db.First(&out).Error; err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if err := db.Model(&out).Update("name", "updated").Error; err != nil {
		t.Fatalf("update failed: %v", err)
	}
	if err := db.Delete(&out).Error; err != nil {
		t.Fatalf("delete failed: %v", err)
	}

	after := dbQueryDurationSampleCount(t)
	if after < before+4 {
		t.Fatalf("expected at least 4 new observations (create/query/update/delete), before=%d after=%d", before, after)
	}
}
