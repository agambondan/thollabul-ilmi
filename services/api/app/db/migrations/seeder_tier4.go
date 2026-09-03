package migrations

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func SeedTier4(db *gorm.DB) {
	seedAsbabunNuzul(db)
	seedBlogPosts(db)
	seedUserWird(db)
}

// asbabunNuzulSeed is the in-memory shape used to build AsbabunNuzul rows.
// Each entry must reference a verified source (kitab + nomor) — see
// MEMORY.md "Islamic data seeding harus shahih". Riwayat yang takhrij-nya
// kabur tidak boleh dimasukkan ke seeder ini.
type asbabunNuzulSeed struct {
	Title    string
	Narrator string
	SurahID  int
	AyahFrom int
	AyahTo   int
	Content  string
	Source   string
}

func seedAsbabunNuzul(db *gorm.DB) {
	data := verifiedAsbabunNuzulDataset()
	fmt.Printf("Seeding Asbabun Nuzul (%d entri terverifikasi)...\n", len(data))

	for _, s := range data {
		ayahs, displayRef, err := resolveAyahsForAsbab(db, s)
		if err != nil {
			fmt.Printf("Warning: %s — %v\n", s.Title, err)
			continue
		}

		var existing model.AsbabunNuzul
		err = db.Where("title = ?", s.Title).First(&existing).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			translationID := upsertAsbabunNuzulTranslation(db, nil, s)
			item := model.AsbabunNuzul{
				Title:         s.Title,
				Narrator:      s.Narrator,
				Content:       s.Content,
				Source:        s.Source,
				DisplayRef:    displayRef,
				TranslationID: translationID,
				Ayahs:         ayahs,
			}
			if err := db.Create(&item).Error; err != nil {
				fmt.Printf("Warning: create %s: %v\n", s.Title, err)
			}
			continue
		}
		if err != nil {
			fmt.Printf("Warning: lookup %s: %v\n", s.Title, err)
			continue
		}

		existing.Narrator = s.Narrator
		existing.Content = s.Content
		existing.Source = s.Source
		existing.DisplayRef = displayRef
		existing.TranslationID = upsertAsbabunNuzulTranslation(db, existing.TranslationID, s)
		if err := db.Save(&existing).Error; err != nil {
			fmt.Printf("Warning: update %s: %v\n", s.Title, err)
			continue
		}
		if err := db.Model(&existing).Association("Ayahs").Replace(ayahs); err != nil {
			fmt.Printf("Warning: replace ayahs %s: %v\n", s.Title, err)
		}
	}
}

func upsertAsbabunNuzulTranslation(db *gorm.DB, existingID *int, s asbabunNuzulSeed) *int {
	tr := model.Translation{
		Idn:            stringPtr(s.Title),
		LatinIdn:       stringPtr(s.Narrator),
		DescriptionIdn: stringPtr(s.Content),
	}
	if existingID != nil {
		tr.ID = existingID
		if err := db.Save(&tr).Error; err != nil {
			fmt.Printf("Warning: update translation for %s: %v\n", s.Title, err)
		}
		return existingID
	}
	if err := db.Create(&tr).Error; err != nil {
		fmt.Printf("Warning: create translation for %s: %v\n", s.Title, err)
		return nil
	}
	return tr.ID
}

// resolveAyahsForAsbab loads the [from..to] range of ayat for a given surah,
// builds the canonical DisplayRef string, and returns both. Fails if any ayat
// in the range is missing — better to skip than seed a partial reference.
func resolveAyahsForAsbab(db *gorm.DB, s asbabunNuzulSeed) ([]model.Ayah, string, error) {
	var surah model.Surah
	if err := db.Preload("Translation").Where("number = ?", s.SurahID).First(&surah).Error; err != nil {
		return nil, "", fmt.Errorf("surah %d not found", s.SurahID)
	}

	if s.AyahTo < s.AyahFrom {
		s.AyahTo = s.AyahFrom
	}

	var ayahs []model.Ayah
	if err := db.
		Where("surah_id = ? AND number BETWEEN ? AND ?", surah.ID, s.AyahFrom, s.AyahTo).
		Order("number ASC").
		Find(&ayahs).Error; err != nil {
		return nil, "", err
	}
	expected := s.AyahTo - s.AyahFrom + 1
	if len(ayahs) != expected {
		return nil, "", fmt.Errorf("expected %d ayat for QS %d:%d-%d, got %d",
			expected, s.SurahID, s.AyahFrom, s.AyahTo, len(ayahs))
	}

	displayRef := buildDisplayRef(&surah, s.AyahFrom, s.AyahTo)
	return ayahs, displayRef, nil
}

func buildDisplayRef(surah *model.Surah, from, to int) string {
	name := ""
	if surah.Identifier != nil {
		name = strings.TrimSpace(*surah.Identifier)
	}
	if name == "" && surah.Translation != nil && surah.Translation.LatinEn != nil {
		name = strings.TrimSpace(*surah.Translation.LatinEn)
	}
	num := 0
	if surah.Number != nil {
		num = *surah.Number
	}
	if name == "" {
		name = fmt.Sprintf("Surah %d", num)
	}
	if from == to {
		return fmt.Sprintf("QS. %s %d:%d", name, num, from)
	}
	return fmt.Sprintf("QS. %s %d:%d-%d", name, num, from, to)
}

func seedBlogPosts(db *gorm.DB) {
	fmt.Println("Seeding Blog Posts...")

	adminID := uuid.MustParse("00000000-0000-0000-0000-000000000001")

	now := time.Now()
	categoryID := func(cat model.BlogCategory) *int {
		if cat.ID == nil {
			return nil
		}
		return ptrInt(*cat.ID)
	}
	posts := []model.BlogPost{
		{
			BaseUUID:   model.BaseUUID{ID: uuid.New()},
			AuthorID:   adminID,
			CategoryID: categoryID(lookupCategory(db, "quran-tafsir")),
			Title:      "Keutamaan Membaca Al-Quran Setiap Hari",
			Slug:       "keutamaan-membaca-al-quran",
			Excerpt:    "Membaca Al-Quran adalah ibadah yang sangat mulia dengan pahala yang berlipat ganda.",
			Content:    "<p>Al-Quran adalah kalamullah yang diturunkan kepada Nabi Muhammad SAW sebagai petunjuk bagi umat manusia. Membacanya bukan sekadar rutinitas, melainkan sarana komunikasi dengan Sang Pencipta. Rasulullah SAW bersabda bahwa setiap huruf yang dibaca akan mendapatkan satu kebaikan, dan satu kebaikan dilipatgandakan menjadi sepuluh.</p><p>Selain pahala, Al-Quran juga akan menjadi syafaat (penolong) bagi pembacanya di hari kiamat kelak. Mari luangkan waktu minimal 15-30 menit setiap hari untuk berinteraksi dengan wahyu ilahi ini.</p>",
			Status:     model.BlogStatusPublished,
			PublishedAt: &now,
		},
		{
			BaseUUID:   model.BaseUUID{ID: uuid.New()},
			AuthorID:   adminID,
			CategoryID: categoryID(lookupCategory(db, "hadith-sunnah")),
			Title:      "Mengenal Kitab Arbain Nawawi",
			Slug:       "mengenal-arbain-nawawi",
			Excerpt:    "Kitab legendaris yang memuat 42 hadis pokok dalam ajaran Islam.",
			Content:    "<p>Kitab Al-Arba'in An-Nawawiyah karya Imam An-Nawawi adalah salah satu kitab hadis paling populer di dunia Islam. Meskipun judulnya 'Arbain' (Empat Puluh), sebenarnya kitab ini memuat 42 hadis yang dianggap sebagai pondasi atau poros agama Islam.</p><p>Hadis-hadis di dalamnya mencakup berbagai aspek: niat, rukun Islam, iman, ihsan, takdir, hingga adab dan akhlak. Mempelajari kitab ini sangat direkomendasikan bagi setiap muslim sebagai langkah awal memahami sunnah Nabi SAW secara komprehensif.</p>",
			Status:     model.BlogStatusPublished,
			PublishedAt: &now,
		},
	}
	postTags := map[string][]string{
		"keutamaan-membaca-al-quran": {"quran", "tilawah", "hafalan"},
		"mengenal-arbain-nawawi":     {"hadith", "fiqh", "akhlak"},
	}

	// Seed extended articles (konten tambahan)
	extendedPosts, extendedTags := seedExtendedBlogPosts(db, adminID, now)
	posts = append(posts, extendedPosts...)
	for slug, slugs := range extendedTags {
		postTags[slug] = slugs
	}

	for _, p := range posts {
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"category_id", "title", "excerpt", "content", "status", "published_at"}),
		}).Create(&p).Error; err != nil {
			fmt.Printf("Warning: upsert blog post %s: %v\n", p.Slug, err)
			continue
		}

		slugs := postTags[p.Slug]
		if len(slugs) == 0 {
			continue
		}
		var saved model.BlogPost
		if err := db.Where("slug = ?", p.Slug).First(&saved).Error; err != nil {
			fmt.Printf("Warning: lookup blog post %s: %v\n", p.Slug, err)
			continue
		}
		var tags []model.BlogTag
		if err := db.Where("slug IN ?", slugs).Find(&tags).Error; err != nil {
			fmt.Printf("Warning: lookup blog tags for %s: %v\n", p.Slug, err)
			continue
		}
		if len(tags) == 0 {
			continue
		}
		if err := db.Model(&saved).Association("Tags").Replace(tags); err != nil {
			fmt.Printf("Warning: replace blog tags for %s: %v\n", p.Slug, err)
		}
	}
}

// helper: lookupCategory returns the BlogCategory row matching the given slug.
// We call this from within the loop below — defined at package level so the
// inline closure inside seedBlogPosts can use it.
func lookupCategory(db *gorm.DB, slug string) model.BlogCategory {
	var cat model.BlogCategory
	db.Where("slug = ?", slug).First(&cat)
	return cat
}

func seedExtendedBlogPosts(
	db *gorm.DB,
	authorID uuid.UUID,
	now time.Time,
) ([]model.BlogPost, map[string][]string) {
	entries := getExtendedBlogSeedEntries()
	posts := make([]model.BlogPost, 0, len(entries))
	tags := make(map[string][]string, len(entries))

	for _, e := range entries {
		cat := lookupCategory(db, e.CategorySlug)
		posts = append(posts, model.BlogPost{
			BaseUUID:    model.BaseUUID{ID: uuid.New()},
			AuthorID:    authorID,
			CategoryID:  ptrIntOrNil(cat),
			Title:       e.Title,
			Slug:        e.Slug,
			Excerpt:     e.Excerpt,
			Content:     e.Content,
			Status:      model.BlogStatusPublished,
			PublishedAt: &now,
		})
		tags[e.Slug] = e.Tags
	}
	return posts, tags
}

func ptrIntOrNil(cat model.BlogCategory) *int {
	if cat.ID == nil {
		return nil
	}
	return ptrInt(*cat.ID)
}

func seedUserWird(db *gorm.DB) {
	fmt.Println("Seeding User Wird...")

	adminID := uuid.MustParse("00000000-0000-0000-0000-000000000001")

	wirds := []model.UserWird{
		{
			BaseUUID:        model.BaseUUID{ID: uuid.New()},
			UserID:          adminID,
			Title:           "Tasbih, Tahmid, Takbir",
			Arabic:          "سُبْحَانَ اللهِ، وَالْحَمْدُ لِلهِ، وَاللهُ أَكْبَرُ",
			Transliteration: "Subhanallah, Alhamdulillah, Allahu Akbar",
			Translation:     "Maha Suci Allah, Segala Puji bagi Allah, Allah Maha Besar",
			Count:           33,
			Occasion:        "Setelah Sholat",
			Note:            "Dibaca masing-masing 33 kali setelah sholat fardhu.",
		},
		{
			BaseUUID:        model.BaseUUID{ID: uuid.New()},
			UserID:          adminID,
			Title:           "Istighfar",
			Arabic:          "أَسْتَغْفِرُ اللهَ الْعَظِيمَ",
			Transliteration: "Astaghfirullahal 'adzim",
			Translation:     "Aku memohon ampun kepada Allah Yang Maha Agung",
			Count:           100,
			Occasion:        "Umum",
			Note:            "Rutinkan membaca istighfar minimal 100 kali sehari.",
		},
	}

	for _, w := range wirds {
		// We don't have a unique constraint on Title for UserWird in the model,
		// but for seeding we'll check by UserID and Title.
		var existing model.UserWird
		if err := db.Where("user_id = ? AND title = ?", w.UserID, w.Title).First(&existing).Error; err != nil {
			db.Create(&w)
		} else {
			w.ID = existing.ID
			db.Save(&w)
		}
	}
}

func ptrInt(i int) *int {
	return &i
}
