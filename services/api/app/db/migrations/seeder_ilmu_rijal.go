package migrations

import (
	"fmt"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// SeedIlmuRijal seeds Perawi, JarhTadil, Sanad, MataSanad, and Takhrij.
// Must be called after DataSeeds (books already have IDs).
func SeedIlmuRijal(db *gorm.DB) {
	seedPerawi(db)
	seedPerawiGuru(db)
	seedJarhTadil(db)
	seedSanadHadith(db)
	seedHadithAyahLinks(db)
}

// ─── Perawi ──────────────────────────────────────────────────────────────────

func seedPerawi(db *gorm.DB) {
	hijriTrue := true

	perawi := []model.Perawi{
		// ── Nabi ──────────────────────────────────────────────────────────────
		{
			NamaArab:    lib.Strptr("مُحَمَّدٌ رَسُولُ اللَّهِ ﷺ"),
			NamaLatin:   lib.Strptr("Muhammad Rasulullah ﷺ"),
			NamaLengkap: lib.Strptr("Muhammad bin Abdillah bin Abdul Muththalib bin Hasyim"),
			Kunyah:      lib.Strptr("Abul Qasim"),
			Nisbah:      lib.Strptr("al-Qurasyi al-Hasyimi"),
			TahunLahir:  lib.Intptr(-53),
			TahunWafat:  lib.Intptr(11),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Makkah Al-Mukarramah"),
			TempatWafat: lib.Strptr("Madinah Al-Munawwarah"),
			Tabaqah:     lib.Strptr("nabi"),
			Status:      lib.Strptr("nabi"),
			Biografis:   lib.Strptr("Rasulullah Muhammad ﷺ, Nabi dan Rasul terakhir, sumber seluruh hadith. Dilahirkan di Makkah, wafat di Madinah pada 11 H."),
		},
		// ── Sahabat ───────────────────────────────────────────────────────────
		{
			NamaArab:    lib.Strptr("أَبُو هُرَيْرَةَ"),
			NamaLatin:   lib.Strptr("Abu Hurairah"),
			NamaLengkap: lib.Strptr("Abdurrahman bin Shakhr al-Dawsi"),
			Kunyah:      lib.Strptr("Abu Hurairah"),
			Nisbah:      lib.Strptr("al-Dawsi al-Yamani"),
			TahunWafat:  lib.Intptr(57),
			TahunHijri:  &hijriTrue,
			TempatWafat: lib.Strptr("Madinah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahSahabat)),
			Status:      lib.Strptr(string(model.StatusTsiqah)),
			Biografis:   lib.Strptr("Sahabat yang paling banyak meriwayatkan hadith (± 5.374 hadith). Masuk Islam tahun 7 H, selalu mendampingi Nabi ﷺ di akhir masa hidupnya."),
		},
		{
			NamaArab:    lib.Strptr("عَبْدُ اللَّهِ بْنُ عُمَرَ"),
			NamaLatin:   lib.Strptr("Abdullah bin Umar"),
			NamaLengkap: lib.Strptr("Abdullah bin Umar bin al-Khaththab al-Adawi al-Qurasyi"),
			Kunyah:      lib.Strptr("Abu Abdirrahman"),
			Nisbah:      lib.Strptr("al-Adawi al-Qurasyi"),
			TahunWafat:  lib.Intptr(73),
			TahunHijri:  &hijriTrue,
			TempatWafat: lib.Strptr("Makkah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahSahabat)),
			Status:      lib.Strptr(string(model.StatusTsiqah)),
			Biografis:   lib.Strptr("Putra Umar bin Khaththab. Terkenal sangat ketat mengikuti sunnah Nabi ﷺ. Meriwayatkan sekitar 2.630 hadith."),
		},
		{
			NamaArab:    lib.Strptr("أَنَسُ بْنُ مَالِكٍ"),
			NamaLatin:   lib.Strptr("Anas bin Malik"),
			NamaLengkap: lib.Strptr("Anas bin Malik bin an-Nadhr al-Anshari al-Khazraji"),
			Kunyah:      lib.Strptr("Abu Hamzah"),
			Nisbah:      lib.Strptr("al-Anshari al-Khazraji"),
			TahunWafat:  lib.Intptr(93),
			TahunHijri:  &hijriTrue,
			TempatWafat: lib.Strptr("Bashrah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahSahabat)),
			Status:      lib.Strptr(string(model.StatusTsiqah)),
			Biografis:   lib.Strptr("Pelayan Nabi ﷺ selama 10 tahun. Salah satu sahabat paling produktif dalam periwayatan hadith (± 2.286 hadith). Wafat di Bashrah."),
		},
		{
			NamaArab:    lib.Strptr("عَائِشَةُ أُمُّ الْمُؤْمِنِينَ"),
			NamaLatin:   lib.Strptr("Aisyah Ummul Mukminin"),
			NamaLengkap: lib.Strptr("Aisyah binti Abi Bakr ash-Shiddiq al-Qurasyi at-Taimiyah"),
			Kunyah:      lib.Strptr("Umm Abdillah"),
			Laqab:       lib.Strptr("Ummul Mukminin, ash-Shiddiqah"),
			Nisbah:      lib.Strptr("at-Taimiyah al-Qurasyi"),
			TahunWafat:  lib.Intptr(58),
			TahunHijri:  &hijriTrue,
			TempatWafat: lib.Strptr("Madinah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahSahabat)),
			Status:      lib.Strptr(string(model.StatusTsiqah)),
			Biografis:   lib.Strptr("Istri Nabi ﷺ dan putri Abu Bakar ash-Shiddiq. Rujukan utama hadith seputar kehidupan rumah tangga dan ibadah khusus Nabi ﷺ. Meriwayatkan ± 2.210 hadith."),
		},
		// ── Tabi'in ───────────────────────────────────────────────────────────
		{
			NamaArab:    lib.Strptr("نَافِعٌ"),
			NamaLatin:   lib.Strptr("Nafi'"),
			NamaLengkap: lib.Strptr("Nafi' al-Adawi, mawla Ibni Umar"),
			Kunyah:      lib.Strptr("Abu Abdillah"),
			Nisbah:      lib.Strptr("al-Madani"),
			TahunWafat:  lib.Intptr(117),
			TahunHijri:  &hijriTrue,
			TempatWafat: lib.Strptr("Madinah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahTabiin)),
			Status:      lib.Strptr(string(model.StatusTsiqahTsiqah)),
			Biografis:   lib.Strptr("Hamba sahaya (mawla) milik Abdullah bin Umar. Imam Malik menyebut sanad 'Malik – Nafi' – Ibn Umar' sebagai sanad paling shahih (silsilah dzahabiyyah)."),
		},
		{
			NamaArab:    lib.Strptr("مُحَمَّدُ بْنُ مُسْلِمٍ الزُّهْرِيُّ"),
			NamaLatin:   lib.Strptr("Muhammad bin Muslim az-Zuhri (Ibnu Syihab)"),
			NamaLengkap: lib.Strptr("Muhammad bin Muslim bin Ubaidillah bin Abdillah bin Syihab al-Qurasyi az-Zuhri"),
			Kunyah:      lib.Strptr("Abu Bakr"),
			Laqab:       lib.Strptr("Ibnu Syihab"),
			Nisbah:      lib.Strptr("az-Zuhri al-Qurasyi"),
			TahunWafat:  lib.Intptr(124),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Madinah"),
			TempatWafat: lib.Strptr("Syam"),
			Tabaqah:     lib.Strptr(string(model.TabaqahTabiin)),
			Status:      lib.Strptr(string(model.StatusTsiqahTsiqah)),
			Biografis:   lib.Strptr("Imam tabi'in terkemuka, penghimpun sunnah dan hadith pertama secara resmi atas perintah Khalifah Umar bin Abdul Aziz. Guru Imam Malik."),
		},
		// ── Tabi'ut Tabi'in / Imam ────────────────────────────────────────────
		{
			NamaArab:    lib.Strptr("مَالِكُ بْنُ أَنَسٍ"),
			NamaLatin:   lib.Strptr("Malik bin Anas"),
			NamaLengkap: lib.Strptr("Malik bin Anas bin Malik bin Abi Amir al-Asbahi"),
			Kunyah:      lib.Strptr("Abu Abdillah"),
			Laqab:       lib.Strptr("Imam Darul Hijrah"),
			Nisbah:      lib.Strptr("al-Asbahi al-Madani"),
			TahunLahir:  lib.Intptr(93),
			TahunWafat:  lib.Intptr(179),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Madinah"),
			TempatWafat: lib.Strptr("Madinah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahTabiutTabiin)),
			Status:      lib.Strptr(string(model.StatusTsiqahTsiqah)),
			Biografis:   lib.Strptr("Imam madzhab Maliki. Ulama hadith terkemuka Madinah. Karyanya Al-Muwaththa' adalah kitab hadith yang tersusun paling awal. Guru dari Imam Syafi'i."),
		},
		{
			NamaArab:    lib.Strptr("مُحَمَّدُ بْنُ إِسْمَاعِيلَ الْبُخَارِيُّ"),
			NamaLatin:   lib.Strptr("Muhammad bin Ismail al-Bukhari"),
			NamaLengkap: lib.Strptr("Muhammad bin Ismail bin Ibrahim bin al-Mughirah al-Ju'fi al-Bukhari"),
			Kunyah:      lib.Strptr("Abu Abdillah"),
			Laqab:       lib.Strptr("Amirul Mukminin fil Hadith"),
			Nisbah:      lib.Strptr("al-Bukhari al-Ju'fi"),
			TahunLahir:  lib.Intptr(194),
			TahunWafat:  lib.Intptr(256),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Bukhara (Uzbekistan)"),
			TempatWafat: lib.Strptr("Khartank, dekat Samarkand"),
			Tabaqah:     lib.Strptr(string(model.TabaqahTabaqahKelima)),
			Status:      lib.Strptr(string(model.StatusTsiqahTsiqah)),
			Biografis:   lib.Strptr("Imam al-Bukhari, penyusun Shahih Bukhari — kitab paling shahih setelah Al-Quran. Menghafal 100.000 hadith shahih dan 200.000 hadith. Mulai belajar hadith sejak usia 11 tahun."),
		},
		{
			NamaArab:    lib.Strptr("مُسْلِمُ بْنُ الْحَجَّاجِ"),
			NamaLatin:   lib.Strptr("Muslim bin al-Hajjaj"),
			NamaLengkap: lib.Strptr("Muslim bin al-Hajjaj bin Muslim al-Qusyairi an-Naisaburi"),
			Kunyah:      lib.Strptr("Abu al-Husain"),
			Nisbah:      lib.Strptr("al-Qusyairi an-Naisaburi"),
			TahunLahir:  lib.Intptr(204),
			TahunWafat:  lib.Intptr(261),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Naisabur (Iran)"),
			TempatWafat: lib.Strptr("Naisabur (Iran)"),
			Tabaqah:     lib.Strptr(string(model.TabaqahTabaqahKelima)),
			Status:      lib.Strptr(string(model.StatusTsiqahTsiqah)),
			Biografis:   lib.Strptr("Penyusun Shahih Muslim, kitab hadith paling shahih kedua. Murid Imam al-Bukhari. Menyaring 300.000 hadith untuk menghasilkan ± 7.500 hadith shahih."),
		},
		{
			NamaArab:    lib.Strptr("أَبُو دَاوُدَ السِّجِسْتَانِيُّ"),
			NamaLatin:   lib.Strptr("Abu Dawud as-Sijistani"),
			NamaLengkap: lib.Strptr("Sulaiman bin al-Asy'ats bin Ishaq al-Azdi as-Sijistani"),
			Kunyah:      lib.Strptr("Abu Dawud"),
			Nisbah:      lib.Strptr("al-Azdi as-Sijistani"),
			TahunLahir:  lib.Intptr(202),
			TahunWafat:  lib.Intptr(275),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Sijistan (Afghanistan/Iran)"),
			TempatWafat: lib.Strptr("Bashrah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahTabaqahKelima)),
			Status:      lib.Strptr(string(model.StatusTsiqahTsiqah)),
			Biografis:   lib.Strptr("Penyusun Sunan Abu Dawud. Murid Imam al-Bukhari dan Imam Ahmad. Menyaring 500.000 hadith untuk menghasilkan 4.800 hadith dalam kitabnya."),
		},
		{
			NamaArab:    lib.Strptr("مُحَمَّدُ بْنُ عِيسَى التِّرْمِذِيُّ"),
			NamaLatin:   lib.Strptr("Muhammad bin Isa at-Tirmidzi"),
			NamaLengkap: lib.Strptr("Muhammad bin Isa bin Saurah bin Musa ad-Dhahhak as-Sulami at-Tirmidzi"),
			Kunyah:      lib.Strptr("Abu Isa"),
			Nisbah:      lib.Strptr("at-Tirmidzi as-Sulami"),
			TahunLahir:  lib.Intptr(209),
			TahunWafat:  lib.Intptr(279),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Tirmidz (Uzbekistan)"),
			TempatWafat: lib.Strptr("Tirmidz"),
			Tabaqah:     lib.Strptr(string(model.TabaqahTabaqahKelima)),
			Status:      lib.Strptr(string(model.StatusTsiqahTsiqah)),
			Biografis:   lib.Strptr("Penyusun Al-Jami' (Sunan Tirmidzi). Murid Imam al-Bukhari dan Imam Abu Dawud. Dikenal dengan inovasi menggolongkan derajat hadith di tiap bab."),
		},
		{
			NamaArab:    lib.Strptr("قُتَيْبَةُ بْنُ سَعِيدٍ"),
			NamaLatin:   lib.Strptr("Qutaibah bin Sa'id"),
			NamaLengkap: lib.Strptr("Qutaibah bin Sa'id bin Jamil al-Tsaqafi al-Baghawi"),
			Kunyah:      lib.Strptr("Abu Raja'"),
			Nisbah:      lib.Strptr("al-Tsaqafi al-Baghawi"),
			TahunWafat:  lib.Intptr(240),
			TahunHijri:  &hijriTrue,
			TempatWafat: lib.Strptr("Baghlan"),
			Tabaqah:     lib.Strptr(string(model.TabaqahTabaqahKelima)),
			Status:      lib.Strptr(string(model.StatusTsiqahTsiqah)),
			Biografis:   lib.Strptr("Perawi thiqah, guru Imam al-Bukhari, Imam Muslim, dan Abu Dawud. Dikenal sebagai penghubung penting antara generasi tabi'ut tabi'in dengan imam hadith."),
		},
		// ── Sahabat tambahan ───────────────────────────────────────────────────
		{
			NamaArab:    lib.Strptr("عُمَرُ بْنُ الْخَطَّابِ"),
			NamaLatin:   lib.Strptr("Umar bin Khattab"),
			NamaLengkap: lib.Strptr("Umar bin al-Khatthab bin Nufail al-Adawi al-Qurasyi"),
			Kunyah:      lib.Strptr("Abu Hafs"),
			Laqab:       lib.Strptr("Al-Faruq"),
			Nisbah:      lib.Strptr("al-Adawi al-Qurasyi"),
			TahunLahir:  lib.Intptr(-40),
			TahunWafat:  lib.Intptr(23),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Makkah"),
			TempatWafat: lib.Strptr("Madinah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahSahabat)),
			Status:      lib.Strptr(string(model.StatusTsiqah)),
			Biografis:   lib.Strptr("Khalifah kedua, sahabat utama, mertua Nabi ﷺ. Terkenal dengan ketegasan dan keadilannya. Meriwayatkan sekitar 537 hadith. Salah satu dari Khulafa'ur Rasyidin."),
		},
		{
			NamaArab:    lib.Strptr("عَلِيُّ بْنُ أَبِي طَالِبٍ"),
			NamaLatin:   lib.Strptr("Ali bin Abi Talib"),
			NamaLengkap: lib.Strptr("Ali bin Abi Thalib bin Abdul Muththalib al-Qurasyi al-Hasyimi"),
			Kunyah:      lib.Strptr("Abu Hasan"),
			Laqab:       lib.Strptr("Karramallahu Wajhah, Asadullah"),
			Nisbah:      lib.Strptr("al-Qurasyi al-Hasyimi"),
			TahunLahir:  lib.Intptr(-23),
			TahunWafat:  lib.Intptr(40),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Makkah"),
			TempatWafat: lib.Strptr("Kufah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahSahabat)),
			Status:      lib.Strptr(string(model.StatusTsiqah)),
			Biografis:   lib.Strptr("Khalifah keempat, sepupu dan menantu Nabi ﷺ. Gerbangnya ilmu. Meriwayatkan sekitar 536 hadith. Termasuk Khulafa'ur Rasyidin."),
		},
		{
			NamaArab:    lib.Strptr("عَبْدُ اللَّهِ بْنُ عَبَّاسٍ"),
			NamaLatin:   lib.Strptr("Abdullah bin Abbas"),
			NamaLengkap: lib.Strptr("Abdullah bin Abbas bin Abdul Muththalib al-Qurasyi al-Hasyimi"),
			Kunyah:      lib.Strptr("Abu Abbas"),
			Laqab:       lib.Strptr("Habrul Ummah, Turjumanul Quran"),
			Nisbah:      lib.Strptr("al-Qurasyi al-Hasyimi"),
			TahunLahir:  lib.Intptr(-3),
			TahunWafat:  lib.Intptr(68),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Makkah"),
			TempatWafat: lib.Strptr("Tha'if"),
			Tabaqah:     lib.Strptr(string(model.TabaqahSahabat)),
			Status:      lib.Strptr(string(model.StatusTsiqah)),
			Biografis:   lib.Strptr("Sepupu Nabi ﷺ, ahli tafsir Al-Quran. Dijuluki 'Turjumanul Quran' (penerjemah Al-Quran). Meriwayatkan sekitar 1.660 hadith. Doa Nabi: 'Ya Allah, pahamkanlah ia dalam agama dan ajarkanlah takwil.'"),
		},
		{
			NamaArab:    lib.Strptr("جَابِرُ بْنُ عَبْدِ اللَّهِ"),
			NamaLatin:   lib.Strptr("Jabir bin Abdullah"),
			NamaLengkap: lib.Strptr("Jabir bin Abdullah bin Amr bin Haram al-Anshari as-Sulami"),
			Kunyah:      lib.Strptr("Abu Abdillah"),
			Nisbah:      lib.Strptr("al-Anshari as-Sulami"),
			TahunWafat:  lib.Intptr(78),
			TahunHijri:  &hijriTrue,
			TempatWafat: lib.Strptr("Madinah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahSahabat)),
			Status:      lib.Strptr(string(model.StatusTsiqah)),
			Biografis:   lib.Strptr("Sahabat yang paling banyak meriwayatkan hadith tentang manasik haji. Meriwayatkan sekitar 1.540 hadith. Ayahnya gugur di Perang Uhud."),
		},
		{
			NamaArab:    lib.Strptr("أَبُو سَعِيدٍ الْخُدْرِيُّ"),
			NamaLatin:   lib.Strptr("Abu Said al-Khudri"),
			NamaLengkap: lib.Strptr("Sa'ad bin Malik bin Sinan al-Anshari al-Khudri"),
			Kunyah:      lib.Strptr("Abu Sa'id"),
			Nisbah:      lib.Strptr("al-Anshari al-Khudri"),
			TahunWafat:  lib.Intptr(74),
			TahunHijri:  &hijriTrue,
			TempatWafat: lib.Strptr("Madinah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahSahabat)),
			Status:      lib.Strptr(string(model.StatusTsiqah)),
			Biografis:   lib.Strptr("Sahabat yang meriwayatkan sekitar 1.170 hadith. Ikut serta dalam Perang Khandaq dan bai'at Ridhwan. Termasuk sahabat yang banyak berfatwa di Madinah."),
		},
		{
			NamaArab:    lib.Strptr("عَبْدُ اللَّهِ بْنُ مَسْعُودٍ"),
			NamaLatin:   lib.Strptr("Abdullah bin Mas'ud"),
			NamaLengkap: lib.Strptr("Abdullah bin Mas'ud bin Ghafil al-Hudzali"),
			Kunyah:      lib.Strptr("Abu Abdurrahman"),
			Nisbah:      lib.Strptr("al-Hudzali"),
			TahunLahir:  lib.Intptr(-37),
			TahunWafat:  lib.Intptr(32),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Makkah"),
			TempatWafat: lib.Strptr("Madinah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahSahabat)),
			Status:      lib.Strptr(string(model.StatusTsiqah)),
			Biografis:   lib.Strptr("Sahabat yang pertama kali membaca Al-Quran dengan jahr (keras) di Makkah. Ahli qira'at dan fiqh. Meriwayatkan sekitar 848 hadith. Nabi ﷺ bersabda: 'Berpeganglah pada bacaan Ibnu Mas'ud.'"),
		},
		// ── Tabi'in tambahan ──────────────────────────────────────────────────
		{
			NamaArab:    lib.Strptr("سَعِيدُ بْنُ الْمُسَيَّبِ"),
			NamaLatin:   lib.Strptr("Sa'id bin al-Musayyab"),
			NamaLengkap: lib.Strptr("Sa'id bin al-Musayyab bin Hazn al-Qurasyi al-Makhzumi"),
			Kunyah:      lib.Strptr("Abu Muhammad"),
			Laqab:       lib.Strptr("Sayyidut Tabi'in"),
			Nisbah:      lib.Strptr("al-Qurasyi al-Makhzumi"),
			TahunLahir:  lib.Intptr(15),
			TahunWafat:  lib.Intptr(94),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Madinah"),
			TempatWafat: lib.Strptr("Madinah"),
			Tabaqah:     lib.Strptr(string(model.TabaqahTabiin)),
			Status:      lib.Strptr(string(model.StatusTsiqahTsiqah)),
			Biografis:   lib.Strptr("Pemimpin para tabi'in. Ahli fiqh Madinah, menantu Abu Hurairah. Imam Malik menjadikannya sebagai hujjah utama dalam fiqh."),
		},
		{
			NamaArab:    lib.Strptr("أَبُو سَلَمَةَ بْنُ عَبْدِ الرَّحْمَنِ"),
			NamaLatin:   lib.Strptr("Abu Salamah bin Abdurrahman"),
			NamaLengkap: lib.Strptr("Abdullah bin Abdurrahman bin Auf al-Qurasyi az-Zuhri"),
			Kunyah:      lib.Strptr("Abu Salamah"),
			Nisbah:      lib.Strptr("al-Qurasyi az-Zuhri"),
			TahunWafat:  lib.Intptr(104),
			TahunHijri:  &hijriTrue,
			Tabaqah:     lib.Strptr(string(model.TabaqahTabiin)),
			Status:      lib.Strptr(string(model.StatusTsiqah)),
			Biografis:   lib.Strptr("Tabii terkemuka, anak dari Abdurrahman bin Auf. Guru dari Az-Zuhri. Termasuk fuqaha Madinah dan perawi tsiqah."),
		},
		// ── Imam-imam tambahan ────────────────────────────────────────────────
		{
			NamaArab:    lib.Strptr("أَحْمَدُ بْنُ حَنْبَلٍ"),
			NamaLatin:   lib.Strptr("Ahmad bin Hanbal"),
			NamaLengkap: lib.Strptr("Ahmad bin Muhammad bin Hanbal bin Hilal asy-Syaibani"),
			Kunyah:      lib.Strptr("Abu Abdillah"),
			Laqab:       lib.Strptr("Imam Ahlus Sunnah"),
			Nisbah:      lib.Strptr("asy-Syaibani al-Marwazi al-Baghdadi"),
			TahunLahir:  lib.Intptr(164),
			TahunWafat:  lib.Intptr(241),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Baghdad"),
			TempatWafat: lib.Strptr("Baghdad"),
			Tabaqah:     lib.Strptr(string(model.TabaqahTabaqahKelima)),
			Status:      lib.Strptr(string(model.StatusTsiqahTsiqah)),
			Biografis:   lib.Strptr("Imam madzhab Hanbali. Penyusun Musnad Ahmad (26.000+ hadith). Murid Imam Syafi'i. Dikenal kuat memegang sunnah hingga rela dipenjara dalam fitnah Khalqul Quran."),
		},
		{
			NamaArab:    lib.Strptr("مُحَمَّدُ بْنُ إِدْرِيسَ الشَّافِعِيُّ"),
			NamaLatin:   lib.Strptr("Muhammad bin Idris asy-Syafi'i"),
			NamaLengkap: lib.Strptr("Muhammad bin Idris bin Abbas bin Utsman asy-Syafi'i al-Qurasyi"),
			Kunyah:      lib.Strptr("Abu Abdillah"),
			Laqab:       lib.Strptr("Imam Syafi'i, Nashirus Sunnah"),
			Nisbah:      lib.Strptr("asy-Syafi'i al-Qurasyi al-Muththalibi"),
			TahunLahir:  lib.Intptr(150),
			TahunWafat:  lib.Intptr(204),
			TahunHijri:  &hijriTrue,
			TempatLahir: lib.Strptr("Ghazzah (Palestina)"),
			TempatWafat: lib.Strptr("Fusthat (Mesir)"),
			Tabaqah:     lib.Strptr(string(model.TabaqahTabaqahKelima)),
			Status:      lib.Strptr(string(model.StatusTsiqahTsiqah)),
			Biografis:   lib.Strptr("Imam madzhab Syafi'i. Mujaddid abad ke-2 H. Murid Imam Malik. Guru Imam Ahmad. Peletak dasar ushul fiqh melalui karyanya Ar-Risalah. Hujjah dalam hadith dan fiqh."),
		},
	}

	for i := range perawi {
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "nama_latin"}},
			DoUpdates: clause.AssignmentColumns([]string{"nama_arab", "nama_lengkap", "kunyah", "laqab", "nisbah", "tahun_lahir", "tahun_wafat", "tahun_hijri", "tempat_lahir", "tempat_wafat", "tabaqah", "status", "biografis"}),
		}).Create(&perawi[i])
	}
}

func seedPerawiGuru(db *gorm.DB) {
	var existingCount int64
	db.Model(&model.PerawiGuru{}).Count(&existingCount)

	getID := func(namaLatin string) *int {
		var p model.Perawi
		if err := db.Where("nama_latin = ?", namaLatin).First(&p).Error; err != nil {
			return nil
		}
		return p.ID
	}

	type relation struct {
		guru  string
		murid string
	}
	relations := []relation{
		// Nabi → Sahabat
		{guru: "Muhammad Rasulullah ﷺ", murid: "Abu Hurairah"},
		{guru: "Muhammad Rasulullah ﷺ", murid: "Abdullah bin Umar"},
		{guru: "Muhammad Rasulullah ﷺ", murid: "Anas bin Malik"},
		{guru: "Muhammad Rasulullah ﷺ", murid: "Aisyah Ummul Mukminin"},
		{guru: "Muhammad Rasulullah ﷺ", murid: "Umar bin Khattab"},
		{guru: "Muhammad Rasulullah ﷺ", murid: "Ali bin Abi Talib"},
		{guru: "Muhammad Rasulullah ﷺ", murid: "Abdullah bin Abbas"},
		{guru: "Muhammad Rasulullah ﷺ", murid: "Jabir bin Abdullah"},
		{guru: "Muhammad Rasulullah ﷺ", murid: "Abu Said al-Khudri"},
		{guru: "Muhammad Rasulullah ﷺ", murid: "Abdullah bin Mas'ud"},
		// Sahabat → Tabi'in
		{guru: "Abdullah bin Umar", murid: "Nafi'"},
		{guru: "Abu Hurairah", murid: "Sa'id bin al-Musayyab"},
		{guru: "Abu Hurairah", murid: "Abu Salamah bin Abdurrahman"},
		{guru: "Anas bin Malik", murid: "Muhammad bin Muslim az-Zuhri (Ibnu Syihab)"},
		{guru: "Abdullah bin Abbas", murid: "Sa'id bin al-Musayyab"},
		{guru: "Jabir bin Abdullah", murid: "Abu Salamah bin Abdurrahman"},
		{guru: "Aisyah Ummul Mukminin", murid: "Abu Salamah bin Abdurrahman"},
		// Tabi'in → Tabi'ut Tabi'in / Imam
		{guru: "Sa'id bin al-Musayyab", murid: "Muhammad bin Muslim az-Zuhri (Ibnu Syihab)"},
		{guru: "Abu Salamah bin Abdurrahman", murid: "Muhammad bin Muslim az-Zuhri (Ibnu Syihab)"},
		{guru: "Nafi'", murid: "Malik bin Anas"},
		{guru: "Muhammad bin Muslim az-Zuhri (Ibnu Syihab)", murid: "Malik bin Anas"},
		{guru: "Muhammad bin Muslim az-Zuhri (Ibnu Syihab)", murid: "Muhammad bin Idris asy-Syafi'i"},
		{guru: "Malik bin Anas", murid: "Muhammad bin Idris asy-Syafi'i"},
		{guru: "Malik bin Anas", murid: "Muhammad bin Ismail al-Bukhari"},
		{guru: "Muhammad bin Idris asy-Syafi'i", murid: "Ahmad bin Hanbal"},
		{guru: "Muhammad bin Idris asy-Syafi'i", murid: "Muhammad bin Ismail al-Bukhari"},
		// Imam → Imam / Mukharrij
		{guru: "Qutaibah bin Sa'id", murid: "Muhammad bin Ismail al-Bukhari"},
		{guru: "Qutaibah bin Sa'id", murid: "Muslim bin al-Hajjaj"},
		{guru: "Ahmad bin Hanbal", murid: "Muhammad bin Ismail al-Bukhari"},
		{guru: "Ahmad bin Hanbal", murid: "Muslim bin al-Hajjaj"},
		{guru: "Ahmad bin Hanbal", murid: "Abu Dawud as-Sijistani"},
		{guru: "Muhammad bin Ismail al-Bukhari", murid: "Muslim bin al-Hajjaj"},
		{guru: "Muhammad bin Ismail al-Bukhari", murid: "Abu Dawud as-Sijistani"},
		{guru: "Muhammad bin Ismail al-Bukhari", murid: "Muhammad bin Isa at-Tirmidzi"},
		{guru: "Abu Dawud as-Sijistani", murid: "Muhammad bin Isa at-Tirmidzi"},
	}

	rows := make([]model.PerawiGuru, 0, len(relations))
	for _, rel := range relations {
		guruID := getID(rel.guru)
		muridID := getID(rel.murid)
		if guruID == nil || muridID == nil {
			continue
		}
		rows = append(rows, model.PerawiGuru{GuruID: guruID, MuridID: muridID})
	}
	if len(rows) == 0 {
		return
	}
	for i := range rows {
		db.Clauses(clause.OnConflict{DoNothing: true}).Create(&rows[i])
	}
}

// ─── Jarh wa Ta'dil ──────────────────────────────────────────────────────────

func seedJarhTadil(db *gorm.DB) {
	// Resolve perawi IDs by name
	getID := func(namaLatin string) *int {
		var p model.Perawi
		if err := db.Where("nama_latin = ?", namaLatin).First(&p).Error; err != nil {
			return nil
		}
		return p.ID
	}

	tadil := model.JarhTadilJenis(model.JenisTadil)
	tingkat1 := 1
	tingkat2 := 2
	tingkat3 := 3

	abuHurairahID := getID("Abu Hurairah")
	ibnUmarID := getID("Abdullah bin Umar")
	anasID := getID("Anas bin Malik")
	aisyahID := getID("Aisyah Ummul Mukminin")
	nafiID := getID("Nafi'")
	zuhriID := getID("Muhammad bin Muslim az-Zuhri (Ibnu Syihab)")
	malikID := getID("Malik bin Anas")
	bukhariID := getID("Muhammad bin Ismail al-Bukhari")
	muslimID := getID("Muslim bin al-Hajjaj")
	qutaibahID := getID("Qutaibah bin Sa'id")

	if abuHurairahID == nil || bukhariID == nil {
		return
	}

	penilaian := []model.JarhTadil{
		// Penilaian terhadap Abu Hurairah
		{
			PerawiID:   abuHurairahID,
			PenilaiID:  bukhariID,
			JenisNilai: &tadil,
			Tingkat:    &tingkat1,
			TeksNilai:  lib.Strptr("tsiqah huffazh as-shahabah"),
			Sumber:     lib.Strptr("At-Tarikh Al-Kabir"),
			Catatan:    lib.Strptr("Imam Bukhari menetapkan Abu Hurairah sebagai perawi paling tsiqah di kalangan sahabat dalam hal hafalan"),
		},
		{
			PerawiID:   abuHurairahID,
			PenilaiID:  muslimID,
			JenisNilai: &tadil,
			Tingkat:    &tingkat1,
			TeksNilai:  lib.Strptr("min kibaril huffazh was-siqat"),
			Sumber:     lib.Strptr("Rijal Shahih Muslim"),
			Catatan:    lib.Strptr("Imam Muslim memasukkan Abu Hurairah sebagai sahabat paling produktif dan tsiqah"),
		},
		// Penilaian terhadap Abdullah bin Umar
		{
			PerawiID:   ibnUmarID,
			PenilaiID:  bukhariID,
			JenisNilai: &tadil,
			Tingkat:    &tingkat1,
			TeksNilai:  lib.Strptr("sahabatun thiqatun huffazh"),
			Sumber:     lib.Strptr("At-Tarikh Al-Kabir"),
			Catatan:    lib.Strptr("Abdullah bin Umar dikenal sangat ketat mengikuti sunnah hingga detail kecil"),
		},
		// Penilaian terhadap Anas bin Malik
		{
			PerawiID:   anasID,
			PenilaiID:  bukhariID,
			JenisNilai: &tadil,
			Tingkat:    &tingkat1,
			TeksNilai:  lib.Strptr("khadimun Nabi ﷺ, tsiqah"),
			Sumber:     lib.Strptr("At-Tarikh Al-Kabir"),
			Catatan:    lib.Strptr("Pelayan Nabi ﷺ selama 10 tahun, hafalan kuat"),
		},
		// Penilaian terhadap Aisyah
		{
			PerawiID:   aisyahID,
			PenilaiID:  bukhariID,
			JenisNilai: &tadil,
			Tingkat:    &tingkat1,
			TeksNilai:  lib.Strptr("Ummul Mukminin, hafizhatun faqihah"),
			Sumber:     lib.Strptr("At-Tarikh Al-Kabir"),
			Catatan:    lib.Strptr("Paling faqih di antara Ummahatul Mukminin, sering mengoreksi hadith sahabat lain"),
		},
		// Penilaian terhadap Nafi'
		{
			PerawiID:   nafiID,
			PenilaiID:  malikID,
			JenisNilai: &tadil,
			Tingkat:    &tingkat1,
			TeksNilai:  lib.Strptr("Nafi'un thiqatun tsiqah, imamun fi al-hadith"),
			Sumber:     lib.Strptr("Al-Jarh wat Ta'dil oleh Ibn Abi Hatim"),
			Halaman:    lib.Strptr("VIII/449"),
			Catatan:    lib.Strptr("Imam Malik menyebut sanad Malik-Nafi-Ibn Umar sebagai silsilah dzahabiyyah (rantai emas)"),
		},
		// Penilaian terhadap Az-Zuhri
		{
			PerawiID:   zuhriID,
			PenilaiID:  malikID,
			JenisNilai: &tadil,
			Tingkat:    &tingkat1,
			TeksNilai:  lib.Strptr("az-Zuhri awtsaqun nas wa ahfazunum fil hadith"),
			Sumber:     lib.Strptr("Tahdzib al-Kamal, Al-Mizzi"),
			Catatan:    lib.Strptr("Imam Malik menilai Az-Zuhri sebagai manusia paling tsiqah dan paling hafal hadith"),
		},
		// Penilaian terhadap Malik
		{
			PerawiID:   malikID,
			PenilaiID:  bukhariID,
			JenisNilai: &tadil,
			Tingkat:    &tingkat1,
			TeksNilai:  lib.Strptr("asahhu al-asanid: Malik an Nafi' an Ibn Umar"),
			Sumber:     lib.Strptr("Shahih al-Bukhari, muqaddimah"),
			Catatan:    lib.Strptr("Imam Bukhari menyebut sanad Malik sebagai yang paling shahih"),
		},
		// Penilaian terhadap al-Bukhari
		{
			PerawiID:   bukhariID,
			PenilaiID:  muslimID,
			JenisNilai: &tadil,
			Tingkat:    &tingkat1,
			TeksNilai:  lib.Strptr("laisa fi ad-dunya mitsluhu"),
			Sumber:     lib.Strptr("Siyar A'lam an-Nubala', adz-Dzahabi XII/434"),
			Catatan:    lib.Strptr("Imam Muslim sujud syukur kepada al-Bukhari sambil berkata: tidak ada di dunia ini orang yang menyamaimu dalam ilmu hadith"),
		},
		// Penilaian terhadap Qutaibah bin Sa'id
		{
			PerawiID:   qutaibahID,
			PenilaiID:  bukhariID,
			JenisNilai: &tadil,
			Tingkat:    &tingkat2,
			TeksNilai:  lib.Strptr("tsiqah tsabtun"),
			Sumber:     lib.Strptr("At-Tarikh Al-Kabir"),
			Catatan:    lib.Strptr("Imam Bukhari menilai Qutaibah sebagai guru tsiqah dan tsabt"),
		},
		{
			PerawiID:   qutaibahID,
			PenilaiID:  muslimID,
			JenisNilai: &tadil,
			Tingkat:    &tingkat3,
			TeksNilai:  lib.Strptr("tsiqah"),
			Sumber:     lib.Strptr("Rijal Shahih Muslim"),
			Catatan:    lib.Strptr("Imam Muslim meriwayatkan darinya banyak hadith dalam Shahih-nya"),
		},
	}

	for i := range penilaian {
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "perawi_id"}, {Name: "penilai_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"jenis_nilai", "tingkat", "teks_nilai", "sumber", "halaman", "catatan"}),
		}).Create(&penilaian[i])
	}
}

// ─── Sanad & MataSanad ───────────────────────────────────────────────────────
// Menyeed sanad untuk hadith terkenal "Innamal a'malu binniyyat" (HR. Bukhari No. 1)
// jika hadith dengan nomor tersebut ada di database.

func seedSanadHadith(db *gorm.DB) {
	var count int64
	db.Model(&model.Sanad{}).Count(&count)
	if count > 0 {
		return
	}

	getID := func(namaLatin string) *int {
		var p model.Perawi
		if err := db.Where("nama_latin = ?", namaLatin).First(&p).Error; err != nil {
			return nil
		}
		return p.ID
	}

	getHadith := func(bookSlug string, number int) (*model.Hadith, bool) {
		var h model.Hadith
		if err := db.Joins("Book").
			Where(`"Book".slug = ? AND hadith.number = ?`, bookSlug, number).
			First(&h).Error; err != nil {
			return nil, false
		}
		return &h, true
	}

	musnad := model.SanadJenis(model.SanadMusnad)
	muttashil := model.SanadStatus(model.SanadMuttashil)
	haddatsana := model.MetodePeriwayatan(model.MetodeHaddatsana)
	ananah := model.MetodePeriwayatan(model.MetodeAnanah)

	// ── Hadith 1: Bukhari #1 — "Innamal a'malu binniyat" ─────────────
	if h, ok := getHadith("bukhari", 1); ok {
		buildSanad(db, h, getID, []string{
			"Muhammad bin Ismail al-Bukhari",
			"Qutaibah bin Sa'id",
			"Malik bin Anas",
			"Nafi'",
			"Abdullah bin Umar",
		}, "Jalur: Bukhari ← Qutaibah ← Malik ← Nafi' ← Ibn Umar", &musnad, &muttashil,
			[]model.MetodePeriwayatan{haddatsana, ananah, ananah, ananah})
		seedTakhrijHadith(db, h.ID)
	}

	// ── Hadith 2: Bukhari #50 — Hadith Jibril (Iman, Islam, Ihsan) ──
	if h, ok := getHadith("bukhari", 50); ok {
		buildSanad(db, h, getID, []string{
			"Muhammad bin Ismail al-Bukhari",
			"Qutaibah bin Sa'id",
			"Ismail bin Ja'far",
			"Abu Suhail Nafi' bin Malik",
			"Malik bin Anas",
			"Atha' bin Yasar",
			"Abu Hurairah",
		}, "Jalur: Bukhari ← Isma'il ← Malik ← Abu Suhail ← Atha' ← Abu Hurairah", &musnad, &muttashil,
			[]model.MetodePeriwayatan{haddatsana, ananah, ananah, ananah, ananah, ananah})
	}

	// ── Hadith 3: Bukhari #33 — Tanda-tanda munafik ──────────────
	if h, ok := getHadith("bukhari", 33); ok {
		buildSanad(db, h, getID, []string{
			"Muhammad bin Ismail al-Bukhari",
			"Sulaiman Abu ar-Rabi'",
			"Ismail bin Ja'far",
			"Bukair bin Mismar",
			"Amir bin Sa'd",
			"Abu Hurairah",
		}, "Jalur: Bukhari ← Sulaiman ← Isma'il ← Bukair ← Amir ← Abu Hurairah", &musnad, &muttashil,
			[]model.MetodePeriwayatan{haddatsana, ananah, ananah, ananah, ananah, ananah})
	}

	// ── Hadith 4: Bukhari #8 — Islam dibangun 5 perkara ──────────
	if h, ok := getHadith("bukhari", 8); ok {
		buildSanad(db, h, getID, []string{
			"Muhammad bin Ismail al-Bukhari",
			"Ubaidullah bin Musa",
			"Hanzhalah bin Abu Sufyan",
			"Ikrimah bin Khalid",
			"Abdullah bin Umar",
		}, "Jalur: Bukhari ← Ubaidullah ← Hanzhalah ← Ikrimah ← Ibn Umar", &musnad, &muttashil,
			[]model.MetodePeriwayatan{haddatsana, ananah, ananah, ananah, ananah})
	}
}

func buildSanad(db *gorm.DB, hadith *model.Hadith, getID func(string) *int, chain []string, catatan string, jenis *model.SanadJenis, status *model.SanadStatus, metode []model.MetodePeriwayatan) {
	// Resolve semua perawi dalam chain
	ids := make([]*int, len(chain))
	for i, nama := range chain {
		id := getID(nama)
		if id == nil {
			return // skip jika ada perawi yang belum terdaftar
		}
		ids[i] = id
	}

	jalur1 := 1
	sanad := model.Sanad{
		HadithID:    hadith.ID,
		NomorJalur:  &jalur1,
		Jenis:       jenis,
		StatusSanad: status,
		Catatan:     lib.Strptr(catatan),
	}

	if err := db.Create(&sanad).Error; err != nil {
		return
	}

	// Mata sanad: tiap perawi dengan metode
	for i, id := range ids {
		m := model.MataSanad{
			SanadID:  sanad.ID,
			PerawiID: id,
			Urutan:   lib.Intptr(i + 1),
		}
		if i < len(metode) {
			m.Metode = &metode[i]
		}
		db.Create(&m)
	}
}

// ─── Takhrij ─────────────────────────────────────────────────────────────────

func seedTakhrijHadith(db *gorm.DB, hadithID *int) {
	if hadithID == nil {
		return
	}

	var count int64
	db.Model(&model.Takhrij{}).Where("hadith_id = ?", hadithID).Count(&count)
	if count > 0 {
		return
	}

	// Cari book_id untuk masing-masing kitab
	getBookID := func(slug string) *int {
		var book model.Book
		if err := db.Where("slug = ?", slug).First(&book).Error; err != nil {
			return nil
		}
		return book.ID
	}

	muslimID := getBookID("muslim")
	abudaudID := getBookID("abudaud")
	tirmidziID := getBookID("tirmidzi")
	nasaiID := getBookID("nasai")
	ibnumajahID := getBookID("ibnumajah")

	takhrijData := []struct {
		bookID          *int
		nomorHadisKitab string
		jilid           string
		halaman         string
		catatan         string
	}{
		{muslimID, "1907", "6", "48", "HR. Muslim, Kitab Al-Imarah"},
		{abudaudID, "2201", "3", "69", "HR. Abu Dawud, Kitab Ath-Thalaq"},
		{tirmidziID, "1647", "4", "179", "HR. Tirmidzi, Kitab Fadha'il Al-Jihad; status: hasan shahih"},
		{nasaiID, "75", "1", "59", "HR. An-Nasa'i, Kitab Ath-Thaharah"},
		{ibnumajahID, "4227", "5", "3422", "HR. Ibnu Majah, Kitab Az-Zuhd"},
	}

	for _, t := range takhrijData {
		if t.bookID == nil {
			continue
		}
		takhrij := model.Takhrij{
			HadithID:        hadithID,
			BookID:          t.bookID,
			NomorHadisKitab: lib.Strptr(t.nomorHadisKitab),
			Jilid:           lib.Strptr(t.jilid),
			Halaman:         lib.Strptr(t.halaman),
			Catatan:         lib.Strptr(t.catatan),
		}
		db.Clauses(clause.OnConflict{DoNothing: true}).Create(&takhrij)
	}
}

// ─── HadithAyah ────────────────────────────────────────────────────────────────
// Menghubungkan hadith terkenal dengan ayat Al-Quran yang relevan.
// Mempermudah fitur "Takhrij Ayat" dan "Hadith Terkait".

func seedHadithAyahLinks(db *gorm.DB) {
	type ayahRef struct {
		surah int
		ayah  int
	}
	type hadithRef struct {
		bookSlug string
		number   int
		catatan  string
	}

	links := []struct {
		hadith hadithRef
		ayahs  []ayahRef
	}{
		{
			hadith: hadithRef{"bukhari", 1, "Hadits tentang niat — sejalan dengan perintah ikhlas dalam beribadah"},
			ayahs:  []ayahRef{{98, 5}},
		},
		{
			hadith: hadithRef{"bukhari", 8, "Hadits tentang rukun Islam — dasar-dasar agama"},
			ayahs:  []ayahRef{{3, 19}, {3, 85}},
		},
		{
			hadith: hadithRef{"bukhari", 33, "Hadits tentang tanda munafik"},
			ayahs:  []ayahRef{{2, 8}, {2, 9}, {2, 10}},
		},
		{
			hadith: hadithRef{"bukhari", 50, "Hadits Jibril — penjelasan Iman, Islam, Ihsan"},
			ayahs:  []ayahRef{{2, 177}, {31, 12}},
		},
		{
			hadith: hadithRef{"bukhari", 6018, "Hadits tentang iman dan hari akhir — menjaga lisan"},
			ayahs:  []ayahRef{{33, 70}, {33, 71}},
		},
		{
			hadith: hadithRef{"bukhari", 5027, "Hadits tentang sebaik-baik manusia — belajar Quran"},
			ayahs:  []ayahRef{{96, 1}, {96, 3}},
		},
	}

	// Build ayah index
	type ayahIdx struct {
		ID          int
		Number      int
		SurahNumber int
	}
	var idxRows []ayahIdx
	db.Raw(`SELECT ayah.id, ayah.number, surah.number AS surah_number FROM ayah JOIN surah ON surah.id = ayah.surah_id`).Scan(&idxRows)
	ayahMap := make(map[string]int, len(idxRows))
	for _, a := range idxRows {
		ayahMap[fmt.Sprintf("%d:%d", a.SurahNumber, a.Number)] = a.ID
	}

	for _, link := range links {
		var hadith model.Hadith
		if err := db.Joins("Book").Where(`"Book".slug = ? AND hadith.number = ?`, link.hadith.bookSlug, link.hadith.number).First(&hadith).Error; err != nil {
			continue
		}
		for _, ref := range link.ayahs {
			ayahID, ok := ayahMap[fmt.Sprintf("%d:%d", ref.surah, ref.ayah)]
			if !ok {
				continue
			}
			item := model.HadithAyah{
				HadithID: hadith.ID,
				AyahID:   &ayahID,
				Catatan:  link.hadith.catatan,
			}
			db.Clauses(clause.OnConflict{DoNothing: true}).Create(&item)
		}
	}
}
