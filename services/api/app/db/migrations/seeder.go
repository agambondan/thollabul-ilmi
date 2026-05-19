package migrations

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

var (
	book model.Book
	juz  model.Juz
)

// DataSeeds data to seeds
func DataSeeds(db *gorm.DB) []interface{} {
	return []interface{}{
		book.Seed(db),
		juz.Seeder(db),
		seedDoa(),
		seedAsmaUlHusna(),
		seedAmalanItems(),
		seedDzikir(),
		seedSholatGuide(),
		seedFiqhCategories(),
		seedFiqhItems(),
		seedTahlilCollections(),
		seedTahlilItems(),
		seedSirohCategories(),
		seedBlogCategories(),
		seedBlogTags(),
		seedKajian(),
	}
}

// SeedRelated seeds data that requires parent-FK lookups.
// Called after DataSeeds so parent records already have IDs.
func SeedRelated(db *gorm.DB) {
	seedFiqhItemsRelated(db)
	seedTahlilItemsRelated(db)
	seedSirohContentsRelated(db)
	seedMufrodatRelated(db)
	SeedTier4(db)
}

func seedDoa() []model.Doa {
	return []model.Doa{
		{Category: model.DoaCategoryPagi, Title: "Doa Bangun Tidur", Arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", Transliteration: "Alhamdulillahilladzi ahyaanaa ba'da maa amaatanaa wa ilaihin nusyuur", TranslationText: "Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan hanya kepada-Nya kami akan dibangkitkan.", Source: "HR. Bukhari No. 6312; Shahih"},
		{Category: model.DoaCategoryPagi, Title: "Doa Pagi (Ashabna)", Arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ", Transliteration: "Ashbahnaa wa ashbahal mulku lillah, walhamdulillah, laa ilaaha illallah wahdahu laa syariika lah", TranslationText: "Kami berpagi hari dan kerajaan hanyalah milik Allah. Segala puji bagi Allah, tiada ilah yang berhak disembah selain Allah semata, tiada sekutu bagi-Nya.", Source: "HR. Muslim No. 2723; HR. Abu Dawud No. 5076; Shahih"},
		{Category: model.DoaCategoryPetang, Title: "Doa Petang (Amsainaa)", Arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ", Transliteration: "Amsainaa wa amsal mulku lillah, walhamdulillah, laa ilaaha illallah wahdahu laa syariika lah", TranslationText: "Kami bersore hari dan kerajaan hanyalah milik Allah. Segala puji bagi Allah, tiada ilah yang berhak disembah selain Allah semata, tiada sekutu bagi-Nya.", Source: "HR. Muslim No. 2723; Shahih"},
		{Category: model.DoaCategoryTidur, Title: "Doa Sebelum Tidur", Arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", Transliteration: "Bismikallahumma amuutu wa ahyaa", TranslationText: "Dengan nama-Mu ya Allah, aku mati dan aku hidup.", Source: "HR. Bukhari No. 6324; HR. Muslim No. 2711; Shahih"},
		{Category: model.DoaCategoryTidur, Title: "Doa Sebelum Tidur (Al-Mulk)", Arabic: "اللَّهُمَّ بِاسْمِكَ أَحْيَا وَأَمُوتُ", Transliteration: "Allahumma bismika ahyaa wa amuut", TranslationText: "Ya Allah, dengan nama-Mu aku hidup dan aku mati.", Source: "HR. Bukhari No. 6312; HR. Muslim No. 2711; Shahih"},
		{Category: model.DoaCategoryMakan, Title: "Doa Sebelum Makan", Arabic: "بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ", Transliteration: "Bismillahi wa 'alaa barakatillah", TranslationText: "Dengan nama Allah dan atas berkah Allah.", Source: "HR. Abu Dawud No. 3767; Hasan Shahih (Al-Albani)"},
		{Category: model.DoaCategoryMakan, Title: "Doa Setelah Makan", Arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ", Transliteration: "Alhamdulillahilladzi ath'amanaa wa saqaanaa wa ja'alanaa muslimiin", TranslationText: "Segala puji bagi Allah yang telah memberi kami makan dan minum, serta menjadikan kami orang-orang Muslim.", Source: "HR. Abu Dawud No. 3850; HR. Tirmidzi No. 3457; Hasan Shahih"},
		{Category: model.DoaCategoryKamarMandi, Title: "Doa Masuk Kamar Mandi", Arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ", Transliteration: "Allahumma inni a'uudzubika minal khubutsi wal khabaa'its", TranslationText: "Ya Allah, sesungguhnya aku berlindung kepada-Mu dari setan laki-laki dan setan perempuan.", Source: "HR. Bukhari No. 142; HR. Muslim No. 375; Shahih"},
		{Category: model.DoaCategoryKamarMandi, Title: "Doa Keluar Kamar Mandi", Arabic: "غُفْرَانَكَ", Transliteration: "Ghufraanaka", TranslationText: "Aku memohon ampunan-Mu.", Source: "HR. Abu Dawud No. 30; HR. Tirmidzi No. 7; HR. Ibnu Majah No. 301; Shahih"},
		{Category: model.DoaCategoryMasjid, Title: "Doa Masuk Masjid", Arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", Transliteration: "Allahummaftah lii abwaaba rahmatik", TranslationText: "Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu.", Source: "HR. Muslim No. 713; HR. Ibnu Majah No. 772; Shahih"},
		{Category: model.DoaCategoryMasjid, Title: "Doa Keluar Masjid", Arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", Transliteration: "Allahumma innii as'aluka min fadhlika", TranslationText: "Ya Allah, sesungguhnya aku memohon kepada-Mu dari karunia-Mu.", Source: "HR. Muslim No. 713; HR. Ibnu Majah No. 773; Shahih"},
		{Category: model.DoaCategorySafar, Title: "Doa Naik Kendaraan", Arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ", Transliteration: "Subhaanal ladzii sakhkhara lanaa haadzaa wa maa kunnaa lahu muqriniin, wa innaa ilaa rabbinaa lamunqalibuun", TranslationText: "Maha Suci Allah yang telah menundukkan semua ini bagi kami padahal kami sebelumnya tidak mampu menguasainya, dan sesungguhnya kami akan kembali kepada Rabb kami.", Source: "HR. Muslim No. 1342; HR. Abu Dawud No. 2602; Shahih"},
		{Category: model.DoaCategorySafar, Title: "Doa Bepergian", Arabic: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى", Transliteration: "Allahumma innaa nas'aluka fii safarina haadzal birra wat taqwaa", TranslationText: "Ya Allah, sesungguhnya kami memohon kepada-Mu dalam perjalanan ini kebaikan dan ketakwaan.", Source: "HR. Muslim No. 1342; Shahih"},
		{Category: model.DoaCategoryBelajar, Title: "Doa Sebelum Belajar", Arabic: "رَبِّ زِدْنِي عِلْمًا وَارْزُقْنِي فَهْمًا", Transliteration: "Rabbi zidnii 'ilmaa warzuqnii fahmaa", TranslationText: "Ya Rabbku, tambahkanlah ilmu kepadaku dan berikanlah aku pemahaman.", Source: "QS. Thaha: 114"},
		{Category: model.DoaCategoryBelajar, Title: "Doa Sesudah Belajar", Arabic: "اللَّهُمَّ إِنِّي أَسْتَوْدِعُكَ مَا عَلَّمْتَنِي فَارْدُدْهُ إِلَيَّ عِنْدَ حَاجَتِي إِلَيْهِ", Transliteration: "Allahumma innii astaudi'uka maa 'allamtanii fardudhu ilayya 'inda haajatii ilayh", TranslationText: "Ya Allah, aku menitipkan kepada-Mu apa yang telah Engkau ajarkan kepadaku, maka kembalikanlah ia kepadaku ketika aku membutuhkannya.", Source: "Doa Salaf"},
		{Category: model.DoaCategoryUmum, Title: "Doa Perlindungan (Sayyidul Istighfar)", Arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ", Transliteration: "Allahumma anta rabbii laa ilaaha illaa anta khalaqtanii wa anaa 'abduk", TranslationText: "Ya Allah, Engkau adalah Rabbku, tidak ada ilah yang berhak disembah selain Engkau, Engkau yang menciptakanku dan aku adalah hamba-Mu.", Source: "HR. Bukhari No. 6306; Shahih"},
		{Category: model.DoaCategoryUmum, Title: "Doa Kebaikan Dunia & Akhirat", Arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", Transliteration: "Rabbanaaa aatinaa fid dunyaa hasanah, wa fil aakhirati hasanah, wa qinaa 'adzaaban naar", TranslationText: "Ya Rabb kami, berikanlah kepada kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari azab neraka.", Source: "QS. Al-Baqarah: 201"},
		{Category: model.DoaCategoryUmum, Title: "Doa Mohon Keteguhan Hati", Arabic: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ", Transliteration: "Yaa muqallibal quluub, tsabbit qalbii 'alaa diinik", TranslationText: "Wahai Yang Membolak-balikkan hati, teguhkanlah hatiku di atas agama-Mu.", Source: "HR. Tirmidzi No. 2140; Hasan Shahih"},
		{Category: model.DoaCategoryUmum, Title: "Doa Masuk Rumah", Arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ", Transliteration: "Allahumma innii as'aluka khayral mawliji wa khayral makhraji", TranslationText: "Ya Allah, aku memohon kepada-Mu kebaikan dalam masuk dan kebaikan dalam keluar.", Source: "HR. Abu Dawud No. 5096; HR. Ibnu Majah No. 3882; Hasan"},
		{Category: model.DoaCategoryUmum, Title: "Doa Perlindungan dari Ilmu yang Tidak Bermanfaat", Arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لَا يَنْفَعُ وَمِنْ قَلْبٍ لَا يَخْشَعُ", Transliteration: "Allahumma innii a'uudzubika min 'ilmin laa yanfa' wa min qalbin laa yakhsya'", TranslationText: "Ya Allah, aku berlindung kepada-Mu dari ilmu yang tidak bermanfaat, dari hati yang tidak khusyu'.", Source: "HR. Muslim No. 2722; HR. Abu Dawud No. 1548; HR. Tirmidzi No. 3482; Shahih"},
	}
}

func seedAsmaUlHusna() []model.AsmaUlHusna {
	return []model.AsmaUlHusna{
		{Number: 1, Arabic: "اللَّهُ", Transliteration: "Allah", Indonesian: "Yang Maha Agung", English: "Allah", Meaning: "Nama yang paling agung, mencakup semua sifat kesempurnaan"},
		{Number: 2, Arabic: "الرَّحْمَنُ", Transliteration: "Ar-Rahman", Indonesian: "Yang Maha Pengasih", English: "The Most Gracious", Meaning: "Yang memiliki rahmat yang luas mencakup seluruh makhluk di dunia"},
		{Number: 3, Arabic: "الرَّحِيمُ", Transliteration: "Ar-Rahim", Indonesian: "Yang Maha Penyayang", English: "The Most Merciful", Meaning: "Yang mengkhususkan rahmat-Nya bagi orang-orang beriman di akhirat"},
		{Number: 4, Arabic: "الْمَلِكُ", Transliteration: "Al-Malik", Indonesian: "Yang Maha Merajai", English: "The King", Meaning: "Yang memiliki kerajaan mutlak dan berkuasa atas segala sesuatu"},
		{Number: 5, Arabic: "الْقُدُّوسُ", Transliteration: "Al-Quddus", Indonesian: "Yang Maha Suci", English: "The Most Holy", Meaning: "Yang Maha Suci dari segala kekurangan dan aib"},
		{Number: 6, Arabic: "السَّلَامُ", Transliteration: "As-Salam", Indonesian: "Yang Maha Sejahtera", English: "The Source of Peace", Meaning: "Yang selamat dari segala kekurangan dan yang memberi keselamatan"},
		{Number: 7, Arabic: "الْمُؤْمِنُ", Transliteration: "Al-Mu'min", Indonesian: "Yang Maha Memberi Keamanan", English: "The Guardian of Faith", Meaning: "Yang memberi keamanan dan membenarkan para rasul-Nya"},
		{Number: 8, Arabic: "الْمُهَيْمِنُ", Transliteration: "Al-Muhaymin", Indonesian: "Yang Maha Memelihara", English: "The Protector", Meaning: "Yang mengawasi dan memelihara segala sesuatu"},
		{Number: 9, Arabic: "الْعَزِيزُ", Transliteration: "Al-Aziz", Indonesian: "Yang Maha Perkasa", English: "The Almighty", Meaning: "Yang Maha Mulia tidak terkalahkan dan tidak tertandingi"},
		{Number: 10, Arabic: "الْجَبَّارُ", Transliteration: "Al-Jabbar", Indonesian: "Yang Maha Kuasa", English: "The Compeller", Meaning: "Yang kehendak-Nya tidak dapat dikalahkan, Yang Maha Tinggi"},
		{Number: 11, Arabic: "الْمُتَكَبِّرُ", Transliteration: "Al-Mutakabbir", Indonesian: "Yang Maha Megah", English: "The Supreme", Meaning: "Yang memiliki kebesaran dan keagungan yang mutlak"},
		{Number: 12, Arabic: "الْخَالِقُ", Transliteration: "Al-Khaliq", Indonesian: "Yang Maha Pencipta", English: "The Creator", Meaning: "Yang menciptakan segala sesuatu dari ketiadaan"},
		{Number: 13, Arabic: "الْبَارِئُ", Transliteration: "Al-Bari'", Indonesian: "Yang Maha Mengadakan", English: "The Evolver", Meaning: "Yang mengadakan dan memisahkan antara makhluk satu dengan lainnya"},
		{Number: 14, Arabic: "الْمُصَوِّرُ", Transliteration: "Al-Musawwir", Indonesian: "Yang Maha Membentuk Rupa", English: "The Fashioner", Meaning: "Yang memberikan bentuk dan rupa kepada segala sesuatu"},
		{Number: 15, Arabic: "الْغَفَّارُ", Transliteration: "Al-Ghaffar", Indonesian: "Yang Maha Pengampun", English: "The Ever-Forgiving", Meaning: "Yang terus-menerus mengampuni dosa hamba-Nya"},
		{Number: 16, Arabic: "الْقَهَّارُ", Transliteration: "Al-Qahhar", Indonesian: "Yang Maha Mengalahkan", English: "The Subduer", Meaning: "Yang menundukkan seluruh makhluk dan menguasai segalanya"},
		{Number: 17, Arabic: "الْوَهَّابُ", Transliteration: "Al-Wahhab", Indonesian: "Yang Maha Pemberi", English: "The Bestower", Meaning: "Yang memberi tanpa batas dan tanpa mengharapkan imbalan"},
		{Number: 18, Arabic: "الرَّزَّاقُ", Transliteration: "Ar-Razzaq", Indonesian: "Yang Maha Pemberi Rezeki", English: "The Provider", Meaning: "Yang memberikan rezeki kepada seluruh makhluk-Nya"},
		{Number: 19, Arabic: "الْفَتَّاحُ", Transliteration: "Al-Fattah", Indonesian: "Yang Maha Pembuka Rahmat", English: "The Opener", Meaning: "Yang membuka pintu rahmat dan kemenangan bagi hamba-Nya"},
		{Number: 20, Arabic: "الْعَلِيمُ", Transliteration: "Al-'Alim", Indonesian: "Yang Maha Mengetahui", English: "The All-Knowing", Meaning: "Yang mengetahui segala sesuatu, lahir dan batin, dahulu dan akan datang"},
		{Number: 21, Arabic: "الْقَابِضُ", Transliteration: "Al-Qabidh", Indonesian: "Yang Maha Menyempitkan", English: "The Withholder", Meaning: "Yang menyempitkan dan menahan sesuai hikmah-Nya"},
		{Number: 22, Arabic: "الْبَاسِطُ", Transliteration: "Al-Basith", Indonesian: "Yang Maha Melapangkan", English: "The Extender", Meaning: "Yang melapangkan rezeki dan rahmat kepada siapa yang dikehendaki"},
		{Number: 23, Arabic: "الْخَافِضُ", Transliteration: "Al-Khafidh", Indonesian: "Yang Maha Merendahkan", English: "The Abaser", Meaning: "Yang merendahkan siapa yang dikehendaki dengan keadilan-Nya"},
		{Number: 24, Arabic: "الرَّافِعُ", Transliteration: "Ar-Rafi'", Indonesian: "Yang Maha Meninggikan", English: "The Exalter", Meaning: "Yang meninggikan derajat siapa yang dikehendaki dengan karunia-Nya"},
		{Number: 25, Arabic: "الْمُعِزُّ", Transliteration: "Al-Mu'izz", Indonesian: "Yang Maha Memuliakan", English: "The Honourer", Meaning: "Yang memberikan kemuliaan kepada siapa yang dikehendaki"},
		{Number: 26, Arabic: "الْمُذِلُّ", Transliteration: "Al-Mudzill", Indonesian: "Yang Maha Menghinakan", English: "The Dishonorer", Meaning: "Yang menghinakan siapa yang dikehendaki dengan keadilan-Nya"},
		{Number: 27, Arabic: "السَّمِيعُ", Transliteration: "As-Sami'", Indonesian: "Yang Maha Mendengar", English: "The All-Hearing", Meaning: "Yang mendengar semua suara dan bisikan hati"},
		{Number: 28, Arabic: "الْبَصِيرُ", Transliteration: "Al-Bashir", Indonesian: "Yang Maha Melihat", English: "The All-Seeing", Meaning: "Yang melihat segala sesuatu meskipun tersembunyi"},
		{Number: 29, Arabic: "الْحَكَمُ", Transliteration: "Al-Hakam", Indonesian: "Yang Maha Menetapkan", English: "The Judge", Meaning: "Yang menetapkan hukum dan keputusan dengan adil"},
		{Number: 30, Arabic: "الْعَدْلُ", Transliteration: "Al-'Adl", Indonesian: "Yang Maha Adil", English: "The Just", Meaning: "Yang Maha Adil dalam setiap keputusan dan tindakan-Nya"},
		{Number: 31, Arabic: "اللَّطِيفُ", Transliteration: "Al-Lathif", Indonesian: "Yang Maha Lembut", English: "The Subtle One", Meaning: "Yang Maha Halus dalam mengetahui dan bertindak"},
		{Number: 32, Arabic: "الْخَبِيرُ", Transliteration: "Al-Khabir", Indonesian: "Yang Maha Mengenal", English: "The All-Aware", Meaning: "Yang mengetahui hakikat segala sesuatu secara mendalam"},
		{Number: 33, Arabic: "الْحَلِيمُ", Transliteration: "Al-Halim", Indonesian: "Yang Maha Penyantun", English: "The Forbearing", Meaning: "Yang Maha Sabar dan tidak tergesa-gesa dalam menghukum"},
		{Number: 34, Arabic: "الْعَظِيمُ", Transliteration: "Al-'Azhim", Indonesian: "Yang Maha Agung", English: "The Magnificent", Meaning: "Yang memiliki keagungan yang tidak terbatas"},
		{Number: 35, Arabic: "الْغَفُورُ", Transliteration: "Al-Ghafur", Indonesian: "Yang Maha Memaafkan", English: "The All-Forgiving", Meaning: "Yang menutup dosa-dosa hamba-Nya dengan ampunan-Nya"},
		{Number: 36, Arabic: "الشَّكُورُ", Transliteration: "Asy-Syakur", Indonesian: "Yang Maha Mensyukuri", English: "The Most Appreciative", Meaning: "Yang membalas amal-amal kecil dengan pahala yang besar"},
		{Number: 37, Arabic: "الْعَلِيُّ", Transliteration: "Al-'Ali", Indonesian: "Yang Maha Tinggi", English: "The Most High", Meaning: "Yang Maha Tinggi di atas segala makhluk-Nya"},
		{Number: 38, Arabic: "الْكَبِيرُ", Transliteration: "Al-Kabir", Indonesian: "Yang Maha Besar", English: "The Most Great", Meaning: "Yang memiliki kebesaran dalam zat dan sifat-Nya"},
		{Number: 39, Arabic: "الْحَفِيظُ", Transliteration: "Al-Hafizh", Indonesian: "Yang Maha Memelihara", English: "The Preserver", Meaning: "Yang memelihara segala sesuatu dan tidak lalai"},
		{Number: 40, Arabic: "الْمُقِيتُ", Transliteration: "Al-Muqit", Indonesian: "Yang Maha Pemberi Kecukupan", English: "The Nourisher", Meaning: "Yang memberikan makanan dan kecukupan kepada setiap makhluk"},
		{Number: 41, Arabic: "الْحَسِيبُ", Transliteration: "Al-Hasib", Indonesian: "Yang Maha Membuat Perhitungan", English: "The Reckoner", Meaning: "Yang mencukupi dan menghitung amal perbuatan hamba-Nya"},
		{Number: 42, Arabic: "الْجَلِيلُ", Transliteration: "Al-Jalil", Indonesian: "Yang Maha Luhur", English: "The Majestic", Meaning: "Yang memiliki keluhuran dan keagungan yang sempurna"},
		{Number: 43, Arabic: "الْكَرِيمُ", Transliteration: "Al-Karim", Indonesian: "Yang Maha Mulia", English: "The Most Generous", Meaning: "Yang Maha Dermawan dan mulia dalam memberi"},
		{Number: 44, Arabic: "الرَّقِيبُ", Transliteration: "Ar-Raqib", Indonesian: "Yang Maha Mengawasi", English: "The Watchful", Meaning: "Yang mengawasi setiap gerak dan diam makhluk-Nya"},
		{Number: 45, Arabic: "الْمُجِيبُ", Transliteration: "Al-Mujib", Indonesian: "Yang Maha Mengabulkan", English: "The Responsive", Meaning: "Yang mengabulkan doa dan permintaan hamba-Nya"},
		{Number: 46, Arabic: "الْوَاسِعُ", Transliteration: "Al-Wasi'", Indonesian: "Yang Maha Luas", English: "The All-Encompassing", Meaning: "Yang Maha Luas ilmu, rahmat, dan kekuasaan-Nya"},
		{Number: 47, Arabic: "الْحَكِيمُ", Transliteration: "Al-Hakim", Indonesian: "Yang Maha Bijaksana", English: "The Wise", Meaning: "Yang menempatkan segala sesuatu pada tempat yang tepat"},
		{Number: 48, Arabic: "الْوَدُودُ", Transliteration: "Al-Wadud", Indonesian: "Yang Maha Mencintai", English: "The Loving", Meaning: "Yang mencintai orang-orang beriman dan dicintai oleh mereka"},
		{Number: 49, Arabic: "الْمَجِيدُ", Transliteration: "Al-Majid", Indonesian: "Yang Maha Mulia", English: "The Most Glorious", Meaning: "Yang memiliki kemuliaan yang sempurna dan keagungan yang tinggi"},
		{Number: 50, Arabic: "الْبَاعِثُ", Transliteration: "Al-Ba'its", Indonesian: "Yang Maha Membangkitkan", English: "The Resurrector", Meaning: "Yang akan membangkitkan seluruh makhluk pada hari kiamat"},
		{Number: 51, Arabic: "الشَّهِيدُ", Transliteration: "Asy-Syahid", Indonesian: "Yang Maha Menyaksikan", English: "The Witness", Meaning: "Yang menyaksikan segala sesuatu yang terjadi"},
		{Number: 52, Arabic: "الْحَقُّ", Transliteration: "Al-Haqq", Indonesian: "Yang Maha Benar", English: "The Truth", Meaning: "Yang wujud-Nya pasti dan benar, tidak ada yang lebih benar dari-Nya"},
		{Number: 53, Arabic: "الْوَكِيلُ", Transliteration: "Al-Wakil", Indonesian: "Yang Maha Memelihara", English: "The Trustee", Meaning: "Yang memelihara dan mengurus urusan hamba-Nya yang bertawakal"},
		{Number: 54, Arabic: "الْقَوِيُّ", Transliteration: "Al-Qawi", Indonesian: "Yang Maha Kuat", English: "The Most Strong", Meaning: "Yang memiliki kekuatan sempurna yang tidak dapat dikalahkan"},
		{Number: 55, Arabic: "الْمَتِينُ", Transliteration: "Al-Matin", Indonesian: "Yang Maha Kokoh", English: "The Firm", Meaning: "Yang memiliki kekuatan yang sangat kokoh dan tidak pernah lemah"},
		{Number: 56, Arabic: "الْوَلِيُّ", Transliteration: "Al-Wali", Indonesian: "Yang Maha Melindungi", English: "The Protecting Friend", Meaning: "Yang menjadi wali dan pelindung orang-orang beriman"},
		{Number: 57, Arabic: "الْحَمِيدُ", Transliteration: "Al-Hamid", Indonesian: "Yang Maha Terpuji", English: "The Praiseworthy", Meaning: "Yang berhak mendapatkan segala pujian dan sanjungan"},
		{Number: 58, Arabic: "الْمُحْصِي", Transliteration: "Al-Muhshi", Indonesian: "Yang Maha Menghitung", English: "The Appraiser", Meaning: "Yang menghitung dan mengetahui semua hal dengan terperinci"},
		{Number: 59, Arabic: "الْمُبْدِئُ", Transliteration: "Al-Mubdi'", Indonesian: "Yang Maha Memulai", English: "The Originator", Meaning: "Yang menciptakan makhluk pertama kali tanpa contoh sebelumnya"},
		{Number: 60, Arabic: "الْمُعِيدُ", Transliteration: "Al-Mu'id", Indonesian: "Yang Maha Mengembalikan Kehidupan", English: "The Restorer", Meaning: "Yang akan mengembalikan makhluk setelah kematian"},
		{Number: 61, Arabic: "الْمُحْيِي", Transliteration: "Al-Muhyi", Indonesian: "Yang Maha Menghidupkan", English: "The Giver of Life", Meaning: "Yang memberikan kehidupan kepada siapa yang dikehendaki"},
		{Number: 62, Arabic: "الْمُمِيتُ", Transliteration: "Al-Mumit", Indonesian: "Yang Maha Mematikan", English: "The Taker of Life", Meaning: "Yang mematikan makhluk sesuai dengan kehendak dan hikmah-Nya"},
		{Number: 63, Arabic: "الْحَيُّ", Transliteration: "Al-Hayy", Indonesian: "Yang Maha Hidup", English: "The Ever-Living", Meaning: "Yang hidup kekal abadi, tidak terkena kematian"},
		{Number: 64, Arabic: "الْقَيُّومُ", Transliteration: "Al-Qayyum", Indonesian: "Yang Maha Berdiri Sendiri", English: "The Self-Subsisting", Meaning: "Yang berdiri sendiri dan menopang segala sesuatu"},
		{Number: 65, Arabic: "الْوَاجِدُ", Transliteration: "Al-Wajid", Indonesian: "Yang Maha Menemukan", English: "The Perceiver", Meaning: "Yang Maha Kaya dan tidak kekurangan apapun"},
		{Number: 66, Arabic: "الْمَاجِدُ", Transliteration: "Al-Majid", Indonesian: "Yang Maha Mulia", English: "The Noble", Meaning: "Yang memiliki kemuliaan dalam perbuatan-Nya"},
		{Number: 67, Arabic: "الْوَاحِدُ", Transliteration: "Al-Wahid", Indonesian: "Yang Maha Esa", English: "The One", Meaning: "Yang Maha Esa dalam zat, sifat, dan perbuatan-Nya"},
		{Number: 68, Arabic: "الْأَحَدُ", Transliteration: "Al-Ahad", Indonesian: "Yang Maha Tunggal", English: "The Unique", Meaning: "Yang tunggal tidak ada yang menyerupai-Nya"},
		{Number: 69, Arabic: "الصَّمَدُ", Transliteration: "As-Samad", Indonesian: "Yang Maha Dibutuhkan", English: "The Eternal", Meaning: "Yang menjadi tujuan semua kebutuhan dan tidak membutuhkan apapun"},
		{Number: 70, Arabic: "الْقَادِرُ", Transliteration: "Al-Qadir", Indonesian: "Yang Maha Menentukan", English: "The Capable", Meaning: "Yang berkuasa atas segala sesuatu tanpa ada hambatan"},
		{Number: 71, Arabic: "الْمُقْتَدِرُ", Transliteration: "Al-Muqtadir", Indonesian: "Yang Maha Berkuasa", English: "The Powerful", Meaning: "Yang memiliki kekuasaan penuh atas segala sesuatu"},
		{Number: 72, Arabic: "الْمُقَدِّمُ", Transliteration: "Al-Muqaddim", Indonesian: "Yang Maha Mendahulukan", English: "The Expediter", Meaning: "Yang mendahulukan siapa yang dikehendaki sesuai hikmah-Nya"},
		{Number: 73, Arabic: "الْمُؤَخِّرُ", Transliteration: "Al-Mu'akhkhir", Indonesian: "Yang Maha Mengakhirkan", English: "The Delayer", Meaning: "Yang mengakhirkan siapa yang dikehendaki sesuai hikmah-Nya"},
		{Number: 74, Arabic: "الْأَوَّلُ", Transliteration: "Al-Awwal", Indonesian: "Yang Maha Awal", English: "The First", Meaning: "Yang ada sebelum segala sesuatu ada"},
		{Number: 75, Arabic: "الْآخِرُ", Transliteration: "Al-Akhir", Indonesian: "Yang Maha Akhir", English: "The Last", Meaning: "Yang tetap ada setelah segala sesuatu tiada"},
		{Number: 76, Arabic: "الظَّاهِرُ", Transliteration: "Az-Zhahir", Indonesian: "Yang Maha Nyata", English: "The Manifest", Meaning: "Yang jelas dan nyata keberadaan-Nya melalui tanda-tanda kekuasaan-Nya"},
		{Number: 77, Arabic: "الْبَاطِنُ", Transliteration: "Al-Bathin", Indonesian: "Yang Maha Tersembunyi", English: "The Hidden", Meaning: "Yang tersembunyi dari pandangan makhluk, tidak terjangkau oleh indera"},
		{Number: 78, Arabic: "الْوَالِي", Transliteration: "Al-Wali", Indonesian: "Yang Maha Memerintah", English: "The Governor", Meaning: "Yang mengatur dan memerintah seluruh urusan alam semesta"},
		{Number: 79, Arabic: "الْمُتَعَالِي", Transliteration: "Al-Muta'ali", Indonesian: "Yang Maha Tinggi", English: "The Self Exalted", Meaning: "Yang Maha Tinggi di atas segala sifat kekurangan"},
		{Number: 80, Arabic: "الْبَرُّ", Transliteration: "Al-Barr", Indonesian: "Yang Maha Dermawan", English: "The Source of All Good", Meaning: "Yang Maha Baik dan berbuat kebaikan kepada hamba-Nya"},
		{Number: 81, Arabic: "التَّوَّابُ", Transliteration: "At-Tawwab", Indonesian: "Yang Maha Penerima Tobat", English: "The Ever-Returning", Meaning: "Yang menerima tobat hamba-Nya berulang kali dengan penuh kasih"},
		{Number: 82, Arabic: "الْمُنْتَقِمُ", Transliteration: "Al-Muntaqim", Indonesian: "Yang Maha Pemberi Hukuman", English: "The Avenger", Meaning: "Yang memberikan hukuman setimpal kepada orang yang zalim"},
		{Number: 83, Arabic: "الْعَفُوُّ", Transliteration: "Al-'Afuw", Indonesian: "Yang Maha Pemaaf", English: "The Pardoner", Meaning: "Yang menghapus dosa tanpa meninggalkan bekas"},
		{Number: 84, Arabic: "الرَّؤُوفُ", Transliteration: "Ar-Ra'uf", Indonesian: "Yang Maha Pengasih", English: "The Compassionate", Meaning: "Yang memiliki kasih sayang yang sangat lembut kepada hamba-Nya"},
		{Number: 85, Arabic: "مَالِكُ الْمُلْكِ", Transliteration: "Malikal Mulk", Indonesian: "Yang Maha Memiliki Kerajaan", English: "The Owner of All", Meaning: "Yang memiliki kerajaan secara mutlak dan memberikannya kepada siapa yang dikehendaki"},
		{Number: 86, Arabic: "ذُو الْجَلَالِ وَالْإِكْرَامِ", Transliteration: "Dzul Jalali wal Ikram", Indonesian: "Yang Maha Memiliki Kebesaran dan Kemuliaan", English: "The Lord of Majesty", Meaning: "Yang memiliki keagungan dan kemuliaan yang sempurna"},
		{Number: 87, Arabic: "الْمُقْسِطُ", Transliteration: "Al-Muqsith", Indonesian: "Yang Maha Adil", English: "The Equitable One", Meaning: "Yang berlaku adil dalam setiap keputusan-Nya"},
		{Number: 88, Arabic: "الْجَامِعُ", Transliteration: "Al-Jami'", Indonesian: "Yang Maha Mengumpulkan", English: "The Gatherer", Meaning: "Yang mengumpulkan makhluk pada hari kiamat"},
		{Number: 89, Arabic: "الْغَنِيُّ", Transliteration: "Al-Ghani", Indonesian: "Yang Maha Kaya", English: "The Self-Sufficient", Meaning: "Yang tidak membutuhkan apapun dari makhluk-Nya"},
		{Number: 90, Arabic: "الْمُغْنِي", Transliteration: "Al-Mughni", Indonesian: "Yang Maha Memberikan Kekayaan", English: "The Enricher", Meaning: "Yang memberikan kekayaan kepada siapa yang dikehendaki"},
		{Number: 91, Arabic: "الْمَانِعُ", Transliteration: "Al-Mani'", Indonesian: "Yang Maha Mencegah", English: "The Preventer", Meaning: "Yang mencegah sesuatu sesuai dengan hikmah dan keadilan-Nya"},
		{Number: 92, Arabic: "الضَّارُّ", Transliteration: "Ad-Dharr", Indonesian: "Yang Maha Pemberi Derita", English: "The Distresser", Meaning: "Yang memberikan mudarat kepada siapa yang dikehendaki sebagai ujian"},
		{Number: 93, Arabic: "النَّافِعُ", Transliteration: "An-Nafi'", Indonesian: "Yang Maha Memberi Manfaat", English: "The Propitious", Meaning: "Yang memberikan manfaat kepada siapa yang dikehendaki"},
		{Number: 94, Arabic: "النُّورُ", Transliteration: "An-Nur", Indonesian: "Yang Maha Bercahaya", English: "The Light", Meaning: "Yang menerangi langit, bumi, dan hati orang-orang beriman"},
		{Number: 95, Arabic: "الْهَادِي", Transliteration: "Al-Hadi", Indonesian: "Yang Maha Pemberi Petunjuk", English: "The Guide", Meaning: "Yang memberikan petunjuk kepada siapa yang dikehendaki"},
		{Number: 96, Arabic: "الْبَدِيعُ", Transliteration: "Al-Badi'", Indonesian: "Yang Maha Pencipta yang Baru", English: "The Originator", Meaning: "Yang menciptakan sesuatu yang baru tanpa ada contoh sebelumnya"},
		{Number: 97, Arabic: "الْبَاقِي", Transliteration: "Al-Baqi", Indonesian: "Yang Maha Kekal", English: "The Everlasting", Meaning: "Yang kekal abadi tanpa permulaan dan tanpa akhir"},
		{Number: 98, Arabic: "الْوَارِثُ", Transliteration: "Al-Warits", Indonesian: "Yang Maha Mewarisi", English: "The Inheritor", Meaning: "Yang mewarisi segala sesuatu setelah semua makhluk musnah"},
		{Number: 99, Arabic: "الرَّشِيدُ", Transliteration: "Ar-Rasyid", Indonesian: "Yang Maha Pandai", English: "The Guide to the Right Path", Meaning: "Yang membimbing makhluk-Nya ke jalan yang lurus dan benar"},
	}
}

func seedAmalanItems() []model.AmalanItem {
	return []model.AmalanItem{
		{Name: "Sholat Tahajud", Description: "Sholat sunnah malam minimal 2 rakaat", Category: model.AmalanSholat},
		{Name: "Sholat Dhuha", Description: "Sholat sunnah pagi minimal 2 rakaat", Category: model.AmalanSholat},
		{Name: "Sholat Rawatib", Description: "Sholat sunnah sebelum/sesudah sholat fardhu", Category: model.AmalanSholat},
		{Name: "Puasa Senin", Description: "Puasa sunnah hari Senin", Category: model.AmalanPuasa},
		{Name: "Puasa Kamis", Description: "Puasa sunnah hari Kamis", Category: model.AmalanPuasa},
		{Name: "Puasa Ayyamul Bidh", Description: "Puasa tanggal 13, 14, 15 bulan Hijriah", Category: model.AmalanPuasa},
		{Name: "Dzikir Pagi", Description: "Baca dzikir pagi setelah subuh", Category: model.AmalanDzikir},
		{Name: "Dzikir Petang", Description: "Baca dzikir petang setelah ashar", Category: model.AmalanDzikir},
		{Name: "Istighfar 100x", Description: "Membaca istighfar minimal 100 kali", Category: model.AmalanDzikir},
		{Name: "Sholawat 100x", Description: "Membaca sholawat minimal 100 kali", Category: model.AmalanDzikir},
		{Name: "Sedekah Harian", Description: "Bersedekah setiap hari walau sedikit", Category: model.AmalanSedekah},
		{Name: "Tilawah Al-Quran", Description: "Membaca Al-Quran minimal 1 halaman", Category: model.AmalanLainnya},
		{Name: "Baca Hadith", Description: "Membaca minimal 1 hadith beserta maknanya", Category: model.AmalanLainnya},
	}
}

func seedSholatGuide() []model.SholatGuide {
	return []model.SholatGuide{
		{Step: 1, Title: "Niat", Arabic: "", Transliteration: "", TranslationText: "Niat di dalam hati saat memulai sholat", Description: "Niat tempatnya di dalam hati saat takbiratul ihram. Tidak ada lafaz niat khusus yang diwajibkan dari Nabi ﷺ.", Source: "HR. Bukhari No. 1; HR. Muslim No. 1907; Al-Mughni, Ibn Qudamah", Notes: "Ulama salaf dan fuqaha mu'tabar menjelaskan niat sebagai amalan hati; pelafalan niat bukan bagian dari rukun sholat."},
		{Step: 2, Title: "Takbiratul Ihram", Arabic: "اللَّهُ أَكْبَرُ", Transliteration: "Allahu Akbar", TranslationText: "Allah Maha Besar", Description: "Mengangkat kedua tangan sejajar telinga atau bahu sambil mengucapkan takbir.", Source: "HR. Bukhari No. 735; HR. Muslim No. 390; Shahih", Notes: "Takbiratul ihram menjadi pembuka sholat dan mengharamkan hal-hal di luar sholat."},
		{Step: 3, Title: "Doa Iftitah", Arabic: "اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ", Transliteration: "Allahumma baa'id baynii wa bayna khathaayaaya", TranslationText: "Ya Allah, jauhkanlah antara aku dan kesalahan-kesalahanku", Description: "Dibaca setelah takbiratul ihram, sebelum membaca Al-Fatihah.", Source: "HR. Bukhari No. 744; HR. Muslim No. 598; Shahih", Notes: "Doa iftitah dibaca dengan suara pelan setelah takbiratul ihram."},
		{Step: 4, Title: "Membaca Al-Fatihah", Arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ...", Transliteration: "Bismillahir rahmaanir rahiim. Alhamdu lillaahi rabbil 'aalamiin...", TranslationText: "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang. Segala puji bagi Allah Rabb semesta alam...", Description: "Wajib dibaca di setiap rakaat. Diakhiri dengan amin.", Source: "HR. Bukhari No. 756; HR. Muslim No. 394; Shahih", Notes: "Al-Fatihah adalah rukun yang tidak boleh ditinggalkan."},
		{Step: 5, Title: "Membaca Surah/Ayat", Arabic: "", Transliteration: "", TranslationText: "Membaca surah atau beberapa ayat Al-Quran setelah Al-Fatihah", Description: "Dilakukan pada rakaat pertama dan kedua (sunnah).", Source: "HR. Bukhari No. 776; HR. Muslim No. 452; Shahih", Notes: "Pada sholat wajib, bacaan surah setelah Al-Fatihah disunnahkan pada dua rakaat pertama."},
		{Step: 6, Title: "Rukuk", Arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ", Transliteration: "Subhaana rabbiyal 'azhiim", TranslationText: "Maha Suci Tuhanku Yang Maha Agung", Description: "Membungkuk hingga punggung lurus sejajar. Dibaca minimal 3 kali.", Source: "HR. Muslim No. 772; HR. Abu Dawud No. 869; Shahih", Notes: "Tasbih rukuk dibaca ketika posisi rukuk dengan thuma'ninah."},
		{Step: 7, Title: "I'tidal", Arabic: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ. رَبَّنَا وَلَكَ الْحَمْدُ", Transliteration: "Sami'allaahu liman hamidah. Rabbanaa wa lakal hamd", TranslationText: "Allah mendengar orang yang memuji-Nya. Rabb kami, hanya bagi-Mu segala puji.", Description: "Berdiri tegak kembali setelah rukuk.", Source: "HR. Bukhari No. 796; HR. Muslim No. 392; Shahih", Notes: "Makmum cukup membaca 'Rabbana wa lakal hamd' setelah imam mengucapkan 'Sami'Allahu liman hamidah'."},
		{Step: 8, Title: "Sujud Pertama", Arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى", Transliteration: "Subhaana rabbiyal a'laa", TranslationText: "Maha Suci Tuhanku Yang Maha Tinggi", Description: "Sujud dengan 7 anggota badan menyentuh lantai. Dibaca minimal 3 kali.", Source: "HR. Muslim No. 771; HR. Abu Dawud No. 875; Shahih", Notes: "Tasbih sujud dibaca ketika sujud dengan tenang."},
		{Step: 9, Title: "Duduk di antara Dua Sujud", Arabic: "رَبِّ اغْفِرْ لِي وَارْحَمْنِي", Transliteration: "Rabbighfirlii warhamni", TranslationText: "Ya Tuhanku, ampunilah aku dan rahmatilah aku", Description: "Duduk iftirasy di antara dua sujud.", Source: "HR. Abu Dawud No. 850; HR. Tirmidzi No. 284; HR. Ibnu Majah No. 898; Shahih", Notes: "Doa di antara dua sujud bisa dibaca dengan beberapa lafaz yang sahih; ini salah satu yang masyhur."},
		{Step: 10, Title: "Sujud Kedua", Arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى", Transliteration: "Subhaana rabbiyal a'laa", TranslationText: "Maha Suci Tuhanku Yang Maha Tinggi", Description: "Sujud kedua sama seperti sujud pertama.", Source: "HR. Muslim No. 771; Shahih", Notes: "Gerakan dan bacaan sujud kedua sama seperti sujud pertama."},
		{Step: 11, Title: "Tasyahhud Akhir", Arabic: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ...", Transliteration: "At-tahiyyaatu lillaahi wash-shalawaatu wat-thayyibaat...", TranslationText: "Segala penghormatan, sholat, dan kebaikan hanya bagi Allah...", Description: "Dibaca pada rakaat terakhir dalam posisi duduk tawarruk.", Source: "HR. Bukhari No. 831; HR. Muslim No. 402; Shahih", Notes: "Tasyahhud diajarkan langsung oleh Nabi ﷺ kepada Ibn Mas'ud."},
		{Step: 12, Title: "Salam", Arabic: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ", Transliteration: "As-salaamu 'alaikum wa rahmatullaah", TranslationText: "Semoga keselamatan dan rahmat Allah tercurah atas kalian", Description: "Menoleh ke kanan lalu ke kiri untuk mengakhiri sholat.", Source: "HR. Abu Dawud No. 975; HR. Ibnu Majah No. 275; Shahih", Notes: "Salam adalah penutup sholat."},
	}
}

func seedFiqhCategories() []model.FiqhCategory {
	return []model.FiqhCategory{
		{Name: "Thaharah", Slug: "thaharah", Description: "Hukum-hukum bersuci: wudhu, mandi wajib, tayammum, najis"},
		{Name: "Sholat", Slug: "sholat", Description: "Hukum-hukum sholat: syarat, rukun, hal yang membatalkan"},
		{Name: "Puasa", Slug: "puasa", Description: "Hukum-hukum puasa: syarat, rukun, yang membatalkan, fidyah"},
		{Name: "Zakat", Slug: "zakat", Description: "Hukum-hukum zakat: nisab, haul, jenis harta, mustahiq"},
		{Name: "Haji & Umrah", Slug: "haji-umrah", Description: "Manasik haji dan umrah, syarat, rukun, wajib, dam"},
		{Name: "Muamalah", Slug: "muamalah", Description: "Hukum jual beli, utang piutang, sewa, gadai dalam Islam"},
		{Name: "Nikah", Slug: "nikah", Description: "Hukum pernikahan: syarat, rukun, mahar, hak dan kewajiban"},
		{Name: "Jenazah", Slug: "jenazah", Description: "Hukum mengurus jenazah: memandikan, mengkafani, mensholatkan, menguburkan"},
	}
}

func seedFiqhItems() []model.FiqhItem {
	return []model.FiqhItem{}
}

func seedTahlilCollections() []model.TahlilCollection {
	return []model.TahlilCollection{
		{Type: model.TahlilTypeYasin, Title: "Surah Yasin", Description: "Surah ke-36 dalam Al-Quran, sering dibaca dalam majelis tahlil"},
		{Type: model.TahlilTypeTahlil, Title: "Bacaan Tahlil Lengkap", Description: "Rangkaian bacaan tahlil: Al-Fatihah, Al-Ikhlas, Al-Falaq, An-Nas, Al-Baqarah 1-5, ayat kursi, tasbih, tahmid, tahlil, sholawat, dan doa"},
		{Type: model.TahlilTypeDoaArwah, Title: "Doa Arwah", Description: "Doa untuk orang yang telah meninggal dunia"},
	}
}

func seedTahlilItems() []model.TahlilItem {
	return []model.TahlilItem{}
}

func seedDzikir() []model.Dzikir {
	return []model.Dzikir{
		// Dzikir Pagi
		{Category: model.DzikirPagi, Title: "Ayat Kursi", Arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...", Transliteration: "Allahu laa ilaaha illaa huwal hayyul qayyuum...", TranslationText: "Allah, tidak ada ilah melainkan Dia, Yang Maha Hidup lagi terus-menerus mengurus (makhluk-Nya)...", Count: 1, Source: "QS. Al-Baqarah: 255"},
		{Category: model.DzikirPagi, Title: "Tasbih Pagi", Arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", Transliteration: "Subhaanallaahi wa bihamdih", TranslationText: "Maha Suci Allah dan segala puji bagi-Nya", Count: 100, Fadhilah: "Dosa-dosanya diampuni walaupun sebanyak buih di lautan", Source: "HR. Bukhari No. 6405; HR. Muslim No. 2691; Shahih"},
		{Category: model.DzikirPagi, Title: "Dzikir Pagi (Sayyidul Istighfar)", Arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ", Transliteration: "Allahumma anta rabbii laa ilaaha illaa anta, khalaqtanii wa ana 'abduka", TranslationText: "Ya Allah, Engkau adalah Rabbku, tidak ada ilah selain Engkau. Engkau yang menciptakanku dan aku adalah hamba-Mu", Count: 1, Fadhilah: "Jika dibaca pagi hari dengan yakin lalu meninggal, ia masuk surga", Source: "HR. Bukhari No. 6306; Shahih"},
		// Dzikir Petang
		{Category: model.DzikirPetang, Title: "Tasbih Petang", Arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", Transliteration: "Subhaanallaahi wa bihamdih", TranslationText: "Maha Suci Allah dan segala puji bagi-Nya", Count: 100, Source: "HR. Bukhari No. 6405; HR. Muslim No. 2691; Shahih"},
		{Category: model.DzikirPetang, Title: "Doa Perlindungan Petang", Arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", Transliteration: "A'uudzu bikalimaatillaahit taammaati min syarri maa khalaq", TranslationText: "Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan makhluk yang Dia ciptakan", Count: 3, Fadhilah: "Tidak ada racun, binatang berbisa, atau pencuri yang membahayakannya", Source: "HR. Muslim No. 2709; HR. Tirmidzi No. 3604; Shahih"},
		// Dzikir Setelah Sholat
		{Category: model.DzikirSetelahSholat, Title: "Tasbih Tahmid Takbir", Arabic: "سُبْحَانَ اللَّهِ — الْحَمْدُ لِلَّهِ — اللَّهُ أَكْبَرُ", Transliteration: "Subhaanallaah — Alhamdulillaah — Allaahu Akbar", TranslationText: "Maha Suci Allah — Segala puji bagi Allah — Allah Maha Besar", Count: 33, Source: "HR. Muslim No. 597; Shahih"},
		{Category: model.DzikirSetelahSholat, Title: "Istighfar Setelah Sholat", Arabic: "أَسْتَغْفِرُ اللَّهَ", Transliteration: "Astaghfirullah", TranslationText: "Aku memohon ampun kepada Allah", Count: 3, Source: "HR. Muslim No. 591; Shahih"},
		// Dzikir Tidur
		{Category: model.DzikirTidur, Title: "Tasbih Sebelum Tidur", Arabic: "سُبْحَانَ اللَّهِ — الْحَمْدُ لِلَّهِ — اللَّهُ أَكْبَرُ", Transliteration: "Subhaanallaah — Alhamdulillaah — Allaahu Akbar", TranslationText: "Maha Suci Allah — Segala puji bagi Allah — Allah Maha Besar", Count: 33, Fadhilah: "Lebih baik dari seorang pembantu", Source: "HR. Bukhari No. 3113; HR. Muslim No. 2727; Shahih"},
		{Category: model.DzikirTidur, Title: "Al-Ikhlas, Al-Falaq, An-Nas sebelum tidur", Arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ... قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ... قُلْ أَعُوذُ بِرَبِّ النَّاسِ...", Transliteration: "Qul huwallahu ahad... Qul a'uudzu birabbil falaq... Qul a'uudzu birabbin naas...", TranslationText: "Surat Al-Ikhlas, Al-Falaq, dan An-Nas", Count: 3, Fadhilah: "Cukup dari segala sesuatu", Source: "HR. Bukhari No. 5017; HR. Abu Dawud No. 5056; Shahih"},
		// Dzikir Safar
		{Category: model.DzikirSafar, Title: "Doa Naik Kendaraan", Arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ", Transliteration: "Subhaanal ladzii sakhkhara lanaa haadzaa wa maa kunnaa lahu muqriniin, wa innaa ilaa rabbinaa lamunqalibuun", TranslationText: "Maha Suci Allah yang telah menundukkan ini bagi kami padahal kami sebelumnya tidak mampu menguasainya, dan sesungguhnya kami akan kembali kepada Rabb kami", Count: 1, Source: "HR. Muslim No. 1342; HR. Abu Dawud No. 2602; HR. Tirmidzi No. 3446; Shahih"},
		// Dzikir Umum
		{Category: model.DzikirUmum, Title: "Hauqalah", Arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", Transliteration: "Laa hawla wa laa quwwata illaa billaah", TranslationText: "Tidak ada daya dan kekuatan kecuali dengan (pertolongan) Allah", Count: 1, Fadhilah: "Salah satu perbendaharaan surga", Source: "HR. Bukhari No. 6384; HR. Muslim No. 2704; Shahih"},
		{Category: model.DzikirUmum, Title: "Basmalah", Arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", Transliteration: "Bismillahir rahmaanir rahiim", TranslationText: "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang", Count: 1, Source: "QS. Al-Fatihah: 1; QS. An-Naml: 30"},
		{Category: model.DzikirUmum, Title: "Istirja' (Inna lillahi)", Arabic: "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ", Transliteration: "Innaa lillaahi wa innaa ilaihi raaji'uun", TranslationText: "Sesungguhnya kami milik Allah dan kepada-Nya lah kami kembali", Count: 1, Source: "QS. Al-Baqarah: 156; HR. Muslim No. 918; Shahih"},

		// Wirid Hari Jumat
		{Category: model.DzikirUmum, Occasion: "jumat", Title: "Perbanyak Sholawat di Hari Jumat", Arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ", Transliteration: "Allahumma sholli 'alaa Muhammad wa 'alaa aali Muhammad", TranslationText: "Ya Allah, limpahkanlah sholawat kepada Muhammad dan kepada keluarga Muhammad", Count: 100, Fadhilah: "Nabi ﷺ bersabda: 'Perbanyaklah sholawat kepadaku pada malam dan hari Jumat.' (HR. Al-Baihaqi)", Source: "HR. Al-Baihaqi No. 3/249; Shahih (Al-Albani, Shahihul Jami' No. 1209)"},
		{Category: model.DzikirUmum, Occasion: "jumat", Title: "Doa Mustajab Akhir Ashar Jumat", Arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، عَلَيْكَ تَوَكَّلْتُ وَأَنْتَ رَبُّ الْعَرْشِ الْعَظِيمِ", Transliteration: "Allahumma anta rabbii laa ilaaha illaa anta, 'alaika tawakkaltu wa anta rabbul 'arsyil 'azhiim", TranslationText: "Ya Allah, Engkau adalah Rabbku, tidak ada ilah selain Engkau, kepada-Mu aku bertawakal dan Engkau adalah Rabb Arsy yang agung", Count: 1, Fadhilah: "Terdapat waktu mustajab di hari Jumat — pendapat kuat: setelah Ashar hingga Maghrib (HR. Abu Dawud)", Source: "HR. Abu Dawud; HR. Tirmidzi"},
		{Category: model.DzikirUmum, Occasion: "jumat", Title: "Membaca Surat Al-Kahfi di Hari Jumat", Arabic: "", Transliteration: "", TranslationText: "Membaca Surat Al-Kahfi (QS. 18) setiap hari Jumat — boleh di siang atau malam Jumat", Count: 1, Fadhilah: "Nabi ﷺ bersabda: 'Barangsiapa membaca Surat Al-Kahfi pada hari Jumat, maka ia akan mendapat cahaya di antara dua Jumat.' (HR. Al-Hakim; Shahih menurut Al-Albani)", Source: "HR. Al-Hakim No. 2/368; Shahihul Jami' No. 6470 (Al-Albani: Shahih)"},

		// Wirid Hari Arafah (9 Dzulhijjah)
		{Category: model.DzikirUmum, Occasion: "arafah", Title: "Doa Terbaik Hari Arafah", Arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", Transliteration: "Laa ilaaha illallah wahdahu laa syariika lah, lahul mulku wa lahul hamdu wa huwa 'alaa kulli syai'in qadiir", TranslationText: "Tidak ada ilah yang berhak disembah selain Allah semata, tiada sekutu bagi-Nya. Milik-Nya segala kerajaan dan pujian, dan Dia Maha Kuasa atas segala sesuatu", Count: 1, Fadhilah: "Nabi ﷺ bersabda: 'Doa terbaik adalah doa di hari Arafah.' (HR. Tirmidzi)", Source: "HR. Tirmidzi No. 3585; Hasan Shahih"},
		{Category: model.DzikirUmum, Occasion: "arafah", Title: "Takbir Hari Tasyrik (9-13 Dzulhijjah)", Arabic: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ", Transliteration: "Allahu akbar, allahu akbar, laa ilaaha illallah, wallahu akbar, allahu akbar, walillaahil hamd", TranslationText: "Allah Maha Besar, Allah Maha Besar, tidak ada ilah selain Allah, Allah Maha Besar, Allah Maha Besar, dan hanya bagi Allah segala pujian", Count: 1, Fadhilah: "Dianjurkan memperbanyak takbir dari fajar 9 Dzulhijjah hingga Ashar 13 Dzulhijjah (Hari Tasyrik terakhir)", Source: "HR. Ahmad; Ibnu Abi Syaibah; Atsar para Sahabat; Shahih"},

		// Wirid Lailatul Qadar
		{Category: model.DzikirUmum, Occasion: "lailatul_qadar", Title: "Doa Lailatul Qadar", Arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", Transliteration: "Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'annii", TranslationText: "Ya Allah, sesungguhnya Engkau Maha Pemaaf, mencintai maaf, maka maafkanlah aku", Count: 1, Fadhilah: "Aisyah ra. bertanya: 'Wahai Rasulullah, apa yang aku baca jika aku mendapati Lailatul Qadar?' Beliau menjawab: 'Baca doa ini.'", Source: "HR. Tirmidzi No. 3513; Shahih"},
		{Category: model.DzikirUmum, Occasion: "lailatul_qadar", Title: "Qiyamul Lail 10 Malam Terakhir Ramadan", Arabic: "", Transliteration: "", TranslationText: "Perbanyak sholat malam, tilawah Al-Quran, dzikir, dan doa pada 10 malam terakhir Ramadan. Nabi ﷺ lebih giat beribadah pada 10 malam terakhir dari malam-malam lainnya.", Count: 1, Fadhilah: "Nabi ﷺ bersabda: 'Carilah Lailatul Qadar pada malam-malam ganjil dari 10 terakhir Ramadan.' (HR. Bukhari)", Source: "HR. Bukhari No. 2017; HR. Muslim No. 1169"},

		// Wirid Ramadan
		{Category: model.DzikirUmum, Occasion: "ramadan", Title: "Doa Berbuka Puasa", Arabic: "اللَّهُمَّ لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ", Transliteration: "Allahumma laka shumtu wa bika aamantu wa 'alaika tawakkaltu wa 'alaa rizqika afthartu", TranslationText: "Ya Allah, untuk-Mu aku berpuasa, kepada-Mu aku beriman, kepada-Mu aku bertawakal, dan dengan rezeki-Mu aku berbuka", Count: 1, Source: "HR. Abu Dawud No. 2358; Hadith Hasan"},
		{Category: model.DzikirUmum, Occasion: "ramadan", Title: "Doa Menyambut Ramadan", Arabic: "اللَّهُمَّ بَارِكْ لَنَا فِي رَجَبَ وَشَعْبَانَ وَبَلِّغْنَا رَمَضَانَ", Transliteration: "Allahumma baarik lanaa fii rajabin wa sya'baana wa ballighnaa ramadhaan", TranslationText: "Ya Allah, berkahilah kami di bulan Rajab dan Sya'ban, dan sampaikan kami ke bulan Ramadan", Count: 1, Source: "HR. Ahmad No. 2346; dilemahkan sebagian ulama, namun maknanya baik"},
		{Category: model.DzikirUmum, Occasion: "ramadan", Title: "Niat Puasa Ramadan", Arabic: "نَوَيْتُ صَوْمَ غَدٍ عَنْ أَدَاءِ فَرْضِ شَهْرِ رَمَضَانَ هَذِهِ السَّنَةِ لِلَّهِ تَعَالَى", Transliteration: "Nawaitu shauma ghadin 'an adaa'i fardhi syahri ramadhana haadzihi as-sanati lillaahi ta'aalaa", TranslationText: "Aku berniat puasa esok hari untuk menunaikan kewajiban puasa bulan Ramadan tahun ini karena Allah Ta'ala", Count: 1, Source: "Kitab fiqh; niat adalah amalan hati"},

		// Wirid Idul Fitri
		{Category: model.DzikirUmum, Occasion: "iedul_fitri", Title: "Takbiran Idul Fitri", Arabic: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللَّهُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ", Transliteration: "Allahu akbar, allahu akbar, allahu akbar, laa ilaaha illallah, allahu akbar, allahu akbar, walillaahil hamd", TranslationText: "Allah Maha Besar (3x), tidak ada ilah selain Allah, Allah Maha Besar (2x), dan hanya bagi Allah segala pujian", Count: 1, Fadhilah: "Dianjurkan bertakbir sejak malam Idul Fitri hingga selesai sholat Id", Source: "QS. Al-Baqarah: 185; HR. Al-Baihaqi"},
		{Category: model.DzikirUmum, Occasion: "iedul_fitri", Title: "Ucapan Selamat Hari Raya", Arabic: "تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ", Transliteration: "Taqabbalallahu minnaa wa minkum", TranslationText: "Semoga Allah menerima (ibadah) dari kami dan dari kalian", Count: 1, Fadhilah: "Ucapan yang dicontohkan para sahabat saat bertemu di hari raya", Source: "HR. Ahmad; Ibnu Hajar, Fathul Bari"},

		// Wirid Idul Adha
		{Category: model.DzikirUmum, Occasion: "iedul_adha", Title: "Takbiran Idul Adha", Arabic: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللَّهُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ", Transliteration: "Allahu akbar, allahu akbar, allahu akbar, laa ilaaha illallah, allahu akbar, allahu akbar, walillaahil hamd", TranslationText: "Allah Maha Besar (3x), tidak ada ilah selain Allah, Allah Maha Besar (2x), dan hanya bagi Allah segala pujian", Count: 1, Fadhilah: "Dianjurkan bertakbir dari fajar 9 Dzulhijjah hingga Ashar 13 Dzulhijjah", Source: "QS. Al-Hajj: 28; HR. Al-Baihaqi"},
		{Category: model.DzikirUmum, Occasion: "iedul_adha", Title: "Doa Menyembelih Hewan Kurban", Arabic: "بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ، اللَّهُمَّ هَذَا مِنْكَ وَلَكَ، اللَّهُمَّ تَقَبَّلْ مِنِّي", Transliteration: "Bismillah, Allahu akbar, Allahumma haadzaa minka wa laka, Allahumma taqabbal minnii", TranslationText: "Dengan nama Allah, Allah Maha Besar. Ya Allah, ini dari-Mu dan untuk-Mu. Ya Allah, terimalah dariku", Count: 1, Source: "HR. Muslim No. 1966; Abu Dawud No. 2795"},
	}
}
