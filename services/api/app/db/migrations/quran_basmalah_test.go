package migrations

import "testing"

func TestCleanQuranArabicTextStripsLeadingBasmalahOutsideFatihahAndTawbah(t *testing.T) {
	got := cleanQuranArabicText(2, 1, "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ الٓمٓ")
	if got != "الٓمٓ" {
		t.Fatalf("expected basmalah stripped from Al-Baqara 2:1, got %q", got)
	}
}

func TestCleanQuranArabicTextKeepsFatihahAndTawbah(t *testing.T) {
	fatihah := "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
	if got := cleanQuranArabicText(1, 1, fatihah); got != fatihah {
		t.Fatalf("expected Al-Fatihah basmalah to remain, got %q", got)
	}

	tawbah := "بَرَآءَةٌ مِّنَ ٱللَّهِ"
	if got := cleanQuranArabicText(9, 1, tawbah); got != tawbah {
		t.Fatalf("expected At-Tawbah text to remain, got %q", got)
	}
}
