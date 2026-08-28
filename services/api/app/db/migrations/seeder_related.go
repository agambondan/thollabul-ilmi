package migrations

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ─── Simple (no-FK) seeds ────────────────────────────────────────────────────

func seedSirohCategories() []model.SirohCategory {
	return []model.SirohCategory{
		{Title: "Nasab & Kelahiran Nabi ﷺ", Slug: "nasab-kelahiran", Order: 1},
		{Title: "Masa Kecil & Remaja", Slug: "masa-kecil-remaja", Order: 2},
		{Title: "Kenabian & Dakwah di Makkah", Slug: "kenabian-dakwah-makkah", Order: 3},
		{Title: "Hijrah ke Madinah", Slug: "hijrah-madinah", Order: 4},
		{Title: "Pembangunan Masyarakat Madinah", Slug: "masyarakat-madinah", Order: 5},
		{Title: "Perang & Ekspedisi", Slug: "perang-ekspedisi", Order: 6},
		{Title: "Penaklukan Makkah (Fath al-Makkah)", Slug: "fath-al-makkah", Order: 7},
		{Title: "Haji Wada' & Wafat Nabi ﷺ", Slug: "haji-wada-wafat", Order: 8},
	}
}

func seedBlogCategories() []model.BlogCategory {
	return []model.BlogCategory{
		{Name: "Quran & Tafsir", Slug: "quran-tafsir", Description: "Kajian seputar Al-Quran, tafsir, dan ilmu-ilmu Quran"},
		{Name: "Hadith & Sunnah", Slug: "hadith-sunnah", Description: "Kajian hadith, syarah hadith, dan sunnah Nabi ﷺ"},
		{Name: "Fiqh & Hukum Islam", Slug: "fiqh-hukum", Description: "Pembahasan hukum-hukum Islam dalam kehidupan sehari-hari"},
		{Name: "Akhlak & Adab", Slug: "akhlak-adab", Description: "Adab dan akhlak Islami dalam berbagai aspek kehidupan"},
		{Name: "Aqidah & Tauhid", Slug: "aqidah-tauhid", Description: "Penguatan aqidah dan pemahaman tauhid yang benar"},
		{Name: "Sejarah Islam", Slug: "sejarah-islam", Description: "Sirah Nabawiyah dan sejarah peradaban Islam"},
		{Name: "Keluarga Muslim", Slug: "keluarga-muslim", Description: "Tuntunan membangun keluarga sakinah mawaddah warahmah"},
		{Name: "Inspirasi & Motivasi", Slug: "inspirasi-motivasi", Description: "Artikel motivasi dan inspirasi bagi kehidupan muslim"},
	}
}

func seedBlogTags() []model.BlogTag {
	return []model.BlogTag{
		{Name: "Sholat", Slug: "sholat"},
		{Name: "Puasa", Slug: "puasa"},
		{Name: "Zakat", Slug: "zakat"},
		{Name: "Haji", Slug: "haji"},
		{Name: "Quran", Slug: "quran"},
		{Name: "Hadith", Slug: "hadith"},
		{Name: "Akhlak", Slug: "akhlak"},
		{Name: "Doa", Slug: "doa"},
		{Name: "Dzikir", Slug: "dzikir"},
		{Name: "Ramadan", Slug: "ramadan"},
		{Name: "Fiqh", Slug: "fiqh"},
		{Name: "Tauhid", Slug: "tauhid"},
		{Name: "Sirah", Slug: "sirah"},
		{Name: "Keluarga", Slug: "keluarga"},
		{Name: "Hafalan", Slug: "hafalan"},
		{Name: "Tilawah", Slug: "tilawah"},
	}
}

func seedKajian() []model.Kajian {
	return []model.Kajian{
		{Title: "Tafsir Surah Al-Fatihah", Speaker: "Ust. Adi Hidayat", Topic: "Quran & Tafsir", Type: model.KajianTypeVideo, Description: "Kajian mendalam tentang makna dan kandungan Surah Al-Fatihah sebagai induk Al-Quran.", Duration: 3600, PublishedAt: "2024-01-15"},
		{Title: "Kitab Riyadhus Shalihin: Bab Ikhlas", Speaker: "Ust. Khalid Basalamah", Topic: "Hadith & Sunnah", Type: model.KajianTypeVideo, Description: "Kajian kitab Riyadhus Shalihin karya Imam Nawawi tentang bab keikhlasan beramal.", Duration: 2700, PublishedAt: "2024-02-01"},
		{Title: "Fiqh Sholat Lengkap", Speaker: "Ust. Firanda Andirja", Topic: "Fiqh", Type: model.KajianTypeVideo, Description: "Pembahasan lengkap fiqh sholat mulai dari syarat, rukun, sunnah, hingga hal-hal yang membatalkan.", Duration: 5400, PublishedAt: "2024-02-20"},
		{Title: "Mengenal Asmaul Husna", Speaker: "Ust. Hanan Attaki", Topic: "Aqidah & Tauhid", Type: model.KajianTypeVideo, Description: "Kajian 99 nama-nama Allah yang indah dan cara mengamalkannya dalam kehidupan sehari-hari.", Duration: 3000, PublishedAt: "2024-03-05"},
		{Title: "Sirah Nabawiyah: Hijrah ke Madinah", Speaker: "Ust. Felix Siauw", Topic: "Sejarah Islam", Type: model.KajianTypeVideo, Description: "Kisah hijrah Rasulullah ﷺ dari Makkah ke Madinah dan pelajaran yang dapat diambil.", Duration: 4200, PublishedAt: "2024-03-15"},
		{Title: "Tadabbur Quran: Juz 30", Speaker: "Ust. Budi Ashari", Topic: "Quran & Tafsir", Type: model.KajianTypeAudio, Description: "Tadabbur ayat-ayat dalam Juz 30 Al-Quran dengan penjelasan makna yang mendalam.", Duration: 3600, PublishedAt: "2024-04-01"},
		{Title: "Panduan Lengkap Puasa Ramadan", Speaker: "Ust. Abdul Somad", Topic: "Fiqh", Type: model.KajianTypeVideo, Description: "Panduan fiqh puasa Ramadan: niat, hal yang membatalkan, fidyah, dan amalan sunnah di bulan Ramadan.", Duration: 4800, PublishedAt: "2024-03-10"},
		{Title: "Adab Menuntut Ilmu", Speaker: "Ust. Syafiq Riza Basalamah", Topic: "Akhlak & Adab", Type: model.KajianTypeVideo, Description: "Tuntunan adab bagi penuntut ilmu berdasarkan Al-Quran, hadith, dan kitab-kitab ulama salaf.", Duration: 3300, PublishedAt: "2024-04-20"},
	}
}

// ─── FK-dependent seeds (needs parent ID lookup) ─────────────────────────────

func seedFiqhItemsRelated(db *gorm.DB) {
	type catItem struct {
		slug  string
		items []model.FiqhItem
	}

	data := []catItem{
		{
			slug: "thaharah",
			items: []model.FiqhItem{
				{Title: "Syarat Sah Wudhu", Slug: "syarat-sah-wudhu", Content: "Syarat sah wudhu ada lima:\n1. Islam — wudhu tidak sah bagi orang kafir.\n2. Tamyiz — mampu membedakan baik dan buruk, minimal usia 7 tahun.\n3. Tidak ada penghalang air ke kulit — seperti cat tebal, minyak yang menutupi pori-pori.\n4. Menggunakan air mutlak — air yang turun dari langit atau keluar dari bumi dalam keadaan alami (suci dan mensucikan).\n5. Tidak dalam keadaan haid atau nifas.\n\nDasar: QS. Al-Ma'idah: 6 dan hadith sahih tentang tata cara wudhu Nabi ﷺ.\n\nCatatan ulama: rincian syarat dirumuskan fuqaha dari dalil-dalil thaharah agar praktik wudhu sesuai tuntunan salaf.", Source: "QS. Al-Ma'idah: 6; HR. Bukhari & Muslim; Al-Mughni, Ibn Qudamah", SortOrder: 1},
				{Title: "Rukun Wudhu", Slug: "rukun-wudhu", Content: "Rukun (fardu) wudhu ada enam berdasarkan QS. Al-Ma'idah: 6:\n1. Niat — dalam hati saat memulai wudhu.\n2. Membasuh seluruh wajah — dari tempat tumbuh rambut kepala hingga bawah dagu, dan dari telinga ke telinga.\n3. Membasuh kedua tangan hingga siku termasuk siku.\n4. Mengusap sebagian kepala.\n5. Membasuh kedua kaki hingga mata kaki termasuk mata kaki.\n6. Tertib (berurutan) sesuai yang disebutkan dalam ayat.\n\nMasing-masing bagian cukup dibasuh sekali, sunnah tiga kali.\n\nCatatan ulama: niat adalah amalan hati, sedangkan rincian batas anggota wudhu dijelaskan fuqaha dari praktik Nabi ﷺ dan pemahaman salaf.", Source: "QS. Al-Ma'idah: 6; HR. Bukhari & Muslim; Al-Mughni, Ibn Qudamah", SortOrder: 2},
				{Title: "Sunnah-Sunnah Wudhu", Slug: "sunnah-wudhu", Content: "Sunnah wudhu yang dianjurkan:\n1. Membaca basmalah di awal.\n2. Membasuh kedua telapak tangan tiga kali sebelum memasukkan ke bejana.\n3. Berkumur-kumur (madmadah).\n4. Membersihkan rongga hidung (istinsyaq dan istintsar).\n5. Menyela-nyela jari tangan dan kaki.\n6. Mengusap seluruh kepala.\n7. Mengusap kedua telinga luar dan dalam.\n8. Membasuh tiga kali setiap anggota.\n9. Memulai dengan anggota kanan.\n10. Berdoa setelah wudhu: 'Asyhadu an laa ilaaha illallah...'", Source: "HR. Bukhari, Muslim, Abu Dawud, Tirmidzi", SortOrder: 3},
				{Title: "Pembatal Wudhu", Slug: "pembatal-wudhu", Content: "Hal-hal yang membatalkan wudhu:\n1. Keluarnya sesuatu dari qubul atau dubur (kencing, berak, kentut, wadi, madzi).\n2. Hilang akal karena tidur nyenyak (bukan tidur sambil duduk dengan pantat rapat), gila, pingsan, atau mabuk.\n3. Menyentuh kemaluan sendiri dengan telapak tangan tanpa penghalang (menurut pendapat yang rajih).\n4. Makan daging unta (berdasarkan hadith shahih riwayat Muslim).\n\nCatatan: bersentuhan kulit lawan jenis non-mahram — ulama berbeda pendapat; pendapat terkuat tidak membatalkan kecuali dengan syahwat.", Source: "HR. Bukhari, Muslim, Abu Dawud, Ahmad", SortOrder: 4},
				{Title: "Cara Mandi Wajib (Mandi Junub)", Slug: "cara-mandi-wajib", Content: "Rukun mandi wajib hanya dua:\n1. Niat dalam hati untuk mengangkat hadats besar.\n2. Meratakan air ke seluruh tubuh termasuk rambut dan kulit di bawahnya.\n\nTata cara sunnah (berdasarkan hadith Aisyah ra., HR. Bukhari & Muslim):\n1. Mencuci kedua tangan.\n2. Membersihkan kemaluan dan tempat yang terkena najis.\n3. Wudhu sempurna.\n4. Masukkan jari-jari yang basah ke sela-sela rambut dan gosok kulit kepala.\n5. Tuangkan air ke kepala tiga kali.\n6. Ratakan air ke seluruh tubuh mulai kanan lalu kiri.\n7. Membasuh kedua kaki.\n\nSebab mandi wajib: junub (jima' atau keluar mani), haid, nifas, melahirkan, masuk Islam.", Source: "HR. Bukhari No. 248, Muslim No. 316", SortOrder: 5},
				{Title: "Tayammum: Syarat dan Tata Cara", Slug: "tayammum-syarat-cara", Content: "Tayammum adalah pengganti wudhu/mandi menggunakan debu suci ketika tidak ada air atau tidak mampu menggunakannya.\n\nSyarat tayammum:\n1. Tidak ada air setelah mencari dengan sungguh-sungguh, atau ada tapi tidak cukup.\n2. Ada udzur (sakit, jauh dari air, dll.) sehingga penggunaan air membahayakan.\n3. Masuk waktu sholat (menurut sebagian ulama).\n4. Menggunakan tanah/debu yang suci.\n\nRukun tayammum:\n1. Niat.\n2. Menepuk debu satu kali dengan kedua telapak tangan.\n3. Mengusap wajah.\n4. Mengusap kedua tangan hingga pergelangan.\n5. Tertib.\n\nDasar: QS. An-Nisa: 43, QS. Al-Maidah: 6.", Source: "HR. Bukhari No. 338, Muslim No. 368", SortOrder: 6},
			},
		},
		{
			slug: "sholat",
			items: []model.FiqhItem{
				{Title: "Syarat Sah Sholat", Slug: "syarat-sah-sholat", Content: "Syarat sah sholat yang harus dipenuhi sebelum sholat:\n1. Islam.\n2. Berakal dan tamyiz.\n3. Suci dari hadats kecil (wudhu) dan besar (mandi).\n4. Suci pakaian, badan, dan tempat sholat dari najis.\n5. Menutup aurat — laki-laki: antara pusar hingga lutut; perempuan: seluruh tubuh kecuali wajah dan telapak tangan.\n6. Menghadap kiblat (Ka'bah di Makkah).\n7. Telah masuk waktu sholat.\n8. Niat di dalam hati.", Source: "QS. Al-Baqarah: 43; QS. Al-Ma'idah: 6; HR. Bukhari No. 1; HR. Muslim No. 1907", SortOrder: 1},
				{Title: "Rukun Sholat", Slug: "rukun-sholat", Content: "Rukun sholat (fardu yang jika ditinggalkan sholat batal):\n1. Niat di dalam hati bersamaan takbiratul ihram.\n2. Berdiri bagi yang mampu.\n3. Takbiratul ihram: 'Allahu Akbar'.\n4. Membaca Al-Fatihah di setiap rakaat.\n5. Ruku' dengan thuma'ninah.\n6. I'tidal (bangkit dari ruku') dengan thuma'ninah.\n7. Sujud dua kali dengan thuma'ninah.\n8. Duduk antara dua sujud dengan thuma'ninah.\n9. Tasyahhud akhir.\n10. Sholawat atas Nabi ﷺ dalam tasyahhud akhir.\n11. Salam pertama.\n12. Tertib (berurutan).\n\nThuma'ninah: tenang minimal seukuran satu tasbih.", Source: "HR. Bukhari No. 1; HR. Muslim No. 1907; HR. Bukhari No. 756; HR. Muslim No. 394; HR. Bukhari No. 793, Muslim No. 397", SortOrder: 2},
				{Title: "Hal yang Membatalkan Sholat", Slug: "pembatal-sholat", Content: "Sholat batal karena:\n1. Sengaja berbicara selain bacaan sholat.\n2. Banyak bergerak di luar gerakan sholat.\n3. Hadas kecil atau besar (keluar sesuatu dari qubul/dubur, dll.).\n4. Terkena najis pada badan, pakaian, atau tempat yang tidak segera disingkirkan.\n5. Terbuka aurat dan tidak segera ditutup.\n6. Mengubah niat (misalnya berniat keluar dari sholat).\n7. Makan dan minum dengan sengaja.\n8. Tertawa terbahak-bahak.\n9. Membelakangi kiblat tanpa udzur.\n10. Sengaja mendahului imam dalam gerakan (bagi makmum).\n\nCatatan ulama: rincian pembatal sholat dikembalikan kepada nash tentang larangan berbicara/bergerak di luar sholat, kewajiban thaharah, menghadap kiblat, serta penjelasan fuqaha salaf.", Source: "HR. Muslim No. 537; QS. Al-Baqarah: 144; Al-Mughni, Ibn Qudamah", SortOrder: 3},
				{Title: "Waktu-Waktu Sholat Fardhu", Slug: "waktu-sholat-fardhu", Content: "Waktu sholat fardhu lima waktu:\n1. Subuh: dari terbit fajar shadiq (fajar kedua) hingga terbit matahari.\n2. Dzuhur: dari matahari tergelincir (zawal) hingga bayangan benda sama panjang dengannya.\n3. Ashar: dari akhir waktu dzuhur hingga terbenamnya matahari. Waktu utama: sebelum matahari menguning.\n4. Maghrib: dari terbenam matahari hingga hilangnya mega merah di ufuk barat.\n5. Isya: dari hilangnya mega merah hingga tengah malam (atau terbit fajar dalam kondisi darurat).\n\nDasar: QS. An-Nisa: 103, HR. Muslim No. 614 (hadith Jibril menuntun waktu sholat).", Source: "HR. Muslim No. 614, HR. Bukhari No. 521", SortOrder: 4},
				{Title: "Sholat Sunnah Rawatib", Slug: "sholat-sunnah-rawatib", Content: "Sholat sunnah rawatib (mengikuti sholat fardhu):\n\nSunnah muakkadah (sangat dianjurkan):\n- 2 rakaat sebelum Subuh (paling utama).\n- 4 rakaat sebelum Dzuhur dan 2 rakaat sesudahnya.\n- 2 rakaat sesudah Maghrib.\n- 2 rakaat sesudah Isya.\n\nSunnah ghairu muakkadah:\n- 4 rakaat sebelum Ashar.\n- 2 rakaat sebelum Maghrib.\n- 2 rakaat sebelum Isya.\n\nKeutamaan: 'Barangsiapa menjaga 12 rakaat sunnah, Allah akan bangunkan baginya rumah di surga.' (HR. Muslim No. 728)", Source: "HR. Muslim No. 728, Tirmidzi No. 415", SortOrder: 5},
			},
		},
		{
			slug: "puasa",
			items: []model.FiqhItem{
				{Title: "Rukun Puasa", Slug: "rukun-puasa", Content: "Puasa memiliki dua rukun:\n1. Niat di dalam hati — untuk puasa wajib, niat dilakukan sebelum terbit fajar. Tidak ada lafaz niat khusus yang wajib dibaca.\n2. Imsak — menahan diri dari semua yang membatalkan puasa sejak terbit fajar shadiq hingga terbenam matahari.\n\nDasar: QS. Al-Baqarah: 183-187.\n\nCatatan ulama: fuqaha salaf menjelaskan niat sebagai amalan hati; lafaz niat bukan rukun puasa.", Source: "QS. Al-Baqarah: 183-187; HR. Bukhari No. 1; HR. Muslim No. 1907; HR. Abu Dawud No. 2454; Al-Mughni, Ibn Qudamah", SortOrder: 1},
				{Title: "Hal yang Membatalkan Puasa", Slug: "pembatal-puasa", Content: "Pembatal puasa yang disepakati ulama:\n1. Makan dan minum dengan sengaja.\n2. Jima' (hubungan suami istri) di siang hari — wajib qadha + kafarat (memerdekakan budak, atau puasa 2 bulan berturut-turut, atau memberi makan 60 orang miskin).\n3. Muntah dengan sengaja.\n4. Haid dan nifas (wajib qadha, tanpa kafarat).\n5. Keluarnya mani dengan sengaja (selain mimpi).\n6. Berniat buka puasa (meskipun belum makan).\n\nYang tidak membatalkan: makan/minum karena lupa, mimpi basah, sikat gigi dengan pasta gigi tanpa ditelan, menelan ludah sendiri, suntikan obat yang bukan nutrisi (menurut pendapat kuat).", Source: "HR. Bukhari No. 1933, Muslim No. 1111", SortOrder: 2},
				{Title: "Orang yang Boleh Tidak Berpuasa", Slug: "rukhsah-puasa", Content: "Islam memberikan keringanan bagi:\n1. Musafir (dalam perjalanan ≥81 km) — boleh tidak puasa dan wajib qadha.\n2. Orang sakit yang memberatkan — boleh tidak puasa dan wajib qadha.\n3. Wanita hamil/menyusui yang khawatir atas diri/bayinya — boleh tidak puasa, wajib qadha (dan sebagian ulama menambahkan fidyah).\n4. Orang tua renta yang tidak mampu — tidak wajib puasa, wajib fidyah 1 mud (±600gr) makanan pokok per hari.\n5. Orang sakit menahun yang tidak diharapkan sembuh — fidyah setiap hari.\n\nFidyah: memberi makan satu orang miskin senilai satu kali makan.", Source: "QS. Al-Baqarah: 184-185; HR. Bukhari No. 1943", SortOrder: 3},
				{Title: "Puasa Sunnah Utama", Slug: "puasa-sunnah-utama", Content: "Puasa sunnah yang sangat dianjurkan:\n1. Senin & Kamis — 'Amal-amal diperlihatkan pada hari Senin dan Kamis, maka aku ingin amalku diperlihatkan dalam keadaan aku berpuasa.' (HR. Tirmidzi No. 747)\n2. Ayyamul Bidh (13, 14, 15 setiap bulan Hijriah) — 'Puasa tiga hari setiap bulan seperti puasa setahun penuh.' (HR. Muslim No. 1162)\n3. Puasa Syawal 6 hari — 'Seperti puasa setahun.' (HR. Muslim No. 1164)\n4. Puasa Arafah (9 Dzulhijjah) — menghapus dosa setahun lalu dan akan datang. (HR. Muslim No. 1162)\n5. Puasa Asyura (10 Muharram) + Tasu'a (9 Muharram) — menghapus dosa setahun lalu. (HR. Muslim No. 1162)\n6. Puasa Dawud — sehari puasa sehari tidak (puasa terbaik menurut Nabi ﷺ). (HR. Bukhari No. 1979)", Source: "HR. Muslim, Bukhari, Tirmidzi, Abu Dawud", SortOrder: 4},
			},
		},
		{
			slug: "zakat",
			items: []model.FiqhItem{
				{Title: "Syarat Wajib Zakat Maal", Slug: "syarat-zakat-maal", Content: "Zakat maal wajib bagi yang memenuhi syarat:\n1. Islam.\n2. Merdeka (bukan budak).\n3. Memiliki harta yang mencapai nishab.\n4. Harta telah dimiliki selama satu tahun penuh (haul).\n5. Harta merupakan milik penuh (bukan hutang, bukan terlantar).\n\nNishab:\n- Emas: 85 gram emas murni\n- Perak: 595 gram perak\n- Uang: senilai 85 gram emas\n- Hasil pertanian: 653 kg (5 wasaq) — tanpa syarat haul\n- Ternak: sesuai ketentuan masing-masing jenis\n\nKadar zakat maal: 2,5% dari total harta yang telah mencapai nishab dan haul.", Source: "HR. Abu Dawud No. 1573, Tirmidzi No. 620", SortOrder: 1},
				{Title: "Zakat Fitrah: Ketentuan dan Waktu", Slug: "zakat-fitrah", Content: "Zakat fitrah:\n- Wajib bagi setiap muslim yang memiliki kelebihan makanan pokok melebihi kebutuhannya dan tanggungannya di hari Idul Fitri.\n- Besaran: 1 sha' (±2,5 kg atau 3,5 liter) bahan makanan pokok (beras, gandum, kurma, dll.), atau boleh dengan nilai uangnya.\n- Waktu yang afdhol: pagi hari sebelum sholat Id.\n- Waktu yang boleh: sejak awal Ramadan.\n- Haram dibayar setelah sholat Id (hanya bernilai sedekah biasa).\n- Tujuan: menyucikan orang yang berpuasa dari ucapan kotor dan perbuatan buruk, serta sebagai makanan bagi orang-orang miskin. (HR. Abu Dawud No. 1609)\n- Mustahiq: delapan golongan sama dengan zakat maal.", Source: "HR. Bukhari No. 1503, Abu Dawud No. 1609", SortOrder: 2},
				{Title: "Mustahiq (Penerima) Zakat", Slug: "mustahiq-zakat", Content: "Allah menetapkan 8 golongan penerima zakat dalam QS. At-Taubah: 60:\n1. Fakir — tidak memiliki harta dan pekerjaan.\n2. Miskin — memiliki pekerjaan/harta tapi tidak mencukupi kebutuhan pokok.\n3. Amil zakat — panitia yang mengurus pengumpulan dan distribusi zakat.\n4. Muallaf — orang yang baru masuk Islam atau yang diharapkan islamnya.\n5. Riqab — memerdekakan budak (pada masa perbudakan).\n6. Gharim — orang yang terlilit hutang bukan untuk kemaksiatan.\n7. Fisabilillah — pejuang di jalan Allah sesuai batasan syar'i.\n8. Ibnu Sabil — musafir yang kehabisan bekal di perjalanan.\n\nCatatan ulama: pembagian delapan ashnaf mengikuti nash ayat; rincian batasannya dijelaskan dalam tafsir salaf dan kitab fiqh mu'tabar.", Source: "QS. At-Taubah: 60; Tafsir Ibn Kathir; Al-Mughni, Ibn Qudamah", SortOrder: 3},
			},
		},
		{
			slug: "haji-umrah",
			items: []model.FiqhItem{
				{Title: "Syarat Wajib Haji", Slug: "syarat-wajib-haji", Content: "Haji wajib bagi yang memenuhi syarat (istitha'ah):\n1. Islam.\n2. Berakal.\n3. Baligh.\n4. Merdeka.\n5. Mampu (istitha'ah) — secara fisik sehat, finansial mencukupi ongkos PP dan biaya hidup selama haji serta nafkah keluarga yang ditinggalkan, dan aman di perjalanan.\n6. Bagi perempuan: harus bersama mahram atau rombongan perempuan terpercaya (terjadi perbedaan pendapat ulama).\n\nDasar: QS. Ali-Imran: 97 — 'Mengerjakan haji adalah kewajiban manusia terhadap Allah, yaitu bagi orang yang mampu mengadakan perjalanan ke Baitullah.'", Source: "QS. Ali-Imran: 97; HR. Bukhari No. 1513", SortOrder: 1},
				{Title: "Rukun Haji", Slug: "rukun-haji", Content: "Rukun haji (jika ditinggalkan, haji batal dan tidak dapat diganti dam):\n1. Ihram — niat memasuki ibadah haji.\n2. Wukuf di Arafah — pada 9 Dzulhijjah dari zawal hingga fajar 10 Dzulhijjah.\n3. Tawaf ifadhah (tawaf ziarah) — setelah wukuf, 7 putaran mengelilingi Ka'bah.\n4. Sa'i — berjalan antara Shafa dan Marwah 7 kali.\n5. Tahallul — mencukur/memotong rambut.\n6. Tertib.\n\n'Haji itu (wukuf di) Arafah.' (HR. Tirmidzi No. 889, dinyatakan hasan shahih)\n\nCatatan ulama: rincian rukun haji diringkas dari nash manasik dan penjelasan fuqaha mu'tabar.", Source: "QS. Al-Baqarah: 158, 196; HR. Tirmidzi No. 889; Al-Mughni, Ibn Qudamah", SortOrder: 2},
				{Title: "Wajib Haji dan Konsekuensi Meninggalkannya", Slug: "wajib-haji", Content: "Wajib haji (jika ditinggalkan, haji tetap sah tapi wajib membayar dam/denda):\n1. Ihram dari miqat yang telah ditentukan.\n2. Mabit di Muzdalifah (malam 10 Dzulhijjah).\n3. Melempar Jumrah Aqabah (7 batu) pada 10 Dzulhijjah.\n4. Mabit di Mina malam-malam hari Tasyriq (11, 12, 13 Dzulhijjah).\n5. Melempar ketiga Jumrah (Ula, Wusta, Aqabah) pada hari Tasyriq.\n6. Tawaf Wada' (perpisahan) sebelum meninggalkan Makkah.\n\nDam/denda: menyembelih seekor kambing dan dagingnya dibagikan kepada fakir miskin di Tanah Haram.\n\nCatatan ulama: pembedaan rukun dan wajib haji mengikuti penjelasan fuqaha salaf; rukun membatalkan haji jika ditinggalkan, sedangkan wajib diganti dengan dam.", Source: "QS. Al-Baqarah: 196; HR. Bukhari & Muslim; Al-Mughni, Ibn Qudamah", SortOrder: 3},
			},
		},
		{
			slug: "muamalah",
			items: []model.FiqhItem{
				{Title: "Syarat Sah Jual Beli dalam Islam", Slug: "syarat-jual-beli", Content: "Jual beli (bay') dalam Islam sah jika memenuhi syarat:\n\nSyarat pelaku:\n1. Berakal dan tamyiz.\n2. Ridha/suka sama suka — tidak ada unsur paksaan.\n3. Bukan orang yang dilarang bertransaksi (safih/pemboros yang dilarang wali).\n\nSyarat barang:\n1. Suci — tidak boleh menjual najis.\n2. Bermanfaat — tidak boleh menjual sesuatu yang tidak ada manfaatnya.\n3. Dimiliki penjual atau ada izin dari pemilik.\n4. Dapat diserahterimakan.\n5. Diketahui dengan jelas (tidak ada gharar/ketidakjelasan).\n\nDasar: QS. An-Nisa: 29 — 'Janganlah kamu memakan harta sesamamu dengan cara yang bathil, kecuali melalui perniagaan yang berlaku atas dasar suka sama suka.'\n\nCatatan ulama: syarat barang dan akad dirumuskan fuqaha dari larangan gharar, riba, dan memakan harta secara batil.", Source: "QS. An-Nisa: 29; HR. Muslim No. 1513; Al-Mughni, Ibn Qudamah", SortOrder: 1},
				{Title: "Transaksi yang Dilarang dalam Islam", Slug: "transaksi-dilarang", Content: "Islam melarang berbagai transaksi yang mengandung:\n\n1. Riba (bunga/riba) — QS. Al-Baqarah: 275-279. Termasuk riba nasi'ah (riba karena penundaan) dan riba fadhl (riba karena kelebihan).\n2. Gharar — ketidakjelasan yang merugikan salah satu pihak. Contoh: membeli ikan di laut, buah yang belum matang di pohon (bai' al-mu'awamah).\n3. Maysir (judi) — QS. Al-Maidah: 90-91.\n4. Jual beli barang haram — minuman keras, babi, dan sejenisnya.\n5. Bay' najsy — menawar dengan tujuan menaikkan harga bukan untuk membeli, agar pembeli lain terpancing.\n6. Bay' al-'inah — menjual barang dengan kredit kemudian membelinya kembali lebih murah secara tunai (rekayasa riba).\n7. Ihtikar — menimbun barang kebutuhan pokok hingga harga naik.", Source: "QS. Al-Baqarah: 275; QS. Al-Maidah: 90; HR. Muslim No. 1513", SortOrder: 2},
			},
		},
		{
			slug: "nikah",
			items: []model.FiqhItem{
				{Title: "Rukun dan Syarat Nikah", Slug: "rukun-syarat-nikah", Content: "Rukun nikah (jika salah satu tidak ada, nikah tidak sah):\n1. Calon suami.\n2. Calon istri.\n3. Wali nikah dari pihak perempuan.\n4. Dua orang saksi laki-laki muslim yang adil.\n5. Ijab (dari wali) dan qabul (dari calon suami) dalam satu majelis.\n\nSyarat calon suami: Islam, berakal, tidak dalam ihram, tidak dalam kondisi yang menghalangi.\nSyarat calon istri: Islam (atau Ahli Kitab menurut jumhur), tidak ada penghalang (dalam iddah, mahram, istri keempat, dll.).\nSyarat wali: laki-laki, Islam, baligh, berakal, adil, tidak dalam ihram.\n\n'Tidak ada nikah tanpa wali.' (HR. Abu Dawud No. 2085, Tirmidzi No. 1101 — shahih)\n\nCatatan ulama: rincian rukun nikah mengikuti pemahaman jumhur fuqaha berdasarkan nash wali, saksi, dan akad.", Source: "QS. An-Nur: 32; HR. Abu Dawud No. 2085; Al-Mughni, Ibn Qudamah", SortOrder: 1},
				{Title: "Mahar dalam Pernikahan Islam", Slug: "mahar-nikah", Content: "Mahar (maskawin) adalah hak istri yang wajib diberikan suami:\n- Wajib hukumnya, bukan syarat sah nikah tapi syarat kesempurnaan nikah. QS. An-Nisa: 4 — 'Dan berikanlah mas kawin (mahar) kepada wanita yang kamu nikahi sebagai pemberian yang penuh kerelaan.'\n- Bentuknya: boleh berupa uang, emas, barang berharga, jasa mengajar Al-Quran, hafalan Al-Quran, atau apa pun yang bermanfaat dan disetujui kedua pihak.\n- Tidak ada batasan minimal dan maksimal secara syar'i, namun Nabi ﷺ menganjurkan yang mudah. 'Sebaik-baik mahar adalah yang paling mudah.' (HR. Abu Dawud No. 2117)\n- Mahar menjadi milik penuh istri dan suami tidak berhak memintanya kembali kecuali ada kerelaan dari istri.", Source: "QS. An-Nisa: 4; HR. Abu Dawud No. 2117", SortOrder: 2},
			},
		},
		{
			slug: "jenazah",
			items: []model.FiqhItem{
				{Title: "Kewajiban Mengurus Jenazah Muslim", Slug: "kewajiban-jenazah", Content: "Mengurus jenazah muslim hukumnya fardhu kifayah (kewajiban yang gugur jika sebagian kaum muslimin telah melaksanakannya), meliputi empat hal:\n1. Memandikan (ghusl al-mayyit).\n2. Mengkafani (takfin).\n3. Mensholatkan (sholat jenazah).\n4. Menguburkan (dafn).\n\nMemandikan jenazah: diniatkan, diawali dengan wudhu jenazah, lalu dibasuh seluruh tubuh minimal sekali — dianjurkan ganjil (3, 5, 7 kali). Gunakan air bersih, boleh ditambah daun bidara atau sedikit kapur barus di basuhan terakhir.\n\nMengkafani: minimal 1 lembar yang menutup seluruh tubuh. Sunnah laki-laki 3 lembar, perempuan 5 lembar.", Source: "HR. Bukhari No. 1253, Muslim No. 939", SortOrder: 1},
				{Title: "Sholat Jenazah: Tata Cara dan Bacaan", Slug: "sholat-jenazah", Content: "Sholat jenazah adalah fardhu kifayah dengan 4 takbir:\n\nTakbir 1: Membaca Al-Fatihah (sunnah didahului Ta'awwudz dan Basmalah)\nTakbir 2: Membaca sholawat atas Nabi ﷺ (minimal: Allahumma shalli 'alaa Muhammad)\nTakbir 3: Doa untuk mayit:\n'Allahummaghfir lahu warhamhu wa 'aafihi wa'fu 'anhu wa akrim nuzulahu wa wassi' mudkhalahu waghsilhu bil maa'i wats tsalji wal baradi...'\nTakbir 4: Doa penutup, kemudian salam ke kanan.\n\nCatatan: tidak ada ruku', sujud, atau tasyahhud dalam sholat jenazah. Imam berdiri sejajar kepala jenazah laki-laki dan sejajar perut jenazah perempuan.", Source: "HR. Muslim No. 963; Abu Dawud No. 3201", SortOrder: 2},
			},
		},
	}

	for _, cat := range data {
		var category model.FiqhCategory
		if err := db.Where("slug = ?", cat.slug).First(&category).Error; err != nil {
			continue
		}
		for i := range cat.items {
			cat.items[i].CategoryID = lib.Intptr(*category.ID)
			db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "slug"}},
				DoUpdates: clause.AssignmentColumns([]string{"title", "content", "source", "sort_order"}),
			}).Create(&cat.items[i])
		}
	}
}

func seedSirohContentsRelated(db *gorm.DB) {
	type catContent struct {
		slug     string
		contents []model.SirohContent
	}

	data := []catContent{
		{
			slug: "nasab-kelahiran",
			contents: []model.SirohContent{
				{Title: "Nasab Rasulullah ﷺ", Slug: "nasab-rasulullah", Content: "Muhammad bin Abdullah bin Abdul Muthalib bin Hasyim bin Abdu Manaf bin Qushay bin Kilab bin Murrah bin Ka'ab bin Lu'ay bin Ghalib bin Fihr bin Malik bin An-Nadhr bin Kinanah bin Khuzaymah bin Mudrikah bin Ilyas bin Mudhar bin Nizar bin Ma'ad bin Adnan.\n\nNasab ini disepakati kesahihannya hingga Adnan. Adnan adalah keturunan Nabi Ismail bin Ibrahim 'alayhimassalam.\n\nDari sisi ibu: Aminah binti Wahb bin Abdu Manaf bin Zuhrah bin Kilab — bertemu dengan nasab ayah pada Kilab bin Murrah.\n\nSumber: Sirah Ibn Hisham, Ar-Raheeq Al-Makhtum oleh Shafiyyurrahman Al-Mubarakfuri.", Order: 1},
				{Title: "Kelahiran Nabi Muhammad ﷺ", Slug: "kelahiran-nabi", Content: "Nabi Muhammad ﷺ lahir di Makkah Al-Mukarramah pada hari Senin, 12 Rabi'ul Awwal tahun Gajah (bertepatan dengan sekitar 571 M).\n\nTahun Gajah adalah tahun ketika pasukan bergajah Abrahah dari Yaman datang menyerang Ka'bah dan dihancurkan Allah dengan burung Ababil (QS. Al-Fil).\n\nAyahnya, Abdullah bin Abdul Muthalib, telah wafat sebelum kelahirannya — dalam perjalanan dagang ke Syam, beberapa bulan sebelum Nabi ﷺ lahir.\n\nBayi Muhammad ﷺ pertama kali disusui oleh Tsuwaibah, budak Abu Lahab, beberapa hari. Kemudian diserahkan kepada Halimah As-Sa'diyah dari Bani Sa'd di pelosok padang pasir — sesuai kebiasaan bangsawan Arab untuk menyusukan bayi di desa agar tumbuh sehat.\n\nPada usia 5-6 tahun, Halimah mengembalikan Nabi ﷺ kepada ibunya. Pada usia 6 tahun, ibundanya Aminah wafat saat perjalanan pulang dari Yatsrib (Madinah) dan dikuburkan di Al-Abwa'.", Order: 2},
				{Title: "Pemeliharaan oleh Kakek dan Paman", Slug: "kakek-paman-nabi", Content: "Setelah ibunda Aminah wafat, Nabi ﷺ diasuh oleh kakeknya Abdul Muthalib — pemimpin Quraisy yang sangat dicintai rakyat. Abdul Muthalib sangat menyayangi cucunya yang yatim piatu ini.\n\nPada usia 8 tahun, Abdul Muthalib wafat. Wasiatnya menyerahkan Nabi ﷺ kepada pamannya Abu Thalib — saudara kandung Abdullah (ayah Nabi ﷺ).\n\nAbu Thalib membesarkan dan melindungi Nabi ﷺ dengan penuh kasih sayang. Meski tidak pernah masuk Islam, Abu Thalib senantiasa membela dan melindungi keponakan tercintanya sepanjang hidupnya.\n\nSumber: Sirah Ibn Hisham; Ar-Raheeq Al-Makhtum.", Order: 3},
			},
		},
		{
			slug: "masa-kecil-remaja",
			contents: []model.SirohContent{
				{Title: "Perjalanan ke Syam bersama Abu Thalib", Slug: "perjalanan-syam-abu-thalib", Content: "Pada usia 12 tahun, Nabi ﷺ menyertai pamannya Abu Thalib dalam perjalanan dagang ke Syam (Suriah). Dalam perjalanan ini, seorang pendeta Nasrani bernama Bahira di Bushra (Bostra) melihat tanda-tanda kenabian pada diri Muhammad ﷺ dan mengingatkan Abu Thalib untuk menjaganya dari orang-orang Yahudi yang bisa membahayakannya.\n\nPada usia sekitar 25 tahun, Nabi ﷺ pergi berdagang ke Syam atas permintaan Khadijah binti Khuwaylid — seorang janda kaya dan terpandang. Pembantu Khadijah, Maisarah, menyaksikan kemuliaan akhlak dan kejujuran Muhammad ﷺ dalam perjalanan tersebut.", Order: 1},
				{Title: "Pernikahan dengan Khadijah binti Khuwaylid ra.", Slug: "pernikahan-khadijah", Content: "Setelah menyaksikan laporan Maisarah tentang kejujuran dan kemuliaan Muhammad ﷺ dalam perjalanan dagang, Khadijah menyampaikan keinginannya untuk menikah melalui perantara Nafisah binti Munabbih.\n\nNabi ﷺ menerima lamaran tersebut. Pernikahan berlangsung saat Nabi ﷺ berusia 25 tahun dan Khadijah berusia 40 tahun.\n\nMahar pernikahan: 20 ekor unta muda (menurut satu riwayat).\n\nKhadijah ra. adalah orang pertama yang beriman kepada Nabi ﷺ ketika wahyu turun. Ia adalah ibu dari semua anak Nabi ﷺ: Al-Qasim, Abdullah, Zainab, Ruqayyah, Ummu Kulsum, dan Fatimah Az-Zahra ra.\n\nNabi ﷺ tidak menikah dengan wanita lain selama Khadijah masih hidup — selama 25 tahun hingga Khadijah wafat.\n\nSumber: HR. Bukhari No. 3820, Sirah Ibn Hisham.", Order: 2},
				{Title: "Peristiwa Hilful Fudhul dan Pembangunan Ka'bah", Slug: "hilful-fudhul-kabah", Content: "Sebelum kenabian, Muhammad ﷺ dikenal dengan julukan Al-Amin (yang sangat dipercaya) dan As-Shadiq (yang jujur).\n\nIa turut serta dalam Hilful Fudhul — sebuah pakta persaudaraan para pemuda Quraisy yang dibentuk untuk membela orang-orang tertindas dan memastikan keadilan. Nabi ﷺ pernah menyebut bahwa ia masih bangga dengan pakta mulia ini meskipun telah bersyariat Islam.\n\nPada usia 35 tahun, kaum Quraisy merenovasi Ka'bah setelah kebakaran. Perselisihan terjadi tentang siapa yang berhak meletakkan Hajar Aswad kembali ke tempat semula. Mereka sepakat memilih siapa yang pertama masuk pintu Masjidil Haram — Muhammad ﷺ yang datang pertama. Ia kemudian meletakkan Hajar Aswad di atas kain dan meminta perwakilan tiap kabilah memegang ujungnya, lalu mengangkatnya bersama-sama — solusi bijak yang menghindari pertumpahan darah.\n\nSumber: Sirah Ibn Hisham; Ar-Raheeq Al-Makhtum.", Order: 3},
			},
		},
		{
			slug: "kenabian-dakwah-makkah",
			contents: []model.SirohContent{
				{Title: "Turunnya Wahyu Pertama di Gua Hira", Slug: "wahyu-pertama-hira", Content: "Muhammad ﷺ sering berkhalwat (menyendiri) di Gua Hira di Jabal Nur, Makkah, untuk bertafakur dan beribadah kepada Allah.\n\nPada malam 17 Ramadan tahun ke-40 dari kelahirannya (bertepatan sekitar 610 M), Malaikat Jibril datang dan memeluknya tiga kali sambil berkata: 'Iqra!' (Bacalah!). Nabi ﷺ menjawab: 'Maa ana bi qaari'' (Aku tidak bisa membaca).\n\nKemudian Jibril membacakan QS. Al-Alaq: 1-5:\n'Bacalah dengan (menyebut) nama Tuhanmu yang Menciptakan. Dia telah menciptakan manusia dari segumpal darah. Bacalah, dan Tuhanmulah Yang Maha Pemurah. Yang mengajar (manusia) dengan pena. Dia mengajarkan kepada manusia apa yang tidak diketahuinya.'\n\nNabi ﷺ pulang dalam keadaan gemetar dan langsung mendekap Khadijah. Khadijah kemudian membawa beliau kepada sepupunya Waraqah bin Naufal — seorang tua yang berilmu — yang menyatakan bahwa itu adalah wahyu seperti yang diterima Musa as.\n\nSumber: HR. Bukhari No. 3, Muslim No. 160.", Order: 1},
				{Title: "Fase Dakwah Sirriyah (Rahasia)", Slug: "dakwah-sirriyah", Content: "Tiga tahun pertama dakwah dilakukan secara sembunyi-sembunyi (dakwah sirriyah). Nabi ﷺ mengajak orang-orang terdekat:\n\nOrang pertama yang masuk Islam:\n1. Khadijah binti Khuwaylid ra. — istri Nabi ﷺ (dari kalangan wanita).\n2. Ali bin Abi Thalib ra. — sepupu yang tinggal di rumah Nabi ﷺ, usia ~10 tahun (dari kalangan anak-anak).\n3. Abu Bakar Ash-Shiddiq ra. — sahabat dekat (dari kalangan laki-laki dewasa/merdeka).\n4. Zaid bin Haritsah ra. — budak yang dibebaskan Nabi ﷺ.\n\nAbu Bakar kemudian mengajak beberapa tokoh yang masuk Islam: Utsman bin Affan, Abdurrahman bin Auf, Az-Zubair bin Al-Awwam, Thalhah bin Ubaidillah, dan Sa'd bin Abi Waqqash ra.\n\nMajelis pengajaran dilakukan di rumah Al-Arqam bin Abi Al-Arqam.\n\nSumber: Sirah Ibn Hisham; HR. Bukhari No. 3818.", Order: 2},
				{Title: "Hijrah Pertama ke Habasyah", Slug: "hijrah-habasyah", Content: "Setelah tiga tahun dakwah rahasia, pada tahun ke-5 kenabian Allah memerintahkan dakwah terang-terangan (QS. Al-Hijr: 94). Tekanan dan penyiksaan kaum Quraisy kepada kaum muslimin semakin meningkat.\n\nNabi ﷺ mengizinkan para sahabat yang lemah dan tidak memiliki pelindung untuk hijrah ke Habasyah (Ethiopia/Abyssinia) — negeri yang adil di bawah Raja Najasyi (Ashhamah bin Abjar).\n\nHijrah pertama (tahun ke-5 kenabian): ~12 laki-laki dan 4 perempuan, dipimpin Utsman bin Affan dan istrinya Ruqayyah ra.\n\nHijrah kedua (lebih besar): ~83 laki-laki, melarikan diri dari penganiayaan Quraisy. Di hadapan Raja Najasyi, Ja'far bin Abi Thalib membacakan QS. Maryam dan sang raja menitikkan air mata — ia tidak menyerahkan kaum muslimin kepada utusan Quraisy.\n\nSumber: HR. Ahmad; Sirah Ibn Hisham.", Order: 3},
			},
		},
		{
			slug: "hijrah-madinah",
			contents: []model.SirohContent{
				{Title: "Peristiwa Isra' Mi'raj", Slug: "isra-miraj", Content: "Pada tahun ke-10 kenabian (tahun Duka — 'Aam Al-Huzn), Nabi ﷺ kehilangan dua orang yang sangat dicintainya: paman pelindungnya Abu Thalib dan istri tercintanya Khadijah ra.\n\nAllah menghibur Nabi ﷺ dengan peristiwa Isra' Mi'raj:\n- Isra': perjalanan malam dari Masjidil Haram (Makkah) ke Masjidil Aqsha (Yerusalem) dengan Buraq.\n- Mi'raj: perjalanan naik dari Masjidil Aqsha menembus langit-langit hingga Sidratul Muntaha.\n\nDi Sidratul Muntaha, Allah mewajibkan sholat 5 waktu — awalnya 50 waktu, kemudian dikurangi atas permohonan Nabi ﷺ atas saran Nabi Musa as. hingga menjadi 5 waktu dengan pahala 50 waktu.\n\nDasar: QS. Al-Isra: 1; HR. Bukhari No. 3207, Muslim No. 162.", Order: 1},
				{Title: "Baiat Aqabah dan Persiapan Hijrah", Slug: "baiat-aqabah", Content: "Pada musim haji, Nabi ﷺ bertemu dengan utusan dari Yatsrib (Madinah) di Aqabah:\n\nBaiat Aqabah Pertama (tahun ke-12 kenabian): 12 orang dari Aws dan Khazraj berjanji tidak menyekutukan Allah, tidak mencuri, tidak berzina, tidak membunuh anak, tidak berdusta, dan tidak mendurhakai Nabi ﷺ dalam kebaikan.\n\nBaiat Aqabah Kedua (tahun ke-13 kenabian): 73 laki-laki dan 2 perempuan. Mereka berjanji melindungi Nabi ﷺ seperti melindungi istri dan anak-anak mereka. Ini adalah baiat perang (baiat jihad) pertama.\n\nNabi ﷺ kemudian mengizinkan para sahabat hijrah ke Madinah. Kaum Quraisy berusaha menghalangi dan merancang pembunuhan terhadap Nabi ﷺ (Darun Nadwah).\n\nSumber: Sirah Ibn Hisham; HR. Ahmad.", Order: 2},
				{Title: "Perjalanan Hijrah Rasulullah ﷺ ke Madinah", Slug: "perjalanan-hijrah", Content: "Mengetahui rencana pembunuhan Quraisy, Allah memerintahkan Nabi ﷺ hijrah ke Madinah.\n\nNabi ﷺ bersama Abu Bakar ra. keluar dari Makkah di malam hari (1 Rabi'ul Awwal / Juli 622 M). Ali bin Abi Thalib ra. diminta tidur di tempat Nabi ﷺ untuk mengecoh para pengepung.\n\nMereka bersembunyi di Gua Tsur di selatan Makkah selama tiga malam. Kaum Quraisy menawarkan hadiah 100 ekor unta bagi yang berhasil menangkap Muhammad ﷺ.\n\nSetelah tiga hari, mereka bertolak ke Madinah melewati rute yang tidak biasa, dipandu oleh Abdullah bin Uraiqith. Dalam perjalanan, seorang penunggang kuda bernama Suraqah bin Malik hampir menangkap mereka namun terhalang kakinya terus terperosok ke pasir.\n\nSetelah 14 hari perjalanan, Nabi ﷺ tiba di Quba (pinggiran Madinah) pada 8 Rabi'ul Awwal. Di sini beliau mendirikan Masjid Quba — masjid pertama dalam Islam.\n\nPada 12 Rabi'ul Awwal, Nabi ﷺ memasuki Madinah. Unta Nabi ﷺ (Qaswha) berhenti di tanah milik dua anak yatim Bani Najjar. Di sinilah kemudian dibangun Masjid Nabawi.\n\nSumber: HR. Bukhari No. 3905; Sirah Ibn Hisham.", Order: 3},
			},
		},
		{
			slug: "masyarakat-madinah",
			contents: []model.SirohContent{
				{Title: "Pembangunan Masjid Nabawi", Slug: "masjid-nabawi", Content: "Sesampainya di Madinah, prioritas pertama Nabi ﷺ adalah membangun masjid. Tanah tempat berhentinya unta Nabi dibeli dari dua anak yatim seharga 10 dinar emas (dibayar Abu Bakar).\n\nMasjid Nabawi dibangun secara bergotong royong oleh Nabi ﷺ dan para sahabat. Ukuran awal: 60 x 70 hasta. Dinding dari batu bata dan tanah liat, atap dari pelepah kurma, tiang dari batang pohon kurma.\n\nDi sebelah masjid dibangun bilik-bilik sederhana (hujurat) untuk para istri Nabi ﷺ.\n\nSejak awal, masjid bukan hanya tempat sholat tetapi juga pusat kegiatan: pendidikan, pengadilan, perencanaan, dan bahtera kaum muslimin.\n\nSumber: HR. Bukhari No. 428; Sirah Ibn Hisham.", Order: 1},
				{Title: "Piagam Madinah: Konstitusi Pertama Dunia", Slug: "piagam-madinah", Content: "Tak lama setelah tiba di Madinah, Nabi ﷺ menyusun sebuah perjanjian tertulis antara kaum Muhajirin (pendatang dari Makkah), kaum Anshar (penduduk Madinah), dan berbagai suku Yahudi di Madinah.\n\nDokumen ini dikenal sebagai Shahifah Al-Madinah (Piagam Madinah) — dianggap oleh para sejarawan sebagai konstitusi tertulis pertama di dunia.\n\nIsi utama Piagam Madinah:\n1. Semua suku dan kelompok di Madinah adalah satu umat (ummah).\n2. Kaum muslimin dan non-muslim berhak atas perlindungan yang sama.\n3. Kebebasan beragama dijamin.\n4. Pertahanan Madinah adalah tanggung jawab bersama.\n5. Nabi Muhammad ﷺ sebagai otoritas tertinggi dalam penyelesaian perselisihan.\n\nPiagam ini menandai lahirnya negara Madinah — model masyarakat majemuk yang bersatu.\n\nSumber: Sirah Ibn Hisham; Montgomery Watt, Islamic Political Thought.", Order: 2},
				{Title: "Mempersaudarakan Muhajirin dan Anshar (Al-Muakhah)", Slug: "muakhah-muhajirin-anshar", Content: "Salah satu langkah brilian Nabi ﷺ dalam membangun masyarakat Madinah adalah Al-Muakhah — mempersaudarakan kaum Muhajirin dan Anshar.\n\nNabi ﷺ memanggil para sahabat dan mempersaudarakan mereka berpasangan:\n- Abu Bakar — Kharijah bin Zaid Al-Anshari\n- Umar bin Khattab — Itban bin Malik Al-Khazraji\n- Abdurrahman bin Auf — Sa'd bin Ar-Rabi' Al-Anshari\n- Ja'far bin Abi Thalib — Mu'adz bin Jabal\n- Dan seterusnya...\n\nPersaudaraan ini bukan sekadar formalitas: kaum Anshar siap berbagi harta, rumah, bahkan — dalam beberapa kasus — menawarkan salah satu istrinya untuk Muhajirin (yang tentu saja ditolak dengan sopan). Abdurrahman bin Auf yang ditawari setengah harta Sa'd menjawab: 'Cukup tunjukkan padaku di mana pasar!' — lalu berdagang dan menjadi sukses dengan tangannya sendiri.\n\nSumber: HR. Bukhari No. 2294; Sirah Ibn Hisham.", Order: 3},
			},
		},
		{
			slug: "perang-ekspedisi",
			contents: []model.SirohContent{
				{Title: "Perang Badar Al-Kubra (17 Ramadan 2 H / 624 M)", Slug: "perang-badar", Content: "Perang Badar adalah pertempuran besar pertama dalam Islam.\n\nLatar belakang: Nabi ﷺ memimpin ekspedisi untuk mencegat kafilah dagang Quraisy yang dipimpin Abu Sufyan. Kafilah berhasil lolos, namun Quraisy mengirim pasukan besar (~1000 orang) untuk menggempur umat Islam.\n\nKekuatan: Muslim ~313-317 orang (kurang terlatih dan minim perlengkapan) vs. Quraisy ~1000 orang.\n\nHasil: Kemenangan gemilang kaum muslimin. 70 orang Quraisy tewas termasuk Abu Jahl — pemimpin permusuhan terhadap Islam. 70 orang lainnya ditawan. Pihak muslim: 14 syahid.\n\nSignifikansi: Allah menurunkan bantuan malaikat (QS. Al-Anfal: 9). Ini menjadi titik balik sejarah Islam — membuktikan bahwa kebenaran bisa mengalahkan kekuatan fisik.\n\nSumber: HR. Bukhari No. 3992; QS. Al-Anfal: 5-19; Ar-Raheeq Al-Makhtum.", Order: 1},
				{Title: "Perang Uhud (7 Syawal 3 H / 625 M)", Slug: "perang-uhud", Content: "Setahun setelah Badar, Quraisy kembali dengan pasukan ~3000 orang untuk membalas dendam.\n\nKekuatan muslim: ~700 orang. Nabi ﷺ menempatkan 50 pemanah di Bukit Ainain dengan perintah: 'Jangan tinggalkan pos kalian meskipun melihat kami terbunuh atau rampasan.'\n\nFase pertama: kaum muslimin unggul, kaum Quraisy mundur. Namun 40 pemanah meninggalkan pos untuk mengambil ghanimah (rampasan) — melanggar perintah Nabi ﷺ. Khalid bin Walid (saat itu masih kafir) memanfaatkan celah ini untuk menyerang dari belakang.\n\nAkibat: kaum muslimin kocar-kacir, 70 orang syahid termasuk Hamzah bin Abdul Muthalib (paman Nabi ﷺ). Nabi ﷺ sendiri terluka di wajah dan sempat tersiar kabar beliau terbunuh.\n\nPelajaran: pentingnya ketaatan kepada pemimpin dan bahaya godaan duniawi.\n\nSumber: QS. Ali-Imran: 121-179; HR. Bukhari No. 4043; Ar-Raheeq Al-Makhtum.", Order: 2},
			},
		},
		{
			slug: "fath-al-makkah",
			contents: []model.SirohContent{
				{Title: "Penaklukan Makkah Tanpa Pertumpahan Darah (10 Ramadan 8 H / 630 M)", Slug: "fath-al-makkah-peristiwa", Content: "Setelah Perjanjian Hudaybiyah dilanggar oleh sekutu Quraisy (Bani Bakr menyerang Bani Khuza'ah yang bersekutu dengan muslimin), Nabi ﷺ mempersiapkan ekspedisi besar.\n\nPasukan muslim ~10.000 orang bergerak menuju Makkah. Nabi ﷺ masuk Makkah dengan kepala tertunduk penuh syukur di atas untanya, sambil membaca Surah Al-Fath.\n\nAbu Sufyan — pemimpin Quraisy — masuk Islam malam sebelum penaklukan. Nabi ﷺ menyatakan: 'Barangsiapa masuk rumah Abu Sufyan, ia aman. Barangsiapa menutup pintu rumahnya, ia aman. Barangsiapa masuk Masjidil Haram, ia aman.'\n\nNabi ﷺ memasuki Ka'bah dan menghancurkan 360 berhala di dalamnya sambil membaca: 'Jaa'al haqqu wa zahaqal baathil, innal baathila kaana zahuuqa.' (QS. Al-Isra: 81)\n\nKemudian Nabi ﷺ bertanya kepada kaum Quraisy yang berkumpul: 'Apa yang kalian kira akan aku perbuat kepada kalian?' Mereka menjawab: 'Kebaikan, karena engkau saudara yang mulia.' Nabi ﷺ bersabda: 'Pergilah, kalian semua merdeka (antum ath-thulaqa')!'\n\nIni adalah 'Amnesti Umum' terbesar dalam sejarah — tanpa balas dendam, tanpa pembantaian.\n\nSumber: HR. Bukhari No. 4280; Ibn Hisham; Ar-Raheeq Al-Makhtum.", Order: 1},
			},
		},
		{
			slug: "haji-wada-wafat",
			contents: []model.SirohContent{
				{Title: "Haji Wada': Khutbah Terakhir Rasulullah ﷺ", Slug: "khutbah-haji-wada", Content: "Pada tahun ke-10 H (632 M), Nabi ﷺ melaksanakan haji terakhirnya — dikenal sebagai Haji Wada' (Haji Perpisahan). Lebih dari 100.000 kaum muslimin menyertai beliau.\n\nPada 9 Dzulhijjah di Arafah, Nabi ﷺ menyampaikan Khutbah Wada' — khutbah yang merangkum prinsip-prinsip Islam:\n\n1. 'Wahai manusia, dengarkan kata-kataku karena aku tidak tahu apakah setelah tahun ini aku masih bisa bertemu kalian lagi.'\n2. 'Sesungguhnya darah, harta, dan kehormatan kalian adalah suci dan haram atas sesama kalian.'\n3. 'Riba jahiliyah dihapuskan.'\n4. 'Bertakwalah kepada Allah dalam urusan wanita. Mereka memiliki hak atas kalian dan kalian memiliki hak atas mereka.'\n5. 'Aku tinggalkan kepada kalian dua perkara yang jika kalian berpegang teguh padanya tidak akan sesat: Kitabullah dan Sunnahku.'\n6. 'Hendaklah yang hadir menyampaikan kepada yang tidak hadir.'\n\nKemudian turun QS. Al-Maidah: 3 — 'Pada hari ini telah Aku sempurnakan agamamu untukmu, dan telah Aku cukupkan nikmat-Ku bagimu, dan telah Aku ridhai Islam sebagai agamamu.'\n\nSumber: HR. Bukhari No. 1741, Muslim No. 1218.", Order: 1},
				{Title: "Wafatnya Rasulullah ﷺ (12 Rabi'ul Awwal 11 H / 632 M)", Slug: "wafat-rasulullah", Content: "Sekembali dari Haji Wada', Nabi ﷺ mulai mengalami sakit yang semakin berat. Beliau minta izin kepada para istrinya untuk dirawat di kamar Aisyah ra.\n\nDalam sakit tersebut, Nabi ﷺ menekankan pesan terakhirnya: 'Sholat, sholat, dan (perlakukan baik) budak-budak yang kalian miliki.'\n\nPada Senin, 12 Rabi'ul Awwal 11 H, Nabi ﷺ wafat pada usia 63 tahun di kamar Aisyah ra. Saat itu Abu Bakar sedang mengimami sholat. Abu Bakar masuk dan mencium dahi Nabi ﷺ sambil berkata: 'Betapa harumnya engkau dalam keadaan hidup maupun wafat.'\n\nKemudian Abu Bakar keluar dan berkhutbah: 'Wahai manusia, barangsiapa menyembah Muhammad, sesungguhnya Muhammad telah wafat. Dan barangsiapa menyembah Allah, sesungguhnya Allah Maha Hidup dan tidak akan mati.' Lalu membaca QS. Ali-Imran: 144.\n\nNabi ﷺ dikuburkan di tempat beliau wafat — di bawah ranjang Aisyah ra. yang kini menjadi bagian dari Masjid Nabawi.\n\nSumber: HR. Bukhari No. 4448, 5669; Ar-Raheeq Al-Makhtum.", Order: 2},
			},
		},
	}

	for _, cat := range data {
		var category model.SirohCategory
		if err := db.Where("slug = ?", cat.slug).First(&category).Error; err != nil {
			continue
		}
		for i := range cat.contents {
			cat.contents[i].CategoryID = category.ID
			db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "slug"}},
				DoUpdates: clause.AssignmentColumns([]string{"title", "content", "order"}),
			}).Create(&cat.contents[i])
		}
	}
}

// seedMufrodatRelated delegates to seedMufrodatData (see seeder_mufrodat.go).
// The dataset and seeding logic live there so this file stays focused on
// other related seeds.
func seedMufrodatRelated(db *gorm.DB) {
	seedMufrodatData(db)
}
