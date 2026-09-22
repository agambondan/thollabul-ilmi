package migrations

import (
	"fmt"
	"strings"
	"testing"
)

func TestQariCatalogIntegrity(t *testing.T) {
	if len(qariCatalog) == 0 {
		t.Fatal("qariCatalog is empty")
	}

	seenSlugs := make(map[string]bool)
	for i, q := range qariCatalog {
		if strings.TrimSpace(q.Name) == "" {
			t.Fatalf("qari[%d] has empty Name", i)
		}
		if strings.TrimSpace(q.Slug) == "" {
			t.Fatalf("qari[%d] %q has empty Slug", i, q.Name)
		}
		if seenSlugs[q.Slug] {
			t.Fatalf("duplicate qari slug %q", q.Slug)
		}
		seenSlugs[q.Slug] = true

		if strings.TrimSpace(q.EveryAyahDir) == "" {
			t.Fatalf("qari %q has empty EveryAyahDir", q.Name)
		}
		if strings.TrimSpace(q.QuranicAudio) == "" {
			t.Fatalf("qari %q has empty QuranicAudio", q.Name)
		}

		surahURL := surahAudioURL(q, 1)
		expectedPrefix := fmt.Sprintf("https://download.quranicaudio.com/quran/%s/001.mp3", q.QuranicAudio)
		if surahURL != expectedPrefix {
			t.Fatalf("qari %q: surah URL mismatch: got %s, want %s", q.Name, surahURL, expectedPrefix)
		}

		ayahURL := ayahAudioURL(q, 1, 1)
		expectedAyah := fmt.Sprintf("https://everyayah.com/data/%s/001001.mp3", q.EveryAyahDir)
		if ayahURL != expectedAyah {
			t.Fatalf("qari %q: ayah URL mismatch: got %s, want %s", q.Name, ayahURL, expectedAyah)
		}
	}
}
