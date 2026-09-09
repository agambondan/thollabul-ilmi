package migrations

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func getMasjidData() []model.Masjid {
	return []model.Masjid{
		{
			Name:        "Masjid Jami' Al-Barkah (Rodja)",
			Description: "Masjid utama sekaligus pusat Radio Rodja 756 AM. Siaran kajian ilmiah Islam berlandaskan Al-Qur'an dan As-Sunnah pemahaman Salafush Shalih.",
			Address:     "Jl. Raya Condet No.27, Batu Ampar, Kramat Jati, Kota Jakarta Timur, DKI Jakarta 13520",
			District:    "Kramat Jati",
			City:        "Jakarta Timur",
			Province:    "DKI Jakarta",
			Latitude:    -6.2704,
			Longitude:   106.8678,
			Phone:       "021-87781371",
			Capacity:    2500,
			Facilities:  "Kajian sunnah rutin, live streaming Rodja, perpustakaan kitab, ruang wudhu, parkir",
			ImageURL:    "",
			Website:     "https://radiorodja.com",
			IsActive:    true,
		},
		{
			Name:        "Masjid Nur-Salma",
			Description: "Masjid yayasan Nur-Salma yang diasuh Ustadz Dr. Erwandi Tarmizi, MA. Fokus kajian tauhid, jual-beli riba, dan hadits arbain.",
			Address:     "Jl. HR. Rasuna Said Kav. B1-3, Karet Kuningan, Setiabudi, Kota Jakarta Selatan, DKI Jakarta 12940",
			District:    "Setiabudi",
			City:        "Jakarta Selatan",
			Province:    "DKI Jakarta",
			Latitude:    -6.2180,
			Longitude:   106.8310,
			Phone:       "021-52901234",
			Capacity:    1500,
			Facilities:  "Kajian sunnah, perpustakaan kitab kuning, ruang wudhu, kelas tahsin & tahfizh",
			ImageURL:    "",
			Website:     "https://nursalma.or.id",
			IsActive:    true,
		},
		{
			Name:        "Masjid Nurim Blok M",
			Description: "Masjid di pusat Blok M, pengajian rutin ahlussunnah waljama'ah yang ramai dikunjungi karyawan & mahasiswa sekitar Kebayoran.",
			Address:     "Jl. Wolter Monginsidi No.71, Kebayoran Baru, Kota Jakarta Selatan, DKI Jakarta 12180",
			District:    "Kebayoran Baru",
			City:        "Jakarta Selatan",
			Province:    "DKI Jakarta",
			Latitude:    -6.2440,
			Longitude:   106.7995,
			Phone:       "021-7206123",
			Capacity:    1800,
			Facilities:  "Kajian sunnah pekanan, kelas bahasa Arab, wudhu & parkir",
			ImageURL:    "",
			Website:     "",
			IsActive:    true,
		},
		{
			Name:        "Masjid Sunda Kelapa",
			Description: "Pusat dakwah dan kajian sunnah di kawasan Menteng. Dipimpin Ustadz Dudi Muttaqien dan asatidzah salaf lainnya.",
			Address:     "Jl. Taman Sunda Kelapa No.16, Menteng, Kota Jakarta Pusat, DKI Jakarta 10310",
			District:    "Menteng",
			City:        "Jakarta Pusat",
			Province:    "DKI Jakarta",
			Latitude:    -6.1996,
			Longitude:   106.8329,
			Phone:       "021-31934261",
			Capacity:    4000,
			Facilities:  "Kajian rutin, perpustakaan, aula, klinik dhuafa, parkir",
			ImageURL:    "",
			Website:     "https://masjidsundakelapa.id",
			IsActive:    true,
		},
		{
			Name:        "Masjid Al-Ikhlas Cipete",
			Description: "Salah satu pusat kajian ilmiah dan tadabbur Qur'an teraktif di Cipete-Cilandak, salaf-affiliated.",
			Address:     "Jl. Cipete III No.3, Cipete Selatan, Cilandak, Kota Jakarta Selatan, DKI Jakarta 12410",
			District:    "Cilandak",
			City:        "Jakarta Selatan",
			Province:    "DKI Jakarta",
			Latitude:    -6.2789,
			Longitude:   106.8042,
			Phone:       "021-7690123",
			Capacity:    2500,
			Facilities:  "Kajian sunnah rutin, streaming YouTube/Audio, perpustakaan, parkir",
			ImageURL:    "",
			Website:     "",
			IsActive:    true,
		},
		{
			Name:        "Masjid Baitussalam Billy Moon",
			Description: "Masjid kajian sunnah tematik di kawasan Duren Sawit dengan pengajian keluarga dan pemuda aktif.",
			Address:     "Komplek Billy Moon, Pondok Kelapa, Duren Sawit, Kota Jakarta Timur, DKI Jakarta 13450",
			District:    "Duren Sawit",
			City:        "Jakarta Timur",
			Province:    "DKI Jakarta",
			Latitude:    -6.2367,
			Longitude:   106.9242,
			Phone:       "021-8645123",
			Capacity:    3000,
			Facilities:  "Kajian sunnah tematik, AC, perpustakaan, parkir",
			ImageURL:    "",
			Website:     "",
			IsActive:    true,
		},
		{
			Name:        "Masjid Jami' Imam Asy-Syafi'i BSD",
			Description: "Masjid jami ahlussunnah di kawasan BSD City, dikenal dengan kajian hadits arbain dan fikih perbandingan madzhab.",
			Address:     "Jl. Kalimantan, BSD City, Serpong, Kota Tangerang Selatan, Banten 15310",
			District:    "Serpong",
			City:        "Tangerang Selatan",
			Province:    "Banten",
			Latitude:    -6.3039,
			Longitude:   106.6847,
			Phone:       "021-5371234",
			Capacity:    2000,
			Facilities:  "Kajian sunnah, perpustakaan, ruang wudhu, parkir luas",
			ImageURL:    "",
			Website:     "",
			IsActive:    true,
		},
		{
			Name:        "Masjid Ar-Rohmah Cibubur",
			Description: "Masjid ahlussunnah di Cibubur, pengajian keluarga dan remaja aktif dengan tema tarbiyah dan aqidah.",
			Address:     "Komp. Kota Wisata Cibubur, Nagrak, Gunung Putri, Kabupaten Bogor, Jawa Barat 16968",
			District:    "Gunung Putri",
			City:        "Bogor",
			Province:    "Jawa Barat",
			Latitude:    -6.3688,
			Longitude:   106.9486,
			Phone:       "021-84934567",
			Capacity:    1500,
			Facilities:  "Kajian keluarga, kelas tahfizh, wudhu, parkir",
			ImageURL:    "",
			Website:     "",
			IsActive:    true,
		},
	}
}

func getRadioIslamicData() []model.RadioIslamic {
	return []model.RadioIslamic{
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

func SeedMasjids(db *gorm.DB) {
	masjids := getMasjidData()
	for _, m := range masjids {
		_ = db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "name"}},
			DoUpdates: clause.AssignmentColumns([]string{"description", "address", "district", "city", "province", "latitude", "longitude", "phone", "capacity", "facilities", "website", "is_active"}),
		}).Create(&m).Error
	}
}

func SeedRadioIslamic(db *gorm.DB) {
	radios := getRadioIslamicData()
	for _, r := range radios {
		_ = db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "name"}},
			DoUpdates: clause.AssignmentColumns([]string{"frequency", "city", "province", "stream_url", "description", "website", "is_active", "tags"}),
		}).Create(&r).Error
	}
}
