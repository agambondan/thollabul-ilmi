// Package embeddings generates dense vector embeddings for the kajian transcript
// search. It is intentionally pure-Go so the production binary on the VPS does
// not pull in a Python/Torch/ONNX runtime. The LocalHashProvider produces a
// normalized 256-dimensional vector by hashing tokens + trigrams with FNV-1a
// and applying signed weighting. Cosine similarity between two vectors ranges
// from 0 (orthogonal) to 1 (identical) when both are L2-normalized. This is the
// same approach Chronicle uses for `chunk_embeddings`.
//
// The scoring is *not* a real semantic model, but it is good enough for hybrid
// retrieval when combined with whole-word lexical matching in Postgres. Two
// unrelated chunks about "poligami" and "shalat" will still share a few
// connective tokens ("yang", "dengan") and score close to zero. Two chunks
// about the same topic will share many topic tokens + trigrams and score
// substantially higher than noise.
package embeddings

import (
	"context"
	"fmt"
	"hash/fnv"
	"math"
	"strconv"
	"strings"
	"unicode"
)

const (
	// DefaultProviderName is the registered identifier for the LocalHashProvider.
	DefaultProviderName = "kajian-local-hash-v1"

	// DefaultDimensions matches the column width declared on
	// kajian_transcript.embedding (vector(256)). Keep in sync.
	DefaultDimensions = 256
)

// Provider generates a dense embedding vector for a piece of text.
type Provider interface {
	Name() string
	Dimensions() int
	EmbedText(ctx context.Context, text string) ([]float32, error)
}

// LocalHashProvider is a deterministic, dependency-free embedding provider.
// It hashes each token (weight 1.0) and its character trigrams (weight 0.35)
// into the same vector, then L2-normalizes the result. Identical input always
// produces the identical vector, which is required for cosine search.
type LocalHashProvider struct {
	dimensions int
}

// NewLocalHashProvider returns a provider with the project's default dimensions.
func NewLocalHashProvider() *LocalHashProvider {
	return &LocalHashProvider{dimensions: DefaultDimensions}
}

// NewLocalHashProviderWithDimensions is used by tests that want a shorter vector.
func NewLocalHashProviderWithDimensions(dimensions int) *LocalHashProvider {
	if dimensions <= 0 {
		dimensions = DefaultDimensions
	}
	return &LocalHashProvider{dimensions: dimensions}
}

// Name implements Provider.
func (p *LocalHashProvider) Name() string { return DefaultProviderName }

// Dimensions implements Provider.
func (p *LocalHashProvider) Dimensions() int { return p.dimensions }

// EmbedText implements Provider.
func (p *LocalHashProvider) EmbedText(ctx context.Context, text string) ([]float32, error) {
	if strings.TrimSpace(text) == "" {
		return nil, fmt.Errorf("empty text cannot be embedded")
	}

	vector := make([]float32, p.dimensions)
	for _, feature := range features(text) {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		primary := hashString(feature.token)
		secondary := hashString(feature.token + "#secondary")
		applyHash(vector, primary, feature.weight)
		applyHash(vector, secondary, feature.weight*0.45)
	}
	normalize(vector)
	return vector, nil
}

// ComposeChunkInput concatenates title + topic + text with a separator so the
// embedding carries more retrieval signal than the text alone. The separator is
// intentionally visible so the hash treats them as distinct features.
func ComposeChunkInput(title, topic, text string) string {
	parts := []string{
		strings.TrimSpace(title),
		strings.TrimSpace(topic),
		strings.TrimSpace(text),
	}
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p != "" {
			out = append(out, p)
		}
	}
	return strings.Join(out, "\n")
}

// FormatVector renders a Go []float32 as the Postgres pgvector literal syntax:
// "[0.123000,0.456000,...]". This is what pgvector-go accepts as a bound value.
func FormatVector(values []float32) string {
	parts := make([]string, 0, len(values))
	for _, v := range values {
		parts = append(parts, strconv.FormatFloat(float64(v), 'f', 6, 32))
	}
	return "[" + strings.Join(parts, ",") + "]"
}

// ParseVector reverses FormatVector for tests and debugging. Not used at
// runtime; pgvector-go handles unmarshalling from the driver directly.
func ParseVector(s string) ([]float32, error) {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "[")
	s = strings.TrimSuffix(s, "]")
	if s == "" {
		return []float32{}, nil
	}
	raw := strings.Split(s, ",")
	out := make([]float32, 0, len(raw))
	for _, r := range raw {
		v, err := strconv.ParseFloat(strings.TrimSpace(r), 32)
		if err != nil {
			return nil, err
		}
		out = append(out, float32(v))
	}
	return out, nil
}

// ValidateVector ensures a vector matches the provider's dimensions. Cheap guard
// before writing to the database; the column constraint will reject the write
// anyway but we want a friendlier error path.
func ValidateVector(values []float32, dimensions int) error {
	if dimensions <= 0 {
		return fmt.Errorf("dimensions must be positive")
	}
	if len(values) != dimensions {
		return fmt.Errorf("vector length %d does not match dimensions %d", len(values), dimensions)
	}
	return nil
}

type feature struct {
	token  string
	weight float32
}

func features(text string) []feature {
	tokens := tokenize(text)
	if len(tokens) == 0 {
		return nil
	}
	out := make([]feature, 0, len(tokens)*2)
	for _, token := range tokens {
		out = append(out, feature{token: token, weight: 1.0})
		for _, tri := range trigrams(token) {
			out = append(out, feature{token: tri, weight: 0.35})
		}
	}
	return out
}

// tokenize lowercases and splits on non-letter/non-digit runes. Indonesian has no
// case, but study topics in Indonesian YouTube captions often include English or
// Arabic terms, so lowercasing helps the hash bucket them consistently.
func tokenize(text string) []string {
	lower := strings.ToLower(text)
	parts := strings.FieldsFunc(lower, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if len(p) < 2 {
			continue
		}
		out = append(out, p)
	}
	return out
}

func trigrams(token string) []string {
	if len(token) < 3 {
		return nil
	}
	out := make([]string, 0, len(token)-2)
	for i := 0; i+3 <= len(token); i++ {
		out = append(out, token[i:i+3])
	}
	return out
}

func hashString(value string) uint64 {
	h := fnv.New64a()
	_, _ = h.Write([]byte(value))
	return h.Sum64()
}

func applyHash(vector []float32, hash uint64, weight float32) {
	if len(vector) == 0 {
		return
	}
	index := int(hash % uint64(len(vector)))
	sign := float32(1)
	if hash&1 == 1 {
		sign = -1
	}
	vector[index] += sign * weight
}

func normalize(vector []float32) {
	var sum float64
	for _, v := range vector {
		sum += float64(v * v)
	}
	if sum == 0 {
		return
	}
	scale := float32(1 / math.Sqrt(sum))
	for i := range vector {
		vector[i] *= scale
	}
}