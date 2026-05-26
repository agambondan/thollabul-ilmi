package migrations

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
	"unicode/utf8"
)

const (
	expectedQuranSurahCount = 114
	expectedQuranAyahCount  = 6236
	minTaggedQuranAyahs     = 5000
)

var quranHTMLTagPattern = regexp.MustCompile(`<[^>]+>`)

func TestQuranBaseFileIntegrity(t *testing.T) {
	data := loadQuranBaseFileForTest(t)

	if len(data.Surahs) != expectedQuranSurahCount {
		t.Fatalf("expected %d surahs, got %d", expectedQuranSurahCount, len(data.Surahs))
	}

	totalAyahs := 0
	taggedAyahs := 0
	for surahIndex, surah := range data.Surahs {
		expectedSurahNumber := surahIndex + 1
		if surah.Number != expectedSurahNumber {
			t.Fatalf("expected surah number %d at index %d, got %d", expectedSurahNumber, surahIndex, surah.Number)
		}
		if len(surah.Ayahs) == 0 {
			t.Fatalf("surah %d has no ayahs", surah.Number)
		}

		for ayahIndex, ayah := range surah.Ayahs {
			expectedAyahNumber := ayahIndex + 1
			if ayah.Number != expectedAyahNumber {
				t.Fatalf("expected ayah %d:%d, got ayah number %d", surah.Number, expectedAyahNumber, ayah.Number)
			}
			if strings.TrimSpace(ayah.Arabic) == "" {
				t.Fatalf("ayah %d:%d has empty arabic text", surah.Number, ayah.Number)
			}
			if strings.TrimSpace(ayah.ArHtml) == "" {
				t.Fatalf("ayah %d:%d has empty ar_html", surah.Number, ayah.Number)
			}
			if strings.TrimSpace(ayah.Indonesian) == "" {
				t.Fatalf("ayah %d:%d has empty Indonesian translation", surah.Number, ayah.Number)
			}
			if strings.TrimSpace(ayah.English) == "" {
				t.Fatalf("ayah %d:%d has empty English translation", surah.Number, ayah.Number)
			}
			if hasLeadingQuranNoise(ayah.Arabic) {
				t.Fatalf("ayah %d:%d arabic starts with leading text noise", surah.Number, ayah.Number)
			}
			if hasLeadingQuranNoise(ayah.ArHtml) {
				t.Fatalf("ayah %d:%d ar_html starts with leading text noise", surah.Number, ayah.Number)
			}
			if strings.Contains(ayah.ArHtml, "<tajweed") {
				taggedAyahs++
			}
			totalAyahs++
		}
	}

	if totalAyahs != expectedQuranAyahCount {
		t.Fatalf("expected %d ayahs, got %d", expectedQuranAyahCount, totalAyahs)
	}
	if taggedAyahs < minTaggedQuranAyahs {
		t.Fatalf("expected at least %d ayahs with tajweed tags, got %d", minTaggedQuranAyahs, taggedAyahs)
	}
}

func TestQuranBaseFileBasmalahPlacement(t *testing.T) {
	data := loadQuranBaseFileForTest(t)
	if len(data.Surahs) < 2 {
		t.Fatalf("expected at least 2 surahs, got %d", len(data.Surahs))
	}

	for _, surah := range data.Surahs {
		if len(surah.Ayahs) == 0 {
			t.Fatalf("surah %d has no ayahs", surah.Number)
		}
		firstAyah := surah.Ayahs[0]
		hasBasmalah := containsQuranBasmalah(firstAyah.Arabic) || containsQuranBasmalah(firstAyah.ArHtml)
		switch surah.Number {
		case 1:
			if !hasBasmalah {
				t.Fatalf("expected Al-Fatihah 1:1 to contain basmalah")
			}
		default:
			if hasBasmalah {
				t.Fatalf("expected surah %d:1 to not contain embedded basmalah", surah.Number)
			}
		}
	}

	baqarahFirstAyah := data.Surahs[1].Ayahs[0]
	if !strings.HasPrefix(plainQuranText(baqarahFirstAyah.Arabic), "الٓمٓ") {
		t.Fatalf("expected Al-Baqara 2:1 to start with alif laam miim, got %q", baqarahFirstAyah.Arabic)
	}
	if !strings.HasPrefix(plainQuranText(baqarahFirstAyah.ArHtml), "الٓمٓ") {
		t.Fatalf("expected Al-Baqara 2:1 ar_html to start with alif laam miim, got %q", baqarahFirstAyah.ArHtml)
	}
}

func loadQuranBaseFileForTest(t *testing.T) quranBaseJSON {
	t.Helper()

	path := filepath.Join("..", "..", "..", quranBaseDataFile)
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}

	var data quranBaseJSON
	if err := json.Unmarshal(raw, &data); err != nil {
		t.Fatalf("parse %s: %v", path, err)
	}
	return data
}

func hasLeadingQuranNoise(text string) bool {
	text = strings.TrimLeftFunc(text, func(r rune) bool {
		return r == ' ' || r == '\t' || r == '\n' || r == '\r'
	})
	if text == "" {
		return false
	}
	firstRune, _ := utf8.DecodeRuneInString(text)
	return firstRune == '\ufeff' || firstRune == '\u200b' || firstRune == '\u200c' || firstRune == '\u200d'
}

func containsQuranBasmalah(text string) bool {
	plain := plainQuranText(text)
	for _, prefix := range quranBasmalahPrefixes {
		if strings.Contains(plain, prefix) {
			return true
		}
	}
	return false
}

func plainQuranText(text string) string {
	return quranHTMLTagPattern.ReplaceAllString(text, "")
}
