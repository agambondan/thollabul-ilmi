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

var qariCatalog = []qariInfo{
	{
		Name:         "Mishary Rashid Al-Afasy",
		Slug:         "mishary-rashid-alafasy",
		EveryAyahDir: "Alafasy_128kbps",
		QuranicAudio: "mishaari_raashid_al-`afaasee",
	},
	{
		Name:         "Abdurrahman As-Sudais",
		Slug:         "abdurrahman-as-sudais",
		EveryAyahDir: "Abdurrahmaan_As-Sudais_192kbps",
		QuranicAudio: "abdurrahmaan_as-sudays",
	},
	{
		Name:         "Abdul Basit Abdul Samad",
		Slug:         "abdul-basit",
		EveryAyahDir: "Abdul_Basit_Murattal_192kbps",
		QuranicAudio: "abdul_basit",
	},
	{
		Name:         "Saad Al-Ghamidi",
		Slug:         "saad-al-ghamidi",
		EveryAyahDir: "Saad_Al-Ghamidi_128kbps",
		QuranicAudio: "sa`d_al-ghaamidi",
	},
	{
		Name:         "Yasser Al-Dosari",
		Slug:         "yasser-al-dosari",
		EveryAyahDir: "Yasser_Ad-Dosari_128kbps",
		QuranicAudio: "yaasir_ad-dusaari",
	},
	{
		Name:         "Maher Al-Muaiqly",
		Slug:         "maher-al-muaiqly",
		EveryAyahDir: "Maher_Al-Muaiqly_128kbps",
		QuranicAudio: "maahir_ibnaa_`ali_haashim_ibn_`abdul_`aziiz_al-mu`ayqiliy",
	},
	{
		Name:         "Hani Ar-Rifai",
		Slug:         "hani-ar-rifai",
		EveryAyahDir: "Hani_Rifai_192kbps",
		QuranicAudio: "haani_ar-rifaa`i",
	},
	{
		Name:         "Salah Bukhatir",
		Slug:         "salah-bukhatir",
		EveryAyahDir: "Salah_Bukhatir_128kbps",
		QuranicAudio: "salaah_`abdul_`aziiz_bukhaatir",
	},
	{
		Name:         "Abdullah Al-Juhany",
		Slug:         "abdullah-al-juhany",
		EveryAyahDir: "Abdullah_Al_Juhany_128kbps",
		QuranicAudio: "abdullaah_`abdul_`aziiz_`abdullaah_aal-juhany",
	},
	{
		Name:         "Ali Abdurrahman Al-Hudhaify",
		Slug:         "ali-al-hudhaify",
		EveryAyahDir: "Ali_Bin_Abdur_Rahman_Al_Huthaify_128kbps",
		QuranicAudio: "`ali_ibn_`abd_ar-rahman_al-hudhaify",
	},
}

func surahAudioURL(q qariInfo, surahNum int) string {
	return fmt.Sprintf("https://download.quranicaudio.com/quran/%s/%03d.mp3", q.QuranicAudio, surahNum)
}

func ayahAudioURL(q qariInfo, surahNum, ayahNum int) string {
	return fmt.Sprintf("https://everyayah.com/data/%s/%03d%03d.mp3", q.EveryAyahDir, surahNum, ayahNum)
}

func SeedAudioFromCDN(db *gorm.DB) {
	var surahCount int64
	db.Model(&model.Surah{}).Count(&surahCount)
	if surahCount == 0 {
		log.Println("[seeder] surah table empty — skipping SeedAudioFromCDN")
		return
	}

	var surahs []struct {
		ID     int
		Number int
	}
	db.Raw("SELECT id, number FROM surah WHERE deleted_at IS NULL ORDER BY number").Scan(&surahs)
	if len(surahs) == 0 {
		return
	}

	var ayahs []struct {
		ID          int
		Number      int
		SurahNumber int
	}
	db.Raw(`
		SELECT ayah.id, ayah.number, surah.number AS surah_number
		FROM ayah JOIN surah ON surah.id = ayah.surah_id
		WHERE ayah.deleted_at IS NULL AND surah.deleted_at IS NULL
		ORDER BY surah.number, ayah.number
	`).Scan(&ayahs)

	for _, q := range qariCatalog {
		seedSurahAudioForQari(db, &surahs, q)
		seedAyahAudioForQari(db, &ayahs, q)
	}
}

func seedSurahAudioForQari(db *gorm.DB, surahs *[]struct {
	ID     int
	Number int
}, q qariInfo) {
	var count int64
	db.Model(&model.SurahAudio{}).
		Where("qari_slug = ?", q.Slug).
		Count(&count)
	if count > 0 {
		return
	}

	log.Printf("[seeder] surah audio: %s (%s)", q.Name, q.Slug)
	for _, s := range *surahs {
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

func seedAyahAudioForQari(db *gorm.DB, ayahs *[]struct {
	ID          int
	Number      int
	SurahNumber int
}, q qariInfo) {
	var count int64
	db.Model(&model.AyahAudio{}).
		Where("qari_slug = ?", q.Slug).
		Count(&count)
	if count > 0 {
		return
	}

	log.Printf("[seeder] ayah audio: %s (%s) — %d ayah", q.Name, q.Slug, len(*ayahs))
	batchSize := 100
	for i := 0; i < len(*ayahs); i += batchSize {
		end := i + batchSize
		if end > len(*ayahs) {
			end = len(*ayahs)
		}
		batch := (*ayahs)[i:end]
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
			log.Printf("[seeder]   ayah %s: %d/%d", q.Slug, end, len(*ayahs))
		}
	}
}
