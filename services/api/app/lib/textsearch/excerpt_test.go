package textsearch

import (
	"reflect"
	"strings"
	"testing"
)

func TestSnippetTermsOrder(t *testing.T) {
	got := Parse("cara mengatasi stres").SnippetTerms()
	// phrase first, then the content words, then variants, then stems
	if got[0] != "cara mengatasi stres" || got[1] != "mengatasi" || got[2] != "stres" {
		t.Fatalf("SnippetTerms = %v", got)
	}
	joined := strings.Join(got, ",")
	for _, want := range []string{"cemas", "atasi"} {
		if !strings.Contains(joined, want) {
			t.Errorf("SnippetTerms missing %q: %v", want, got)
		}
	}
}

func TestStripAffixes(t *testing.T) {
	cases := map[string][]string{
		"mengatasi": {"atasi", "mengatas", "atas"},
		"kesabaran": {"sabaran", "kesabar", "sabar"},
		"riba":      nil,
		"bersabar":  {"sabar"},
	}
	for in, want := range cases {
		if got := stripAffixes(in); !reflect.DeepEqual(got, want) {
			t.Errorf("stripAffixes(%q) = %v, want %v", in, got, want)
		}
	}
}

func TestExcerptCentersOnFirstTerm(t *testing.T) {
	prefix := strings.Repeat("kata pengantar panjang ", 12) // ~276 runes
	text := prefix + "maka hukum RIBA itu haram, kata beliau. " + strings.Repeat("penutup ", 20)
	got := Excerpt(text, []string{"hukum riba"}, 120)
	if !strings.Contains(strings.ToLower(got), "hukum riba") {
		t.Fatalf("excerpt lost the match: %q", got)
	}
	if !strings.HasPrefix(got, "…") || !strings.HasSuffix(got, "…") {
		t.Fatalf("excerpt should be marked as cut on both sides: %q", got)
	}
	if n := len([]rune(got)); n > 140 {
		t.Fatalf("excerpt too long: %d runes", n)
	}
	if strings.Contains(got, "…k") || strings.HasPrefix(got, "… ") {
		t.Fatalf("excerpt should start at a word boundary: %q", got)
	}
}

func TestExcerptFallsBackToHead(t *testing.T) {
	text := strings.Repeat("abc def ", 40)
	got := Excerpt(text, []string{"zzz"}, 50)
	if !strings.HasPrefix(got, "abc def") || !strings.HasSuffix(got, "…") || len([]rune(got)) > 52 {
		t.Fatalf("fallback excerpt = %q", got)
	}
	short := "pendek saja"
	if got := Excerpt(short, []string{"saja"}, 50); got != short {
		t.Fatalf("short text must be returned untouched, got %q", got)
	}
}

func TestExcerptIsRuneSafe(t *testing.T) {
	text := strings.Repeat("بِسْمِ اللهِ ", 30) + "kata salat di sini " + strings.Repeat("الرَّحْمَنِ ", 30)
	got := Excerpt(text, []string{"salat"}, 60)
	if !strings.Contains(got, "salat") || !strings.HasPrefix(got, "…") {
		t.Fatalf("rune-safe excerpt = %q", got)
	}
}

func TestBestFuzzyToken(t *testing.T) {
	text := "Allah halalkan jual beli. Allah haramkan riba. Kata sebagian orang ribuan."
	if got := BestFuzzyToken(text, "ribaa", 0.5); got != "riba" {
		t.Fatalf("BestFuzzyToken = %q, want riba", got)
	}
	if got := BestFuzzyToken(text, "istikamah", 0.5); got != "" {
		t.Fatalf("unrelated word must not match, got %q", got)
	}
	if got := BestFuzzyToken("tetap istikamah di jalan Allah", "istiqomah", 0.4); got != "istikamah" {
		t.Fatalf("BestFuzzyToken = %q, want istikamah", got)
	}
}
