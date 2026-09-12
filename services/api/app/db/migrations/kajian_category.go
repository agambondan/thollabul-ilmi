package migrations

import (
	"strings"

	"github.com/agambondan/islamic-explorer/app/model"
)

// classifyKajianCategory assigns a coarse Islamic-knowledge category from a
// kajian's title, falling back to its channel's topic/focus tags when the
// title carries no recognizable signal. Rule-based keyword matching rather
// than per-video-precise: with 5000+ scraped videos and many generic titles
// ("Totalitas = Berhasil?", "Sesepuh Dengan Harapan Yang Kokoh"), a
// hand-tuned keyword pass is a practical v1 grouping for browsing/filtering,
// not a scholarly taxonomy. Order matters -- entries earlier in
// kajianCategoryKeywords win when a title matches more than one category.
func classifyKajianCategory(title, topic string) model.KajianCategory {
	if cat, ok := matchKajianCategoryKeywords(strings.ToLower(title)); ok {
		return cat
	}
	if cat, ok := matchKajianCategoryKeywords(strings.ToLower(topic)); ok {
		return cat
	}
	return model.KajianUmum
}

var kajianCategoryKeywords = []struct {
	category model.KajianCategory
	keywords []string
}{
	{model.KajianAkidahTauhid, []string{
		"aqidah", "akidah", "tauhid", "syirik", "bid'ah", "bidah", "manhaj",
		"firqah", "asma wa sifat", "asmaul husna", "wala wal bara",
		"nawaqidul islam", "kitabut tauhid",
	}},
	{model.KajianSirahSejarah, []string{
		"sirah", "sejarah islam", "kisah nabi", "kisah sahabat",
		"perang badar", "perang uhud", "fathu makkah", "khulafaur rasyidin",
		"sejarah nabi",
	}},
	{model.KajianTafsirQuran, []string{
		"tafsir", "surah ", "surat ", "tadabbur", "qs.", "q.s.",
	}},
	{model.KajianHadisSunnah, []string{
		"hadits", "hadist", "hadis ", "riyadhus shalihin", "riyadhush shalihin",
		"bulughul maram", "arbain nawawi", "shahih bukhari", "shahih muslim",
		"at-targhib", "at-tarhib", "minhajul muslim", "fathul majid",
		"syarah kitab", "matan ",
	}},
	{model.KajianFikihIbadah, []string{
		"sholat", "shalat", "puasa", "zakat", " haji", "umroh", "umrah",
		"wudhu", "thaharah", "sujud", "witir", "tarawih", "ramadhan",
		"qurban", "kurban", "aqiqah", "jenazah", "sedekah", "i'tikaf",
		"itikaf",
	}},
	{model.KajianFikihMuamalah, []string{
		"muamalah", "riba", "jual beli", "bisnis syariah", "ekonomi syariah",
		"hutang", "utang", "warisan", " waris", "investasi", "perbankan",
		"sewa menyewa",
	}},
	{model.KajianKeluargaParenting, []string{
		"keluarga", "suami", "istri", "nikah", "menikah", "pernikahan",
		"parenting", "mendidik anak", "rumah tangga", "pacaran", "poligami",
		"thalak", "talak", "cerai", "wali nikah",
	}},
	{model.KajianAkhlakAdab, []string{
		"adab", "akhlak", "akhlaq", "etika",
	}},
	{model.KajianTazkiyatunNufus, []string{
		"tazkiyah", "tazkiyatun", "zuhud", "muhasabah", "taubat", "ikhlas",
		"syukur", "sabar", "nasehat diri", "penyucian jiwa", "hati yang",
	}},
}

func matchKajianCategoryKeywords(haystack string) (model.KajianCategory, bool) {
	for _, entry := range kajianCategoryKeywords {
		for _, kw := range entry.keywords {
			if strings.Contains(haystack, kw) {
				return entry.category, true
			}
		}
	}
	return "", false
}
