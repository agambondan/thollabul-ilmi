package migrations

import (
	"fmt"
	"log"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type qariInfo struct {
	Name         string
	Slug         string
	EveryAyahDir string
	QuranicAudio string
}

var defaultQari = qariInfo{
	Name:         "Mishary Rashid Al-Afasy",
	Slug:         "mishary-rashid-alafasy",
	EveryAyahDir: "Alafasy_128kbps",
	QuranicAudio: "mishaari_raashid_al-`afaasee",
}

func surahAudioURL(q qariInfo, surahNum int) string {
	return fmt.Sprintf("https://download.quranicaudio.com/quran/%s/%03d.mp3", q.QuranicAudio, surahNum)
}

func ayahAudioURL(q qariInfo, surahNum, ayahNum int) string {
	return fmt.Sprintf("https://everyayah.com/data/%s/%03d%03d.mp3", q.EveryAyahDir, surahNum, ayahNum)
}

func SeedAudioFromCDN(db *gorm.DB) {
	q := defaultQari

	var surahCount int64
	db.Model(&model.Surah{}).Count(&surahCount)
	if surahCount == 0 {
		log.Println("[seeder] surah table empty — skipping SeedAudioFromCDN")
		return
	}

	var audioCount int64
	db.Model(&model.SurahAudio{}).Count(&audioCount)
	if audioCount > 0 {
		log.Println("[seeder] surah audio already seeded — skipping")
	} else {
		type surahRow struct {
			ID     int
			Number int
		}
		var surahs []surahRow
		db.Raw("SELECT id, number FROM surah WHERE deleted_at IS NULL ORDER BY number").Scan(&surahs)
		log.Printf("[seeder] seed surah audio: %d surah", len(surahs))

		for _, s := range surahs {
			row := model.SurahAudio{
				SurahID:  &s.ID,
				QariName: q.Name,
				QariSlug: q.Slug,
				AudioURL: surahAudioURL(q, s.Number),
			}
			db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "surah_id"}, {Name: "qari_slug"}},
				DoUpdates: clause.AssignmentColumns([]string{"audio_url", "qari_name"}),
			}).Create(&row)
		}
	}

	var ayahCount int64
	db.Model(&model.AyahAudio{}).Count(&ayahCount)
	if ayahCount > 0 {
		log.Println("[seeder] ayah audio already seeded — skipping")
		return
	}

	type ayahRow struct {
		ID          int
		Number      int
		SurahNumber int
	}
	var ayahs []ayahRow
	db.Raw(`
		SELECT ayah.id, ayah.number, surah.number AS surah_number
		FROM ayah JOIN surah ON surah.id = ayah.surah_id
		WHERE ayah.deleted_at IS NULL AND surah.deleted_at IS NULL
		ORDER BY surah.number, ayah.number
	`).Scan(&ayahs)

	log.Printf("[seeder] seed ayah audio: %d ayah", len(ayahs))
	batchSize := 100
	for i := 0; i < len(ayahs); i += batchSize {
		end := i + batchSize
		if end > len(ayahs) {
			end = len(ayahs)
		}
		batch := ayahs[i:end]
		for _, a := range batch {
			row := model.AyahAudio{
				AyahID:   &a.ID,
				QariName: q.Name,
				QariSlug: q.Slug,
				AudioURL: ayahAudioURL(q, a.SurahNumber, a.Number),
			}
			db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "ayah_id"}, {Name: "qari_slug"}},
				DoUpdates: clause.AssignmentColumns([]string{"audio_url", "qari_name"}),
			}).Create(&row)
		}
		if (i/batchSize+1)%10 == 0 {
			log.Printf("[seeder]   ayah %d/%d", end, len(ayahs))
		}
	}
	log.Printf("[seeder] ayah audio selesai: %d entri", len(ayahs))
}
