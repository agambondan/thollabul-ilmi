package textsearch

import (
	"reflect"
	"strings"
	"testing"
)

func TestParseNormalisesAndExpands(t *testing.T) {
	q := Parse("  Cara mengatasi Stres  ")
	if q.Raw != "Cara mengatasi Stres" {
		t.Fatalf("raw not trimmed: %q", q.Raw)
	}
	if got := q.Words; !reflect.DeepEqual(got, []string{"cara", "mengatasi", "stres"}) {
		t.Fatalf("words = %v", got)
	}
	// "cara" is a stopword and must not become a concept group.
	if len(q.Groups) != 2 || q.Groups[0].Source != "mengatasi" || q.Groups[1].Source != "stres" {
		t.Fatalf("groups = %+v", q.Groups)
	}
	if got := q.Groups[1].Terms; !reflect.DeepEqual(got, []string{"cemas", "depresi", "galau", "gelisah", "stres", "stress", "tertekan"}) {
		t.Fatalf("stres variants = %v", got)
	}
}

func TestParseKeepsStopwordsWhenNothingElse(t *testing.T) {
	q := Parse("apa itu")
	if len(q.Groups) != 2 {
		t.Fatalf("expected fallback to raw tokens, got %+v", q.Groups)
	}
}

func TestParseEmpty(t *testing.T) {
	for _, in := range []string{"", "   ", "?!", "'"} {
		if q := Parse(in); !q.IsEmpty() {
			t.Errorf("Parse(%q) should be empty, got %+v", in, q)
		}
	}
}

func TestTokenizeStripsApostrophesAndPunctuation(t *testing.T) {
	got := Tokenize("Al-Qur'an, jum’at & bid'ah! a")
	want := []string{"al", "quran", "jumat", "bidah"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("Tokenize = %v, want %v", got, want)
	}
}

func TestPhraseRegex(t *testing.T) {
	q := Parse(`"Hukum  riba" (bank)`)
	if got := q.PhraseRegex(); got != `\mhukum[\s-]+riba[\s-]+bank\M` {
		t.Fatalf("PhraseRegex = %q", got)
	}
	if got := Parse("a.b*c").PhraseRegex(); got != `\ma\.b\*c\M` {
		t.Fatalf("metacharacters must be quoted, got %q", got)
	}
	if got := Parse("").PhraseRegex(); got != "" {
		t.Fatalf("empty query must give empty regex, got %q", got)
	}
}

func TestTSQueryBuilders(t *testing.T) {
	q := Parse("sholat khusyuk")
	if got := q.TSQueryAll(); got != "(salat | sembahyang | shalat | sholat | solat) & (khusu | khusyu | khusyuk)" {
		t.Fatalf("TSQueryAll = %q", got)
	}
	if got := q.TSQueryAny(); got != "(salat | sembahyang | shalat | sholat | solat) | (khusu | khusyu | khusyuk)" {
		t.Fatalf("TSQueryAny = %q", got)
	}
	single := Parse("riba")
	if got := single.TSQueryAll(); got != "(rente | riba | ribawi)" {
		t.Fatalf("single group = %q", got)
	}
	if got := Parse("zuhur").GroupQueries(); len(got) != 1 {
		t.Fatalf("GroupQueries = %v", got)
	}
}

func TestGroupTSQuerySkipsNonAlnum(t *testing.T) {
	g := Group{Source: "x", Terms: []string{"ok", "bad term", "a|b", "c'd", "fine2"}}
	if got := g.TSQuery(); got != "(ok | fine2)" {
		t.Fatalf("TSQuery = %q", got)
	}
	if got := (Group{Terms: []string{"a b"}}).TSQuery(); got != "" {
		t.Fatalf("all-unsafe group must be empty, got %q", got)
	}
}

func TestTSQueryKeepsNonASCIILetters(t *testing.T) {
	// Regression: termPattern used to be ASCII-only ([a-z0-9]+), so any
	// Arabic-script or accented-Latin word silently vanished from the query
	// while the API still advertised it in expanded_terms. A live search for
	// "café wudhu" matched every "wudhu" chunk while ignoring "café" outright.
	arabic := Parse("بسم الله")
	if got := arabic.GroupQueries(); len(got) != 2 {
		t.Fatalf("Arabic groups should survive TSQuery filtering, got %v", got)
	}
	mixed := Parse("café wudhu")
	groups := mixed.GroupQueries()
	if len(groups) != 2 {
		t.Fatalf("expected both concepts in a mixed-script query, got %v", groups)
	}
	if !strings.Contains(mixed.TSQueryAll(), "café") {
		t.Fatalf("TSQueryAll dropped the accented word: %q", mixed.TSQueryAll())
	}
}

func TestHighlightTerms(t *testing.T) {
	got := Parse("hadits sholat hadits").HighlightTerms()
	want := []string{"hadis", "hadist", "hadith", "hadits", "salat", "sembahyang", "shalat", "sholat", "solat"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("HighlightTerms = %v", got)
	}
}

func TestVariantsUnknownTokenIsItself(t *testing.T) {
	if got := Variants("xyzzy"); !reflect.DeepEqual(got, []string{"xyzzy"}) {
		t.Fatalf("Variants = %v", got)
	}
}

func TestVariantGroupsAreWellFormed(t *testing.T) {
	seen := map[string]int{}
	for i, g := range variantGroups {
		if len(g) < 2 {
			t.Errorf("group %d has fewer than two terms: %v", i, g)
		}
		for _, term := range g {
			if !termPattern.MatchString(term) {
				t.Errorf("group %d term %q fails termPattern", i, term)
			}
			if prev, dup := seen[term]; dup && prev != i {
				t.Errorf("term %q appears in groups %d and %d", term, prev, i)
			}
			seen[term] = i
			if IsStopword(term) {
				t.Errorf("variant %q is also a stopword", term)
			}
		}
	}
}
