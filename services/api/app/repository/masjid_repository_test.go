package repository

import (
	"database/sql"
	"math"
	"sync"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/mattn/go-sqlite3"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

const masjidSQLiteDriverName = "sqlite3_masjid_test"

var registerMasjidSQLiteDriver sync.Once

func masjidSQLiteDriver() string {
	registerMasjidSQLiteDriver.Do(func() {
		sql.Register(masjidSQLiteDriverName, &sqlite3.SQLiteDriver{
			ConnectHook: func(conn *sqlite3.SQLiteConn) error {
				funcs := map[string]interface{}{
					"radians":  func(deg float64) float64 { return deg * math.Pi / 180 },
					"cos":      math.Cos,
					"sin":      math.Sin,
					"acos":     math.Acos,
					"least":    math.Min,
					"greatest": math.Max,
				}
				for name, fn := range funcs {
					if err := conn.RegisterFunc(name, fn, true); err != nil {
						return err
					}
				}
				return nil
			},
		})
	})
	return masjidSQLiteDriverName
}

func newMasjidTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Dialector{DriverName: masjidSQLiteDriver(), DSN: "file::memory:"}, &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
		Logger:         logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("sql db: %v", err)
	}
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { sqlDB.Close() })
	if err := db.AutoMigrate(&model.Masjid{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	return db
}

func seedMasjid(t *testing.T, db *gorm.DB, m model.Masjid) model.Masjid {
	t.Helper()
	if err := db.Create(&m).Error; err != nil {
		t.Fatalf("seed masjid %q: %v", m.Name, err)
	}
	return m
}

func masjidNames(list []model.Masjid) []string {
	names := make([]string, 0, len(list))
	for _, m := range list {
		names = append(names, m.Name)
	}
	return names
}

func nearbyNames(list []model.MasjidDistance) []string {
	names := make([]string, 0, len(list))
	for _, m := range list {
		names = append(names, m.Name)
	}
	return names
}

func equalStrings(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func TestMasjidFindNearbySkipsDeletedAndInactive(t *testing.T) {
	db := newMasjidTestDB(t)
	repo := NewMasjidRepository(db)

	seedMasjid(t, db, model.Masjid{Name: "Masjid Sunda Kelapa", City: "Jakarta Pusat", Latitude: -6.2012984, Longitude: 106.8322571, IsActive: true})
	seedMasjid(t, db, model.Masjid{Name: "Masjid Cut Meutia", City: "Jakarta Pusat", Latitude: -6.1874, Longitude: 106.8331, IsActive: true})
	retired := seedMasjid(t, db, model.Masjid{Name: "Masjid Retired Landmark", City: "Jakarta Pusat", Latitude: -6.1702, Longitude: 106.8314, IsActive: true})
	if err := db.Delete(&retired).Error; err != nil {
		t.Fatalf("soft delete masjid: %v", err)
	}
	seedMasjid(t, db, model.Masjid{Name: "Masjid Nonaktif", City: "Jakarta Pusat", Latitude: -6.2100, Longitude: 106.8400, IsActive: false})
	seedMasjid(t, db, model.Masjid{Name: "Masjid Gedhe Yogyakarta", City: "Yogyakarta", Latitude: -7.8053, Longitude: 110.3642, IsActive: true})

	results, total, err := repo.FindNearby(-6.2088, 106.8456, 25, 50)
	if err != nil {
		t.Fatalf("FindNearby: %v", err)
	}

	want := []string{"Masjid Sunda Kelapa", "Masjid Cut Meutia"}
	if got := nearbyNames(results); !equalStrings(got, want) {
		t.Fatalf("expected %v, got %v", want, got)
	}
	if total != int64(len(want)) {
		t.Fatalf("expected total %d to match the listed masjids, got %d", len(want), total)
	}
	if math.Abs(results[0].Distance-1.6945) > 0.05 {
		t.Fatalf("expected ~1.69 km to the nearest masjid, got %.4f", results[0].Distance)
	}
	if results[0].Distance >= results[1].Distance {
		t.Fatalf("expected results ordered by distance, got %.4f then %.4f", results[0].Distance, results[1].Distance)
	}
}

func TestMasjidFindNearbyLimitKeepsTotalOfAllWithinRadius(t *testing.T) {
	db := newMasjidTestDB(t)
	repo := NewMasjidRepository(db)

	seedMasjid(t, db, model.Masjid{Name: "Masjid Sunda Kelapa", City: "Jakarta Pusat", Latitude: -6.2012984, Longitude: 106.8322571, IsActive: true})
	seedMasjid(t, db, model.Masjid{Name: "Masjid Cut Meutia", City: "Jakarta Pusat", Latitude: -6.1874, Longitude: 106.8331, IsActive: true})
	deleted := seedMasjid(t, db, model.Masjid{Name: "Masjid Retired Landmark", City: "Jakarta Pusat", Latitude: -6.2090, Longitude: 106.8460, IsActive: true})
	if err := db.Delete(&deleted).Error; err != nil {
		t.Fatalf("soft delete masjid: %v", err)
	}

	results, total, err := repo.FindNearby(-6.2088, 106.8456, 25, 1)
	if err != nil {
		t.Fatalf("FindNearby: %v", err)
	}
	if want := []string{"Masjid Sunda Kelapa"}; !equalStrings(nearbyNames(results), want) {
		t.Fatalf("expected %v, got %v", want, nearbyNames(results))
	}
	if total != 2 {
		t.Fatalf("expected total 2 (deleted masjid excluded), got %d", total)
	}
}

func TestMasjidFindAllSearchCoversNameAddressDistrictAndCity(t *testing.T) {
	db := newMasjidTestDB(t)
	repo := NewMasjidRepository(db)

	seedMasjid(t, db, model.Masjid{Name: "Masjid Sunda Kelapa", District: "Menteng", City: "Jakarta Pusat", Address: "Jl. Taman Sunda Kelapa No.16", Latitude: -6.2, Longitude: 106.8, IsActive: true})
	seedMasjid(t, db, model.Masjid{Name: "Masjid Jamik Pangkalpinang", District: "Rangkui", City: "Pangkal Pinang", Address: "Jl. Masjid Jamik, Kota Pangkalpinang", Latitude: -2.1, Longitude: 106.1, IsActive: true})
	seedMasjid(t, db, model.Masjid{Name: "Masjid Agung Al-Azhar", District: "Kebayoran Baru", City: "Jakarta Selatan", Address: "Jl. Sisingamangaraja", Latitude: -6.2, Longitude: 106.8, IsActive: true})
	retired := seedMasjid(t, db, model.Masjid{Name: "Masjid Retired Landmark", District: "Sawah Besar", City: "Jakarta Pusat", Address: "Jl. Taman Wijaya Kusuma", Latitude: -6.17, Longitude: 106.83, IsActive: true})
	if err := db.Delete(&retired).Error; err != nil {
		t.Fatalf("soft delete masjid: %v", err)
	}
	seedMasjid(t, db, model.Masjid{Name: "Masjid Nonaktif", District: "Menteng", City: "Jakarta Pusat", Address: "Jl. Nonaktif", Latitude: -6.2, Longitude: 106.8, IsActive: false})

	cases := []struct {
		name      string
		search    string
		city      string
		want      []string
		wantTotal int64
	}{
		{"name", "sunda", "", []string{"Masjid Sunda Kelapa"}, 1},
		{"case insensitive", "SUNDA KELAPA", "", []string{"Masjid Sunda Kelapa"}, 1},
		{"district", "kebayoran", "", []string{"Masjid Agung Al-Azhar"}, 1},
		{"address", "sisingamangaraja", "", []string{"Masjid Agung Al-Azhar"}, 1},
		{"city spelled differently from the address", "pangkal pinang", "", []string{"Masjid Jamik Pangkalpinang"}, 1},
		{"city shared by several masjids", "jakarta", "", []string{"Masjid Agung Al-Azhar", "Masjid Sunda Kelapa"}, 2},
		{"soft deleted masjid stays hidden", "retired", "", []string{}, 0},
		{"soft deleted masjid stays hidden by district", "sawah besar", "", []string{}, 0},
		{"inactive masjid stays hidden", "nonaktif", "", []string{}, 0},
		{"city filter", "", "jakarta", []string{"Masjid Agung Al-Azhar", "Masjid Sunda Kelapa"}, 2},
		{"search and city filter together", "menteng", "jakarta", []string{"Masjid Sunda Kelapa"}, 1},
		{"no search lists every visible masjid", "", "", []string{"Masjid Agung Al-Azhar", "Masjid Jamik Pangkalpinang", "Masjid Sunda Kelapa"}, 3},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			list, total, err := repo.FindAll(tc.search, tc.city, "", 50, 0)
			if err != nil {
				t.Fatalf("FindAll: %v", err)
			}
			if got := masjidNames(list); !equalStrings(got, tc.want) {
				t.Fatalf("expected %v, got %v", tc.want, got)
			}
			if total != tc.wantTotal {
				t.Fatalf("expected total %d, got %d", tc.wantTotal, total)
			}
		})
	}

	page, total, err := repo.FindAll("jakarta", "", "", 1, 1)
	if err != nil {
		t.Fatalf("FindAll page: %v", err)
	}
	if want := []string{"Masjid Sunda Kelapa"}; !equalStrings(masjidNames(page), want) {
		t.Fatalf("expected second page %v, got %v", want, masjidNames(page))
	}
	if total != 2 {
		t.Fatalf("expected paged total 2, got %d", total)
	}
}
