package migrations

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestStaticIslamicContentSourcesAreSpecific(t *testing.T) {
	files := []string{
		"amalan_item.json",
		"asbabun_nuzul.json",
		"doa.json",
		"dzikir.json",
		"fiqh_item.json",
		"manasik_step.json",
		"sholat_guide.json",
		"siroh_content.json",
	}

	vague := []string{
		"berbagai riwayat",
		"beberapa riwayat",
		"berbagai sumber",
		"sumber umum",
		"internet",
		"situs umum",
	}

	for _, name := range files {
		t.Run(name, func(t *testing.T) {
			items := readStaticContentSourceRows(t, name)
			for i, item := range items {
				title := item["title"]
				if title == "" {
					title = item["name"]
				}
				source := strings.TrimSpace(item["source"])
				if source == "" {
					t.Fatalf("%s[%d] %q missing source", name, i, title)
				}
				for _, pattern := range vague {
					if strings.Contains(strings.ToLower(source), pattern) {
						t.Fatalf("%s[%d] %q has vague source: %s", name, i, title, source)
					}
				}
				if !hasSpecificIslamicSource(source) {
					t.Fatalf("%s[%d] %q source is not specific enough: %s", name, i, title, source)
				}
			}
		})
	}
}

func readStaticContentSourceRows(t *testing.T, name string) []map[string]string {
	t.Helper()
	path := filepath.Join("..", "..", "..", "data", "static", name)
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", name, err)
	}
	var items []map[string]interface{}
	if err := json.Unmarshal(data, &items); err != nil {
		t.Fatalf("parse %s: %v", name, err)
	}
	rows := make([]map[string]string, 0, len(items))
	for _, item := range items {
		row := map[string]string{}
		for _, key := range []string{"title", "name", "source"} {
			if value, ok := item[key].(string); ok {
				row[key] = value
			}
		}
		rows = append(rows, row)
	}
	return rows
}

func hasSpecificIslamicSource(source string) bool {
	markers := []string{
		"QS.",
		"HR.",
		"No.",
		"hlm.",
		"Fathul Bari",
		"Al-Mughni",
		"Al-Majmu'",
		"Fathul Qarib",
		"Tafsir Ibnu Katsir",
		"Sirah Ibnu Hisyam",
		"Ar-Raheeq Al-Makhtum",
		"Sunan Kubra",
		"Shahihul Jami'",
		"Lubabun Nuqul",
		"As-Suyuthi",
		"Ibnu Abi Hatim",
		"Thabrani",
		"Al-Mu'jam",
		"Muqaddimah Ibnu Shalah",
		"Nukhbatul Fikar",
		"Tadribur Rawi",
		"Taqrib At-Tahdzib",
		"Tahdzib At-Tahdzib",
		"Siyar A'lam",
		"Taisir Musthalah",
		"Ibnu Hajar",
		"Adz-Dzahabi",
		"Al-Wahidi",
		"At-Tirmidzi",
		"An-Nasai",
		"Abu Dawud",
		"Ibnu Majah",
		"Al-Hakim",
		"Al-Baihaqi",
		"Ahmad",
	}
	for _, marker := range markers {
		if strings.Contains(source, marker) {
			return true
		}
	}
	return false
}
