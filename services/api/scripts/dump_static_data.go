//go:build ignore

// Dump semua static seed data dari database ke file JSON di data/static/.
// Jalankan sekali ketika DB sudah terisi via seeder lama, lalu commit file-nya.
// Setelah itu, Seeder() akan baca dari file-file ini sehingga DB bisa di-reset kapanpun.
//
// Usage:
//
//	go run scripts/dump_static_data.go
//	go run scripts/dump_static_data.go -out ./data/static
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func main() {
	outDir := flag.String("out", "./data/static", "Output directory")
	flag.Parse()

	for _, f := range []string{".env.local", ".env"} {
		if err := lib.LoadEnvironmentLocalFlag(f); err == nil {
			log.Printf("Config: %s", f)
			break
		}
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		viper.GetString("db_host"), viper.GetString("db_port"),
		viper.GetString("db_user"), viper.GetString("db_pass"),
		viper.GetString("db_name"),
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Warn),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatalf("koneksi DB gagal: %v", err)
	}

	if err := os.MkdirAll(*outDir, 0o755); err != nil {
		log.Fatalf("mkdir %s: %v", *outDir, err)
	}

	d := &dumper{db: db, out: *outDir}
	d.dumpDoa()
	d.dumpAsmaUlHusna()
	d.dumpAmalanItem()
	d.dumpDzikir()
	d.dumpSholatGuide()
	d.dumpFiqhCategories()
	d.dumpFiqhItems()
	d.dumpSirohCategories()
	d.dumpSirohContents()
	d.dumpBlogCategories()
	d.dumpBlogTags()
	d.dumpKajian()
	d.dumpAchievements()
	d.dumpQuizQuestions()
	d.dumpIslamicEvents()
	d.dumpHistoryEvents()
	d.dumpManasikSteps()
	d.dumpIslamicTerms()
	d.dumpAsbabunNuzul()
	d.dumpPerawi()
	d.dumpJarhTadil()
	d.dumpPerawiGuru()

	log.Println("Dump selesai!")
}

// ── helpers ───────────────────────────────────────────────────────────────────

type dumper struct {
	db  *gorm.DB
	out string
}

func (d *dumper) save(name string, v interface{}) {
	path := filepath.Join(d.out, name)
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		log.Printf("marshal %s: %v", name, err)
		return
	}
	if err := os.WriteFile(path, b, 0o644); err != nil {
		log.Printf("write %s: %v", name, err)
		return
	}
	log.Printf("✓ %s", path)
}

// ── Doa ───────────────────────────────────────────────────────────────────────

type doaRow struct {
	Category        string `json:"category"`
	Title           string `json:"title"`
	Arabic          string `json:"arabic"`
	Transliteration string `json:"transliteration"`
	TranslationText string `json:"translation_text"`
	Source          string `json:"source"`
}

func (d *dumper) dumpDoa() {
	var rows []doaRow
	d.db.Raw(`SELECT category, title, arabic, transliteration, translation AS translation_text, source FROM doa WHERE deleted_at IS NULL ORDER BY category, id`).Scan(&rows)
	d.save("doa.json", rows)
}

// ── Asmaul Husna ──────────────────────────────────────────────────────────────

type asmaRow struct {
	Number          int    `json:"number"`
	Arabic          string `json:"arabic"`
	Transliteration string `json:"transliteration"`
	Indonesian      string `json:"indonesian"`
	English         string `json:"english"`
	Meaning         string `json:"meaning"`
}

func (d *dumper) dumpAsmaUlHusna() {
	var rows []asmaRow
	d.db.Raw(`SELECT number, arabic, transliteration, indonesian, english, meaning FROM asma_ul_husna WHERE deleted_at IS NULL ORDER BY number`).Scan(&rows)
	d.save("asma_ul_husna.json", rows)
}

// ── Amalan Item ───────────────────────────────────────────────────────────────

type amalanRow struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

func (d *dumper) dumpAmalanItem() {
	var rows []amalanRow
	d.db.Raw(`SELECT name, description, category FROM amalan_item WHERE deleted_at IS NULL ORDER BY id`).Scan(&rows)
	d.save("amalan_item.json", rows)
}

// ── Dzikir ────────────────────────────────────────────────────────────────────

type dzikirRow struct {
	Category        string `json:"category"`
	Title           string `json:"title"`
	Arabic          string `json:"arabic"`
	Transliteration string `json:"transliteration"`
	TranslationText string `json:"translation_text"`
	Count           int    `json:"count"`
	Fadhilah        string `json:"fadhilah,omitempty"`
	Source          string `json:"source"`
	Occasion        string `json:"occasion,omitempty"`
}

func (d *dumper) dumpDzikir() {
	var rows []dzikirRow
	d.db.Raw(`SELECT category, title, arabic, transliteration, translation AS translation_text, count, fadhilah, source, occasion FROM dzikir WHERE deleted_at IS NULL ORDER BY category, id`).Scan(&rows)
	d.save("dzikir.json", rows)
}

// ── Sholat Guide ──────────────────────────────────────────────────────────────

type sholatGuideRow struct {
	Step            int    `json:"step"`
	Title           string `json:"title"`
	Arabic          string `json:"arabic"`
	Transliteration string `json:"transliteration"`
	TranslationText string `json:"translation_text"`
	Description     string `json:"description"`
	Source          string `json:"source"`
	Notes           string `json:"notes,omitempty"`
}

func (d *dumper) dumpSholatGuide() {
	var rows []sholatGuideRow
	d.db.Raw(`SELECT step, title, arabic, transliteration, translation AS translation_text, description, source, notes FROM sholat_guide WHERE deleted_at IS NULL ORDER BY step`).Scan(&rows)
	d.save("sholat_guide.json", rows)
}

// ── Fiqh Category ─────────────────────────────────────────────────────────────

type fiqhCatRow struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
}

func (d *dumper) dumpFiqhCategories() {
	var rows []fiqhCatRow
	d.db.Raw(`SELECT name, slug, description FROM fiqh_category WHERE deleted_at IS NULL ORDER BY id`).Scan(&rows)
	d.save("fiqh_category.json", rows)
}

// ── Fiqh Item ─────────────────────────────────────────────────────────────────

type fiqhItemRow struct {
	CategorySlug string `json:"category_slug"`
	Title        string `json:"title"`
	Slug         string `json:"slug"`
	Content      string `json:"content"`
	Source       string `json:"source"`
	SortOrder    int    `json:"sort_order"`
}

func (d *dumper) dumpFiqhItems() {
	var rows []fiqhItemRow
	d.db.Raw(`
		SELECT fc.slug AS category_slug, fi.title, fi.slug, fi.content, fi.source, fi.sort_order
		FROM fiqh_item fi
		JOIN fiqh_category fc ON fc.id = fi.category_id
		WHERE fi.deleted_at IS NULL
		ORDER BY fc.id, fi.sort_order
	`).Scan(&rows)
	d.save("fiqh_item.json", rows)
}

// ── Siroh Category ────────────────────────────────────────────────────────────

type sirohCatRow struct {
	Title string `json:"title"`
	Slug  string `json:"slug"`
	Order int    `json:"order"`
}

func (d *dumper) dumpSirohCategories() {
	var rows []sirohCatRow
	d.db.Raw(`SELECT title, slug, "order" FROM siroh_category WHERE deleted_at IS NULL ORDER BY "order"`).Scan(&rows)
	d.save("siroh_category.json", rows)
}

// ── Siroh Content ─────────────────────────────────────────────────────────────

type sirohContentRow struct {
	CategorySlug string `json:"category_slug"`
	Title        string `json:"title"`
	Slug         string `json:"slug"`
	Content      string `json:"content"`
	Order        int    `json:"order"`
}

func (d *dumper) dumpSirohContents() {
	var rows []sirohContentRow
	d.db.Raw(`
		SELECT sc_cat.slug AS category_slug, sc.title, sc.slug, sc.content, sc."order"
		FROM siroh_content sc
		JOIN siroh_category sc_cat ON sc_cat.id = sc.category_id
		WHERE sc.deleted_at IS NULL
		ORDER BY sc_cat."order", sc."order"
	`).Scan(&rows)
	d.save("siroh_content.json", rows)
}

// ── Blog Category ─────────────────────────────────────────────────────────────

type blogCatRow struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
}

func (d *dumper) dumpBlogCategories() {
	var rows []blogCatRow
	d.db.Raw(`SELECT name, slug, description FROM blog_category WHERE deleted_at IS NULL ORDER BY id`).Scan(&rows)
	d.save("blog_category.json", rows)
}

// ── Blog Tag ──────────────────────────────────────────────────────────────────

type blogTagRow struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

func (d *dumper) dumpBlogTags() {
	var rows []blogTagRow
	d.db.Raw(`SELECT name, slug FROM blog_tag WHERE deleted_at IS NULL ORDER BY id`).Scan(&rows)
	d.save("blog_tag.json", rows)
}

// ── Kajian ────────────────────────────────────────────────────────────────────

type kajianRow struct {
	Title       string `json:"title"`
	Speaker     string `json:"speaker"`
	Topic       string `json:"topic"`
	Type        string `json:"type"`
	Description string `json:"description"`
	Duration    int    `json:"duration"`
	PublishedAt string `json:"published_at"`
}

func (d *dumper) dumpKajian() {
	var rows []kajianRow
	d.db.Raw(`SELECT title, speaker, topic, type, description, duration, published_at FROM kajian WHERE deleted_at IS NULL ORDER BY id`).Scan(&rows)
	d.save("kajian.json", rows)
}

// ── Achievement ───────────────────────────────────────────────────────────────

type achievementRow struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	NameEn      string `json:"name_en"`
	Description string `json:"description"`
	DescEn      string `json:"desc_en"`
	Icon        string `json:"icon"`
	Category    string `json:"category"`
	Threshold   int    `json:"threshold"`
}

func (d *dumper) dumpAchievements() {
	var rows []achievementRow
	d.db.Raw(`SELECT code, name, name_en, description, desc_en, icon, category, threshold FROM achievement WHERE deleted_at IS NULL ORDER BY category, threshold`).Scan(&rows)
	d.save("achievement.json", rows)
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

type quizRow struct {
	Type          string `json:"type"`
	Difficulty    string `json:"difficulty"`
	QuestionText  string `json:"question_text"`
	CorrectAnswer string `json:"correct_answer"`
	Options       string `json:"options"`
	Explanation   string `json:"explanation"`
}

func (d *dumper) dumpQuizQuestions() {
	var rows []quizRow
	d.db.Raw(`SELECT type, difficulty, question_text, correct_answer, options, explanation FROM quiz WHERE deleted_at IS NULL ORDER BY type, id`).Scan(&rows)
	d.save("quiz.json", rows)
}

// ── Islamic Event ─────────────────────────────────────────────────────────────

type islamicEventRow struct {
	Name        string `json:"name"`
	HijriMonth  int    `json:"hijri_month"`
	HijriDay    int    `json:"hijri_day"`
	Category    string `json:"category"`
	Description string `json:"description"`
}

func (d *dumper) dumpIslamicEvents() {
	var rows []islamicEventRow
	d.db.Raw(`SELECT name, hijri_month, hijri_day, category, description FROM islamic_event WHERE deleted_at IS NULL ORDER BY hijri_month, hijri_day, id`).Scan(&rows)
	d.save("islamic_event.json", rows)
}

// ── History Event ─────────────────────────────────────────────────────────────

type historyEventRow struct {
	YearHijri     int    `json:"year_hijri"`
	YearMiladi    int    `json:"year_miladi"`
	Title         string `json:"title"`
	Slug          string `json:"slug"`
	Description   string `json:"description"`
	Category      string `json:"category"`
	IsSignificant bool   `json:"is_significant"`
}

func (d *dumper) dumpHistoryEvents() {
	var rows []historyEventRow
	d.db.Raw(`SELECT year_hijri, year_miladi, title, slug, description, category, is_significant FROM history_event WHERE deleted_at IS NULL ORDER BY year_miladi`).Scan(&rows)
	d.save("history_event.json", rows)
}

// ── Manasik Step ──────────────────────────────────────────────────────────────

type manasikStepRow struct {
	Type            string `json:"type"`
	StepOrder       int    `json:"step_order"`
	Title           string `json:"title"`
	Description     string `json:"description"`
	Arabic          string `json:"arabic"`
	Transliteration string `json:"transliteration"`
	TranslationText string `json:"translation_text"`
	Notes           string `json:"notes,omitempty"`
	IsWajib         bool   `json:"is_wajib"`
}

func (d *dumper) dumpManasikSteps() {
	var rows []manasikStepRow
	d.db.Raw(`SELECT type, step_order, title, description, arabic, transliteration, translation AS translation_text, notes, is_wajib FROM manasik_step WHERE deleted_at IS NULL ORDER BY type, step_order`).Scan(&rows)
	d.save("manasik_step.json", rows)
}

// ── Islamic Term ──────────────────────────────────────────────────────────────

type islamicTermRow struct {
	Term       string `json:"term"`
	Category   string `json:"category"`
	Definition string `json:"definition"`
	Example    string `json:"example,omitempty"`
	Source     string `json:"source,omitempty"`
	Origin     string `json:"origin,omitempty"`
}

func (d *dumper) dumpIslamicTerms() {
	var rows []islamicTermRow
	d.db.Raw(`SELECT term, category, definition, example, source, origin FROM islamic_term WHERE deleted_at IS NULL ORDER BY category, term`).Scan(&rows)
	d.save("islamic_term.json", rows)
}

// ── Asbabun Nuzul ─────────────────────────────────────────────────────────────

type asbabunNuzulRow struct {
	Title      string         `json:"title"`
	Narrator   string         `json:"narrator"`
	Content    string         `json:"content"`
	Source     string         `json:"source"`
	DisplayRef string         `json:"display_ref"`
	Ayahs      []asbabAyahRef `json:"ayahs"`
}

type asbabAyahRef struct {
	SurahNumber int `json:"surah_number"`
	AyahNumber  int `json:"ayah_number"`
}

func (d *dumper) dumpAsbabunNuzul() {
	type rawAN struct {
		ID         int
		Title      string
		Narrator   string
		Content    string
		Source     string
		DisplayRef string
	}
	var raws []rawAN
	d.db.Raw(`SELECT id, title, narrator, content, source, display_ref FROM asbabun_nuzul WHERE deleted_at IS NULL ORDER BY id`).Scan(&raws)

	rows := make([]asbabunNuzulRow, 0, len(raws))
	for _, r := range raws {
		var ayahs []asbabAyahRef
		d.db.Raw(`
			SELECT s.number AS surah_number, a.number AS ayah_number
			FROM asbabun_nuzul_ayahs ana
			JOIN ayah a ON a.id = ana.ayah_id
			JOIN surah s ON s.id = a.surah_id
			WHERE ana.asbabun_nuzul_id = ?
			ORDER BY s.number, a.number
		`, r.ID).Scan(&ayahs)

		rows = append(rows, asbabunNuzulRow{
			Title:      r.Title,
			Narrator:   r.Narrator,
			Content:    r.Content,
			Source:     r.Source,
			DisplayRef: r.DisplayRef,
			Ayahs:      ayahs,
		})
	}
	d.save("asbabun_nuzul.json", rows)
}

// ── Perawi ────────────────────────────────────────────────────────────────────

type perawiRow struct {
	NamaArab    string `json:"nama_arab"`
	NamaLatin   string `json:"nama_latin"`
	NamaLengkap string `json:"nama_lengkap,omitempty"`
	Kunyah      string `json:"kunyah,omitempty"`
	Nisbah      string `json:"nisbah,omitempty"`
	TahunLahir  *int   `json:"tahun_lahir,omitempty"`
	TahunWafat  *int   `json:"tahun_wafat,omitempty"`
	TahunHijri  bool   `json:"tahun_hijri"`
	TempatLahir string `json:"tempat_lahir,omitempty"`
	TempatWafat string `json:"tempat_wafat,omitempty"`
	Tabaqah     string `json:"tabaqah,omitempty"`
	Status      string `json:"status,omitempty"`
	Biografis   string `json:"biografis,omitempty"`
}

func (d *dumper) dumpPerawi() {
	var rows []perawiRow
	d.db.Raw(`SELECT nama_arab, nama_latin, nama_lengkap, kunyah, nisbah, tahun_lahir, tahun_wafat, tahun_hijri, tempat_lahir, tempat_wafat, tabaqah, status, biografis FROM perawi WHERE deleted_at IS NULL ORDER BY id`).Scan(&rows)
	d.save("perawi.json", rows)
}

// ── Jarh Tadil ────────────────────────────────────────────────────────────────

type jarhTadilRow struct {
	PerawiNamaLatin  string  `json:"perawi_nama_latin"`
	PenilaiNamaLatin string  `json:"penilai_nama_latin"`
	JenisNilai       string  `json:"jenis_nilai"`
	Tingkat          *int    `json:"tingkat,omitempty"`
	TeksNilai        *string `json:"teks_nilai,omitempty"`
	Sumber           *string `json:"sumber,omitempty"`
	Halaman          *string `json:"halaman,omitempty"`
	Catatan          *string `json:"catatan,omitempty"`
}

func (d *dumper) dumpJarhTadil() {
	var rows []jarhTadilRow
	d.db.Raw(`
		SELECT p.nama_latin AS perawi_nama_latin, pen.nama_latin AS penilai_nama_latin,
		       jt.jenis_nilai, jt.tingkat, jt.teks_nilai, jt.sumber, jt.halaman, jt.catatan
		FROM jarh_tadil jt
		JOIN perawi p   ON p.id   = jt.perawi_id
		JOIN perawi pen ON pen.id = jt.penilai_id
		WHERE jt.deleted_at IS NULL
		ORDER BY p.id, jt.id
	`).Scan(&rows)
	d.save("jarh_tadil.json", rows)
}

type perawiGuruRow struct {
	GuruNamaLatin  string `json:"guru_nama_latin"`
	MuridNamaLatin string `json:"murid_nama_latin"`
}

func (d *dumper) dumpPerawiGuru() {
	var rows []perawiGuruRow
	d.db.Raw(`
		SELECT g.nama_latin AS guru_nama_latin, m.nama_latin AS murid_nama_latin
		FROM perawi_guru pg
		JOIN perawi g ON g.id = pg.guru_id
		JOIN perawi m ON m.id = pg.murid_id
		ORDER BY pg.guru_id, pg.murid_id
	`).Scan(&rows)
	d.save("perawi_guru.json", rows)
}
