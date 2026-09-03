package migrations

type blogSeedEntry struct {
	CategorySlug string
	Title        string
	Slug         string
	Excerpt      string
	Content      string
	Tags         []string
}

func getExtendedBlogSeedEntries() []blogSeedEntry {
	return []blogSeedEntry{
		{
			CategorySlug: "fiqh-hukum",
			Title:        "Panduan Lengkap Sholat Dhuha: Waktu, Niat, dan Keutamaannya",
			Slug:         "panduan-lengkap-sholat-dhuha",
			Excerpt:      "Penjelasan komprehensif mengenai sholat Dhuha mulai dari keutamaan sedekah 360 persendian, waktu pelaksanaan terbaik, hingga jumlah rakaat yang dianjurkan.",
			Tags:         []string{"sholat", "fiqh"},
			Content: `## Keutamaan Sholat Dhuha

Sholat Dhuha adalah salah satu sholat sunnah muakkadah yang sangat ditekankan oleh Rasulullah ﷺ. Di antara keutamaannya yang agung adalah menggantikan kewajiban sedekah untuk setiap persendian tubuh manusia.

Dalam sebuah hadits shahih riwayat Imam Muslim, Rasulullah ﷺ bersabda:

> "Setiap pagi, setiap ruas anggota badan kalian wajib dikeluarkan sedekahnya. Setiap tasbih adalah sedekah, setiap tahmid adalah sedekah, setiap tahlil adalah sedekah, setiap takbir adalah sedekah, menyuruh kepada kebaikan adalah sedekah, dan melarang dari kemungkaran adalah sedekah. Semua itu cukup digantikan dengan dua rakaat yang dikerjakan pada waktu Dhuha."
> *(HR. Muslim no. 720)*

## Waktu Pelaksanaan Sholat Dhuha

Waktu sholat Dhuha terbentang cukup panjang:

- **Waktu Awal:** Dimulai sekitar 15–20 menit setelah matahari terbit (waktu *Syuruq*), yaitu ketika matahari telah naik setinggi satu tombak (sekitar pukul 06.30 pagi untuk wilayah Indonesia bagian barat).
- **Waktu Terbaik (*Afdhal*):** Saat matahari mulai terasa panas dan terik, sebagaimana sabda Nabi ﷺ bahwa sholat orang-orang awwabin (yang taat) adalah ketika anak unta merasa kepanasan kakinya (*sa'at tarmadhul fihal*), sekitar pukul 09.00 hingga 10.30 pagi.
- **Waktu Akhir:** Menjelang masuk waktu Dzuhur, kurang lebih 10–15 menit sebelum adzan Dzuhur berkumandang (waktu *istiwa'* saat matahari tepat di atas kepala).

## Jumlah Rakaat Sholat Dhuha

Para ulama menjelaskan batasan rakaat sholat Dhuha sebagai berikut:

1. **Minimal:** 2 rakaat.
2. **Pertengahan:** 4 atau 8 rakaat (Rasulullah ﷺ pernah sholat Dhuha 8 rakaat pada peristiwa Pembebasan Kota Makkah / *Fathu Makkah*).
3. **Maksimal:** Sebagian ulama membatasi hingga 12 rakaat, sementara ulama lainnya berpendapat tidak ada batasan maksimal selama dikerjakan dua rakaat salam dua rakaat salam.

## Tata Cara Pelaksanaan

Secara teknis, sholat Dhuha dikerjakan persis seperti sholat sunnah dua rakaat pada umumnya:

- Berniat dalam hati untuk menunaikan sholat sunnah Dhuha karena Allah Ta'ala semata.
- Takbiratul ihram diikuti doa iftitah.
- Membaca Surat Al-Fatihah dan membaca surat pilihan dari Al-Qur'an (bebas, tidak harus surat Adh-Dhuha atau Asy-Syams).
- Ruku', i'tidal, sujud dua kali, lalu bangkit untuk rakaat kedua.
- Tasyahhud akhir dan salam.

Setelah selesai sholat, perbanyaklah memohon ampunan kepada Allah Ta'ala serta meminta kelapangan rezeki yang berkah dan halal.`,
		},
		{
			CategorySlug: "aqidah-tauhid",
			Title:        "Makna Dua Kalimat Syahadat dan Konsekuensinya dalam Kehidupan",
			Slug:         "makna-dua-kalimat-syahadat",
			Excerpt:      "Memahami rukun Islam yang pertama: hakikat penafian dan penetapan dalam Laa ilaha illallah serta pembuktian ketaatan kepada Rasulullah ﷺ.",
			Tags:         []string{"tauhid", "akhlak"},
			Content: `## Pondasi Utama Keislaman

Dua kalimat syahadat merupakan gerbang utama seseorang masuk ke dalam Islam sekaligus pondasi bangunan agama. Tanpa syahadat yang benar, seluruh amal kebaikan ibarat debu yang beterbangan tanpa nilai di sisi Allah Ta'ala.

Rasulullah ﷺ bersabda:

> "Islam dibangun di atas lima perkara: bersaksi bahwa tidak ada sesembahan yang berhak disembah selain Allah dan Muhammad adalah utusan Allah, mendirikan sholat, menunaikan zakat, menunaikan haji ke Baitullah, dan berpuasa di bulan Ramadan."
> *(HR. Bukhari no. 8 & Muslim no. 16)*

## Rukun Syahadat "Laa Ilaha Illallah"

Kalimat tauhid memiliki dua rukun yang tidak boleh dipisahkan:

1. **An-Nafyu (Penafian):** Kata *Laa ilaha* bermakna meniadakan segala bentuk peribadatan dan sesembahan selain Allah Ta'ala (seperti berhala, kuburan orang shalih, jimat, bintang, maupun hawa nafsu).
2. **Al-Itsbat (Penetapan):** Kata *Illallah* bermakna menetapkan peribadatan hanya untuk Allah semata, tanpa ada sekutu bagi-Nya dalam rububiyyah, uluhiyyah, dan asma' wa shifat-Nya.

## 7 Syarat Sah Syahadat

Para ulama merumuskan tujuh syarat diterimanya kalimat tauhid:

- **Al-'Ilmu (Berilmu):** Memahami maknanya, bukan sekadar melafalkan di lisan.
- **Al-Yaqin (Yakin):** Keyakinan yang kokoh tanpa ada keraguan sedikit pun.
- **Al-Qabul (Menerima):** Menerima konsekuensi hukum dan syariat dengan lapang dada.
- **Al-Inqiyad (Tunduk):** Berserah diri dan patuh menjalankan perintah Allah.
- **Ash-Shidqu (Jujur):** Mengucapkannya dengan kejujuran hati, bukan kemunafikan.
- **Al-Ikhlash (Ikhlas):** Membersihkan niat dari segala bentuk kesyirikan dan riya'.
- **Al-Mahabbah (Cinta):** Mencintai kalimat tauhid, orang-orang yang mengamalkannya, dan membenci segala yang menyelisihinya.

## Konsekuensi Syahadat "Muhammad Rasulullah"

Mengakui Nabi Muhammad ﷺ sebagai utusan Allah menuntut empat hal pokok:

1. Membenarkan semua berita yang beliau sampaikan.
2. Mentaati semua perintah yang beliau perintahkan.
3. Menjauhi segala larangan yang beliau peringatkan.
4. Tidak beribadah kepada Allah kecuali dengan syariat yang beliau contohkan.`,
		},
		{
			CategorySlug: "akhlak-adab",
			Title:        "Adab Menuntut Ilmu Menurut Para Ulama Salaf",
			Slug:         "adab-menuntut-ilmu-ulama-salaf",
			Excerpt:      "Imam Malik pernah menasihati: 'Pelajarilah adab sebelum engkau mempelajari ilmu.' Simak panduan adab bagi penuntut ilmu syar'i.",
			Tags:         []string{"akhlak", "hafalan"},
			Content: `## Dahulukan Adab Sebelum Ilmu

Para ulama terdahulu sangat menekankan pentingnya adab sebelum seseorang menyelami lautan ilmu. Imam Malik rahimahullah berpesan kepada seorang pemuda Quraisy:

> "Wahai saudaraku, pelajarilah adab sebelum engkau mempelajari ilmu."
> *(Hilyatul Auliya', 6/330)*

Ilmu tanpa adab ibarat api tanpa kayu bakar atau jasad tanpa ruh. Orang yang berilmu tinggi namun miskin adab justru akan melahirkan kesombongan dan pertikaian.

## 5 Adab Utama Penuntut Ilmu

Berikut adalah adab-adab esensial yang wajib dihiasi oleh setiap muslim penuntut ilmu:

### 1. Mengikhlaskan Niat Karena Allah Ta'ala
Tujuan mencari ilmu syar'i adalah untuk mengangkat kebodohan dari diri sendiri, kemudian dari orang lain, serta mengharap ridha Allah di akhirat. Jangan menuntut ilmu untuk popularitas, debat kusir, atau keuntungan materi duniawi.

### 2. Bersegera Mengamalkan Ilmu yang Didapat
Ilmu akan menetap dan membawa berkah manakala diamalkan. Sufyan Ats-Tsauri rahimahullah berkata: *"Ilmu itu memanggil amalan. Jika amalan menyambutnya, ilmu akan tinggal. Namun jika tidak, ilmu akan pergi berlalu."*

### 3. Menghormati Guru dan Majelis Ilmu
- Duduk dengan tenang dan tertib saat kajian berlangsung.
- Mendengarkan penjelasan guru tanpa memotong pembicaraan.
- Tidak berbisik-bisik atau bermain gawai di tengah majelis.
- Mendoakan kebaikan bagi guru yang telah mengajarkan ilmu.

### 4. Menjauhi Perdebatan (*Jidal*) yang Sia-Sia
Penuntut ilmu sejati menjauhi debat kusir yang hanya mengotori hati dan memicu permusuhan. Jika ada perbedaan pendapat yang mu'tabar di kalangan ulama fiqih, sikapi dengan lapang dada dan penuh adab.

### 5. Menjaga Adab terhadap Kitab dan Catatan
Ulama salaf sangat memuliakan kitab-kitab mereka: tidak meletakkan benda sembarangan di atas kitab hadits atau mushaf Al-Qur'an, serta menulis faedah dengan rapi dan teliti.`,
		},
		{
			CategorySlug: "quran-tafsir",
			Title:        "Keutamaan Membaca Surat Al-Kahfi pada Hari Jumat",
			Slug:         "keutamaan-surat-al-kahfi-hari-jumat",
			Excerpt:      "Mengapa Rasulullah ﷺ menganjurkan membaca Surat Al-Kahfi di hari Jumat? Mengupas hikmah cahaya di antara dua Jumat dan benteng dari fitnah akhir zaman.",
			Tags:         []string{"quran", "tilawah"},
			Content: `## Sunnah yang Mulia di Hari Jumat

Hari Jumat adalah *Sayyidul Ayyam* (pemimpin hari-hari) dalam Islam. Di antara amalan sunnah yang sarat pahala pada hari Jumat adalah membaca Surat Al-Kahfi secara penuh.

Rasulullah ﷺ bersabda:

> "Barangsiapa yang membaca surat Al-Kahfi pada hari Jumat, dia akan disinari cahaya di antara dua Jumat."
> *(HR. Al-Hakim 2/399 dan Al-Baihaqi 3/249, dishahihkan oleh Syaikh Al-Albani)*

Dalam riwayat lain yang dikeluarkan oleh Imam Muslim, sepuluh ayat pertama dari surat ini juga menjadi pelindung dari fitnah terbesar umat manusia:

> "Barangsiapa menghafal sepuluh ayat pertama dari surat Al-Kahfi, ia akan terlindungi dari fitnah Dajjal."
> *(HR. Muslim no. 809)*

## Kapan Waktu Membacanya?

Waktu membaca Surat Al-Kahfi dimulai sejak **terbenamnya matahari pada hari Kamis sore** (malam Jumat) hingga **terbenamnya matahari pada hari Jumat petang**. Rentang waktu lebih dari 24 jam ini memudahkan setiap muslim untuk menyelesaikan 110 ayatnya, baik dalam satu kali duduk maupun dicicil setelah sholat fardhu.

## 4 Ujian Besar dalam Surat Al-Kahfi

Surat Al-Kahfi mengandung empat kisah utama yang masing-masing merepresentasikan ujian besar kehidupan manusia:

1. **Kisah Pemuda Kahfi (*Ashabul Kahfi*):** Ujian keimanan dan agama. Solusinya adalah persahabatan yang shalih dan tawakkal kepada Allah.
2. **Kisah Pemilik Dua Kebun (*Shahibul Jannatain*):** Ujian harta kekayaan dan dunia. Solusinya adalah menyadari bahwa seluruh nikmat berasal dari Allah dan mengucapkan *Maa syaa Allah laa quwwata illa billah*.
3. **Kisah Nabi Musa dan Khidir 'alaihimassalam:** Ujian ilmu pengetahuan. Solusinya adalah sikap rendah hati (*tawadhu'*), sabar, dan menyadari keterbatasan akal manusia.
4. **Kisah Raja Dzulqarnain:** Ujian kekuasaan dan jabatan. Solusinya adalah keadilan, keikhlasan, dan memanfaatkan kekuatan untuk melindungi yang lemah.

Membaca dan merenungi Surat Al-Kahfi setiap pekan akan memperbaharui kompas hidup seorang mukmin agar senantiasa teguh di atas jalan kebenaran.`,
		},
		{
			CategorySlug: "hadith-sunnah",
			Title:        "Syarah Hadits Arbain ke-1: Segala Amal Tergantung pada Niat",
			Slug:         "syarah-hadits-arbain-1-niat",
			Excerpt:      "Hadits 'Innamal a'maalu bin niyyat' adalah poros utama seluruh ibadah. Pelajari bagaimana niat yang tulus dapat mengubah rutinitas biasa menjadi lumbung pahala.",
			Tags:         []string{"hadith", "akhlak"},
			Content: `## Matan Hadits Pertama

Dari Amirul Mukminin Abu Hafsh Umar bin Al-Khattab radhiyallahu 'anhu, ia berkata: Aku mendengar Rasulullah ﷺ bersabda:

> "Sesungguhnya setiap amalan tergantung pada niatnya, dan setiap orang hanya akan mendapatkan apa yang ia niatkan. Barangsiapa yang hijrahnya karena Allah dan Rasul-Nya, maka hijrahnya kepada Allah dan Rasul-Nya. Dan barangsiapa yang hijrahnya karena dunia yang ingin diraihnya atau karena wanita yang ingin dinikahinya, maka hijrahnya kepada apa yang ia tuju."
> *(HR. Al-Bukhari no. 1 dan Muslim no. 1907)*

## Kedudukan Agung Hadits Ini

Para ulama sepakat bahwa hadits ini adalah salah satu poros terpenting agama Islam:

- **Imam Asy-Syafi'i rahimahullah** berkata: *"Hadits ini mencakup sepertiga ilmu dan masuk ke dalam tujuh puluh bab dalam fiqih."*
- **Imam Ahmad bin Hanbal rahimahullah** menyatakan bahwa poros Islam berputar pada tiga hadits, dan yang pertama adalah hadits niat ini.

## Dua Fungsi Niat dalam Syariat

Dalam tinjauan fiqih dan tasawuf syar'i, niat memiliki dua fungsi krusial:

### 1. Tamyizul Ibadat 'anil 'Adat (Membedakan Ibadah dari Kebiasaan)
Niat berfungsi membedakan perbuatan yang bernilai ibadah dengan perbuatan biasa. Contoh: mandi untuk menyegarkan badan adalah kebiasaan, sedangkan mandi dengan niat bersuci dari hadats besar adalah ibadah yang sah.

### 2. Tamyizul Maqshud bil 'Amal (Membedakan Tujuan Pengabdian)
Niat memastikan apakah suatu amal dikerjakan murni karena Allah (Ikhlas) atau demi pujian manusia (Riya' / Sum'ah). Amal yang tercemar riya' tidak hanya tertolak, tetapi mendatangkan dosa besar bagi pelakunya.

## Mengubah Kebiasaan Menjadi Pahala

Salah satu keindahan syariat Islam adalah perbuatan mubah (makan, minum, tidur, beristirahat, berolahraga, hingga nafkah keluarga) dapat bernilai pahala sedekah dan ibadah jika diniatkan untuk memperkuat fisik dalam beribadah dan taat kepada Allah.

Periksalah selalu keikhlasan hati kita sebelum memulai, saat mengerjakan, dan setelah menyelesaikan setiap amal shalih.`,
		},
		{
			CategorySlug: "keluarga-muslim",
			Title:        "Mendidik Anak Mencintai Sholat Sejak Usia Dini",
			Slug:         "mendidik-anak-mencintai-sholat",
			Excerpt:      "Metode nabawiyah menanamkan cinta sholat pada buah hati tanpa kekerasan, dengan keteladanan, pembiasaan bertahap, dan doa orang tua.",
			Tags:         []string{"keluarga", "sholat"},
			Content: `## Amanah Besar Mendidik Anak

Anak adalah karunia sekaligus amanah terberat bagi setiap orang tua muslim. Menanamkan pondasi sholat sejak belia merupakan kunci keselamatan mereka di dunia dan akhirat.

Rasulullah ﷺ meletakkan panduan tahapan usia yang jelas:

> "Perintahkanlah anak-anak kalian untuk mendirikan sholat ketika mereka berumur tujuh tahun, dan pukullah mereka (dengan pukulan mendidik yang tidak melukai) jika meninggalkannya ketika mereka berumur sepuluh tahun, serta pisahkanlah tempat tidur mereka."
> *(HR. Abu Dawud no. 495, dishahihkan oleh Syaikh Al-Albani)*

Rentang waktu dari usia 7 hingga 10 tahun (3 tahun) setara dengan lebih dari 5.000 waktu sholat. Ini menunjukkan bahwa mendidik sholat membutuhkan kesabaran, keteladanan, dan proses pembiasaan ribuan kali.

## 4 Langkah Efektif Menumbuhkan Cinta Sholat

### 1. Keteladanan Nyata (*Qudwah Hasanah*)
Anak adalah peniru ulung. Ketika anak melihat ayah dan ibunya segera berwudhu dan sholat begitu adzan berkumandang, mereka akan merekam bahwa sholat adalah prioritas nomor satu dalam keluarga.

### 2. Ciptakan Suasana yang Menyenangkan
- Sediakan sajadah, peci, mukena kecil dengan warna atau motif yang disukai anak.
- Ajak anak ke masjid bersama ayah untuk sholat berjamaah sambil mengajarkan adab masjid dengan lemah lembut.
- Berikan pujian tulus atau apresiasi kecil ketika mereka berhasil menyelesaikan sholat lima waktu.

### 3. Jelaskan Mengapa Kita Sholat
Jangan hanya memerintah. Ceritakan dengan bahasa sederhana bahwa sholat adalah tanda terima kasih kita kepada Allah yang telah memberi mata, kesehatan, makanan lezat, dan keluarga yang saling menyayangi.

### 4. Jangan Putus Mendoakan Anak
Lisan orang tua memiliki doa yang mustajab. Amalkan doa Nabi Ibrahim 'alaihissalam:

> *Robbij'alni muqiimash-sholaati wa min dzurriyyati, Robbanaa wa taqobbal du'aa'.*
> "Ya Tuhanku, jadikanlah aku dan anak cucuku orang-orang yang tetap mendirikan sholat, ya Tuhan kami, perkenankanlah doaku." *(QS. Ibrahim: 40)*`,
		},
		{
			CategorySlug: "inspirasi-motivasi",
			Title:        "Dahsyatnya Istighfar: Pembuka Pintu Rezeki dan Penggugur Dosa",
			Slug:         "dahsyatnya-istighfar-pembuka-rezeki",
			Excerpt:      "Sering merasa buntu, sempit rezeki, atau gelisah? Temukan rahasia kelapangan hidup melalui lisan yang senantiasa basah dengan istighfar.",
			Tags:         []string{"dzikir", "doa"},
			Content: `## Kekuatan Kalimat Pemohon Ampun

Banyak orang mengira istighfar hanya diucapkan ketika seseorang baru saja berbuat dosa. Padahal dalam pandangan Islam, istighfar adalah amalan harian para nabi dan pintu pembuka berbagai kebaikan duniawi maupun ukhrawi.

Nabi Muhammad ﷺ yang telah diampuni seluruh dosanya yang lalu dan yang akan datang pun tetap beristighfar setiap hari:

> "Demi Allah, sesungguhnya aku beristighfar kepada Allah dan bertaubat kepada-Nya dalam sehari lebih dari tujuh puluh kali."
> *(HR. Bukhari no. 6307)*

## Janji Allah bagi Orang yang Beristighfar

Dalam Surat Nuh ayat 10-12, Allah Ta'ala mengisahkan seruan Nabi Nuh kepada kaumnya tentang buah manis istighfar:

> "Maka aku berkata kepada mereka: 'Mohonlah ampun kepada Tuhanmu, sesungguhnya Dia adalah Maha Pengampun. Niscaya Dia akan mengirimkan hujan yang lebat kepadamu, membanyakkan harta dan anak-anakmu, dan mengadakan untukmu kebun-kebun serta mengadakan (pula di dalamnya) untukmu sungai-sungai.'"
> *(QS. Nuh: 10–12)*

Ayat agung ini menegaskan bahwa istighfar bukan hanya menghapus dosa, tetapi menjadi kunci datangnya rezeki materi, keturunan yang shalih, dan kesuburan hidup.

## 3 Manfaat Nyata dalam Keseharian

- **Jalan Keluar dari Kesulitan:** Rasulullah ﷺ bersabda bahwa siapa yang merutinkan istighfar, Allah jadikan baginya kelapangan dari setiap kesedihan dan jalan keluar dari setiap kesempitan (HR. Abu Dawud).
- **Ketenangan Jiwa:** Hati yang berlumur maksiat akan terasa berat dan gelisah. Istighfar membersihkan noda hitam pada hati sehingga ketenangan kembali bersemi.
- **Menolak Azab dan Bencana:** Allah tidak akan mengazab suatu kaum selama mereka masih memohon ampunan kepada-Nya (QS. Al-Anfal: 33).

Jadikanlah lisan kita basah dengan minimal 100 kali *Astaghfirullah wa atuubu ilaih* setiap hari, terutama di waktu sahur menjelang Subuh.`,
		},
		{
			CategorySlug: "fiqh-hukum",
			Title:        "Keutamaan dan Panduan Puasa Sunnah Senin dan Kamis",
			Slug:         "keutamaan-tata-cara-puasa-senin-kamis",
			Excerpt:      "Meneladani rutinitas puasa mingguan Rasulullah ﷺ: hikmah penyetoran amal, kesehatan fisik, dan tuntunan niat yang benar.",
			Tags:         []string{"puasa", "fiqh"},
			Content: `## Rutinitas Mulia Rasulullah ﷺ

Di antara amalan sunnah mingguan yang senantiasa dijaga oleh Nabi Muhammad ﷺ adalah puasa pada hari Senin dan Kamis. Beliau sangat memperhatikan kedua hari tersebut dibandingkan hari-hari lainnya.

Ketika ditanya mengenai puasa pada hari Senin, Rasulullah ﷺ menjawab:

> "Itu adalah hari aku dilahirkan dan hari aku diutus atau diturunkannya wahyu kepadaku."
> *(HR. Muslim no. 1162)*

Sedangkan mengenai hari Kamis, beliau ﷺ menjelaskan:

> "Amal-amal kebajikan diperlihatkan (kepada Allah) pada hari Senin dan Kamis, maka aku menyukai amalku diperlihatkan dalam keadaan aku sedang berpuasa."
> *(HR. At-Tirmidzi no. 747, dinilai hasan shahih)*

## Hikmah dan Manfaat Puasa Senin Kamis

1. **Penyetoran Amal dalam Keadaan Suci:** Betapa indahnya ketika buku catatan amal kita dinaikkan ke hadapan Rabbul 'Alamin sementara lisan dan perut kita sedang berpuasa menahan hawa nafsu.
2. **Kesehatan Fisik (Intermittent Fasting):** Ilmu kedokteran modern membuktikan bahwa puasa berkala 2 hari dalam sepekan memicu proses *autophagy* (pembersihan sel rusak), memperbaiki sensitivitas insulin, dan menjaga kebugaran jantung.
3. **Melatih Kedisiplinan Ibadah:** Puasa sunnah menjadi benteng pertahanan spiritual agar kita tidak mudah terjerumus ke dalam kemaksiatan.

## Ketentuan Fiqih Puasa Sunnah

- **Kelenturan Niat:** Berbeda dengan puasa wajib Ramadan yang mengharuskan niat sebelum terbit fajar (*tabyitun niyah*), niat puasa sunnah boleh dipasang di pagi atau siang hari selama belum memakan/meminum sesuatu dan belum melakukan hal yang membatalkan puasa.
- **Pahala Buka Puasa:** Bersegeralah berbuka saat adzan Maghrib berkumandang, diawali dengan kurma basah (*ruthab*), kurma kering (*tamr*), atau seteguk air putih.
- **Doa Berbuka yang Shahih:**
  > *Dzahabazh-zhoma'u wabtallatil-'uruuqu wa tsabatal-ajru insyaa Allah.*
  > "Telah hilang rasa dahaga, dan telah basah tenggorokan, dan telah tetap pahala insya Allah." *(HR. Abu Dawud no. 2357)*`,
		},
		{
			CategorySlug: "fiqh-hukum",
			Title:        "Panduan Menghitung Zakat Mal dan Syarat Kewajibannya",
			Slug:         "panduan-menghitung-zakat-mal",
			Excerpt:      "Pahami rukun zakat mal: nisab 85 gram emas, haul 1 tahun, cara kalkulasi 2,5%, serta 8 golongan penerima yang berhak.",
			Tags:         []string{"zakat", "fiqh"},
			Content: `## Zakat: Pembersih Harta dan Jiwa

Zakat merupakan rukun Islam ketiga yang memiliki dimensi ibadah vertikal sekaligus keadilan sosial horizontal. Membayar zakat bukan sekadar bentuk kedermawanan, melainkan kewajiban mutlak atas hak orang miskin yang dititipkan pada harta seorang muslim.

Allah Ta'ala berfirman:

> "Ambillah zakat dari sebagian harta mereka, dengan zakat itu kamu membersihkan dan mensucikan mereka..."
> *(QS. At-Taubah: 103)*

## 2 Syarat Pokok Kewajiban Zakat Mal

Harta simpanan (tabungan, emas, perak, aset lancar) wajib dizakati apabila memenuhi dua parameter syar'i:

1. **Mencapai Nisab:** Batas minimal kepemilikan harta. Untuk zakat mal simpanan/uang, nisabnya disetarakan dengan **85 gram emas murni (24 karat)**.
2. **Mencapai Haul:** Harta tersebut telah mengendap dan dimiliki selama **1 tahun hijriah** (sekitar 354 hari) tanpa berkurang di bawah angka nisab.

## Rumus Praktis Perhitungan

Jika harga emas saat ini adalah Rp 1.400.000 / gram:
- Nisab = 85 gram x Rp 1.400.000 = **Rp 119.000.000**
- Apabila total saldo tabungan, deposito, dan emas cair Anda selama setahun bertahan di atas Rp 119.000.000, maka wajib dikeluarkan sebesar **2,5%**.

> **Zakat Wajib = (Total Harta Simpanan – Hutang Jatuh Tempo) × 2,5%**

Contoh: Total saldo simpanan setelah 1 tahun = Rp 150.000.000. Beban hutang jatuh tempo = Rp 10.000.000. Sisa harta kena zakat = Rp 140.000.000.
Zakat yang wajib dibayarkan = Rp 140.000.000 × 2,5% = **Rp 3.500.000**.

## 8 Golongan Penerima Zakat (*Asnaf*)

Berdasarkan Al-Qur'an Surat At-Taubah ayat 60, zakat hanya boleh disalurkan kepada delapan golongan:

- Fakir (orang yang hampir tidak memiliki penghasilan)
- Miskin (orang yang memiliki penghasilan namun tidak mencukupi kebutuhan pokok)
- Amil zakat (pengelola zakat yang amanah)
- Muallaf (orang yang baru masuk Islam atau dibujuk hatinya)
- Riqab (pembebasan budak)
- Gharimin (orang yang berhutang untuk ketaatan atau mendamaikan manusia)
- Fisabilillah (orang yang berjuang di jalan Allah)
- Ibnu Sabil (musafir yang kehabisan bekal dalam perjalanan ketaatan)`,
		},
		{
			CategorySlug: "sejarah-islam",
			Title:        "Pelajaran Berharga dari Peristiwa Hijrah Nabi ﷺ ke Madinah",
			Slug:         "pelajaran-berharga-peristiwa-hijrah",
			Excerpt:      "Hijrah bukan bentuk keputusasaan, melainkan strategi agung peletakan pondasi peradaban Islam. Telusuri makna tawakkal, ikhtiar, dan persaudaraan.",
			Tags:         []string{"sirah", "hadith"},
			Content: `## Titik Balik Peradaban Islam

Peristiwa hijrahnya Rasulullah ﷺ bersama para sahabat dari Makkah ke Yatsrib (Madinah) pada tahun 622 Masehi adalah momentum paling bersejarah dalam Islam, hingga Khalifah Umar bin Al-Khattab radhiyallahu 'anhu menjadikannya sebagai permulaan kalender Hijriah.

Hijrah bukan pelarian karena ketakutan, melainkan langkah strategis ilahiah untuk membangun basis masyarakat yang berdaulat di atas pondasi tauhid dan keadilan.

## 3 Pilar Pembangunan Kota Madinah

Setibanya di Madinah, Rasulullah ﷺ tidak langsung membangun benteng militer atau istana megah. Beliau memprioritaskan tiga pilar peradaban:

### 1. Membangun Masjid Nabawi
Masjid difungsikan bukan hanya sebagai tempat sholat, tetapi juga pusat pendidikan, parlemen musyawarah, baitul mal, hingga pusat kegiatan sosial kemasyarakatan.

### 2. Mempersaudarakan Kaum Muhajirin dan Anshar
Ikatan aqidah mengalahkan ikatan darah dan kesukuan. Kaum Anshar dengan penuh kerelaan membagi rumah, tanah, dan harta mereka kepada saudara-saudara Muhajirin yang datang tanpa membawa apa-apa dari Makkah (QS. Al-Hasyr: 9).

### 3. Merumuskan Piagam Madinah (*Mitsaq al-Madinah*)
Dokumen konstitusi tertulis pertama di dunia yang menjamin hak-hak asasi, kebebasan beragama, dan kewajiban bersama seluruh penduduk Madinah (termasuk kabilah Yahudi) untuk menjaga keamanan kota.

## Keseimbangan Tawakkal dan Ikhtiar Sempurna

Dalam perjalanan hijrah, Rasulullah ﷺ memberikan teladan nyata tentang perpaduan ikhtiar maksimal dan tawakkal mutlak:

- Beliau menunjuk Ali bin Abi Thalib ra untuk tidur di ranjang beliau guna mengelabui musuh sekaligus mengembalikan barang titipan penduduk Makkah.
- Beliau memilih rute selatan yang berlawanan arah menuju Madinah untuk mengecoh kejaran kaum Quraisy.
- Beliau bersembunyi di Gua Tsur selama tiga malam.
- Beliau menyewa penunjuk jalan yang ahli dan amanah (Abdullah bin Uraiqith).

Namun ketika kaum kafir Quraisy telah berdiri tepat di bibir gua, kepasrahan tawakkal beliau terpancar indah kepada Abu Bakar ra:

> "Janganlah engkau bersedih, sesungguhnya Allah bersama kita."
> *(QS. At-Taubah: 40)*

## Makna Hijrah di Masa Kini

Di zaman modern, pintu hijrah fisik memang telah usai setelah pembebasan Kota Makkah, namun esensi hijrah ruhiyah tetap terbuka hingga akhir zaman:

> "Seorang muslim adalah orang yang menyelamatkan sesama muslim dari lisan dan tangannya. Dan orang yang berhijrah (*muhajir*) adalah orang yang meninggalkan apa yang dilarang oleh Allah."
> *(HR. Bukhari no. 10)*`,
		},
	}
}
