package repository

import "testing"

func TestParseSurahNumberLookup(t *testing.T) {
	tests := []struct {
		name string
		want int
		ok   bool
	}{
		{name: "1-Al-Fatihah", want: 1, ok: true},
		{name: "114/An-Naas", want: 114, ok: true},
		{name: "Al-Fatihah", ok: false},
		{name: "115-Al-Fatihah", ok: false},
	}

	for _, tt := range tests {
		got, ok := parseSurahNumberLookup(tt.name)
		if ok != tt.ok {
			t.Fatalf("%s: expected ok=%v, got %v", tt.name, tt.ok, ok)
		}
		if ok && *got != tt.want {
			t.Fatalf("%s: expected %d, got %d", tt.name, tt.want, *got)
		}
	}
}

func TestSurahNameCandidates(t *testing.T) {
	got := surahNameCandidates("Al-Faatihah")
	want := map[string]bool{
		"al-faatihah": true,
		"al faatihah": true,
		"al-faatiha":  true,
		"al faatiha":  true,
	}

	for candidate := range want {
		if !containsString(got, candidate) {
			t.Fatalf("expected candidates %v to contain %q", got, candidate)
		}
	}
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}
