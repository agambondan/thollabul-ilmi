package embeddings

import (
	"context"
	"testing"
)

func TestLocalHashProviderDeterministic(t *testing.T) {
	p := NewLocalHashProvider()
	ctx := context.Background()

	text := "Hukum riba dalam transaksi modern dan perbankan syariah"
	v1, err := p.EmbedText(ctx, text)
	if err != nil {
		t.Fatalf("embed: %v", err)
	}
	if len(v1) != DefaultDimensions {
		t.Fatalf("expected len %d, got %d", DefaultDimensions, len(v1))
	}
	v2, err := p.EmbedText(ctx, text)
	if err != nil {
		t.Fatalf("embed 2: %v", err)
	}
	for i := range v1 {
		if v1[i] != v2[i] {
			t.Fatalf("mismatch at %d: %f vs %f", i, v1[i], v2[i])
		}
	}
}

func TestFormatAndParseVector(t *testing.T) {
	in := []float32{0.123456, -0.654321, 0.0}
	s := FormatVector(in)
	out, err := ParseVector(s)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if len(out) != len(in) {
		t.Fatalf("len mismatch: %d vs %d", len(out), len(in))
	}
	for i := range in {
		diff := out[i] - in[i]
		if diff < -0.0001 || diff > 0.0001 {
			t.Fatalf("value mismatch at %d: %f vs %f", i, in[i], out[i])
		}
	}
}
