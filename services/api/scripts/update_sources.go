//go:build ignore

// Update field `source` pada tabel doa, dzikir, dan sholat_guide
// dengan referensi lengkap: nomor hadits + derajat keshahihan.
//
// Safe to re-run — hanya UPDATE berdasarkan title, tidak insert ulang.
//
// Usage:
//
//	go run scripts/update_sources.go
//	DB_HOST=localhost DB_PORT=54320 DB_USER=postgres DB_PASS=postgres DB_NAME=thullabul_ilmi go run scripts/update_sources.go
package main

import (
	"fmt"
	"log"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func main() {
	for _, envFile := range []string{".env.local", ".env"} {
		if err := lib.LoadEnvironmentLocalFlag(envFile); err == nil {
			log.Printf("Config: %s", envFile)
			break
		}
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		viper.GetString("db_host"),
		viper.GetString("db_port"),
		viper.GetString("db_user"),
		viper.GetString("db_pass"),
		viper.GetString("db_name"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Warn),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatalf("koneksi DB gagal: %v", err)
	}

	total := 0
	total += updateTable(db, "doa", doaSources)
	total += updateTable(db, "dzikir", dzikirSources)
	total += updateTable(db, "sholat_guide", sholatGuideSources)
	log.Printf("Selesai: %d records diupdate", total)
}

func updateTable(db *gorm.DB, table string, sources map[string]string) int {
	n := 0
	for title, source := range sources {
		res := db.Exec(
			fmt.Sprintf("UPDATE %s SET source = ? WHERE title = ? AND deleted_at IS NULL", table),
			source, title,
		)
		if res.Error != nil {
			log.Printf("[%s] %q: %v", table, title, res.Error)
			continue
		}
		if res.RowsAffected > 0 {
			n += int(res.RowsAffected)
		}
	}
	log.Printf("%s: %d updated", table, n)
	return n
}

// ─── DOA ────────────────────────────────────────────────────────────────────

var doaSources = map[string]string{
	"Doa Bangun Tidur":      "HR. Bukhari No. 6312; Shahih",
	"Doa Pagi (Ashabna)":    "HR. Muslim No. 2723; HR. Abu Dawud No. 5076; Shahih",
	"Doa Petang (Amsainaa)": "HR. Muslim No. 2723; Shahih",

	"Doa Sebelum Tidur":           "HR. Bukhari No. 6324; HR. Muslim No. 2711; Shahih",
	"Doa Sebelum Tidur (Al-Mulk)": "HR. Bukhari No. 6312; HR. Muslim No. 2711; Shahih",

	"Doa Sebelum Makan": "HR. Abu Dawud No. 3767; Hasan Shahih (Al-Albani)",
	"Doa Setelah Makan": "HR. Abu Dawud No. 3850; HR. Tirmidzi No. 3457; Hasan Shahih",

	"Doa Masuk Kamar Mandi":  "HR. Bukhari No. 142; HR. Muslim No. 375; Shahih",
	"Doa Keluar Kamar Mandi": "HR. Abu Dawud No. 30; HR. Tirmidzi No. 7; HR. Ibnu Majah No. 301; Shahih",

	"Doa Masuk Masjid":  "HR. Muslim No. 713; HR. Ibnu Majah No. 772; Shahih",
	"Doa Keluar Masjid": "HR. Muslim No. 713; HR. Ibnu Majah No. 773; Shahih",

	"Doa Naik Kendaraan": "HR. Muslim No. 1342; HR. Abu Dawud No. 2602; Shahih",
	"Doa Bepergian":      "HR. Muslim No. 1342; Shahih",

	// QS tetap, tidak perlu nomor hadits
	// "Doa Sebelum Belajar" → QS. Thaha: 114

	"Doa Perlindungan (Sayyidul Istighfar)":            "HR. Bukhari No. 6306; Shahih",
	"Doa Mohon Keteguhan Hati":                         "HR. Tirmidzi No. 2140; Hasan Shahih",
	"Doa Masuk Rumah":                                  "HR. Abu Dawud No. 5096; HR. Ibnu Majah No. 3882; Hasan",
	"Doa Perlindungan dari Ilmu yang Tidak Bermanfaat": "HR. Muslim No. 2722; HR. Abu Dawud No. 1548; HR. Tirmidzi No. 3482; Shahih",
}

// ─── DZIKIR ─────────────────────────────────────────────────────────────────

var dzikirSources = map[string]string{
	"Tasbih Pagi":   "HR. Bukhari No. 6405; HR. Muslim No. 2691; Shahih",
	"Tasbih Petang": "HR. Bukhari No. 6405; HR. Muslim No. 2691; Shahih",

	"Dzikir Pagi (Sayyidul Istighfar)": "HR. Bukhari No. 6306; Shahih",
	"Doa Perlindungan Petang":          "HR. Muslim No. 2709; HR. Tirmidzi No. 3604; Shahih",

	"Tasbih Tahmid Takbir":     "HR. Muslim No. 597; Shahih",
	"Istighfar Setelah Sholat": "HR. Muslim No. 591; Shahih",

	"Tasbih Sebelum Tidur":                      "HR. Bukhari No. 3113; HR. Muslim No. 2727; Shahih",
	"Al-Ikhlas, Al-Falaq, An-Nas sebelum tidur": "HR. Bukhari No. 5017; HR. Abu Dawud No. 5056; Shahih",

	"Doa Naik Kendaraan":      "HR. Muslim No. 1342; HR. Abu Dawud No. 2602; HR. Tirmidzi No. 3446; Shahih",
	"Hauqalah":                "HR. Bukhari No. 6384; HR. Muslim No. 2704; Shahih",
	"Basmalah":                "QS. Al-Fatihah: 1; QS. An-Naml: 30",
	"Istirja' (Inna lillahi)": "QS. Al-Baqarah: 156; HR. Muslim No. 918; Shahih",

	"Perbanyak Sholawat di Hari Jumat":     "HR. Al-Baihaqi No. 3/249; Shahih (Al-Albani, Shahihul Jami' No. 1209)",
	"Membaca Surat Al-Kahfi di Hari Jumat": "HR. Al-Hakim No. 2/368; Shahihul Jami' No. 6470 (Al-Albani: Shahih)",

	"Doa Terbaik Hari Arafah":               "HR. Tirmidzi No. 3585; Hasan Shahih",
	"Takbir Hari Tasyrik (9-13 Dzulhijjah)": "HR. Ahmad; Ibnu Abi Syaibah; Atsar para Sahabat; Shahih",

	"Doa Lailatul Qadar":                     "HR. Tirmidzi No. 3513; Shahih",
	"Qiyamul Lail 10 Malam Terakhir Ramadan": "HR. Bukhari No. 2017; HR. Muslim No. 1169; Shahih",

	"Doa Berbuka Puasa":     "HR. Abu Dawud No. 2358; HR. Ibnu Majah No. 1753; Hasan",
	"Doa Menyambut Ramadan": "HR. Ahmad No. 2346; Diperselisihkan — Ibn Rajab: Hasan",
	"Niat Puasa Ramadan":    "Ijma' Ulama; HR. Nasai No. 2314; Shahih",

	"Takbiran Idul Fitri":          "QS. Al-Baqarah: 185; HR. Al-Baihaqi No. 3/315; Shahih",
	"Ucapan Selamat Hari Raya":     "HR. Ahmad; Ibnu Hajar, Fathul Bari 2/446; Shahih",
	"Takbiran Idul Adha":           "QS. Al-Hajj: 28; HR. Al-Baihaqi; Shahih",
	"Doa Menyembelih Hewan Kurban": "HR. Muslim No. 1966; HR. Abu Dawud No. 2795; Shahih",
}

// ─── SHOLAT GUIDE ────────────────────────────────────────────────────────────

var sholatGuideSources = map[string]string{
	// Step 1 sudah lengkap, tidak diupdate

	"Takbiratul Ihram":   "HR. Bukhari No. 735; HR. Muslim No. 390; Shahih",
	"Doa Iftitah":        "HR. Bukhari No. 744; HR. Muslim No. 598; Shahih",
	"Membaca Al-Fatihah": "HR. Bukhari No. 756; HR. Muslim No. 394; Shahih",
	"Membaca Surah/Ayat": "HR. Bukhari No. 776; HR. Muslim No. 452; Shahih",

	"Rukuk":                     "HR. Muslim No. 772; HR. Abu Dawud No. 869; Shahih",
	"I'tidal":                   "HR. Bukhari No. 796; HR. Muslim No. 392; Shahih",
	"Sujud Pertama":             "HR. Muslim No. 771; HR. Abu Dawud No. 875; Shahih",
	"Duduk di antara Dua Sujud": "HR. Abu Dawud No. 850; HR. Tirmidzi No. 284; HR. Ibnu Majah No. 898; Shahih",
	"Sujud Kedua":               "HR. Muslim No. 771; Shahih",
	"Tasyahhud Akhir":           "HR. Bukhari No. 831; HR. Muslim No. 402; Shahih",
	"Salam":                     "HR. Abu Dawud No. 975; HR. Ibnu Majah No. 275; Shahih",
}
