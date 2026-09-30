package model_test

import (
	"encoding/json"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
)

func TestDoaJSONKeepsTranslationRelationAndLegacyText(t *testing.T) {
	idn := "Ya Tuhanku, tambahkanlah ilmu kepadaku"
	doa := model.Doa{
		Title:           "Doa Sebelum Belajar",
		TranslationText: "legacy translation text",
		Translation:     &model.Translation{Idn: &idn},
	}

	raw, err := json.Marshal(doa)
	if err != nil {
		t.Fatalf("marshal doa: %v", err)
	}

	var decoded map[string]json.RawMessage
	if err := json.Unmarshal(raw, &decoded); err != nil {
		t.Fatalf("unmarshal doa json: %v", err)
	}

	relation, ok := decoded["translation"]
	if !ok {
		t.Fatalf("translation relation missing from JSON: %s", raw)
	}
	var relationObj map[string]any
	if err := json.Unmarshal(relation, &relationObj); err != nil {
		t.Fatalf("translation must be a JSON object, got %s: %v", relation, err)
	}
	if relationObj["idn"] != idn {
		t.Fatalf("translation.idn = %v, want %q", relationObj["idn"], idn)
	}

	var legacy string
	if err := json.Unmarshal(decoded["translation_text"], &legacy); err != nil {
		t.Fatalf("translation_text missing or not a string: %s: %v", raw, err)
	}
	if legacy != "legacy translation text" {
		t.Fatalf("translation_text = %q", legacy)
	}
}
