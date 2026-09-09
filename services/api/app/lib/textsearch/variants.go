package textsearch

// variantGroups are spelling variants (and a few near-synonyms users type
// interchangeably) of common Indonesian Islamic vocabulary. The first entry is
// the KBBI / auto-caption spelling; the rest are the forms people actually
// search with. This is a retrieval aid only — it carries no religious ruling.
//
// Frequencies in data/static/kajian.json (2026-09-08) motivated the list:
// salat 836 vs sholat 0, hadis 981 vs hadits 4, ustaz 1609 vs ustadz 12,
// zikir 69 vs dzikir 0, wudu 68 vs wudhu 0, akidah 73 vs aqidah 1,
// tobat 114 vs taubat 11, sunah 353 vs sunnah 7, qur'an 528 vs quran 212.
var variantGroups = [][]string{
	{"salat", "shalat", "sholat", "solat", "sembahyang"},
	{"hadis", "hadits", "hadith", "hadist"},
	{"quran", "alquran", "qur", "alqur", "quraan"},
	{"ustaz", "ustadz", "ustad", "ustazah", "ustadzah"},
	{"zikir", "dzikir", "dzikr", "zikr"},
	{"wudu", "wudhu", "wudlu"},
	{"akidah", "aqidah", "aqeedah"},
	{"tauhid", "tawhid", "tauheed"},
	{"syirik", "syirk", "shirk"},
	{"tobat", "taubat", "taubah"},
	{"sedekah", "shodaqoh", "shadaqah", "sadaqah", "shadaqoh", "sodaqoh"},
	{"puasa", "shaum", "saum"},
	{"nikah", "menikah", "pernikahan", "kawin", "perkawinan"},
	{"utang", "hutang", "berhutang", "berutang"},
	{"akhlak", "akhlaq", "ahlak"},
	{"masjid", "mesjid"},
	{"syekh", "syaikh", "sheikh", "shaykh", "syeikh"},
	{"ramadan", "ramadhan", "romadhon", "ramadhon"},
	{"sunah", "sunnah"},
	{"surga", "jannah", "syurga"},
	{"neraka", "jahanam", "jahannam"},
	{"rezeki", "rizki", "rejeki", "rizqi", "rizq"},
	{"gibah", "ghibah"},
	{"fikih", "fiqih", "fiqh", "fiqhi"},
	{"jenazah", "mayit", "mayat"},
	{"magrib", "maghrib"},
	{"isya", "isyak"},
	{"zuhur", "dzuhur", "dhuhur", "zhuhur", "duhur"},
	{"asar", "ashar"},
	{"subuh", "shubuh", "fajar"},
	{"duha", "dhuha"},
	{"umrah", "umroh"},
	{"zakat", "zakah"},
	{"riba", "ribawi", "rente"},
	{"stres", "stress", "depresi", "cemas", "gelisah", "galau", "tertekan"},
	{"kiamat", "qiyamat", "qiyamah"},
	{"haid", "haidh", "menstruasi"},
	{"wanita", "perempuan"},
	{"pria", "laki", "lelaki"},
	{"istri", "isteri"},
	{"ikhlas", "ikhlash"},
	{"takwa", "taqwa"},
	{"syariat", "syariah", "syaria"},
	{"nabi", "rasul", "rasulullah"},
	{"sahabat", "shahabat", "sohabat"},
	{"tafsir", "tafseer"},
	{"tajwid", "tajweed"},
	{"hafal", "hafalan", "menghafal", "hafiz", "hafidz", "tahfiz", "tahfidz", "tahfizh"},
	{"setan", "syaitan", "syetan", "syaithan", "iblis", "jin"},
	{"sihir", "santet", "dukun", "perdukunan"},
	{"musik", "nyanyian", "lagu"},
	{"talak", "talaq", "cerai"},
	{"waris", "warisan", "faraid", "faraidh", "mawaris"},
	{"hijab", "jilbab", "kerudung", "khimar"},
	{"pahala", "ganjaran"},
	{"khusyuk", "khusyu", "khusu"},
	{"tahajud", "tahajjud"},
	{"witir", "witr"},
	{"tarawih", "taraweh"},
	{"kurban", "qurban", "udhiyah"},
	{"akikah", "aqiqah"},
	{"tayamum", "tayammum"},
	{"qasar", "qashar"},
	{"kafir", "kufur"},
	{"munafik", "munafiq", "nifak"},
	{"bidah", "bidaah"},
	{"khutbah", "khotbah"},
	{"jumat", "jumaat"},
	{"kiblat", "qiblat", "qibla"},
	{"azan", "adzan"},
	{"ikamah", "iqamah", "iqomah"},
	{"sujud", "sajdah"},
	{"rukuk", "ruku"},
	{"doa", "dua"},
}

var variantIndex = func() map[string]int {
	idx := make(map[string]int, len(variantGroups)*4)
	for i, g := range variantGroups {
		for _, term := range g {
			idx[term] = i
		}
	}
	return idx
}()

// stopwords are Indonesian function words plus the question/filler words that
// dominate natural-language queries ("cara mengatasi stres", "apa hukum riba").
// The Postgres 'indonesian' text-search config does NOT strip stopwords, so
// they must go here or every OR-query matches the whole corpus.
var stopwords = func() map[string]struct{} {
	list := []string{
		"yang", "dan", "di", "ke", "dari", "untuk", "ini", "itu", "adalah",
		"dengan", "pada", "oleh", "atau", "juga", "tidak", "bukan", "akan",
		"sudah", "telah", "ada", "dalam", "kepada", "agar", "supaya", "bisa",
		"dapat", "harus", "saya", "aku", "kita", "kami", "mereka", "dia", "ia",
		"nya", "apa", "apakah", "bagaimana", "gimana", "kenapa", "mengapa",
		"cara", "tentang", "seperti", "karena", "sebab", "jika", "kalau",
		"maka", "lalu", "kemudian", "saat", "ketika", "sebagai", "para",
		"tersebut", "sangat", "lebih", "paling", "hanya", "saja", "pun", "lah",
		"kah", "ya", "oh", "nah", "sih", "dong", "deh", "kan", "kok", "nih",
		"tuh", "gitu", "begitu", "begini", "al", "si", "sang", "bagi", "tanpa",
		"antara", "hingga", "sampai", "serta", "namun", "tetapi", "tapi",
		"sedangkan", "bahwa", "bila", "apabila", "sementara", "yg", "dgn",
		"utk", "krn", "tdk", "sdh", "blm", "belum", "masih", "mau", "ingin",
		"boleh", "bolehkah", "bagaimanakah", "apa", "siapa", "mana", "dimana",
		"kapan", "berapa",
	}
	m := make(map[string]struct{}, len(list))
	for _, w := range list {
		m[w] = struct{}{}
	}
	return m
}()
