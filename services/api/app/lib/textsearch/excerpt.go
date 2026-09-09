package textsearch

import (
	"strings"
	"unicode"
)

// Indonesian affixes tried (longest first) when a query word is not found
// verbatim in a text, so "mengatasi" still locates "atasi"/"diatasi" and
// "kesabaran" locates "sabar". This only steers the excerpt window; matching
// itself is done by Postgres.
var (
	prefixes = []string{"meng", "meny", "mem", "men", "peng", "peny", "pem", "pen", "ber", "ter", "per", "me", "pe", "di", "ke", "se", "be"}
	suffixes = []string{"kannya", "annya", "inya", "kan", "an", "i", "nya", "lah", "kah"}
)

// SnippetTerms returns the strings to look for when choosing which part of a
// chunk to show, most specific first: the whole phrase, each word, each
// spelling variant, then affix-stripped stems of each word.
func (q Query) SnippetTerms() []string {
	var out []string
	seen := map[string]struct{}{}
	add := func(t string) {
		t = strings.ToLower(strings.TrimSpace(t))
		if len([]rune(t)) < 3 {
			return
		}
		if _, dup := seen[t]; dup {
			return
		}
		seen[t] = struct{}{}
		out = append(out, t)
	}
	if len(q.Words) > 1 {
		add(strings.Join(q.Words, " "))
	}
	for _, w := range q.Words {
		if !IsStopword(strings.ReplaceAll(w, "'", "")) {
			add(w)
		}
	}
	for _, t := range q.HighlightTerms() {
		add(t)
	}
	for _, g := range q.Groups {
		for _, stem := range stripAffixes(g.Source) {
			add(stem)
		}
	}
	return out
}

// stripAffixes returns progressively shorter stems of a word (prefix removed,
// suffix removed, both removed), longest first. It is a heuristic, not a
// morphological analyser; it never returns stems shorter than 4 runes.
func stripAffixes(word string) []string {
	var out []string
	add := func(s string) {
		if len([]rune(s)) >= 4 && s != word {
			for _, o := range out {
				if o == s {
					return
				}
			}
			out = append(out, s)
		}
	}
	noPrefix := word
	for _, p := range prefixes {
		if strings.HasPrefix(word, p) && len([]rune(word))-len([]rune(p)) >= 4 {
			noPrefix = strings.TrimPrefix(word, p)
			break
		}
	}
	noSuffix := func(w string) string {
		for _, s := range suffixes {
			if strings.HasSuffix(w, s) && len([]rune(w))-len([]rune(s)) >= 4 {
				return strings.TrimSuffix(w, s)
			}
		}
		return w
	}
	add(noPrefix)
	add(noSuffix(word))
	add(noSuffix(noPrefix))
	return out
}

// Excerpt returns a window of roughly maxRunes runes from text around the
// first occurrence of the highest-priority term. If no term occurs, the head
// of the text is returned. Cut edges are snapped to whitespace and marked with
// an ellipsis. Matching is case-insensitive and rune-safe.
func Excerpt(text string, terms []string, maxRunes int) string {
	text = strings.TrimSpace(text)
	runes := []rune(text)
	if maxRunes <= 0 || len(runes) <= maxRunes {
		return text
	}
	lowerRunes := []rune(strings.ToLower(text))
	if len(lowerRunes) != len(runes) {
		// ToLower changed the rune count (rare scripts); fall back to the head.
		return string(runes[:cutAtSpace(runes, maxRunes)]) + "…"
	}
	lower := string(lowerRunes)

	hit := -1
	for _, term := range terms {
		if idx := strings.Index(lower, strings.ToLower(term)); idx >= 0 {
			hit = len([]rune(lower[:idx]))
			break
		}
	}
	if hit < 0 {
		return string(runes[:cutAtSpace(runes, maxRunes)]) + "…"
	}

	start := hit - maxRunes/3
	if start < 0 {
		start = 0
	}
	end := start + maxRunes
	if end > len(runes) {
		end = len(runes)
		start = end - maxRunes
		if start < 0 {
			start = 0
		}
	}
	// Snap to word boundaries so we never cut a word in half.
	if start > 0 {
		for start < hit && !unicode.IsSpace(runes[start-1]) {
			start++
		}
	}
	if end < len(runes) {
		end = cutAtSpace(runes, end)
		if end <= hit {
			end = len(runes)
		}
	}
	out := string(runes[start:end])
	if start > 0 {
		out = "…" + out
	}
	if end < len(runes) {
		out += "…"
	}
	return out
}

// cutAtSpace moves limit back to the last whitespace before it (but never
// below half the limit, so a single very long token still gets cut).
func cutAtSpace(runes []rune, limit int) int {
	if limit >= len(runes) {
		return len(runes)
	}
	for i := limit; i > limit/2; i-- {
		if unicode.IsSpace(runes[i]) {
			return i
		}
	}
	return limit
}

// BestFuzzyToken returns the word in text that is most trigram-similar to
// word (Dice coefficient over padded character trigrams, the same shape
// pg_trgm uses) when that similarity is at least minSimilarity, else "".
// It lets the excerpt and the highlighter find the surface form pg_trgm
// matched ("riba" for a "ribaa" query) without another round-trip.
func BestFuzzyToken(text, word string, minSimilarity float64) string {
	word = strings.ToLower(strings.TrimSpace(word))
	if len([]rune(word)) < 3 {
		return ""
	}
	target := trigramSet(word)
	best, bestScore := "", 0.0
	seen := map[string]struct{}{}
	for _, tok := range Tokenize(text) {
		if _, dup := seen[tok]; dup {
			continue
		}
		seen[tok] = struct{}{}
		if len([]rune(tok)) < 3 {
			continue
		}
		set := trigramSet(tok)
		common := 0
		for t := range set {
			if _, ok := target[t]; ok {
				common++
			}
		}
		score := 2 * float64(common) / float64(len(set)+len(target))
		if score > bestScore {
			best, bestScore = tok, score
		}
	}
	if bestScore < minSimilarity {
		return ""
	}
	return best
}

func trigramSet(word string) map[string]struct{} {
	runes := []rune("  " + word + " ")
	out := make(map[string]struct{}, len(runes))
	for i := 0; i+3 <= len(runes); i++ {
		out[string(runes[i:i+3])] = struct{}{}
	}
	return out
}
