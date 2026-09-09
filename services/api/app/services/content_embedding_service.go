package service

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/agambondan/islamic-explorer/app/lib/embeddings"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/pgvector/pgvector-go"
)

type ContentEmbeddingService interface {
	SemanticSearch(ctx context.Context, query string, contentTypes []string, limit int) ([]model.ContentEmbedding, error)
	AskQuestion(ctx context.Context, question string, contentTypes []string) (*AskResponse, error)
	IndexContent(contentType string, contentID uint, chunks []string, metadata map[string]interface{}) error
	DeleteContentEmbeddings(contentType string, contentID uint) error
}

type AskResponse struct {
	Answer     string           `json:"answer"`
	Sources    []SourceCitation `json:"sources"`
	Confidence float32          `json:"confidence"`
}

type SourceCitation struct {
	ContentType string  `json:"content_type"`
	ContentID   uint    `json:"content_id"`
	ChunkText   string  `json:"chunk_text"`
	Metadata    string  `json:"metadata"`
	Similarity  float32 `json:"similarity"`
}

type contentEmbeddingService struct {
	repo              repository.ContentEmbeddingRepository
	embeddingProvider embeddings.Provider
}

func NewContentEmbeddingService(repo repository.ContentEmbeddingRepository) ContentEmbeddingService {
	return &contentEmbeddingService{
		repo:              repo,
		embeddingProvider: embeddings.NewLocalHashProvider(),
	}
}

func (s *contentEmbeddingService) SemanticSearch(ctx context.Context, query string, contentTypes []string, limit int) ([]model.ContentEmbedding, error) {
	queryEmbedding, err := s.embeddingProvider.EmbedText(ctx, query)
	if err != nil {
		return nil, err
	}

	if limit <= 0 {
		limit = 10
	}

	return s.repo.SearchSimilar(queryEmbedding, contentTypes, limit)
}

func (s *contentEmbeddingService) AskQuestion(ctx context.Context, question string, contentTypes []string) (*AskResponse, error) {
	results, err := s.SemanticSearch(ctx, question, contentTypes, 10)
	if err != nil {
		return nil, err
	}

	if len(results) == 0 {
		return &AskResponse{
			Answer:     "Maaf, saya tidak menemukan informasi yang relevan untuk pertanyaan Anda.",
			Sources:    []SourceCitation{},
			Confidence: 0,
		}, nil
	}

	var sources []SourceCitation
	var totalSimilarity float32
	relevantCount := 0

	for _, r := range results {
		if r.Similarity > 0.3 {
			relevantCount++
			var meta map[string]interface{}
			_ = json.Unmarshal([]byte(r.Metadata), &meta)
			sources = append(sources, SourceCitation{
				ContentType: r.ContentType,
				ContentID:   r.ContentID,
				ChunkText:   r.ChunkText,
				Metadata:    r.Metadata,
				Similarity:  r.Similarity,
			})
			totalSimilarity += r.Similarity
		}
	}

	var answer string
	if relevantCount >= 2 {
		answer = s.generateAnswer(question, sources[:min(5, len(sources))])
	} else if relevantCount == 1 {
		answer = "Berdasarkan sumber yang ditemukan: " + truncateText(sources[0].ChunkText, 200)
	} else {
		answer = "Maaf, informasi yang ditemukan tidak cukup relevan untuk menjawab pertanyaan Anda."
	}

	confidence := float32(0)
	if relevantCount > 0 {
		confidence = totalSimilarity / float32(relevantCount)
	}

	return &AskResponse{
		Answer:     answer,
		Sources:    sources,
		Confidence: confidence,
	}, nil
}

func (s *contentEmbeddingService) IndexContent(contentType string, contentID uint, chunks []string, metadata map[string]interface{}) error {
	for i, chunk := range chunks {
		if strings.TrimSpace(chunk) == "" {
			continue
		}

		ctx := context.Background()
		embedding, err := s.embeddingProvider.EmbedText(ctx, chunk)
		if err != nil {
			return err
		}

		meta := make(map[string]interface{})
		for k, v := range metadata {
			meta[k] = v
		}
		meta["chunk_index"] = i

		metaBytes, _ := json.Marshal(meta)

		emb := &model.ContentEmbedding{
			ContentType: contentType,
			ContentID:   contentID,
			ChunkText:   chunk,
			Embedding:   pgvector.NewVector(embedding),
			Metadata:    string(metaBytes),
		}

		if err := s.repo.StoreEmbedding(emb); err != nil {
			return err
		}
	}
	return nil
}

func (s *contentEmbeddingService) DeleteContentEmbeddings(contentType string, contentID uint) error {
	return s.repo.DeleteByContent(contentType, contentID)
}

func (s *contentEmbeddingService) generateAnswer(question string, sources []SourceCitation) string {
	if len(sources) == 0 {
		return "Tidak ada sumber yang ditemukan."
	}

	var sb strings.Builder
	sb.WriteString("Berdasarkan pencarian di sumber-sumber Islam:\n\n")

	for i, src := range sources {
		sourceName := s.getSourceDisplayName(src.ContentType)
		sb.WriteString(sourceName)
		sb.WriteString(": ")
		sb.WriteString(truncateText(src.ChunkText, 150))
		if i < len(sources)-1 {
			sb.WriteString("\n\n")
		}
	}

	sb.WriteString("\n\n(Silakan merujuk ke sumber asli untuk konteks lengkap)")
	return sb.String()
}

func (s *contentEmbeddingService) getSourceDisplayName(contentType string) string {
	switch contentType {
	case "quran":
		return "Al-Quran"
	case "hadith":
		return "Hadits"
	case "tafsir":
		return "Tafsir"
	case "asbabun_nuzul":
		return "Asbabun Nuzul"
	case "doa":
		return "Doa"
	case "fiqh":
		return "Fiqh"
	case "sirah":
		return "Sirah Nabawiyah"
	case "blog":
		return "Artikel"
	case "kajian":
		return "Kajian"
	default:
		return contentType
	}
}

func truncateText(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	return text[:maxLen] + "..."
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
