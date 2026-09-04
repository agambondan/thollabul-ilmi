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
			Title:      "Keutamaan Membaca Al-Quran Setiap Hari Menurut Sunnah",
			Slug:       "keutamaan-membaca-al-quran",
			Excerpt:    "Mengulas keutamaan membaca dan mentadabburi Al-Quran setiap hari, ganjaran pahala per huruf, syafaat di yaumil qiyamah, serta adab-adab tilawah.",
			Content: `## Al-Quran: Mukjizat Abadi dan Petunjuk Hidup

Al-Quran Al-Karim adalah *Kalamullah* (perkataan Allah) yang diturunkan kepada Nabi Muhammad ﷺ melalui perantara Malaikat Jibril 'alaihissalam sebagai petunjuk yang menerangi gulitanya kehidupan manusia. Membacanya adalah ibadah agung yang bernilai pahala berlipat ganda, menguatkan jiwa, dan menjadi penawar bagi berbagai penyakit hati.

Allah Ta'ala berfirman:

> "Sesungguhnya orang-orang yang selalu membaca Kitab Allah dan mendirikan sholat dan menafkahkan sebahagian dari rezeki yang Kami anugerahkan kepada mereka dengan diam-diam dan terang-terangan, mereka itu mengharapkan perniagaan yang tidak akan merugi, agar Allah menyempurnakan kepada mereka pahala mereka dan menambah kepada mereka dari karunia-Nya. Sesungguhnya Allah Maha Pengampun lagi Maha Mensyukuri."
> *([QS. Fathir: 29–30](/quran/35#29))*

Para ulama menamai perdagangan dengan Al-Quran sebagai *tijaratan lan tabur* (perdagangan yang mustahil merugi) karena keuntungan yang dijanjikan bukan kenikmatan fana duniawi, melainkan keridhaan dan surga Allah Ta'ala.

## 5 Keutamaan Agung Membaca Al-Quran

### 1. Setiap Huruf Diberi Balasan Sepuluh Kebaikan
Kemurahan Allah melimpah ruah bagi para pembaca Kitab-Nya. Pahala tidak dihitung per kata atau per kalimat, melainkan dihitung secara mendetail per huruf yang dilafalkan dengan lisan.

Rasulullah ﷺ bersabda:

> "Barangsiapa yang membaca satu huruf dari Kitabullah (Al-Quran), maka baginya satu kebaikan. Dan satu kebaikan itu dilipatgandakan menjadi sepuluh kebaikan semisal. Aku tidak mengatakan *Alif Lam Mim* itu satu huruf, akan tetapi *Alif* satu huruf, *Lam* satu huruf, dan *Mim* satu huruf."
> *([HR. At-Tirmidzi no. 2910](/hadith/tirmidzi/2910), dishahihkan oleh Syaikh Al-Albani)*

Bayangkan jika seorang muslim membaca satu halaman mushaf standar Madinah yang rata-rata memuat sekitar 600–700 huruf, maka dalam satu halaman tersebut terdapat setidaknya 6.000 hingga 7.000 kebaikan yang tersimpan di lembaran amalannya.

### 2. Menjadi Syafaat (Penolong) di Hari Kiamat
Ketika manusia berada di padang mahsyar dalam keadaan ketakutan dan membutuhkan perlindungan, Al-Quran akan datang membela orang-orang yang setia membacanya sewaktu di dunia.

Dari Abu Umamah Al-Bahili radhiyallahu 'anhu, Rasulullah ﷺ bersabda:

> "Bacalah Al-Quran, karena sesungguhnya ia akan datang pada hari kiamat sebagai pemberi syafaat bagi para pembacanya."
> *([HR. Muslim no. 804](/hadith/muslim/804))*

### 3. Bersama Para Malaikat yang Mulia
Keutamaan ini berlaku bagi siapa saja, baik yang telah mahir membaca maupun yang masih terbata-bata dalam mengeja tajwid.

Aisyah radhiyallahu 'anha meriwayatkan sabda Rasulullah ﷺ:

> "Orang yang mahir membaca Al-Quran akan bersama para malaikat yang mulia lagi taat. Sedangkan orang yang membaca Al-Quran dengan terbata-bata dan merasa kesulitan, maka baginya dua pahala (pahala membaca dan pahala atas kesungguhannya berusaha)."
> *([HR. Bukhari no. 4937](/hadith/bukhari/4937) dan [HR. Muslim no. 798](/hadith/muslim/798))*

Maka jangan pernah merasa minder atau putus asa jika lidah masih kaku dalam melafalkan makharijul huruf; setiap tetes perjuangan kita dihargai ganda oleh Allah Yang Maha Pemurah.

### 4. Mengangkat Derajat Seseorang di Surga
Tingkatan surga seseorang berbanding lurus dengan banyaknya hafalan dan tilawah yang dilakukannya dengan tartil.

> "Akan dikatakan kepada pembaca Al-Quran (pada hari kiamat): 'Bacalah, naiklah, dan tartilkanlah sebagaimana engkau mentartilkannya sewaktu di dunia. Karena kedudukanmu berada pada akhir ayat yang engkau baca.'"
> *([HR. Abu Dawud no. 1464](/hadith/abu-daud/1464) dan [HR. At-Tirmidzi no. 2914](/hadith/tirmidzi/2914))*

### 5. Menjadi Rumah yang Bercahaya dan Dipenuhi Ketenangan
Rumah yang di dalamnya dibacakan kalam ilahi akan dikunjungi para malaikat, dijauhi setan, dilapangkan bagi penghuninya, dan dipenuhi keberkahan. Sebaliknya, rumah yang sunyi dari bacaan Al-Quran ibarat kuburan yang gelap gulita.

## Adab-Adab Membaca Al-Quran

Agar bacaan mendatangkan keberkahan maksimal, seorang muslim selayaknya memperhatikan adab-adab berikut:

- **Ikhlas:** Membersihkan niat dari riya' dan keinginan dipuji manusia.
- **Bersuci:** Dalam keadaan berwudhu dan membersihkan mulut dengan siwak atau sikat gigi.
- **Menghadap Kiblat:** Duduk dengan sopan dan penuh ketenangan.
- **Membaca Isti'adzah dan Basmalah:** Memohon perlindungan dari godaan setan sebelum memulai bacaan *(QS. An-Nahl: 98)*.
- **Tartil dan Memperhatikan Tajwid:** Membaca perlahan, memperjelas huruf, dan tidak terburu-buru mengejar khatam.
- **Tadabbur:** Merenungi makna ancaman, janji nikmat, kisah teladan, dan perintah yang termaktub di dalamnya.

Mulailah berkomitmen meluangkan waktu khusus (misal setelah sholat Subuh atau sebelum tidur) minimal 1 juz atau 1 ruku' setiap hari. Istiqomah pada amalan yang sedikit jauh lebih dicintai Allah daripada amalan banyak yang terputus-putus.`,
			Status:     model.BlogStatusPublished,
			PublishedAt: &now,
		},
		{
			BaseUUID:   model.BaseUUID{ID: uuid.New()},
			AuthorID:   adminID,
			CategoryID: categoryID(lookupCategory(db, "hadith-sunnah")),
			Title:      "Mengenal Kitab Arbain Nawawi: Poros Dasar Ajaran Islam",
			Slug:       "mengenal-arbain-nawawi",
			Excerpt:      "Ulasan mendalam kitab Al-Arba'in An-Nawawiyah karya Imam An-Nawawi, latar belakang penulisan, metode penyusunan hadits, dan faedah mempelajarinya.",
			Content: `## Mahakarya Imam An-Nawawi

Di antara ratusan kitab hadits yang beredar di perpustakaan Islam, tidak ada kitab ringkas yang mendapatkan sambutan, penerimaan, dan keberkahan seluas kitab *Al-Arba'in An-Nawawiyah* karya ulama besar madzhab Syafi'i, Al-Imam Abu Zakariyya Yahya bin Syaraf An-Nawawi rahimahullah (wafat 676 H).

Meskipun dinamakan *Arba'in* (yang berarti empat puluh), sebenarnya kitab ini memuat **42 hadits** pilihan yang mencakup pokok-pokok syariat, aqidah, hukum, adab, dan muamalah.

## Mengapa Memilih 42 Hadits Ini?

Imam An-Nawawi tidak mengumpulkan hadits secara acak. Beliau menyaring hadits-hadits yang memiliki derajat *jawami'ul kalim* (kalimat ringkas namun bermakna amat luas dan mendalam).

Dalam mukadimah kitabnya, Imam An-Nawawi rahimahullah menjelaskan kriteria pemilihannya:

> "Setiap hadits dalam kitab ini merupakan salah satu kaidah agung dari kaidah-kaidah agama Islam, yang para ulama menyebutnya sebagai poros Islam, atau separuh dari Islam, atau sepertiganya, atau semisalnya. Kemudian aku berkomitmen bahwa keempat puluh hadits ini semuanya berderajat shahih, dan mayoritasnya terdapat dalam Shahih Al-Bukhari dan Shahih Muslim."

## Struktur dan Tema Pembahasan

Hadits-hadits dalam Arbain Nawawi tersusun secara tematik yang saling melengkapi:

1. **Pondasi Niat dan Landasan Ibadah:** Dibuka dengan hadits pertama tentang niat *([HR. Bukhari no. 1](/hadith/bukhari/1))* dan hadits kedua tentang rukun Islam, Iman, dan Ihsan (Hadits Jibril).
2. **Kemurnian Syariat:** Menjaga keabsahan amal dengan menjauhi perkara bid'ah dan syubhat (Hadits ke-5 dan ke-6).
3. **Nasihat dan Kebaikan Bersama:** Pentingnya agama sebagai nasihat dan larangan menumpahkan darah sesama muslim (Hadits ke-7 dan ke-14).
4. **Pengendalian Diri dan Akhlak:** Larangan marah, menjaga lisan, memuliakan tetangga dan tamu, serta meninggalkan perkara yang tidak bermanfaat (Hadits ke-12, ke-15, ke-16).
5. **Keadilan dan Kasih Sayang:** Bersikap ihsan dalam segala hal termasuk saat menyembelih, serta tidak berbuat zalim kepada sesama (Hadits ke-17 dan ke-24).
6. **Zuhud dan Keikhlasan:** Menjadi orang asing di dunia, mempersiapkan bekal akhirat, dan mengharap rahmat Allah (Hadits ke-31, ke-40, ke-42).

## Mengapa Setiap Muslim Wajib Mempelajarinya?

Bagi penuntut ilmu pemula maupun masyarakat awam, mempelajari Arbain Nawawi memberikan keuntungan besar:

- **Pemahaman Islam yang Holistik:** Anda mendapatkan peta besar ajaran Islam tanpa terjebak dalam perdebatan furu'iyyah yang rumit.
- **Rujukan Dalil yang Kuat:** Mayoritas haditsnya berstatus *Muttafaqun 'Alaih* (disepakati keshahihannya oleh Imam Bukhari dan Muslim).
- **Mudah Dihafal dan Diamalkan:** Redaksi haditsnya padat, lugas, dan relevan dengan problematika kehidupan sehari-hari.
- **Syarah yang Melimpah:** Puluhan ulama besar menuliskan syarah (penjelasan) atas kitab ini, seperti Ibnu Rajab Al-Hanbali (*Jami'ul Ulum wal Hikam*), Ibnu Daqiqil 'Id, hingga ulama kontemporer seperti Syaikh Muhammad bin Shalih Al-Utsaimin.

Mulailah dengan membaca satu hadits beserta syarah ringkasnya setiap pekan. Terapkan pesan-pesannya dalam ucapan, interaksi keluarga, dan aktivitas profesional kita.`,
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
