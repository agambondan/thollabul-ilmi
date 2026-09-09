// Package textsearch prepares free-text user queries for the kajian transcript
// search. It is deliberately dependency-free so the repository layer can build
// Postgres tsquery / regex fragments (and sqlite LIKE fallbacks for tests) from
// one parsed representation.
//
// Pipeline: normalise (lowercase, unify apostrophes) -> tokenize -> drop
// Indonesian stopwords -> expand each remaining token to its spelling-variant
// group. YouTube auto-captions use standard (KBBI) spelling — "salat", "hadis",
// "ustaz", "zikir" — while users overwhelmingly type the pesantren spelling —
// "sholat", "hadits", "ustadz", "dzikir". Without the variant groups those
// queries return zero rows, so the groups are the single most valuable part of
// this package.
package textsearch

import (
	"regexp"
	"sort"
	"strings"
	"unicode"
)

// Group is one query concept: the user's normalised token plus every spelling
// variant that should match it.
type Group struct {
	Source string
	Terms  []string
}

// Query is the parsed representation of a raw search string.
type Query struct {
	// Raw is the trimmed user input.
	Raw string
	// Words are the whitespace-separated words of Raw, lowercased with unified
	// apostrophes and stripped of surrounding punctuation. Used for the exact
	// phrase regex, so stopwords are kept.
	Words []string
	// Groups are the concept groups used by the stemmed / semantic paths.
	// Stopwords are removed unless the whole query is stopwords.
	Groups []Group
}

var termPattern = regexp.MustCompile(`^[a-z0-9]+$`)

// Parse normalises and expands a raw query. It never returns an error: an
// empty or punctuation-only query yields a Query with IsEmpty() == true.
func Parse(raw string) Query {
	q := Query{Raw: strings.TrimSpace(raw)}
	if q.Raw == "" {
		return q
	}
	lower := unifyApostrophes(strings.ToLower(q.Raw))
	for _, w := range strings.Fields(lower) {
		w = strings.TrimFunc(w, func(r rune) bool {
			return !unicode.IsLetter(r) && !unicode.IsDigit(r) && r != '\''
		})
		if strings.IndexFunc(w, func(r rune) bool { return unicode.IsLetter(r) || unicode.IsDigit(r) }) >= 0 {
			q.Words = append(q.Words, w)
		}
	}

	tokens := Tokenize(lower)
	kept := make([]string, 0, len(tokens))
	for _, t := range tokens {
		if !IsStopword(t) {
			kept = append(kept, t)
		}
	}
	if len(kept) == 0 {
		kept = tokens
	}
	seen := make(map[string]struct{}, len(kept))
	for _, t := range kept {
		if _, dup := seen[t]; dup {
			continue
		}
		seen[t] = struct{}{}
		q.Groups = append(q.Groups, Group{Source: t, Terms: Variants(t)})
	}
	return q
}

// IsEmpty reports whether the query has nothing searchable.
func (q Query) IsEmpty() bool { return len(q.Words) == 0 && len(q.Groups) == 0 }

// Tokenize lowercases, removes apostrophes ("qur'an" -> "quran", "jum'at" ->
// "jumat") and splits on every other non-letter/non-digit rune. Single-rune
// tokens are dropped.
func Tokenize(text string) []string {
	lower := strings.ReplaceAll(unifyApostrophes(strings.ToLower(text)), "'", "")
	parts := strings.FieldsFunc(lower, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if len([]rune(p)) < 2 {
			continue
		}
		out = append(out, p)
	}
	return out
}

func unifyApostrophes(s string) string {
	return strings.NewReplacer("’", "'", "‘", "'", "`", "'", "ʼ", "'").Replace(s)
}

// PhraseRegex returns a Postgres ARE regex that matches the query as one
// whole-word phrase, tolerating whitespace or hyphens between words:
// "hukum riba" -> `\mhukum[\s-]+riba\M` (so "al quran" also matches
// "al-quran"). Empty when the query has no words.
// Callers must bind it as a parameter (never interpolate it into SQL).
func (q Query) PhraseRegex() string {
	if len(q.Words) == 0 {
		return ""
	}
	parts := make([]string, len(q.Words))
	for i, w := range q.Words {
		parts[i] = regexp.QuoteMeta(w)
	}
	return `\m` + strings.Join(parts, `[\s-]+`) + `\M`
}

// TSQuery renders the group as a tsquery fragment: (a | b | c). Terms that are
// not plain [a-z0-9]+ are skipped so the fragment can never break the tsquery
// grammar. Empty when nothing survives.
func (g Group) TSQuery() string {
	terms := make([]string, 0, len(g.Terms))
	for _, t := range g.Terms {
		if termPattern.MatchString(t) {
			terms = append(terms, t)
		}
	}
	switch len(terms) {
	case 0:
		return ""
	case 1:
		return terms[0]
	default:
		return "(" + strings.Join(terms, " | ") + ")"
	}
}

// GroupQueries returns the non-empty per-group tsquery fragments, in order.
func (q Query) GroupQueries() []string {
	out := make([]string, 0, len(q.Groups))
	for _, g := range q.Groups {
		if s := g.TSQuery(); s != "" {
			out = append(out, s)
		}
	}
	return out
}

// TSQueryAll requires every concept: (a | b) & (c | d).
func (q Query) TSQueryAll() string { return strings.Join(q.GroupQueries(), " & ") }

// TSQueryAny accepts any concept: (a | b) | (c | d).
func (q Query) TSQueryAny() string { return strings.Join(q.GroupQueries(), " | ") }

// HighlightTerms lists every variant term across all groups so a client can
// highlight matches that differ from what the user typed ("sholat" query,
// "salat" in the transcript). Deduplicated and sorted for stable output.
func (q Query) HighlightTerms() []string {
	seen := map[string]struct{}{}
	for _, g := range q.Groups {
		for _, t := range g.Terms {
			seen[t] = struct{}{}
		}
	}
	out := make([]string, 0, len(seen))
	for t := range seen {
		out = append(out, t)
	}
	sort.Strings(out)
	return out
}

// Variants returns the spelling-variant group containing token (always
// including token itself, sorted, deduplicated).
func Variants(token string) []string {
	set := map[string]struct{}{token: {}}
	if idx, ok := variantIndex[token]; ok {
		for _, v := range variantGroups[idx] {
			set[v] = struct{}{}
		}
	}
	out := make([]string, 0, len(set))
	for v := range set {
		out = append(out, v)
	}
	sort.Strings(out)
	return out
}

// IsStopword reports whether token is in the Indonesian stopword list.
func IsStopword(token string) bool {
	_, ok := stopwords[token]
	return ok
}
