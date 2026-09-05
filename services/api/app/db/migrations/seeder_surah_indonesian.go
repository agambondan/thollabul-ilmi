package migrations

import (
	"log"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type surahIndoEntry struct {
	Number  int
	LatinID string
	MeanID  string
}

var surahIndoData = []surahIndoEntry{
	{1, "Al-Fatihah", "Pembukaan"},
	{2, "Al-Baqarah", "Sapi Betina"},
	{3, "Ali 'Imran", "Keluarga Imran"},
	{4, "An-Nisa", "Wanita"},
	{5, "Al-Ma'idah", "Hidangan"},
	{6, "Al-An'am", "Binatang Ternak"},
	{7, "Al-A'raf", "Tempat Tertinggi"},
	{8, "Al-Anfal", "Rampasan Perang"},
	{9, "At-Taubah", "Pengampunan"},
	{10, "Yunus", "Nabi Yunus"},
	{11, "Hud", "Nabi Hud"},
	{12, "Yusuf", "Nabi Yusuf"},
	{13, "Ar-Ra'd", "Guruh"},
	{14, "Ibrahim", "Nabi Ibrahim"},
	{15, "Al-Hijr", "Gunung Al-Hijr"},
	{16, "An-Nahl", "Lebah"},
	{17, "Al-Isra", "Memperjalankan Malam Hari"},
	{18, "Al-Kahf", "Gua"},
	{19, "Maryam", "Maryam"},
	{20, "Taha", "Taha"},
	{21, "Al-Anbiya", "Para Nabi"},
	{22, "Al-Hajj", "Haji"},
	{23, "Al-Mu'minun", "Orang-Orang Mukmin"},
	{24, "An-Nur", "Cahaya"},
	{25, "Al-Furqan", "Pembeda"},
	{26, "Asy-Syu'ara", "Para Penyair"},
	{27, "An-Naml", "Semut"},
	{28, "Al-Qasas", "Kisah-Kisah"},
	{29, "Al-'Ankabut", "Laba-Laba"},
	{30, "Ar-Rum", "Bangsa Romawi"},
	{31, "Luqman", "Luqman"},
	{32, "As-Sajdah", "Sujud"},
	{33, "Al-Ahzab", "Golongan yang Bersekutu"},
	{34, "Saba", "Kaum Saba'"},
	{35, "Fatir", "Pencipta"},
	{36, "Yasin", "Yasin"},
	{37, "As-Saffat", "Barisan-Barisan"},
	{38, "Sad", "Sad"},
	{39, "Az-Zumar", "Rombongan"},
	{40, "Ghafir", "Maha Pengampun"},
	{41, "Fussilat", "Yang Dijelaskan"},
	{42, "Asy-Syura", "Musyawarah"},
	{43, "Az-Zukhruf", "Perhiasan"},
	{44, "Ad-Dukhan", "Kabut"},
	{45, "Al-Jasiyah", "Yang Berlutut"},
	{46, "Al-Ahqaf", "Bukit-Bukit Pasir"},
	{47, "Muhammad", "Nabi Muhammad"},
	{48, "Al-Fath", "Kemenangan"},
	{49, "Al-Hujurat", "Kamar-Kamar"},
	{50, "Qaf", "Qaf"},
	{51, "Adz-Dzariyat", "Angin yang Menerbangkan"},
	{52, "At-Tur", "Bukit Tursina"},
	{53, "An-Najm", "Bintang"},
	{54, "Al-Qamar", "Bulan"},
	{55, "Ar-Rahman", "Maha Pengasih"},
	{56, "Al-Waqi'ah", "Hari Kiamat"},
	{57, "Al-Hadid", "Besi"},
	{58, "Al-Mujadilah", "Gugatan"},
	{59, "Al-Hasyr", "Pengusiran"},
	{60, "Al-Mumtahanah", "Wanita yang Diuji"},
	{61, "As-Saff", "Barisan"},
	{62, "Al-Jumu'ah", "Hari Jumat"},
	{63, "Al-Munafiqun", "Orang-Orang Munafik"},
	{64, "At-Tagabun", "Pengungkapan Kesalahan"},
	{65, "At-Talaq", "Talak"},
	{66, "At-Tahrim", "Pengharaman"},
	{67, "Al-Mulk", "Kerajaan"},
	{68, "Al-Qalam", "Pena"},
	{69, "Al-Haqqah", "Hari Kiamat yang Pasti"},
	{70, "Al-Ma'arij", "Tempat Naik"},
	{71, "Nuh", "Nabi Nuh"},
	{72, "Al-Jin", "Jin"},
	{73, "Al-Muzzammil", "Orang yang Berselimut"},
	{74, "Al-Muddassir", "Orang yang Berkemul"},
	{75, "Al-Qiyamah", "Hari Kiamat"},
	{76, "Al-Insan", "Manusia"},
	{77, "Al-Mursalat", "Malaikat yang Diutus"},
	{78, "An-Naba", "Berita Besar"},
	{79, "An-Nazi'at", "Malaikat yang Mencabut"},
	{80, "'Abasa", "Bermuka Masam"},
	{81, "At-Takwir", "Menggulung"},
	{82, "Al-Infitar", "Terbelah"},
	{83, "Al-Mutaffifin", "Orang-Orang yang Curang"},
	{84, "Al-Insyiqaq", "Terbelah"},
	{85, "Al-Buruj", "Gugusan Bintang"},
	{86, "At-Tariq", "Yang Datang di Malam Hari"},
	{87, "Al-A'la", "Maha Tinggi"},
	{88, "Al-Ghasyiyah", "Hari Pembalasan"},
	{89, "Al-Fajr", "Fajar"},
	{90, "Al-Balad", "Negeri"},
	{91, "Asy-Syams", "Matahari"},
	{92, "Al-Lail", "Malam"},
	{93, "Ad-Duha", "Waktu Duha"},
	{94, "Asy-Syarh", "Kelapangan"},
	{95, "At-Tin", "Buah Tin"},
	{96, "Al-'Alaq", "Segumpal Darah"},
	{97, "Al-Qadr", "Kemuliaan"},
	{98, "Al-Bayyinah", "Bukti Nyata"},
	{99, "Az-Zalzalah", "Keguncangan"},
	{100, "Al-'Adiyat", "Kuda yang Berlari Kencang"},
	{101, "Al-Qari'ah", "Hari Kiamat yang Menggemparkan"},
	{102, "At-Takasur", "Bermegah-megahan"},
	{103, "Al-'Asr", "Masa"},
	{104, "Al-Humazah", "Pengumpat"},
	{105, "Al-Fil", "Gajah"},
	{106, "Quraisy", "Suku Quraisy"},
	{107, "Al-Ma'un", "Barang yang Berguna"},
	{108, "Al-Kausar", "Nikmat yang Banyak"},
	{109, "Al-Kafirun", "Orang-Orang Kafir"},
	{110, "An-Nasr", "Pertolongan"},
	{111, "Al-Masad", "Gejolak Api"},
	{112, "Al-Ikhlas", "Ikhlas"},
	{113, "Al-Falaq", "Waktu Subuh"},
	{114, "An-Nas", "Manusia"},
}

// BackfillSurahIndonesian populates Translation.latin_idn and Translation.idn
// for all 114 surahs so that requests with Accept-Language: id or lang=ID
// receive proper Indonesian transliterations and surah meanings.
func BackfillSurahIndonesian(db *gorm.DB) error {
	for _, entry := range surahIndoData {
		var s model.Surah
		if err := db.Where("number = ?", entry.Number).First(&s).Error; err != nil {
			continue
		}
		if s.TranslationID == nil || *s.TranslationID == 0 {
			continue
		}

		latin := entry.LatinID
		meaning := entry.MeanID

		if err := db.Model(&model.Translation{}).
			Where("id = ?", *s.TranslationID).
			Updates(map[string]interface{}{
				"latin_idn": &latin,
				"idn":       &meaning,
			}).Error; err != nil {
			log.Printf("[backfill_surah] failed to update surah %d translation: %v", entry.Number, err)
			return err
		}
	}
	return nil
}
