package migrations

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func SeedLessons(db *gorm.DB) {
	modules := []model.LessonModule{
		{Slug: "wudhu", Title: "Tata Cara Wudhu", Description: "Belajar wudhu secara bertahap dari niat hingga kaki.", Icon: "wudhu", Order: 1},
		{Slug: "sholat", Title: "Tata Cara Sholat", Description: "Panduan ringkas gerakan dan bacaan pokok sholat.", Icon: "sholat", Order: 2},
		{Slug: "adzan-iqomah", Title: "Mengenal Adzan & Iqomah", Description: "Makna, lafaz, dan adab adzan serta iqomah.", Icon: "adzan", Order: 3},
	}
	for i := range modules {
		db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "slug"}}, DoNothing: true}).Create(&modules[i])
	}

	var stored []model.LessonModule
	db.Find(&stored)
	bySlug := map[string]int{}
	for _, m := range stored {
		if m.ID != nil {
			bySlug[m.Slug] = *m.ID
		}
	}

	steps := []model.LessonStep{
		{ModuleID: bySlug["wudhu"], StepOrder: 1, Title: "Niat", Body: "Niat di dalam hati ketika membasuh wajah, tidak harus diucapkan."},
		{ModuleID: bySlug["wudhu"], StepOrder: 2, Title: "Membasuh Wajah", Body: "Siramkan air ke seluruh wajah dari dahi sampai dagu dan dari telinga kanan ke telinga kiri."},
		{ModuleID: bySlug["wudhu"], StepOrder: 3, Title: "Membasuh Tangan", Body: "Mulai dari tangan kanan sampai siku, gosok sela-sela jari, lalu tangan kiri."},
		{ModuleID: bySlug["wudhu"], StepOrder: 4, Title: "Mengusap Kepala", Body: "Usap kepala dengan air dari depan ke belakang dan sebaliknya sekali saja."},
		{ModuleID: bySlug["wudhu"], StepOrder: 5, Title: "Membasuh Kaki", Body: "Siramkan air ke seluruh kaki kanan dan kiri sampai mata kaki, termasuk sela-sela."},
		{ModuleID: bySlug["sholat"], StepOrder: 1, Title: "Takbiratul Ihram", Body: "Berdiri tegak, angkat kedua tangan sejajar telinga, baca Allahu Akbar."},
		{ModuleID: bySlug["sholat"], StepOrder: 2, Title: "Membaca Al-Fatihah", Body: "Surat wajib dalam tiap rakaat setelah takbiratul ihram dan berdiri."},
		{ModuleID: bySlug["sholat"], StepOrder: 3, Title: "Ruku", Body: "Bungkukkan badan, tangan di lutut, punggung rata, baca Subhana Rabbiyal Adzim."},
		{ModuleID: bySlug["sholat"], StepOrder: 4, Title: "Sujud", Body: "Turun hingga dahi, telapak tangan, lutut, dan kaki menyentuh lantai."},
		{ModuleID: bySlug["sholat"], StepOrder: 5, Title: "Tasyahud & Salam", Body: "Duduk tasyahud akhir, membaca tahiyat, lalu salam ke kanan dan kiri."},
		{ModuleID: bySlug["adzan-iqomah"], StepOrder: 1, Title: "Pengertian Adzan", Body: "Adzan adalah panggilan untuk menunaikan sholat fardhu."},
		{ModuleID: bySlug["adzan-iqomah"], StepOrder: 2, Title: "Syarat Muadzin", Body: "Muadzin adalah muslim, berakal, memahami lafaz dan adab adzan."},
		{ModuleID: bySlug["adzan-iqomah"], StepOrder: 3, Title: "Lafaz Adzan", Body: "Adzan dimulai dengan takbir, dua syahadat, hayya alas sholah, hayya alal falah, dan penutup."},
		{ModuleID: bySlug["adzan-iqomah"], StepOrder: 4, Title: "Iqomah", Body: "Iqomah mirip adzan, dibaca lebih ringkas sebagai tanda sholat segera dimulai."},
	}
	for i := range steps {
		if steps[i].ModuleID == 0 {
			continue
		}
		db.Where(model.LessonStep{ModuleID: steps[i].ModuleID, StepOrder: steps[i].StepOrder}).FirstOrCreate(&steps[i])
	}
}
