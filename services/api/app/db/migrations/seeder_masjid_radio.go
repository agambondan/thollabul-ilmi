package migrations

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func getMasjidData() []model.Masjid {
	return []model.Masjid{
		{Name: "Masjid Istiqlal", Description: "Masjid terbesar di Asia Tenggara, landmark nasional Indonesia", Address: "Jl. Taman Wijaya Kusuma, Ps. Baru, Sawah Besar, Kota Jakarta Pusat, DKI Jakarta 10710", District: "Sawah Besar", City: "Jakarta Pusat", Province: "DKI Jakarta", Latitude: -6.1704, Longitude: 106.8306, Phone: "021-3813294", Capacity: 200000, Facilities: "Ruang wudhu luas, perpustakaan, museum Islam, parking luas, akses disabilitas, AC", ImageURL: "", Website: "https://istiqlal.or.id", IsActive: true},
		{Name: "Masjid Cut Meutia", Description: "Masjid bersejarah dengan arsitektur peninggalan kolonial di Menteng", Address: "Jl. Cut Mutiah No.1, Kebon Sirih, Menteng, Kota Jakarta Pusat, DKI Jakarta 10350", District: "Menteng", City: "Jakarta Pusat", Province: "DKI Jakarta", Latitude: -6.1874, Longitude: 106.8331, Phone: "021-3103940", Capacity: 3000, Facilities: "Ruang sholat AC, area wudhu, perpustakaan, parkir", ImageURL: "", Website: "", IsActive: true},
		{Name: "Masjid Sunda Kelapa", Description: "Pusat dakwah dan kajian sunnah di Jakarta Pusat", Address: "Jl. Taman Sunda Kelapa No.16, Menteng, Kota Jakarta Pusat, DKI Jakarta 10310", District: "Menteng", City: "Jakarta Pusat", Province: "DKI Jakarta", Latitude: -6.1996, Longitude: 106.8329, Phone: "021-31934261", Capacity: 4000, Facilities: "Aula serbaguna, perpustakaan, klinik, parkir, kantin halal", ImageURL: "", Website: "https://masjidsundakelapa.id", IsActive: true},
		{Name: "Masjid Al-Falah Pejompongan", Description: "Masjid jami di Pejompongan", Address: "Jl. Pejompongan Raya No.1, Bendungan Hilir, Tanah Abang, Jakarta Pusat", District: "Tanah Abang", City: "Jakarta Pusat", Province: "DKI Jakarta", Latitude: -6.2081, Longitude: 106.8093, Phone: "021-5735123", Capacity: 2500, Facilities: "AC, area wudhu nyaman, parkir, ruang kajian", ImageURL: "", Website: "", IsActive: true},

		{Name: "Masjid Agung Al-Azhar", Description: "Pusat dakwah, pendidikan, dan kajian Islam terkemuka", Address: "Jl. Sisingamangaraja No.1, Selong, Kebayoran Baru, Kota Jakarta Selatan, DKI Jakarta 12110", District: "Kebayoran Baru", City: "Jakarta Selatan", Province: "DKI Jakarta", Latitude: -6.2351, Longitude: 106.7993, Phone: "021-72792929", Capacity: 15000, Facilities: "Pendidikan Islam, perpustakaan, aula, lapangan, parkir luas, ambulans", ImageURL: "", Website: "https://masjidalazhar.or.id", IsActive: true},
		{Name: "Masjid Pondok Indah", Description: "Masjid raya kawasan Pondok Indah dengan arsitektur modern megah", Address: "Jl. Ibadah No.1, Pondok Pinang, Kebayoran Lama, Kota Jakarta Selatan, DKI Jakarta 12310", District: "Kebayoran Lama", City: "Jakarta Selatan", Province: "DKI Jakarta", Latitude: -6.2694, Longitude: 106.7828, Phone: "021-7505122", Capacity: 5000, Facilities: "Full AC, lift, gedung pertemuan, perpustakaan, parkir luas basement", ImageURL: "", Website: "https://masjidpondokindah.org", IsActive: true},
		{Name: "Masjid Nurul Iman Blok M Square", Description: "Masjid rooftop populer di lantai 7 Blok M Square dengan miniatur Ka'bah", Address: "Rooftop Blok M Square Lt. 7, Jl. Melawai V, Melawai, Kebayoran Baru, Jakarta Selatan 12160", District: "Kebayoran Baru", City: "Jakarta Selatan", Province: "DKI Jakarta", Latitude: -6.2444, Longitude: 106.7981, Phone: "021-72802000", Capacity: 4000, Facilities: "Replika Ka'bah untuk manasik, view rooftop, AC, wudhu luas", ImageURL: "", Website: "", IsActive: true},
		{Name: "Masjid Al-Ikhlas Cipete", Description: "Masjid kajian sunnah aktif di Cipete Selatan", Address: "Jl. Cipete III No.3, Cipete Selatan, Cilandak, Kota Jakarta Selatan, DKI Jakarta 12410", District: "Cilandak", City: "Jakarta Selatan", Province: "DKI Jakarta", Latitude: -6.2789, Longitude: 106.8042, Phone: "021-7690123", Capacity: 2500, Facilities: "Kajian rutin, live stream, perpustakaan, parkir motor/mobil", ImageURL: "", Website: "", IsActive: true},
		{Name: "Masjid At-Taqwa Sriwijaya", Description: "Masjid di Kebayoran Baru dengan suasana asri dan tertib", Address: "Jl. Sriwijaya Raya No.10, Selong, Kebayoran Baru, Kota Jakarta Selatan, DKI Jakarta 12110", District: "Kebayoran Baru", City: "Jakarta Selatan", Province: "DKI Jakarta", Latitude: -6.2369, Longitude: 106.8058, Phone: "021-7261234", Capacity: 2000, Facilities: "AC, wudhu bersih, parkir, kelas tahsin", ImageURL: "", Website: "", IsActive: true},

		{Name: "Masjid Raya KH Hasyim Asy'ari", Description: "Masjid Raya Provinsi DKI Jakarta di Daan Mogot dengan arsitektur Betawi", Address: "Jl. Daan Mogot KM 14, Semanan, Kalideres, Kota Jakarta Barat, DKI Jakarta 11850", District: "Kalideres", City: "Jakarta Barat", Province: "DKI Jakarta", Latitude: -6.1554, Longitude: 106.7028, Phone: "021-54360123", Capacity: 12500, Facilities: "Plaza luas, ruang wudhu modern, aula, perpustakaan, taman luas", ImageURL: "", Website: "", IsActive: true},
		{Name: "Masjid Jami An-Nawier Pekojan", Description: "Salah satu masjid tertua di Jakarta (berdiri 1760 M) bernilai sejarah tinggi", Address: "Jl. Pekojan Raya No.70, Pekojan, Tambora, Kota Jakarta Barat, DKI Jakarta 11240", District: "Tambora", City: "Jakarta Barat", Province: "DKI Jakarta", Latitude: -6.1386, Longitude: 106.8078, Phone: "021-6901234", Capacity: 2000, Facilities: "Situs cagar budaya, perpustakaan kitab kuning, area wudhu tradisional", ImageURL: "", Website: "", IsActive: true},
		{Name: "Masjid Al-Muchlisin Grogol", Description: "Masjid di perempatan strategis Grogol", Address: "Jl. Dr. Muwardi I No.17, Grogol, Grogol Petamburan, Kota Jakarta Barat 11450", District: "Grogol Petamburan", City: "Jakarta Barat", Province: "DKI Jakarta", Latitude: -6.1668, Longitude: 106.7889, Phone: "021-5678910", Capacity: 3000, Facilities: "AC, aula pertemuan, parkir, sekolah Islam", ImageURL: "", Website: "", IsActive: true},

		{Name: "Masjid Agung At-Tin", Description: "Masjid megah di kawasan TMII dengan kubah khas anak panah", Address: "Jl. Taman Mini I No.3, Pinang Ranti, Makasar, Kota Jakarta Timur, DKI Jakarta 13560", District: "Makasar", City: "Jakarta Timur", Province: "DKI Jakarta", Latitude: -6.2991, Longitude: 106.8778, Phone: "021-87781602", Capacity: 25000, Facilities: "Ruang sholat utama luas, aula serbaguna, perpustakaan, parkir bus/mobil sangat luas", ImageURL: "", Website: "https://masjid-attin.com", IsActive: true},
		{Name: "Masjid Baitussalam Billy Moon", Description: "Masjid aktif kajian di Duren Sawit Jakarta Timur", Address: "Komplek Billy Moon, Pondok Kelapa, Duren Sawit, Kota Jakarta Timur 13450", District: "Duren Sawit", City: "Jakarta Timur", Province: "DKI Jakarta", Latitude: -6.2367, Longitude: 106.9242, Phone: "021-8645123", Capacity: 3000, Facilities: "Kajian sunnah, AC, ruang wudhu bersih, parkir", ImageURL: "", Website: "", IsActive: true},
		{Name: "Masjid Al-Azhar Rawamangun", Description: "Masjid cabang Al-Azhar di Jakarta Timur", Address: "Jl. Sunan Giri No.1, Rawamangun, Pulo Gadung, Kota Jakarta Timur 13220", District: "Pulo Gadung", City: "Jakarta Timur", Province: "DKI Jakarta", Latitude: -6.1925, Longitude: 106.8856, Phone: "021-47862525", Capacity: 4000, Facilities: "Pendidikan Al-Azhar, perpustakaan, aula, lapangan", ImageURL: "", Website: "https://masjidalazhar.or.id", IsActive: true},

		// Jakarta Utara
		{Name: "Masjid Jakarta Islamic Centre (JIC)", Description: "Pusat pengkajian dan pengembangan Islam di Koja Jakarta Utara", Address: "Jl. Kramat Jaya Raya, Tugu Utara, Koja, Kota Jakarta Utara, DKI Jakarta 14260", District: "Koja", City: "Jakarta Utara", Province: "DKI Jakarta", Latitude: -6.1264, Longitude: 106.9142, Phone: "021-44835355", Capacity: 20000, Facilities: "Pusat riset Islam, perpustakaan, wisma penginapan, aula pameran, parkir luas", ImageURL: "", Website: "https://islamic-center.or.id", IsActive: true},
		{Name: "Masjid Ramlie Musofa Danau Sunter", Description: "Masjid bergaya Taj Mahal dengan kaligrafi surat Al-Qari'ah 3 bahasa", Address: "Jl. Danau Sunter Selatan Blok I/10 No.12C, Sunter Agung, Tanjung Priok, Jakarta Utara 14350", District: "Tanjung Priok", City: "Jakarta Utara", Province: "DKI Jakarta", Latitude: -6.1417, Longitude: 106.8681, Phone: "021-65831234", Capacity: 3000, Facilities: "Lift, AC, wudhu ramah disabilitas, terjemahan 3 bahasa, view danau", ImageURL: "", Website: "", IsActive: true},
		{Name: "Masjid Al-Alam Marunda", Description: "Masjid tertua di pesisir utara Jakarta peninggalan era Fatahillah (1600-an)", Address: "Jl. Marunda Kelapa No.1, Marunda, Cilincing, Kota Jakarta Utara 14150", District: "Cilincing", City: "Jakarta Utara", Province: "DKI Jakarta", Latitude: -6.1031, Longitude: 106.9631, Phone: "021-44851234", Capacity: 1000, Facilities: "Situs bersejarah, sumur tawar alami, dekat pantai", ImageURL: "", Website: "", IsActive: true},
	}
}

func getRadioIslamicData() []model.RadioIslamic {
	return []model.RadioIslamic{
		// DKI Jakarta & Jabodetabek
		{
			Name:        "Radio Rodja 756 AM",
			Frequency:   "756 AM",
			City:        "Jakarta",
			Province:    "DKI Jakarta",
			StreamURL:   "https://live.radiorodja.com/;",
			Description: "Radio Menebar Cahaya Sunnah. Siaran kajian ilmiah Islam berlandaskan Al-Qur'an dan As-Sunnah pemahaman Salafush Shalih.",
			LogoURL:     "",
			Website:     "https://radiorodja.com",
			IsActive:    true,
			Tags:        "kajian,sunnah,salaf,ceramah,bahasa-arab,tanya-jawab",
		},
		{
			Name:        "Radio Silaturahim (Rasil) 720 AM",
			Frequency:   "720 AM",
			City:        "Jakarta",
			Province:    "DKI Jakarta",
			StreamURL:   "https://streaming.radiosilaturahim.com:8443/rasil",
			Description: "Untuk Islam yang Satu. Radio dakwah, berita Islam terkini, dialog kebangsaan, dan kesehatan.",
			LogoURL:     "",
			Website:     "https://radiosilaturahim.com",
			IsActive:    true,
			Tags:        "dakwah,berita,dialog,kesehatan,silaturahim",
		},
		{
			Name:        "Radio Muadz Jakarta & Kendari",
			Frequency:   "Streaming / Relay",
			City:        "Jakarta",
			Province:    "DKI Jakarta",
			StreamURL:   "https://stream.radiomuadz.com/live",
			Description: "Radio dakwah Ahlussunnah wal Jama'ah menyiarkan kajian fiqih, tafsir, aqidah, dan murottal Al-Qur'an 24 jam.",
			LogoURL:     "",
			Website:     "https://radiomuadz.com",
			IsActive:    true,
			Tags:        "murottal,kajian,aqidah,fiqih,sunnah",
		},
		{
			Name:        "Radio Tarbiyah Sunnah Bandung (1476 AM)",
			Frequency:   "1476 AM",
			City:        "Bandung",
			Province:    "Jawa Barat",
			StreamURL:   "https://radio.tarbiyahsunnah.com/stream",
			Description: "Radio kajian sunnah asuhan Ustadz Abu Haidar As-Sundawy, Ustadz Yazid Jawas, dan asatidzah lainnya.",
			LogoURL:     "",
			Website:     "https://tarbiyahsunnah.com",
			IsActive:    true,
			Tags:        "kajian,sunnah,tarbiyah,tazkiyatun-nufus",
		},
		{
			Name:        "Radio Muslim Jogja (1467 AM)",
			Frequency:   "1467 AM",
			City:        "Yogyakarta",
			Province:    "DI Yogyakarta",
			StreamURL:   "https://stream.radiomuslim.com/stream",
			Description: "Memurnikan Aqidah Menebarkan Sunnah. Radio dakwah komunitas mahasiswa dan masyarakat Jogja.",
			LogoURL:     "",
			Website:     "https://radiomuslim.com",
			IsActive:    true,
			Tags:        "mahasiswa,kajian,aqidah,sunnah,jogja",
		},
		{
			Name:        "Radio Suara Al-Iman Surabaya (846 AM)",
			Frequency:   "846 AM",
			City:        "Surabaya",
			Province:    "Jawa Timur",
			StreamURL:   "https://stream.suaraaliman.com/live",
			Description: "Sarana Menyapa Hati dengan Sunnah. Radio dakwah Jawa Timur berpusat di STDI Imam Syafi'i.",
			LogoURL:     "",
			Website:     "https://suaraaliman.com",
			IsActive:    true,
			Tags:        "kajian,surabaya,sunnah,fiqih",
		},
		{
			Name:        "Radio Fajri FM 99.3 FM (Bogor-Jakarta)",
			Frequency:   "99.3 FM",
			City:        "Bogor",
			Province:    "Jawa Barat",
			StreamURL:   "https://stream.fajrifm.com/live",
			Description: "Suara Kebangkitan Islam. Menjangkau wilayah Bogor, Depok, dan sebagian Jakarta.",
			LogoURL:     "",
			Website:     "https://fajrifm.com",
			IsActive:    true,
			Tags:        "dakwah,bogor,jakarta,keluarga-islami",
		},
		{
			Name:        "Radio Hang FM 106.0 FM (Batam-Kepri)",
			Frequency:   "106.0 FM",
			City:        "Batam",
			Province:    "Kepulauan Riau",
			StreamURL:   "https://stream.hangfm.id/live",
			Description: "Radio Sunnah tertua di Kepulauan Riau menjangkau Batam, Singapura, dan Johor Bahru Malaysia.",
			LogoURL:     "",
			Website:     "https://hangfm.id",
			IsActive:    true,
			Tags:        "sunnah,batam,singapura,serumpun",
		},
		{
			Name:        "Radio Kita FM 94.3 FM (Cirebon)",
			Frequency:   "94.3 FM",
			City:        "Cirebon",
			Province:    "Jawa Barat",
			StreamURL:   "https://stream.radiokitafm.com/live",
			Description: "Menebar Sunnah Membangun Umat di wilayah Ciayumajakuning.",
			LogoURL:     "",
			Website:     "https://radiokitafm.com",
			IsActive:    true,
			Tags:        "sunnah,cirebon,pantura",
		},
		{
			Name:        "Quran Stream Radio 24 Jam",
			Frequency:   "Digital Stream",
			City:        "Nasional",
			Province:    "Indonesia",
			StreamURL:   "https://stream.zeno.fm/f3wvbbqmdg8uv",
			Description: "Lantunan Murottal Al-Qur'an 30 Juz 24 jam nonstop dari para Qari Masyhur dunia.",
			LogoURL:     "",
			Website:     "",
			IsActive:    true,
			Tags:        "murottal,quran,tilawah,24jam,tanpa-jeda",
		},
	}
}

func seedMasjids() []model.Masjid {
	return getMasjidData()
}

func seedRadioIslamic() []model.RadioIslamic {
	return getRadioIslamicData()
}

// SeedMasjids seeds masjid data for Jakarta
func SeedMasjids(db *gorm.DB) {
	masjids := getMasjidData()
	for _, m := range masjids {
		_ = db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "name"}},
			DoUpdates: clause.AssignmentColumns([]string{"description", "address", "district", "city", "province", "latitude", "longitude", "phone", "capacity", "facilities", "website", "is_active"}),
		}).Create(&m).Error
	}
}

// SeedRadioIslamic seeds radio Islamic data for Jakarta
func SeedRadioIslamic(db *gorm.DB) {
	radios := getRadioIslamicData()
	for _, r := range radios {
		_ = db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "name"}},
			DoUpdates: clause.AssignmentColumns([]string{"frequency", "city", "province", "stream_url", "description", "website", "is_active", "tags"}),
		}).Create(&r).Error
	}
}
