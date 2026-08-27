package migrations

// LocalizedText holds the English variants for content that is stored in
// Indonesian on the primary table (Doa.Title, Doa.Translation, etc.). The
// upsert layer pairs these with the Indonesian text from the seed entry to
// build a Translation row that backs the bilingual API response.
type LocalizedText struct {
	Title    string // English title
	Latin    string // English transliteration override (optional, defaults to Indonesian latin)
	Meaning  string // English meaning / description
	Fadhilah string // English fadhilah (dzikir-only, optional)
}

// doaEnglishByKey returns English translations keyed by "category|title".
// Each entry mirrors the Indonesian seed in seedDoa(); when adding new doa,
// add the English here as well to keep API output bilingual.
func doaEnglishByKey() map[string]LocalizedText {
	return map[string]LocalizedText{
		"pagi|Doa Bangun Tidur": {
			Title:   "Prayer Upon Waking Up",
			Meaning: "All praise is for Allah who has given us life after causing us to die, and to Him is the resurrection.",
		},
		"pagi|Doa Pagi (Ashabna)": {
			Title:   "Morning Prayer (Ashabna)",
			Meaning: "We have entered the morning and the dominion belongs to Allah. Praise is for Allah; there is no god worthy of worship except Allah, alone, with no partner.",
		},
		"petang|Doa Petang (Amsainaa)": {
			Title:   "Evening Prayer (Amsaina)",
			Meaning: "We have entered the evening and the dominion belongs to Allah. Praise is for Allah; there is no god worthy of worship except Allah, alone, with no partner.",
		},
		"tidur|Doa Sebelum Tidur": {
			Title:   "Prayer Before Sleeping",
			Meaning: "In Your name, O Allah, I die and I live.",
		},
		"tidur|Doa Sebelum Tidur (Al-Mulk)": {
			Title:   "Prayer Before Sleeping (Al-Mulk)",
			Meaning: "O Allah, in Your name I live and I die.",
		},
		"makan|Doa Sebelum Makan": {
			Title:   "Prayer Before Eating",
			Meaning: "In the name of Allah and upon the blessings of Allah.",
		},
		"makan|Doa Setelah Makan": {
			Title:   "Prayer After Eating",
			Meaning: "All praise is for Allah who has fed us, given us drink, and made us Muslims.",
		},
		"kamar_mandi|Doa Masuk Kamar Mandi": {
			Title:   "Prayer Entering the Bathroom",
			Meaning: "O Allah, I seek refuge in You from male and female devils.",
		},
		"kamar_mandi|Doa Keluar Kamar Mandi": {
			Title:   "Prayer Leaving the Bathroom",
			Meaning: "I seek Your forgiveness.",
		},
		"masjid|Doa Masuk Masjid": {
			Title:   "Prayer Entering the Mosque",
			Meaning: "O Allah, open for me the gates of Your mercy.",
		},
		"masjid|Doa Keluar Masjid": {
			Title:   "Prayer Leaving the Mosque",
			Meaning: "O Allah, I ask You from Your bounty.",
		},
		"safar|Doa Naik Kendaraan": {
			Title:   "Prayer When Boarding a Vehicle",
			Meaning: "Glory be to Him who subjected this to us, and we could never have it (by ourselves), and to our Lord we shall surely return.",
		},
		"safar|Doa Bepergian": {
			Title:   "Travel Prayer",
			Meaning: "O Allah, we ask You on this journey of ours righteousness and piety.",
		},
		"belajar|Doa Sebelum Belajar": {
			Title:   "Prayer Before Studying",
			Meaning: "O my Lord, increase me in knowledge and bestow upon me understanding.",
		},
		"belajar|Doa Sesudah Belajar": {
			Title:   "Prayer After Studying",
			Meaning: "O Allah, I entrust to You what You have taught me, so return it to me when I need it.",
		},
		"umum|Doa Perlindungan (Sayyidul Istighfar)": {
			Title:   "Master Prayer of Forgiveness (Sayyidul Istighfar)",
			Meaning: "O Allah, You are my Lord, there is no god worthy of worship except You. You created me and I am Your servant.",
		},
		"umum|Doa Kebaikan Dunia & Akhirat": {
			Title:   "Prayer for Goodness in this World and the Hereafter",
			Meaning: "Our Lord, give us in this world good and in the Hereafter good, and protect us from the punishment of the Fire.",
		},
		"umum|Doa Mohon Keteguhan Hati": {
			Title:   "Prayer for Steadfastness of the Heart",
			Meaning: "O Turner of Hearts, keep my heart firm upon Your religion.",
		},
		"umum|Doa Masuk Rumah": {
			Title:   "Prayer Entering the House",
			Meaning: "O Allah, I ask You for goodness in entering and goodness in leaving.",
		},
		"umum|Doa Perlindungan dari Ilmu yang Tidak Bermanfaat": {
			Title:   "Prayer for Protection from Useless Knowledge",
			Meaning: "O Allah, I seek refuge in You from knowledge that does not benefit and from a heart that is not humble.",
		},
	}
}

// dzikirEnglishByKey returns English translations keyed by "category|title".
func dzikirEnglishByKey() map[string]LocalizedText {
	return map[string]LocalizedText{
		"pagi|Ayat Kursi": {
			Title:    "Ayat Kursi (The Throne Verse)",
			Meaning:  "Allah, there is no god worthy of worship except Him, the Ever-Living, the Sustainer of all existence...",
			Fadhilah: "Whoever recites it after every prescribed prayer, nothing prevents him from entering Paradise except death.",
		},
		"pagi|Tasbih Pagi": {
			Title:    "Morning Tasbih",
			Meaning:  "Glory be to Allah, and praise is His.",
			Fadhilah: "His sins are forgiven even if they are like the foam of the sea.",
		},
		"pagi|Dzikir Pagi (Sayyidul Istighfar)": {
			Title:    "Morning Dhikr (Sayyidul Istighfar)",
			Meaning:  "O Allah, You are my Lord, there is no god worthy of worship except You. You created me and I am Your servant.",
			Fadhilah: "If recited in the morning with conviction and the person dies, he enters Paradise.",
		},
		"petang|Tasbih Petang": {
			Title:   "Evening Tasbih",
			Meaning: "Glory be to Allah, and praise is His.",
		},
		"petang|Doa Perlindungan Petang": {
			Title:    "Evening Protection Prayer",
			Meaning:  "I seek refuge in the perfect words of Allah from the evil of what He has created.",
			Fadhilah: "No poison, venomous creature, or thief shall harm him.",
		},
		"setelah_sholat|Tasbih Tahmid Takbir": {
			Title:   "Tasbih, Tahmid, Takbir",
			Meaning: "Glory be to Allah — All praise is for Allah — Allah is the Greatest.",
		},
		"setelah_sholat|Istighfar Setelah Sholat": {
			Title:   "Istighfar After Prayer",
			Meaning: "I seek forgiveness from Allah.",
		},
		"tidur|Tasbih Sebelum Tidur": {
			Title:    "Tasbih Before Sleeping",
			Meaning:  "Glory be to Allah — All praise is for Allah — Allah is the Greatest.",
			Fadhilah: "Better than having a servant.",
		},
		"tidur|Al-Ikhlas, Al-Falaq, An-Nas sebelum tidur": {
			Title:    "Al-Ikhlas, Al-Falaq, An-Nas Before Sleeping",
			Meaning:  "Surahs Al-Ikhlas, Al-Falaq, and An-Nas.",
			Fadhilah: "Sufficient against everything.",
		},
		"safar|Doa Naik Kendaraan": {
			Title:   "Prayer When Boarding a Vehicle",
			Meaning: "Glory be to Him who subjected this to us, and we could never have it (by ourselves), and to our Lord we shall surely return.",
		},
		"dzikir_umum|Hauqalah": {
			Title:    "Hauqalah",
			Meaning:  "There is no power and no strength except by (the help of) Allah.",
			Fadhilah: "One of the treasures of Paradise.",
		},
		"dzikir_umum|Basmalah": {
			Title:   "Basmalah",
			Meaning: "In the name of Allah, the Most Gracious, the Most Merciful.",
		},
		"dzikir_umum|Istirja' (Inna lillahi)": {
			Title:   "Istirja' (Inna lillahi)",
			Meaning: "Indeed, to Allah we belong and to Him we shall return.",
		},
		"dzikir_umum|Perbanyak Sholawat di Hari Jumat": {
			Title:    "Increase Salawat on Friday",
			Meaning:  "O Allah, send Your blessings upon Muhammad and upon the family of Muhammad.",
			Fadhilah: "The Prophet ﷺ said: 'Increase your salawat upon me on the night and day of Friday.' (Reported by Al-Bayhaqi)",
		},
		"dzikir_umum|Doa Mustajab Akhir Ashar Jumat": {
			Title:    "Accepted Prayer of Late Asr on Friday",
			Meaning:  "O Allah, You are my Lord, there is no god worthy of worship except You; in You I place my trust and You are the Lord of the Mighty Throne.",
			Fadhilah: "There is an accepted hour on Friday — the strong opinion: from after Asr until Maghrib (Reported by Abu Dawud).",
		},
		"dzikir_umum|Membaca Surat Al-Kahfi di Hari Jumat": {
			Title:    "Reciting Surah Al-Kahfi on Friday",
			Meaning:  "Recite Surah Al-Kahfi (QS. 18) every Friday — may be in the day or night of Friday.",
			Fadhilah: "The Prophet ﷺ said: 'Whoever reads Surah Al-Kahfi on Friday, light will shine for him between the two Fridays.' (Reported by Al-Hakim; Sahih per Al-Albani)",
		},
		"dzikir_umum|Doa Terbaik Hari Arafah": {
			Title:    "The Best Prayer on the Day of Arafah",
			Meaning:  "There is no god worthy of worship except Allah, alone with no partner. To Him belongs all dominion and praise, and He is over all things capable.",
			Fadhilah: "The Prophet ﷺ said: 'The best supplication is the supplication of the Day of Arafah.' (Reported by Al-Tirmidhi)",
		},
		"dzikir_umum|Takbir Hari Tasyrik (9-13 Dzulhijjah)": {
			Title:    "Takbir of Tashriq Days (9-13 Dhul Hijjah)",
			Meaning:  "Allah is the Greatest, Allah is the Greatest, there is no god except Allah, Allah is the Greatest, Allah is the Greatest, and to Allah belongs all praise.",
			Fadhilah: "It is recommended to abundantly say takbir from dawn of 9 Dhul Hijjah until Asr of 13 Dhul Hijjah (last Tashriq day).",
		},
		"dzikir_umum|Doa Lailatul Qadar": {
			Title:    "Prayer of Laylatul Qadr",
			Meaning:  "O Allah, indeed You are All-Pardoning, You love to pardon, so pardon me.",
			Fadhilah: "Aisha (RA) asked: 'O Messenger of Allah, what should I say if I find Laylatul Qadr?' He replied: 'Recite this prayer.'",
		},
		"dzikir_umum|Qiyamul Lail 10 Malam Terakhir Ramadan": {
			Title:    "Night Prayer in the Last 10 Nights of Ramadan",
			Meaning:  "Increase night prayer, recitation of the Quran, dhikr, and supplication during the last 10 nights of Ramadan. The Prophet ﷺ was more diligent in worship during the last 10 nights than other nights.",
			Fadhilah: "The Prophet ﷺ said: 'Seek Laylatul Qadr in the odd nights of the last 10 of Ramadan.' (Reported by Al-Bukhari)",
		},
		"dzikir_umum|Doa Berbuka Puasa": {
			Title:   "Prayer When Breaking the Fast",
			Meaning: "O Allah, for You I have fasted, in You I believe, in You I trust, and with Your provision I break my fast.",
		},
		"dzikir_umum|Doa Menyambut Ramadan": {
			Title:   "Prayer Welcoming Ramadan",
			Meaning: "O Allah, bless us in Rajab and Sha'ban, and let us reach Ramadan.",
		},
		"dzikir_umum|Niat Puasa Ramadan": {
			Title:   "Intention for Ramadan Fasting",
			Meaning: "I intend to fast tomorrow to fulfill the obligation of Ramadan this year for the sake of Allah the Almighty.",
		},
		"dzikir_umum|Takbiran Idul Fitri": {
			Title:    "Eid al-Fitr Takbir",
			Meaning:  "Allah is the Greatest (3x), there is no god except Allah, Allah is the Greatest (2x), and to Allah belongs all praise.",
			Fadhilah: "Recommended to recite takbir from the night of Eid al-Fitr until the completion of the Eid prayer.",
		},
		"dzikir_umum|Ucapan Selamat Hari Raya": {
			Title:    "Eid Greetings",
			Meaning:  "May Allah accept (worship) from us and from you.",
			Fadhilah: "A greeting practiced by the Companions when meeting on Eid.",
		},
		"dzikir_umum|Takbiran Idul Adha": {
			Title:    "Eid al-Adha Takbir",
			Meaning:  "Allah is the Greatest (3x), there is no god except Allah, Allah is the Greatest (2x), and to Allah belongs all praise.",
			Fadhilah: "Recommended to recite takbir from dawn of 9 Dhul Hijjah until Asr of 13 Dhul Hijjah.",
		},
		"dzikir_umum|Doa Menyembelih Hewan Kurban": {
			Title:   "Prayer When Slaughtering the Sacrificial Animal",
			Meaning: "In the name of Allah, Allah is the Greatest. O Allah, this is from You and for You. O Allah, accept it from me.",
		},
	}
}
