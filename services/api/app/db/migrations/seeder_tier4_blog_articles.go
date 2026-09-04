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
			Title:        "Panduan Lengkap Sholat Dhuha: Waktu, Niat, Jumlah Rakaat, dan Keutamaannya",
			Slug:         "panduan-lengkap-sholat-dhuha",
			Excerpt:      "Penjelasan komprehensif mengenai sholat Dhuha: keutamaan sedekah 360 persendian, batas waktu awal hingga akhir, rakaat terbaik, serta doa yang diajarkan Nabi ﷺ.",
			Tags:         []string{"sholat", "fiqh"},
			Content: `## Pendahuluan: Ibadah Pembuka Hari yang Penuh Berkah

Sholat Dhuha merupakan salah satu sholat sunnah *muakkadah* (sangat dianjurkan) yang senantiasa dijaga oleh Rasulullah ﷺ dan diwasiatkan secara khusus kepada para sahabat tercinta, seperti Abu Hurairah dan Abu Darda' radhiyallahu 'anhuma. Ibadah ini dilaksanakan pada waktu manusia mulai sibuk dengan urusan perniagaan, pekerjaan, dan aktivitas dunia, sehingga meluangkan waktu sejenak untuk bersujud kepada Allah di waktu Dhuha menjadi bukti ketundukan seorang hamba di tengah kelalaian dunia.

Abu Hurairah radhiyallahu 'anhu bertutur:

> "Kekasihku (Rasulullah ﷺ) mewasiatkan kepadaku tiga perkara yang tidak pernah kutinggalkan hingga aku mati: berpuasa tiga hari setiap bulan (Ayyamul Bidh), mengerjakan dua rakaat sholat Dhuha, dan mengerjakan sholat Witir sebelum tidur."
> *([HR. Bukhari no. 1981](/hadith/bukhari#1981) dan [HR. Muslim no. 721](/hadith/muslim#721))*

---

## 4 Keutamaan Agung Sholat Dhuha

Banyak dalil shahih yang menyebutkan ganjaran luar biasa bagi siapa saja yang istiqomah merutinkan sholat Dhuha:

### 1. Menggantikan Sedekah bagi 360 Persendian Manusia
Secara anatomis, tubuh manusia tersusun atas 360 persendian yang setiap harinya wajib disyukuri dan dikeluarkan sedekahnya sebagai tanda terima kasih kepada Sang Pencipta. Sholat Dhuha dua rakaat mampu mencukupi seluruh kewajiban sedekah tersebut.

Rasulullah ﷺ bersabda:

> "Dalam tubuh manusia terdapat 360 persendian, dan ia wajib bersedekah untuk setiap sendinya.' Para sahabat bertanya: 'Siapakah yang mampu melakukan hal itu, wahai Nabi Allah?' Beliau menjawab: 'Menimbun dahak di masjid (membersihkannya) atau menyingkirkan gangguan dari jalanan. Jika engkau tidak mampu, maka dua rakaat Dhuha sudah mencukupimu.'"
> *([HR. Abu Dawud no. 5242](/hadith/abu-daud#5242), dishahihkan oleh Syaikh Al-Albani)*

### 2. Dicukupi Kebutuhan Hidup hingga Akhir Hari
Dalam hadits Qudsi, Allah Subhanahu wa Ta'ala berfirman:

> "Wahai anak Adam, janganlah sekali-kali engkau malas mengerjakan empat rakaat pada awal siang (sholat Dhuha), niscaya Aku akan mencukupimu pada akhir harimu."
> *([HR. Abu Dawud no. 1289](/hadith/abu-daud#1289) dan [HR. At-Tirmidzi no. 475](/hadith/tirmidzi#475))*

Para ulama menafsirkan kecukupan ini meliputi kecukupan rezeki, perlindungan dari mara bahaya, ketenangan jiwa, serta kemudahan dalam menyelesaikan urusan harian.

### 3. Merupakan Sholat Orang-Orang yang Bertaubat (*Sholatul Awwabin*)
Dinamakan *Sholatul Awwabin* karena hanya hamba-hamba yang senantiasa kembali dan menghadapkan hatinya kepada Allah yang mampu meluangkan waktu di saat manusia lain sedang larut dalam kesibukan mencari nafkah.

Rasulullah ﷺ bersabda:

> "Tidak ada yang senantiasa menjaga sholat Dhuha kecuali orang yang kembali kepada Allah (Awwab). Dan sholat Dhuha adalah sholatul awwabin."
> *([HR. Ibnu Khuzaimah no. 1224](https://sunnah.com), dishahihkan oleh Syaikh Al-Albani dalam Silsilah Ash-Shahihah no. 703)*

### 4. Memperoleh Pahala Setara Haji dan Umrah Sempurna
Bagi siapa saja yang sholat Subuh berjamaah di masjid, lalu berdzikir hingga matahari terbit, kemudian sholat dua rakaat Dhuha di awal waktu (*Sholat Isyraq*), ia dijanjikan pahala haji dan umrah yang sempurna.

---

## Waktu Pelaksanaan: Awal, Afdhal, dan Akhir

Mengetahui batasan waktu sholat Dhuha sangat penting agar ibadah sah dan tidak dikerjakan pada waktu terlarang:

- **Waktu Mulai:** Dimulai ketika matahari telah meninggi setinggi tombak (sekitar 15–20 menit setelah terbitnya matahari / *Syuruq*). Di Indonesia, waktu ini berkisar antara pukul 06.15 hingga 06.30 WIB tergantung musim dan letak geografis.
- **Waktu Paling Utama (*Afdhal*):** Dilaksanakan di akhir waktu ketika sengatan panas matahari mulai terasa membakar tanah dan anak unta beranjak mencari tempat berteduh (*sa'at tarmadhul fihal*), yakni sekitar pukul 09.00 hingga 10.30 pagi *([HR. Muslim no. 748](/hadith/muslim#748))*.
- **Batas Akhir Waktu:** Menjelang matahari berada tepat tegak lurus di atas kepala (*waktu Zawal / Istiwa'*), sekitar 10–15 menit sebelum adzan Dzuhur berkumandang. Pada waktu Istiwa' tepat, diharamkan melakukan sholat sunnah hingga matahari sedikit tergelincir ke arah barat.

---

## Jumlah Rakaat Sholat Dhuha

- **Minimal:** 2 rakaat.
- **Rekomendasi Rutin:** 4 atau 8 rakaat. Rasulullah ﷺ pernah sholat Dhuha sebanyak 8 rakaat dengan empat kali salam pada hari Pembebasan Kota Makkah (*Fathu Makkah*), sebagaimana termaktub dalam *[HR. Bukhari no. 357](/hadith/bukhari#357)* dan *[HR. Muslim no. 336](/hadith/muslim#336)*.
- **Maksimal:** Sebagian ulama madzhab Syafi'i membatasi 12 rakaat, sedangkan pendapat terkuat (*rajih*) yang dipilih oleh Syaikhul Islam Ibnu Taimiyah dan Syaikh Ibnu Utsaimin menyatakan tidak ada batasan rakaat maksimal selama dikerjakan dalam kelipatan dua rakaat salam.

---

## Tata Cara Sholat Dhuha Langkah demi Langkah

Pelaksanaannya sama persis seperti sholat sunnah dua rakaat lainnya:

1. **Niat:** Berniat ikhlas di dalam hati karena Allah Ta'ala.
2. **Takbiratul Ihram & Doa Iftitah.**
3. **Membaca Surat Al-Fatihah:** Dilanjutkan dengan membaca surat pendek yang dihafal dari Al-Qur'an. Tidak ada kewajiban mutlak harus membaca Surat Adh-Dhuha atau Asy-Syams; Anda boleh membaca surat apa saja seperti Al-Kafirun, Al-Ikhlas, atau ayat lainnya.
4. **Ruku' & I'tidal** dengan tuma'ninah.
5. **Sujud Dua Kali** dengan khusyuk.
6. **Bangkit ke Rakaat Kedua** dan lakukan gerakan serupa.
7. **Tasyahhud Akhir & Salam.**

---

## Doa Setelah Sholat Dhuha

Meskipun doa populer *"Allahumma innadh dhuha-a dhuha-uk..."* banyak tersebar di buku saku, terdapat doa shahih yang diriwayatkan langsung dari Aisyah radhiyallahu 'anha mengenai bacaan dzikir Nabi ﷺ seusai sholat Dhuha:

> *Allahummaghfirli wa tub 'alayya, innaka Antat-Tawwaabur Rahiim.*
> (Ya Allah, ampunilah aku dan terimalah taubatku, sesungguhnya Engkau Maha Penerima Taubat lagi Maha Penyayang.)
> Diriwayatkan bahwa Rasulullah ﷺ membacanya sebanyak **100 kali** sebelum beranjak *([HR. Al-Bukhari dalam Al-Adab Al-Mufrad no. 619](https://sunnah.com), dishahihkan oleh Syaikh Al-Albani)*.

Semoga Allah memudahkan kita untuk merutinkan sholat Dhuha sebagai investasi akhirat dan pembuka keberkahan rezeki keluarga.`,
		},
		{
			CategorySlug: "aqidah-tauhid",
			Title:        "Makna Dua Kalimat Syahadat, Rukun, dan 7 Syarat Diterimanya",
			Slug:         "makna-dua-kalimat-syahadat",
			Excerpt:      "Ulasan mendalam hakikat kalimat tauhid Laa Ilaha Illallah dan syahadat risalah Muhammad Rasulullah: penafian, penetapan, 7 syarat sah, serta pembatal keislaman.",
			Tags:         []string{"tauhid", "akhlak"},
			Content: `## Hakikat Dua Kalimat Syahadat

Dua kalimat syahadat (*Asyhadu an laa ilaha illallah wa asyhadu anna Muhammadan Rasulullah*) adalah rukun Islam yang paling fundamental. Seluruh ibadah badaniyah seperti sholat, puasa, zakat, dan haji tidak akan bernilai di hadapan Allah manakala pondasi tauhid ini rapuh atau tercampur dengan kesyirikan.

Rasulullah ﷺ menegaskan posisi utama syahadat dalam sabda beliau:

> "Islam dibangun di atas lima perkara: bersaksi bahwa tidak ada sesembahan yang berhak disembah selain Allah dan bahwa Muhammad adalah utusan Allah, mendirikan sholat, menunaikan zakat, haji ke Baitullah, dan berpuasa di bulan Ramadan."
> *([HR. Bukhari no. 8](/hadith/bukhari#8) dan [HR. Muslim no. 16](/hadith/muslim#16))*

---

## Rukun Syahadat Pertama: Laa Ilaha Illallah

Kalimat agung ini terdiri dari dua rukun yang saling mengikat:

1. **An-Nafyu (الـنَّـفْـيُ - Penafian Total):**
   Lafadz *Laa ilaha* menafikan dan membatalkan segala bentuk hak peribadatan kepada selain Allah. Kita menolak menyembah berhala, malaikat, nabi, kuburan wali, jimat, jin, pepohonan, maupun hawa nafsu.
2. **Al-Itsbat (الإِثْـبَـاتُ - Penetapan Mutlak):**
   Lafadz *Illallah* menetapkan bahwa satu-satunya yang berhak disembah, diminta pertolongan, ditakuti, dan diharapkan hanyalah Allah Ta'ala semata tanpa sekutu apa pun.

Allah Ta'ala berfirman:

> "Barangsiapa yang ingkar kepada Thaghut (segala yang disembah selain Allah) dan beriman kepada Allah, maka sesungguhnya ia telah berpegang kepada buhul tali yang amat kuat yang tidak akan putus."
> *([QS. Al-Baqarah: 256](/quran/2#256))*

---

## 7 Syarat Sah Diterimanya Syahadat

Mengucapkan syahadat bukan sekadar hafalan lisan. Para ulama merumuskan 7 syarat wajib yang harus dipenuhi agar syahadat seseorang sah dan menyelamatkannya dari siksa api neraka:

### 1. Al-'Ilmu (العِلْمُ - Memahami Maknanya)
Mengetahui apa yang ditiadakan dan apa yang ditetapkan oleh syahadat, lawan dari kebodohan (*al-jahl*).
*Dalil:* *"Maka ketahuilah, bahwa sesungguhnya tidak ada sesembahan yang berhak disembah selain Allah."* *([QS. Muhammad: 19](/quran/47#19))*

### 2. Al-Yaqin (اليَقِينُ - Keyakinan yang Kokoh)
Meyakini kebenaran tauhid tanpa ragu-ragu (*as-syakk*).
*Dalil:* *"Sesungguhnya orang-orang yang beriman hanyalah orang-orang yang beriman kepada Allah dan Rasul-Nya kemudian mereka tidak ragu-ragu..."* *([QS. Al-Hujurat: 15](/quran/49#15))*

### 3. Al-Qabul (القَبُولُ - Menerima Sepenuh Hati)
Menerima segala konsekuensi tauhid dan hukum Islam dengan lapang dada, tanpa menolak atau mendebat syariat.

### 4. Al-Inqiyad (الانْقِيَادُ - Ketundukan dan Kepatuhan)
Tunduk dan pasrah mengamalkan perintah Allah secara lahir dan batin.
*Dalil:* *"Dan barangsiapa yang menyerahkan dirinya kepada Allah, sedang dia orang yang berbuat kebaikan, maka sesungguhnya ia telah berpegang kepada buhul tali yang kokoh."* *([QS. Luqman: 22](/quran/31#22))*

### 5. Ash-Shidqu (الصِّدْقُ - Kejujuran)
Mengucapkan syahadat dengan hati yang membenarkan lisan, bukan kepalsuan orang munafik.
*Dalil:* Rasulullah ﷺ bersabda bahwa siapa pun yang bersaksi tidak ada ilah selain Allah dan Muhammad hamba dan utusan-Nya secara jujur dari dalam hatinya, Allah haramkan neraka baginya *([HR. Bukhari no. 128](/hadith/bukhari#128))*.

### 6. Al-Ikhlash (الإِخْلاصُ - Keikhlasan Murni)
Membersihkan seluruh niat ibadah dari kotoran syirik, riya', dan sum'ah.
*Dalil:* *"Padahal mereka tidak disuruh kecuali supaya menyembah Allah dengan memurnikan ketaatan kepada-Nya dalam (menjalankan) agama yang lurus..."* *([QS. Al-Bayyinah: 5](/quran/98#5))*

### 7. Al-Mahabbah (المَحَبَّةُ - Kecintaan)
Mencintai kalimat tauhid ini, mencintai Allah dan Rasul-Nya melebihi cinta kepada diri sendiri, anak, harta, dan segenap manusia.

---

## Makna Syahadat Kedua: Muhammad Rasulullah

Pengakuan bahwa Nabi Muhammad ﷺ adalah utusan Allah menuntut 4 kewajiban utama:

1. **Tho'atuhu fiima amar (طاعته فيما أمر):** Mentaati seluruh perintah beliau tanpa membantah.
2. **Tashdiquhu fiima akhbar (تصديقه فيما أخبر):** Membenarkan seluruh wahyu, mukjizat, dan kabar ghaib yang beliau sampaikan.
3. **Ijtinabu maa nahahu 'anhu wa zajar (اجتناب ما نهى عنه وزجر):** Menjauhi segala larangan dan peringatan beliau.
4. **An laa yu'badallaha illa bima syara' (أن لا يُعبد الله إلا بما شرع):** Tidak menyembah Allah kecuali dengan syariat yang telah beliau contohkan, tanpa menambah amalan bid'ah *([HR. Muslim no. 1718](/hadith/muslim#1718))*.

Menjaga kemurnian tauhid dan ittiba' (meneladani sunnah Rasul) adalah jaminan keselamatan abadi di akhirat kelak.`,
		},
		{
			CategorySlug: "akhlak-adab",
			Title:        "Adab Menuntut Ilmu Menurut Salafus Shalih: Niat, Adab Guru, dan Pengamalan",
			Slug:         "adab-menuntut-ilmu-ulama-salaf",
			Excerpt:      "Imam Malik menasihati: 'Pelajarilah adab sebelum mempelajari ilmu.' Simak kaidah emas penuntut ilmu syar'i agar ilmu menjadi berkah dan membuahkan amal shalih.",
			Tags:         []string{"akhlak", "hafalan"},
			Content: `## Urgensi Adab dalam Menuntut Ilmu Syar'i

Islam memuliakan ilmu dan mengangkat derajat orang-orang yang berilmu. Namun para ulama salafus shalih senantiasa mendidik murid-murid mereka bahwa **adab adalah mahkota dari ilmu**. Menuntut ilmu tanpa menghias diri dengan akhlak yang luhur ibarat menuangkan air susu yang murni ke dalam wadah yang najis dan kotor.

Imam Malik bin Anas rahimahullah berkata kepada seorang pemuda Quraisy:

> "Wahai saudaraku, pelajarilah adab sebelum engkau mempelajari ilmu."
> *(Hilyatul Auliya', 6/330)*

Bahkan Ibnul Mubarak rahimahullah menyatakan: *"Aku mempelajari adab selama tiga puluh tahun, dan aku mempelajari ilmu selama dua puluh tahun. Dahulu mereka (salaf) mempelajari adab terlebih dahulu sebelum menuntut ilmu."*

---

## 6 Pilar Adab Penuntut Ilmu Sejati

Berikut adalah adab-adab esensial yang wajib diterapkan oleh setiap thalabul ilmi (penuntut ilmu):

### 1. Ikhlas Niat Semata-mata Karena Allah Ta'ala
Imam Ahmad bin Hanbal rahimahullah pernah ditanya: *"Apakah niat yang benar dalam menuntut ilmu?"* Beliau menjawab: *"Niat yang benar adalah engkau berniat mengangkat kebodohan dari dirimu sendiri, kemudian dari orang lain."*

Rasulullah ﷺ memberikan peringatan keras terhadap orang yang menuntut ilmu demi motif duniawi:

> "Barangsiapa yang menuntut ilmu yang seharusnya untuk mencari wajah Allah, tetapi ia tidak menuntutnya melainkan untuk mendapatkan bagian dari dunia, maka ia tidak akan mencium harumnya surga pada hari kiamat."
> *([HR. Abu Dawud no. 3664](/hadith/abu-daud#3664), dishahihkan oleh Syaikh Al-Albani)*

### 2. Menyegerakan Pengamalan Ilmu
Ilmu yang tidak diamalkan akan menjadi bumerang dan hujjah yang memberatkan pemiliknya di pengadilan akhirat. 

Sufyan Ats-Tsauri rahimahullah berujar:
> *"Ilmu itu memanggil amalan. Jika amalan menyambutnya, maka ilmu akan bertahan. Namun jika tidak, ilmu itu akan pergi sirna."*

### 3. Tawadhu' dan Memuliakan Guru
Penuntut ilmu tidak akan pernah meraih kemanfaatan ilmu jika ia bersikap sombong di hadapan gurunya. 
- Duduklah dengan tenang, sopan, dan penuh perhatian dalam majelis ta'lim.
- Jangan memotong penjelasan guru sebelum dipersilakan.
- Hindari menyebarkan aib atau kesalahan lidah guru; jika guru keliru, luruskan dengan santun secara empat mata.
- Senantiasa mendoakan ampunan dan kebaikan bagi guru yang telah membimbing kita *([HR. Abu Dawud no. 1672](/hadith/abu-daud#1672))*.

### 4. Menjauhi Debat Kusir (*Al-Mira'* dan *Al-Jidal*)
Banyak orang tergelincir ketika telah memiliki sedikit wawasan fiqih lalu gemar berdebat di media sosial untuk pamer kepintaran atau merendahkan saudaranya.

Nabi Muhammad ﷺ bersabda:

> "Aku menjamin sebuah rumah di pinggir surga bagi orang yang meninggalkan perdebatan meskipun ia berada di pihak yang benar."
> *([HR. Abu Dawud no. 4800](/hadith/abu-daud#4800), dinilai hasan oleh Syaikh Al-Albani)*

### 5. Memuliakan Kitab, Mushaf, dan Catatan Ilmu
Imam Al-Burhan Az-Zarnuji dalam kitab monumentalnya *Ta'limul Muta'allim* menekankan agar penuntut ilmu tidak mengambil kitab kecuali dalam keadaan suci, tidak menjulurkan kaki ke arah kitab, dan menjaga lembaran catatan dari kotoran.

### 6. Bersabar Menempuh Proses yang Panjang
Ilmu tidak bisa diraih dengan tubuh yang santai dan malas-malasan. Yahya bin Abi Katsir rahimahullah berkata: *"Ilmu tidak akan diperoleh dengan jasad yang dimanjakan."* Butuh kesabaran bertahun-tahun, mengulang hafalan, mengikat faedah dengan tulisan, serta mengorbankan waktu tidur demi muthala'ah kitab.`,
		},
		{
			CategorySlug: "quran-tafsir",
			Title:        "Keutamaan Membaca Surat Al-Kahfi pada Hari Jumat: Dalil, Waktu, dan 4 Pelajaran Besar",
			Slug:         "keutamaan-surat-al-kahfi-hari-jumat",
			Excerpt:      "Ulasan komprehensif amalan sunnah membaca Surat Al-Kahfi di hari Jumat: benteng dari fitnah Dajjal, cahaya antara dua Jumat, dan tadabbur 4 kisah agung.",
			Tags:         []string{"quran", "tilawah"},
			Content: `## Anjuran Membaca Al-Kahfi di Hari Jumat

Hari Jumat merupakan hari yang paling mulia dalam sepekan (*Sayyidul Ayyam*). Allah Ta'ala mensyariatkan berbagai amalan istimewa di hari ini, mulai dari sholat Jumat, mandi sunnah, memperbanyak sholawat atas Nabi ﷺ, hingga membaca Surat Al-Kahfi secara utuh (110 ayat).

Dari Abu Sa'id Al-Khudri radhiyallahu 'anhu, Rasulullah ﷺ bersabda:

> "Barangsiapa membaca surat Al-Kahfi pada hari Jumat, maka ia akan disinari cahaya di antara dua Jumat."
> *([HR. Al-Hakim no. 3392](https://sunnah.com) dan Al-Baihaqi no. 5996, dishahihkan oleh Syaikh Al-Albani dalam Shahihut Targhib no. 736)*

Dalam riwayat lain yang shahih, sepuluh ayat pertama dari surat ini juga menjadi tameng kokoh dari fitnah terbesar yang akan melanda umat manusia di akhir zaman:

> "Barangsiapa menghafal sepuluh ayat pertama dari surat Al-Kahfi, maka ia akan terlindungi dari fitnah Dajjal."
> *([HR. Muslim no. 809](/hadith/muslim#809))*

---

## Batasan Waktu Pembacaan

Kapan waktu sunnah membaca Surat Al-Kahfi?

Secara syar'i, pergantian hari dalam kalender Hijriah dimulai saat matahari terbenam (*Ghurub*). Oleh karena itu:
- **Awal Waktu:** Mulai terbenamnya matahari pada hari Kamis sore (malam Jumat).
- **Akhir Waktu:** Hingga terbenamnya matahari pada hari Jumat sore (menjelang Maghrib).

Artinya, seorang muslim memiliki rentang waktu leluasa sekitar 24 jam untuk menuntaskan 110 ayat Surat Al-Kahfi. Pembacaan boleh dilakukan sekali duduk atau dicicil pada setiap selesai sholat fardhu. Anda bisa membacanya langsung di fitur *[Al-Qur'an Surat Al-Kahfi](/quran/18)*.

---

## 4 Kisah Agung dan Ujian Kehidupan dalam Al-Kahfi

Surat Al-Kahfi memuat empat kisah monumental yang menggambarkan empat fitnah/ujian terbesar dalam sejarah manusia beserta solusi ilahiahnya:

### 1. Fitnah Agama: Kisah Pemuda Gua (*Ashabul Kahfi* ayat 9–26)
Sekelompok pemuda beriman melarikan diri dari kekejaman raja zalim demi mempertahankan aqidah tauhid. Allah menyelamatkan mereka dengan menidurkannya di dalam gua selama 309 tahun.
- **Kunci Selamat:** Berteman dengan orang-orang shalih dan bertawakkal mutlak kepada Allah saat menghadapi tekanan lingkungan.

### 2. Fitnah Harta: Kisah Pemilik Dua Kebun (*Shahibul Jannatain* ayat 32–44)
Kisah seorang kaya raya yang sombong dengan kebunnya yang melimpah dan meremehkan saudaranya yang miskin. Dalam sekejap, Allah membinasakan seluruh kebunnya hingga rata dengan tanah.
- **Kunci Selamat:** Menyadari bahwa seluruh harta adalah titipan dan senantiasa mengucapkan *Maa syaa Allah laa quwwata illa billah* serta tidak tertipu fatamorgana dunia.

### 3. Fitnah Ilmu: Kisah Nabi Musa dan Khidir 'alaihimassalam (ayat 60–82)
Nabi Musa 'alaihissalam menempuh perjalanan jauh penuh kelelahan untuk menimba hikmah dari hamba Allah yang shalih (Khidir). Terjadi peristiwa melubangi perahu, membunuh anak kecil, dan menegakkan dinding rumah yang roboh.
- **Kunci Selamat:** Sikap rendah hati (*tawadhu'*), sabar menerima ketetapan Allah, dan menyadari bahwa ilmu manusia hanyalah setitik air di lautan luas ilmu Allah.

### 4. Fitnah Kekuasaan: Kisah Raja Dzulqarnain (ayat 83–98)
Penguasa adil dan berilmu yang berkelana ke penjuru timur dan barat dunia. Ketika bertemu kaum yang terancam Ya'juj dan Ma'juj, beliau membangun benteng besi raksasa tanpa memungut upah sepeser pun.
- **Kunci Selamat:** Keikhlasan dalam memimpin, menerapkan keadilan, dan memanfaatkan kekuasaan politik demi melindungi kaum yang tertindas.

Membaca Surat Al-Kahfi setiap Jumat adalah sarana *charger* ruhiyah agar kita tidak terombang-ambing oleh fitnah harta, tahta, ilmu, dan syahwat di zaman modern.`,
		},
		{
			CategorySlug: "hadith-sunnah",
			Title:        "Syarah Hadits Arbain ke-1: Niat, Ikhlas, dan Bahaya Riya' dalam Ibadah",
			Slug:         "syarah-hadits-arbain-1-niat",
			Excerpt:      "Pembahasan mendalam hadits 'Innamal a'maalu bin niyyat': kedudukan hadits sebagai sepertiga Islam, 2 fungsi niat, dan cara mengubah rutinitas menjadi bernilai ibadah.",
			Tags:         []string{"hadith", "akhlak"},
			Content: `## Matan Hadits Lengkap

Dari Amirul Mukminin Abu Hafsh Umar bin Al-Khattab radhiyallahu 'anhu, ia berkata: Aku mendengar Rasulullah ﷺ bersabda:

> "Sesungguhnya setiap amalan tergantung pada niatnya, dan setiap orang hanya akan mendapatkan apa yang ia niatkan. Barangsiapa yang hijrahnya karena Allah dan Rasul-Nya, maka hijrahnya kepada Allah dan Rasul-Nya. Dan barangsiapa yang hijrahnya karena dunia yang ingin diraihnya atau karena wanita yang ingin dinikahinya, maka hijrahnya kepada apa yang ia tuju."
> *([HR. Bukhari no. 1](/hadith/bukhari#1) dan [HR. Muslim no. 1907](/hadith/muslim#1907))*

---

## Kedudukan Agung Hadits Ini dalam Islam

Para imam besar kaum muslimin menegaskan bahwa hadits niat adalah pondasi utama bangunan syariat:

- **Imam Asy-Syafi'i rahimahullah** berkata: *"Hadits ini mencakup sepertiga ilmu dan masuk ke dalam tujuh puluh bab fiqih."*
- **Imam Abdurrahman bin Mahdi** menyatakan: *"Sekiranya aku menyusun sebuah kitab fiqih yang terdiri dari beberapa bab, niscaya aku akan meletakkan hadits Umar ini pada setiap awal babnya."*
- **Imam Ibnu Rajab Al-Hanbali** menempatkannya sebagai kaidah pembeda antara amalan yang diterima (*maqbul*) dengan amalan yang tertolak (*mardud*).

---

## Dua Dimensi Fungsi Niat dalam Fiqih dan Aqidah

Dalam kajian para ulama, niat memiliki dua peranan yang sangat fundamental:

### 1. Tamyizul Ibadat 'anil 'Adat (Membedakan Ibadah dari Kebiasaan Harian)
Niat berfungsi menentukan status hukum suatu perbuatan fisik.
- Seseorang yang menahan lapar dan dahaga seharian demi diet semata tidak mendapatkan pahala akhirat, sedangkan orang yang menahannya dengan niat puasa sunnah akan menuai surga Ar-Rayyan.
- Seseorang yang menyiram air ke seluruh tubuhnya untuk menyegarkan diri di siang terik hanya bernilai kebiasaan mubah, sedangkan orang yang melakukannya dengan niat mandi junub telah sah mengangkat hadats besar.

### 2. Tamyizul Maqshud bil 'Amal (Membedakan Tujuan dan Keikhlasan Hamba)
Niat menyingkap apakah peribadatan ditujukan murni karena mencari wajah Allah Ta'ala (*Ikhlas*) atau demi mencari sanjungan, kedudukan sosial, dan materi (*Riya', Sum'ah, dan Ujub*).

Amalan yang terkontaminasi oleh riya' bukan hanya sia-sia, melainkan mendatangkan murka Allah sebagaimana dalam hadits Qudsi:

> "Aku adalah Dzat yang paling tidak membutuhkan sekutu. Barangsiapa mengerjakan suatu amalan yang di dalamnya ia mempersekutukan-Ku dengan selain-Ku, maka Aku tinggalkan dia bersama kesyirikannya."
> *([HR. Muslim no. 2985](/hadith/muslim#2985))*

---

## Mengubah Aktivitas Mubah Menjadi Lumbung Pahala

Salah satu rahmat terbesar dalam syariat Islam adalah bahwa setiap aktivitas duniawi yang mubah dapat disulap menjadi ibadah bernilai pahala sedekah apabila dipasangi niat yang shalih:

- **Makan dan Minum:** Diniatkan untuk menjaga kesehatan agar kuat menjalankan sholat malam dan puasa.
- **Bekerja dan Berdagang:** Diniatkan mencari rezeki yang halal demi menafkahi anak istri dan membentengi diri dari meminta-minta kepada orang lain.
- **Tidur di Malam Hari:** Diniatkan mengistirahatkan fisik agar mudah bangun di sepertiga malam terakhir untuk bertahajud.
- **Bercengkrama dengan Pasangan:** Diniatkan menjaga kehormatan diri dan membina keluarga sakinah.

Mu'adz bin Jabal radhiyallahu 'anhu pernah berkata: *"Adapun aku, aku tidur lalu bangun sholat malam. Aku mengharapkan pahala dari tidurku sebagaimana aku mengharapkan pahala dari sholat malamku."*

Mari kita senantiasa memperbarui niat di awal, di tengah, dan di akhir setiap aktivitas harian kita.`,
		},
		{
			CategorySlug: "keluarga-muslim",
			Title:        "Mendidik Anak Mencintai Sholat Sejak Dini: Tahapan Usia dan Metode Nabawiyah",
			Slug:         "mendidik-anak-mencintai-sholat",
			Excerpt:      "Tuntunan mendidik anak mendirikan sholat: pembagian usia 7 dan 10 tahun, metode keteladanan tanpa bentakan, serta doa mustajab orang tua.",
			Tags:         []string{"keluarga", "sholat"},
			Content: `## Anak: Titipan Berharga dan Ladang Amal Jariyah

Anak adalah karunia terindah sekaligus amanah terberat bagi setiap orang tua muslim. Kebaikan dan keshalihan anak akan menjadi amal jariyah yang terus mengalirkan pahala ke alam kubur orang tuanya. Dan kewajiban pertama yang wajib ditanamkan dalam dada seorang anak setelah tauhid adalah mendirikan sholat lima waktu.

Nabi Muhammad ﷺ meletakkan cetak biru (*blueprint*) pendidikan sholat bagi anak dalam sabda beliau:

> "Perintahkanlah anak-anak kalian untuk mendirikan sholat ketika mereka berusia tujuh tahun, dan pukullah mereka (dengan pukulan mendidik tanpa melukai) jika meninggalkannya ketika mereka berusia sepuluh tahun, serta pisahkanlah tempat tidur mereka."
> *([HR. Abu Dawud no. 495](/hadith/abu-daud#495), dishahihkan oleh Syaikh Al-Albani)*

Perhatikan rentang waktu antara usia 7 tahun hingga 10 tahun: terdapat rentang waktu **3 tahun penuh** (setara dengan 1.095 hari atau lebih dari **5.400 kali waktu sholat**). Ini membuktikan bahwa pendidikan sholat menuntut kesabaran ekstra, ribuan kali pengingat penuh kasih, dan keteladanan konsisten, bukan kemarahan instan.

---

## 4 Tahapan Mendidik Sholat Menurut Sunnah

### 1. Tahap Pembiasaan Dini (Usia Balita – 6 Tahun)
Pada fase ini anak adalah peniru ulung (*visual learner*).
- Biarkan anak berdiri, ruku', atau sujud di samping orang tuanya meski gerakannya belum tertib.
- Belikan sajadah kecil, sarung, peci, atau mukena lucu yang disukainya.
- Ayah mengajak anak laki-lakinya ke masjid untuk sholat berjamaah sambil mengenalkan adab rumah Allah secara bertahap.
- Tunjukkan wajah ceria dan penuh kebahagiaan setiap kali menyambut waktu adzan.

### 2. Tahap Perintah dan Pengajaran Rukun (Usia 7 – 9 Tahun)
Ketika genap berusia 7 tahun, mulailah memerintahkan anak secara formal dengan tutur kata yang santun namun tegas.
- Ajarkan tata cara wudhu yang benar sesuai sunnah Nabi ﷺ.
- Bimbing anak menghafal bacaan sholat (Surat Al-Fatihah, doa ruku', sujud, dan tasyahhud).
- Buat papan ceklis atau jadwal ibadah harian dengan stiker bintang penghargaan.
- Berikan pujian tulus saat anak berinisiatif mengambil wudhu sendiri.

### 3. Tahap Penegasan dan Disiplin (Usia 10 Tahun ke Atas)
Jika anak telah menginjak usia 10 tahun dan masih meremehkan sholat, orang tua berhak memberikan sanksi mendidik.
- Sanksi tidak boleh berupa pukulan yang melukai, memar, atau mengenai area wajah.
- Bisa berupa pengurangan waktu bermain gawai (*screen time*) atau penundaan fasilitas hiburan.
- Pisahkan tempat tidur anak laki-laki dan perempuan demi menjaga batasan aurat dan rasa malu.

### 4. Tahap Dialog Hati dan Penjelasan Hikmah
Jangan jadikan sholat sebagai beban mekanis. Ceritakan kepada anak mengapa kita berterima kasih kepada Allah: karena Allah telah menganugerahkan kesehatan, kedua mata untuk melihat keindahan, serta keluarga yang harmonis.

---

## Doa Mustajab untuk Keshalihan Anak

Lisan orang tua memiliki daya doa yang luar biasa. Jangan pernah bosan memanjatkan doa Nabi Ibrahim 'alaihissalam yang diabadikan dalam Al-Qur'an:

> *Robbij'alni muqiimash-sholaati wa min dzurriyyati, Robbanaa wa taqobbal du'aa'.*
> "Ya Tuhanku, jadikanlah aku dan anak cucuku orang-orang yang tetap mendirikan sholat, ya Tuhan kami, perkenankanlah doaku."
> *([QS. Ibrahim: 40](/quran/14#40))*

Semoga Allah mengaruniakan kepada kita keturunan yang menjadi penyejuk pandangan mata (*Qurrota A'yun*) dan pemimpin bagi orang-orang yang bertakwa.`,
		},
		{
			CategorySlug: "inspirasi-motivasi",
			Title:        "Dahsyatnya Istighfar: Pembuka Pintu Rezeki, Penggugur Dosa, dan Pelipur Lara",
			Slug:         "dahsyatnya-istighfar-pembuka-rezeki",
			Excerpt:      "Mengapa istighfar menjadi kunci kelapangan rezeki dan ketenangan hati? Mengupas janji Allah dalam Surat Nuh, lafadz istighfar terbaik, dan waktu mustajab.",
			Tags:         []string{"dzikir", "doa"},
			Content: `## Senjata Terkuat Seorang Mukmin

Dalam mengarungi samudra kehidupan duniawi, setiap manusia pasti tidak luput dari kekhilafan dosa, kegundahan jiwa, himpitan ekonomi, maupun kebuntuan masalah. Di tengah kesulitan tersebut, Islam memberikan satu kunci ajaib yang sangat ringan di lisan namun berbobot dahsyat di sisi Allah: **Al-Istighfar** (memohon ampunan kepada Allah Ta'ala).

Rasulullah ﷺ yang merupakan manusia termulia dan telah dijamin surga pun tidak pernah melewatkan harinya tanpa beristighfar:

> "Demi Allah, sesungguhnya aku memohon ampunan kepada Allah dan bertaubat kepada-Nya dalam sehari lebih dari tujuh puluh kali."
> *([HR. Bukhari no. 6307](/hadith/bukhari#6307))*
> Dalam riwayat Muslim: *"Sesungguhnya aku beristighfar seratus kali dalam sehari."* *([HR. Muslim no. 2702](/hadith/muslim#2702))*

---

## 4 Buah Manis Istighfar yang Dijanjikan Allah

### 1. Turunnya Hujan Berkah, Kelapangan Harta, dan Keturunan
Dalam Surat Nuh ayat 10–12, Nabi Nuh 'alaihissalam menyampaikan janji Allah kepada kaumnya manakala mereka mau bertaubat dan beristighfar:

> "Maka aku berkata kepada mereka: 'Mohonlah ampun kepada Tuhanmu, sesungguhnya Dia adalah Maha Pengampun. Niscaya Dia akan mengirimkan hujan yang lebat kepadamu, membanyakkan harta dan anak-anakmu, dan mengadakan untukmu kebun-kebun serta mengadakan (pula di dalamnya) untukmu sungai-sungai.'"
> *([QS. Nuh: 10–12](/quran/71#10))*

Imam Al-Qurthubi mengisahkan bahwa suatu ketika ada seseorang mengadu kepada Imam Al-Hasan Al-Bashri tentang kemarau panjang, orang lain mengadu tentang kemiskinan, dan orang ketiga mengadu tentang belum dikaruniai anak. Terhadap semua keluhan tersebut, Al-Hasan Al-Bashri hanya memberikan satu resep: *"Perbanyaklah istighfar!"*

### 2. Solusi dari Segala Kebuntuan dan Kegundahan
Rasulullah ﷺ bersabda:

> "Barangsiapa memperbanyak istighfar, niscaya Allah menjadikan untuk setiap kesedihannya kelapangan, untuk setiap kesempitannya jalan keluar, dan memberinya rezeki dari arah yang tidak disangka-sangka."
> *([HR. Abu Dawud no. 1518](/hadith/abu-daud#1518) dan [HR. Ibnu Majah no. 3819](https://sunnah.com/ibnmajah:3819))*

### 3. Menghapus Karat dan Noda Hitam di Dalam Hati
Setiap perbuatan dosa akan menitikkan noda hitam pada hati seorang hamba. Jika ia beristighfar dan bertaubat, noda hitam tersebut akan terhapus dan hatinya kembali berkilau bersih *([HR. Tirmidzi no. 3334](/hadith/tirmidzi#3334))*.

### 4. Menjadi Tameng Penangkal Azab dan Bencana
Allah Subhanahu wa Ta'ala berfirman:

> "Dan Allah sekali-kali tidak akan mengazab mereka, sedang kamu berada di antara mereka. Dan tidaklah (pula) Allah akan mengazab mereka, sedang mereka meminta ampun (beristighfar)."
> *([QS. Al-Anfal: 33](/quran/8#33))*

---

## Lafadz-Lafadz Istighfar: Dari yang Ringkas hingga Sayyidul Istighfar

1. **Lafadz Ringkas:**
   > *Astaghfirullah* (Aku memohon ampun kepada Allah) atau *Astaghfirullah wa atuubu ilaih*.
2. **Lafadz Penghapus Dosa Besar:**
   > *Astaghfirullahal 'adzim alladzi laa ilaha illa huwal hayyul qayyumu wa atuubu ilaih.*
   > Barangsiapa mengucapkannya, diampuni dosanya meskipun ia pernah lari dari medan perang *([HR. Abu Dawud no. 1517](/hadith/abu-daud#1517))*.
3. **Sayyidul Istighfar (Penghulu Segala Istighfar):**
   > *Allahumma Anta Robbii laa ilaha illa Anta, kholaqtanii wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastatho'tu. A'uudzu bika min syarri maa shona'tu, abuu-u laka bini'matika 'alayya, wa abuu-u bidzanbii faghfirlii fa-innahu laa yaghfirudz-dzunuuba illa Anta.*
   > Rasulullah ﷺ menjamin bahwa barangsiapa membacanya di petang hari lalu meninggal malam itu, atau membacanya di pagi hari lalu meninggal siang itu, ia termasuk penghuni surga *([HR. Bukhari no. 6306](/hadith/bukhari#6306))*.

Basahilah lisan kita setiap saat dengan istighfar: saat berkendara, menunggu antrean, sebelum tidur, dan terutama di waktu sahur menjelang fajar Subuh.`,
		},
		{
			CategorySlug: "fiqh-hukum",
			Title:        "Keutamaan dan Panduan Puasa Sunnah Senin dan Kamis: Manfaat Syar'i dan Medis",
			Slug:         "keutamaan-tata-cara-puasa-senin-kamis",
			Excerpt:      "Meneladani kebiasaan puasa mingguan Nabi ﷺ: alasan penyetoran amal, rahasia kesehatan sel tubuh (autofagi), kelenturan niat, dan doa berbuka yang shahih.",
			Tags:         []string{"puasa", "fiqh"},
			Content: `## Tradisi Ibadah Mingguan Rasulullah ﷺ

Di antara amalan sunnah yang sangat dijaga kelangsungannya oleh Rasulullah ﷺ di luar bulan suci Ramadan adalah berpuasa pada hari Senin dan Kamis. Beliau senantiasa menanti-nanti kedua hari tersebut dengan penuh kerinduan.

Aisyah radhiyallahu 'anha menceritakan:

> "Rasulullah ﷺ sangat antusias memilih hari Senin dan Kamis untuk berpuasa."
> *([HR. At-Tirmidzi no. 745](/hadith/tirmidzi#745), dishahihkan oleh Syaikh Al-Albani)*

---

## Mengapa Hari Senin dan Kamis?

Terdapat alasan khusus yang disampaikan langsung oleh lisan mulia Rasulullah ﷺ mengenai pemilihan dua hari ini:

### 1. Hari Kelahiran dan Turunnya Wahyu Pertama (Hari Senin)
Ketika Rasulullah ﷺ ditanya mengenai alasan berpuasa pada hari Senin, beliau bersabda:

> "Itu adalah hari di mana aku dilahirkan, dan hari di mana aku diutus (menjadi Rasul) atau diturunkannya wahyu kepadaku."
> *([HR. Muslim no. 1162](/hadith/muslim#1162))*

### 2. Hari Penyetoran Amal Hamba kepada Allah (Hari Kamis)
Setiap pekan, lembaran amal ibadah manusia diperiksa dan diangkat ke hadapan Allah Subhanahu wa Ta'ala.

Rasulullah ﷺ menjelaskan:

> "Amal-amal kebajikan diperlihatkan (kepada Allah) pada hari Senin dan Kamis, maka aku sangat menyukai amalku diperlihatkan dalam keadaan aku sedang berpuasa."
> *([HR. At-Tirmidzi no. 747](/hadith/tirmidzi#747), dinilai hasan shahih)*

---

## Manfaat Medis Modern (*Intermittent Fasting & Autofagi*)

Ditinjau dari perspektif kesehatan modern, puasa berkala dua hari dalam sepekan (metode 5:2 diet) terbukti secara klinis memberikan manfaat spektakuler bagi metabolisme tubuh:

- **Memicu Proses Autofagi (*Autophagy*):** Pada tahun 2016, ilmuwan Jepang Yoshinori Ohsumi meraih Hadiah Nobel Fisiologi/Kedokteran atas penemuannya tentang autofagi, yaitu mekanisme tubuh memakan dan mendaur ulang sel-sel yang rusak, protein toksik, dan sel kanker saat perut dalam kondisi puasa lebih dari 12 jam.
- **Meningkatkan Sensitivitas Insulin:** Membantu menstabilkan kadar gula darah dan menurunkan risiko diabetes melitus tipe 2.
- **Detoksifikasi Organ Hati dan Ginjal:** Memberikan jeda istirahat bagi saluran pencernaan agar dapat membersihkan racun sisa metabolisme.

---

## Ketentuan Fiqih Puasa Sunnah

### 1. Kelonggaran Niat
Berbeda dengan puasa wajib Ramadan yang mengharuskan seseorang berniat sebelum terbit fajar (*Tabyitun Niyyah*), puasa sunnah memiliki kelonggaran di mana niat boleh dipasang di pagi hari (misal pukul 07.00 atau 08.00 pagi) dengan syarat belum makan, minum, atau melakukan pembatal puasa sejak fajar Subuh *([HR. Muslim no. 1154](/hadith/muslim#1154))*.

### 2. Adab Berbuka Puasa
- **Menyegerakan Berbuka:** Segera berbuka saat adzan Maghrib berkumandang *([HR. Bukhari no. 1957](/hadith/bukhari#1957))*.
- **Menu Pembuka:** Membuka dengan kurma basah (*ruthab*), jika tidak ada maka kurma kering (*tamr*), dan jika tidak ada maka dengan beberapa teguk air putih *([HR. Abu Dawud no. 2356](/hadith/abu-daud#2356))*.
- **Doa Berbuka yang Shahih:**
  > *Dzahabazh-zhoma'u wabtallatil-'uruuqu wa tsabatal-ajru insyaa Allah.*
  > "Telah hilang rasa dahaga, telah basah urat-urat, dan telah tetap pahala insya Allah." *([HR. Abu Dawud no. 2357](/hadith/abu-daud#2357))*

Jadikanlah puasa Senin Kamis sebagai benteng pertahanan ruhiyah dan kebugaran jasmani kita sepanjang tahun.`,
		},
		{
			CategorySlug: "fiqh-hukum",
			Title:        "Panduan Menghitung Zakat Mal: Syarat, Nisab Emas, Haul, dan 8 Asnaf Penerima",
			Slug:         "panduan-menghitung-zakat-mal",
			Excerpt:      "Panduan praktis perhitungan zakat mal tabungan, emas, dan investasi: patokan nisab 85 gram emas, haul 1 tahun, rumus 2,5%, serta siapa saja 8 asnaf penerima.",
			Tags:         []string{"zakat", "fiqh"},
			Content: `## Zakat: Rukun Islam Pembersih Jiwa dan Harta

Zakat adalah rukun Islam ketiga yang mengikat setiap muslim yang memiliki kelebihan harta. Zakat bukan sekadar kedermawanan sukarela (*filantropi*), melainkan kewajiban hukum syar'i atas hak fakir miskin yang dititipkan Allah pada kekayaan orang-orang yang mampu.

Allah Subhanahu wa Ta'ala berfirman:

> "Ambillah zakat dari sebagian harta mereka, dengan zakat itu kamu membersihkan dan mensucikan mereka, dan mendoalah untuk mereka. Sesungguhnya doa kamu itu (menjadi) ketenteraman jiwa bagi mereka. Dan Allah Maha Mendengar lagi Maha Mengetahui."
> *([QS. At-Taubah: 103](/quran/9#103))*

---

## 2 Syarat Utama Kewajiban Zakat Mal

Harta simpanan (uang tabungan, deposito, emas, perak, dan surat berharga likuid) wajib dikeluarkan zakatnya apabila memenuhi dua parameter:

### 1. Mencapai Nisab (Batas Minimal Harta)
Nisab zakat harta uang simpanan disetarakan dengan harga **85 gram emas murni (24 karat)**, merujuk pada hadits Ali bin Abi Thalib radhiyallahu 'anhu *([HR. Abu Dawud no. 1573](/hadith/abu-daud#1573))*.
- Jika harga emas saat ini adalah Rp 1.400.000 / gram, maka nisab zakat mal adalah:
  > **Nisab = 85 gram × Rp 1.400.000 = Rp 119.000.000,-**

### 2. Mencapai Haul (Masa Kepemilikan 1 Tahun Hijriah)
Harta tersebut telah bertahan di atas angka nisab selama **1 tahun penuh dalam kalender Hijriah** (sekitar 354 hari). Jika di tengah perjalanan saldo tabungan merosot di bawah nisab, maka hitungan haul terputus dan dihitung ulang dari awal saat saldo kembali menyentuh nisab *([HR. At-Tirmidzi no. 631](/hadith/tirmidzi#631))*.

---

## Rumus Praktis Perhitungan Zakat Mal (2,5%)

Besaran zakat mal yang wajib ditunaikan adalah **2,5%** (atau 2,577% jika menggunakan perhitungan tahun Masehi 365 hari):

> **Zakat Wajib = (Total Tabungan + Emas Simpanan + Piutang Lancar – Hutang Jatuh Tempo) × 2,5%**

### Simulasi Kasus:
- Saldo Tabungan & Deposito: Rp 160.000.000
- Emas Simpanan (tidak dipakai perhiasan harian): Rp 20.000.000
- Hutang jatuh tempo bulan ini: Rp 10.000.000
- **Total Harta Kena Zakat:** (Rp 160.000.000 + Rp 20.000.000) – Rp 10.000.000 = **Rp 170.000.000**
- Karena Rp 170.000.000 > Rp 119.000.000 (melebihi nisab) dan telah mengendap 1 tahun:
- **Zakat yang Wajib Dibayar:** Rp 170.000.000 × 2,5% = **Rp 4.250.000,-**

Anda juga dapat menghitung zakat mal secara otomatis melalui fitur *[Kalkulator Zakat](/zakat)* di website ini.

---

## 8 Asnaf (Golongan) yang Berhak Menerima Zakat

Penyaluran zakat tidak boleh diberikan kepada sembarang orang (misal untuk pembangunan jalan umum atau fasilitas mewah), melainkan dibatasi secara tegas dalam Al-Qur'an Surat At-Taubah ayat 60:

> "Sesungguhnya zakat-zakat itu, hanyalah untuk orang-orang fakir, orang-orang miskin, pengurus-pengurus zakat, para muallaf yang dibujuk hatinya, untuk (memerdekakan) budak, orang-orang yang berhutang, untuk jalan Allah dan untuk mereka yag sedang dalam perjalanan, sebagai suatu ketetapan yang diwajibkan Allah, dan Allah Maha Mengetahui lagi Maha Bijaksana."
> *([QS. At-Taubah: 60](/quran/9#60))*

1. **Fakir:** Orang yang tidak memiliki harta atau mata pencaharian, atau memiliki penghasilan kurang dari separuh kebutuhan pokoknya.
2. **Miskin:** Orang yang memiliki penghasilan tetapi tidak mencukupi standar kebutuhan hidup minimum.
3. **Amil:** Petugas resmi yang ditunjuk mengumpulkan dan mendistribusikan zakat.
4. **Muallaf:** Orang yang baru masuk Islam atau yang diharapkan keislamannya.
5. **Riqab:** Membebaskan hamba sahaya / budak muslim.
6. **Gharimin:** Orang yang terlilit hutang halal demi kebutuhan primer atau mendamaikan dua kubu yang bertikai.
7. **Fisabilillah:** Pejuang dan da'i yang menegakkan agama Allah di medan dakwah.
8. **Ibnu Sabil:** Musafir yang kehabisan bekal dalam perjalanan yang bukan maksiat.

Tunaikanlah zakat dengan hati yang lapang, karena zakat tidak akan pernah mengurangi harta, melainkan membersihkan dan melipatgandakan keberkahannya.`,
		},
		{
			CategorySlug: "sejarah-islam",
			Title:        "Pelajaran Berharga dari Peristiwa Hijrah Nabi ﷺ ke Madinah: Strategi, Ikhtiar, dan Peradaban",
			Slug:         "pelajaran-berharga-peristiwa-hijrah",
			Excerpt:      "Membongkar rahasia di balik peristiwa hijrah Rasulullah ﷺ ke Madinah: perpaduan ikhtiar matang dan tawakkal mutlak, 3 pilar Madinah, dan makna hijrah era modern.",
			Tags:         []string{"sirah", "hadith"},
			Content: `## Titik Balik Sejarah Peradaban Manusia

Peristiwa hijrahnya Rasulullah ﷺ bersama sahabat setia Abu Bakar Ash-Shiddiq radhiyallahu 'anhu dari Makkah Al-Mukarramah menuju Yatsrib (Madinah Al-Munawwarah) pada tahun 622 Masehi bukanlah sekadar peristiwa pelarian dari intimidasi kaum Quraisy. Hijrah adalah momentum strategis ilahiah yang mengubah peta peradaban dunia, hingga Khalifah Umar bin Al-Khattab menetapkannya sebagai tonggak permulaan kalender Islam (Tahun Hijriah).

Allah Subhanahu wa Ta'ala mengabadikan momen genting di Gua Tsur dalam firman-Nya:

> "Jikalau kamu tidak menolongnya (Muhammad) maka sesungguhnya Allah telah menolongnya (yaitu) ketika orang-orang kafir mengeluarkannya (dari Makkah) sedang dia salah seorang dari dua orang ketika keduanya berada dalam gua, di waktu dia berkata kepada temannya: 'Janganlah kamu berduka cita, sesungguhnya Allah beserta kita.' Maka Allah menurunkan ketenangan-Nya kepada (Muhammad)..."
> *([QS. At-Taubah: 40](/quran/9#40))*

---

## 4 Bukti Sempurnanya Manajemen Ikhtiar dan Tawakkal Nabi ﷺ

Hijrah memberikan pelajaran agung bahwa tawakkal kepada takdir Allah tidak pernah meniadakan perencanaan dan ikhtiar profesional:

### 1. Menjaga Kerahasiaan Tingkat Tinggi
Rasulullah ﷺ mendatangi kediaman Abu Bakar pada waktu siang hari yang tidak lazim (*waktu Qailulah* / terik matahari) dengan menutup kepala beliau agar tidak dicurigai oleh mata-mata kaum musyrikin Quraisy.

### 2. Taktik Pengalihan yang Cerdas
- Beliau menugaskan Ali bin Abi Thalib radhiyallahu 'anhu untuk tidur di pembaringan beliau berselimutkan kain hijau Hadramaut, guna mengecoh para pemuda Quraisy yang mengepung rumah beliau sekaligus menunaikan amanah mengembalikan barang titipan penduduk Makkah.
- Beliau memilih jalur selatan menuju Yaman (berlawanan arah dengan Madinah yang berada di sebelah utara) untuk membuyarkan pelacakan jejak kaum kafir.

### 3. Pembagian Peran dan Tugas yang Rapi
- **Abu Bakar Ash-Shiddiq:** Menyiapkan dua ekor unta terbaik yang telah dilatih secara khusus.
- **Asma' binti Abu Bakar (*Dzatun Nithaqain*):** Menyuplai makanan dan minuman ke Gua Tsur di malam hari.
- **Abdullah bin Abu Bakar:** Pemuda cerdas yang bertugas sebagai intelijen penyerap kabar konspirasi di Makkah lalu melaporkannya ke gua pada malam hari.
- **Amir bin Fuhairah:** Menggembalakan domba di atas jejak kaki Asma' dan Abdullah guna menghapus jejak dari kejaran pelacak jejak Makkah.
- **Abdullah bin Uraiqith:** Seorang non-muslim yang profesional dan amanah yang disewa jasanya sebagai penunjuk jalan gurun (*dalil*).

### 4. Kepasrahan Tawakkal yang Mutlak
Ketika para pengejar Quraisy telah berdiri tepat di bibir Gua Tsur hingga Abu Bakar berkata gemetar: *"Wahai Rasulullah, sekiranya salah seorang dari mereka melihat ke bawah kakinya, niscaya mereka akan melihat kita!"* Rasulullah ﷺ menjawab dengan tenang dan penuh keyakinan:

> "Wahai Abu Bakar, apa prasangkamu terhadap dua orang di mana Allah adalah pihak ketiganya?"
> *([HR. Bukhari no. 3653](/hadith/bukhari#3653) dan [HR. Muslim no. 2381](/hadith/muslim#2381))*

---

## 3 Pilar Pembangunan Peradaban Kota Madinah

Begitu tiba di Madinah, langkah awal Rasulullah ﷺ bukanlah membangun kemegahan istana atau kekuatan militer, melainkan meletakkan tiga pilar sosial peradaban:

1. **Pembangunan Masjid Nabawi:** Menjadikan masjid sebagai episentrum ibadah, majelis ilmu, balai musyawarah kenegaraan, dan santunan sosial.
2. **Mempersaudarakan Muhajirin dan Anshar (*Mu-akhah*):** Meleburkan sekat kesukuan dan kedaerahan dengan ikatan aqidah Islam. Kaum Anshar dengan penuh kerelaan membagi rumah dan kebun mereka untuk saudara Muhajirin yang datang tanpa harta *([QS. Al-Hasyr: 9](/quran/59#9))*.
3. **Piagam Madinah (*Shahifah Al-Madinah*):** Konstitusi tertulis modern pertama yang menjamin toleransi beragama, hak asasi manusia, serta tanggung jawab pertahanan bersama antara kaum muslimin dan non-muslim di Madinah.

---

## Makna Hijrah di Era Modern

Pintu hijrah fisik dari Makkah ke Madinah telah ditutup setelah *Fathu Makkah*, namun pintu **Hijrah Maknawiyah** (ruhiyah) terbuka lebar hingga hari kiamat.

Rasulullah ﷺ bersabda:

> "Seorang muslim adalah orang yang menyelamatkan sesama muslim dari lisan dan tangannya. Dan seorang yang berhijrah (*muhajir*) adalah orang yang meninggalkan segala apa yang dilarang oleh Allah."
> *([HR. Bukhari no. 10](/hadith/bukhari#10))*

Hijrah di era sekarang adalah berani meninggalkan pekerjaan yang haram menuju rezeki yang halal, meninggalkan pergaulan toksik dan maksiat menuju majelis ilmu, serta membuang rasa malas demi istiqomah di atas ketaatan kepada Allah Ta'ala.`,
		},
	}
}
