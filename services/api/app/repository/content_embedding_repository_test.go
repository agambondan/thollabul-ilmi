package repository

import (
	"os"
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib/embeddings"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func TestContentEmbeddingRepository_SearchSimilar_Postgres(t *testing.T) {
	dsn := os.Getenv("PG_DSN")
	if dsn == "" {
		dsn = "host=localhost port=54320 user=postgres password=postgres dbname=thullabul_ilmi sslmode=disable"
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
		Logger:         logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Skipf("postgres not reachable: %v", err)
	}

	repo := NewContentEmbeddingRepository(db)
	provider := embeddings.NewLocalHashProvider()

	vec, err := provider.EmbedText(t.Context(), "tauhid")
	assert.NoError(t, err)

	results, err := repo.SearchSimilar(vec, nil, 5)
	assert.NoError(t, err)

	if len(results) > 0 {
		assert.Greater(t, results[0].Similarity, float32(0), "Similarity score should be scanned into model")
		for _, r := range results {
			t.Logf("Result: type=%s, id=%d, sim=%f, chunk=%.50s", r.ContentType, r.ContentID, r.Similarity, r.ChunkText)
		}
	}
}
