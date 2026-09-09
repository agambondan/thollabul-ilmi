// Command backfill-content-embeddings indexes all Islamic knowledge content
// into the content_embeddings table using the LocalHashProvider embeddings.
//
//	go run ./cmd/backfill-content-embeddings/main.go            # full backfill
//	go run ./cmd/backfill-content-embeddings/main.go -batch 500 # batch size
//	go run ./cmd/backfill-content-embeddings/main.go -types quran,hadith # specific types
package main

import (
	"context"
	"flag"
	"fmt"
	"hash/fnv"
	"log"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/config"
	"github.com/agambondan/islamic-explorer/app/db"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/google/uuid"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

func main() {
	batchSize := flag.Int("batch", 250, "rows per SELECT batch")
	limit := flag.Int("limit", 0, "max rows to process (0 = no limit); useful for smoke tests")
	typesFlag := flag.String("types", "", "comma-separated content types to index (quran,hadith,tafsir,asbabun_nuzul,doa,fiqh,sirah,blog,kajian). Empty = all.")
	flag.Parse()

	viper.AutomaticEnv()
	env := (&config.Environment{}).Init()
	dbConn := db.NewPostgresql(env)
	repos, err := repository.NewRepositories(dbConn, nil)
	if err != nil {
		log.Fatalf("init repos: %v", err)
	}

	svc := service.NewContentEmbeddingService(repos.ContentEmbedding)

	ctx := context.Background()

	allTypes := []string{"quran", "hadith", "tafsir", "asbabun_nuzul", "doa", "fiqh", "sirah", "blog", "kajian"}

	var selectedTypes []string
	if *typesFlag == "" {
		selectedTypes = allTypes
	} else {
		for _, t := range strings.Split(*typesFlag, ",") {
			t = strings.TrimSpace(t)
			if t != "" {
				selectedTypes = append(selectedTypes, t)
			}
		}
	}

	fmt.Printf("Indexing content types: %v\n", selectedTypes)

	start := time.Now()
	totalIndexed := 0

	for _, contentType := range selectedTypes {
		count, err := indexContentType(ctx, dbConn, svc, contentType, *batchSize, *limit)
		if err != nil {
			log.Printf("[%s] error: %v", contentType, err)
			continue
		}
		totalIndexed += count
		fmt.Printf("[%s] indexed %d chunks\n", contentType, count)
	}

	fmt.Printf("\nTotal indexed: %d chunks in %s\n", totalIndexed, time.Since(start).Round(time.Second))
}

func indexContentType(ctx context.Context, gdb *gorm.DB, svc service.ContentEmbeddingService, contentType string, batchSize, limit int) (int, error) {
	var chunks []ContentChunk
	var err error

	switch contentType {
	case "quran":
		chunks, err = fetchQuranChunks(gdb, batchSize, limit)
	case "hadith":
		chunks, err = fetchHadithChunks(gdb, batchSize, limit)
	case "tafsir":
		chunks, err = fetchTafsirChunks(gdb, batchSize, limit)
	case "asbabun_nuzul":
		chunks, err = fetchAsbabunNuzulChunks(gdb, batchSize, limit)
	case "doa":
		chunks, err = fetchDoaChunks(gdb, batchSize, limit)
	case "fiqh":
		chunks, err = fetchFiqhChunks(gdb, batchSize, limit)
	case "sirah":
		chunks, err = fetchSirahChunks(gdb, batchSize, limit)
	case "blog":
		chunks, err = fetchBlogChunks(gdb, batchSize, limit)
	case "kajian":
		chunks, err = fetchKajianChunks(gdb, batchSize, limit)
	default:
		return 0, fmt.Errorf("unknown content type: %s", contentType)
	}

	if err != nil {
		return 0, err
	}

	indexed := 0
	for _, chunk := range chunks {
		if err := svc.IndexContent(chunk.ContentType, chunk.ContentID, []string{chunk.Text}, chunk.Metadata); err != nil {
			log.Printf("  error indexing %s/%d: %v", chunk.ContentType, chunk.ContentID, err)
			continue
		}
		indexed++
	}

	return indexed, nil
}

type ContentChunk struct {
	ContentType string
	ContentID   uint
	Text        string
	Metadata    map[string]interface{}
}

func safeString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func safeInt(i *int) int {
	if i == nil {
		return 0
	}
	return *i
}

func hadithGradeString(g *model.HadithGrade) string {
	if g == nil {
		return ""
	}
	return string(*g)
}

// blogContentID derives a stable uint content_id from a blog post's UUID
// primary key, since content_embeddings.content_id is shared across content
// types that key off an int primary key.
func blogContentID(id uuid.UUID) uint {
	h := fnv.New32a()
	h.Write([]byte(id.String()))
	return uint(h.Sum32())
}

func fetchQuranChunks(gdb *gorm.DB, batchSize, limit int) ([]ContentChunk, error) {
	var ayahs []model.Ayah
	query := gdb.Model(&model.Ayah{}).Preload("Surah.Translation").Preload("Translation").Limit(batchSize)
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&ayahs).Error; err != nil {
		return nil, err
	}

	chunks := make([]ContentChunk, 0, len(ayahs))
	for _, a := range ayahs {
		var textParts []string
		if a.Surah != nil && a.Surah.Translation != nil {
			textParts = append(textParts, "Surah "+safeString(a.Surah.Translation.Idn))
		}
		if a.Number != nil {
			textParts = append(textParts, fmt.Sprintf("Ayat %d", *a.Number))
		}
		if a.Translation != nil {
			textParts = append(textParts, safeString(a.Translation.Idn))
			textParts = append(textParts, safeString(a.Translation.En))
		}
		chunks = append(chunks, ContentChunk{
			ContentType: "quran",
			ContentID:   uint(safeInt(a.ID)),
			Text:        strings.Join(textParts, " "),
			Metadata: map[string]interface{}{
				"surah_number": safeInt(a.SurahID),
				"ayah_number":  safeInt(a.Number),
				"page":         safeInt(a.Page),
				"juz":          safeInt(a.JuzNumber),
			},
		})
	}
	return chunks, nil
}

func fetchHadithChunks(gdb *gorm.DB, batchSize, limit int) ([]ContentChunk, error) {
	var hadiths []model.Hadith
	query := gdb.Model(&model.Hadith{}).Preload("Translation").Preload("Book.Translation").Limit(batchSize)
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&hadiths).Error; err != nil {
		return nil, err
	}

	chunks := make([]ContentChunk, 0, len(hadiths))
	for _, h := range hadiths {
		var textParts []string
		var bookSlug string
		if h.Book != nil {
			bookSlug = safeString(h.Book.Slug)
			if h.Book.Translation != nil {
				textParts = append(textParts, "Kitab "+safeString(h.Book.Translation.Idn))
			}
		}
		if h.Translation != nil {
			textParts = append(textParts, safeString(h.Translation.Idn))
			textParts = append(textParts, safeString(h.Translation.En))
		}
		chunks = append(chunks, ContentChunk{
			ContentType: "hadith",
			ContentID:   uint(safeInt(h.ID)),
			Text:        strings.Join(textParts, " "),
			Metadata: map[string]interface{}{
				"book_id":    safeInt(h.BookID),
				"book_slug":  bookSlug,
				"chapter_id": safeInt(h.ChapterID),
				"number":     safeInt(h.Number),
				"grade":      hadithGradeString(h.Grade),
			},
		})
	}
	return chunks, nil
}

func fetchTafsirChunks(gdb *gorm.DB, batchSize, limit int) ([]ContentChunk, error) {
	var tafsirs []model.Tafsir
	query := gdb.Model(&model.Tafsir{}).
		Preload("KemenagTranslation").
		Preload("IbnuKatsirTranslation").
		Preload("IbnuKatsirEnTranslation").
		Limit(batchSize)
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&tafsirs).Error; err != nil {
		return nil, err
	}

	chunks := make([]ContentChunk, 0, len(tafsirs))
	for _, t := range tafsirs {
		var textParts []string
		if t.AyahID != nil {
			textParts = append(textParts, fmt.Sprintf("Tafsir Ayat %d", *t.AyahID))
		}
		textParts = append(textParts, safeString(t.KemenagTranslation.Idn))
		textParts = append(textParts, safeString(t.IbnuKatsirTranslation.Idn))
		textParts = append(textParts, safeString(t.IbnuKatsirEnTranslation.En))
		chunks = append(chunks, ContentChunk{
			ContentType: "tafsir",
			ContentID:   uint(safeInt(t.ID)),
			Text:        strings.Join(textParts, " "),
			Metadata: map[string]interface{}{
				"ayah_id": safeInt(t.AyahID),
			},
		})
	}
	return chunks, nil
}

func fetchAsbabunNuzulChunks(gdb *gorm.DB, batchSize, limit int) ([]ContentChunk, error) {
	var items []model.AsbabunNuzul
	query := gdb.Model(&model.AsbabunNuzul{}).Preload("Translation").Preload("Ayahs").Limit(batchSize)
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&items).Error; err != nil {
		return nil, err
	}

	chunks := make([]ContentChunk, 0, len(items))
	for _, item := range items {
		var textParts []string
		textParts = append(textParts, "Asbabun Nuzul: "+item.Title)
		if item.Narrator != "" {
			textParts = append(textParts, "Perawi: "+item.Narrator)
		}
		textParts = append(textParts, item.Content)
		if item.Translation != nil {
			textParts = append(textParts, safeString(item.Translation.Idn))
			textParts = append(textParts, safeString(item.Translation.En))
		}

		ayahNumbers := make([]int, 0, len(item.Ayahs))
		for _, a := range item.Ayahs {
			ayahNumbers = append(ayahNumbers, safeInt(a.Number))
		}

		chunks = append(chunks, ContentChunk{
			ContentType: "asbabun_nuzul",
			ContentID:   uint(safeInt(item.ID)),
			Text:        strings.Join(textParts, " "),
			Metadata: map[string]interface{}{
				"source":       item.Source,
				"display_ref":  item.DisplayRef,
				"ayah_numbers": ayahNumbers,
			},
		})
	}
	return chunks, nil
}

func fetchDoaChunks(gdb *gorm.DB, batchSize, limit int) ([]ContentChunk, error) {
	var doas []model.Doa
	query := gdb.Model(&model.Doa{}).Preload("Translation").Limit(batchSize)
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&doas).Error; err != nil {
		return nil, err
	}

	chunks := make([]ContentChunk, 0, len(doas))
	for _, d := range doas {
		textParts := []string{d.Title, d.Arabic, d.TranslationText}
		if d.Translation != nil {
			textParts = append(textParts, safeString(d.Translation.Idn))
			textParts = append(textParts, safeString(d.Translation.En))
		}
		chunks = append(chunks, ContentChunk{
			ContentType: "doa",
			ContentID:   uint(safeInt(d.ID)),
			Text:        strings.Join(textParts, " "),
			Metadata: map[string]interface{}{
				"category": string(d.Category),
				"source":   d.Source,
			},
		})
	}
	return chunks, nil
}

func fetchFiqhChunks(gdb *gorm.DB, batchSize, limit int) ([]ContentChunk, error) {
	var items []model.FiqhItem
	query := gdb.Model(&model.FiqhItem{}).Preload("Category.Translation").Preload("Translation").Limit(batchSize)
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&items).Error; err != nil {
		return nil, err
	}

	chunks := make([]ContentChunk, 0, len(items))
	for _, item := range items {
		var textParts []string
		var categorySlug string
		if item.Category != nil {
			categorySlug = item.Category.Slug
			if item.Category.Translation != nil {
				textParts = append(textParts, "Kategori: "+safeString(item.Category.Translation.Idn))
			}
		}
		textParts = append(textParts, item.Title, item.Content)
		if item.Translation != nil {
			textParts = append(textParts, safeString(item.Translation.Idn))
			textParts = append(textParts, safeString(item.Translation.En))
		}
		chunks = append(chunks, ContentChunk{
			ContentType: "fiqh",
			ContentID:   uint(safeInt(item.ID)),
			Text:        strings.Join(textParts, " "),
			Metadata: map[string]interface{}{
				"category_id":   safeInt(item.CategoryID),
				"category_slug": categorySlug,
			},
		})
	}
	return chunks, nil
}

func fetchSirahChunks(gdb *gorm.DB, batchSize, limit int) ([]ContentChunk, error) {
	var contents []model.SirohContent
	query := gdb.Model(&model.SirohContent{}).Preload("Category.Translation").Preload("Translation").Limit(batchSize)
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&contents).Error; err != nil {
		return nil, err
	}

	chunks := make([]ContentChunk, 0, len(contents))
	for _, c := range contents {
		var textParts []string
		var categorySlug string
		if c.Category != nil {
			categorySlug = c.Category.Slug
			if c.Category.Translation != nil {
				textParts = append(textParts, safeString(c.Category.Translation.Idn))
			}
		}
		textParts = append(textParts, c.Title, c.Content)
		if c.Translation != nil {
			textParts = append(textParts, safeString(c.Translation.Idn))
			textParts = append(textParts, safeString(c.Translation.En))
		}
		chunks = append(chunks, ContentChunk{
			ContentType: "sirah",
			ContentID:   uint(safeInt(c.ID)),
			Text:        strings.Join(textParts, " "),
			Metadata: map[string]interface{}{
				"category_id":   safeInt(c.CategoryID),
				"category_slug": categorySlug,
			},
		})
	}
	return chunks, nil
}

func fetchBlogChunks(gdb *gorm.DB, batchSize, limit int) ([]ContentChunk, error) {
	var posts []model.BlogPost
	query := gdb.Model(&model.BlogPost{}).Preload("Category.Translation").Preload("Translation").Limit(batchSize)
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&posts).Error; err != nil {
		return nil, err
	}

	chunks := make([]ContentChunk, 0, len(posts))
	for _, p := range posts {
		textParts := []string{p.Title, p.Content}
		if p.Translation != nil {
			textParts = append(textParts, safeString(p.Translation.Idn))
			textParts = append(textParts, safeString(p.Translation.En))
		}
		chunks = append(chunks, ContentChunk{
			ContentType: "blog",
			ContentID:   blogContentID(p.ID),
			Text:        strings.Join(textParts, " "),
			Metadata: map[string]interface{}{
				"post_id":      p.ID.String(),
				"slug":         p.Slug,
				"category_id":  safeInt(p.CategoryID),
				"published_at": p.PublishedAt,
			},
		})
	}
	return chunks, nil
}

func fetchKajianChunks(gdb *gorm.DB, batchSize, limit int) ([]ContentChunk, error) {
	var transcripts []model.KajianTranscript
	query := gdb.Model(&model.KajianTranscript{}).Preload("Kajian").Limit(batchSize)
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&transcripts).Error; err != nil {
		return nil, err
	}

	chunks := make([]ContentChunk, 0, len(transcripts))
	for _, t := range transcripts {
		var textParts []string
		if t.Kajian != nil {
			textParts = append(textParts, t.Kajian.Title)
			if t.Kajian.Speaker != "" {
				textParts = append(textParts, "Penceramah: "+t.Kajian.Speaker)
			}
			if t.Kajian.Topic != "" {
				textParts = append(textParts, "Topik: "+t.Kajian.Topic)
			}
		}
		textParts = append(textParts, t.Text)
		chunks = append(chunks, ContentChunk{
			ContentType: "kajian",
			ContentID:   uint(safeInt(t.ID)),
			Text:        strings.Join(textParts, " "),
			Metadata: map[string]interface{}{
				"kajian_id":     t.KajianID,
				"video_id":      t.VideoID,
				"start_seconds": t.StartSeconds,
				"end_seconds":   t.EndSeconds,
				"timestamp_url": t.TimestampURL,
			},
		})
	}
	return chunks, nil
}
