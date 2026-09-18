package lib

import (
	"bytes"
	"strings"

	"github.com/ledongthuc/pdf"
)

type ExtractedPage struct {
	Number    int
	Text      string
	Confident bool
}

var commonIndonesianWords = []string{
	" yang ", " dan ", " ini ", " itu ", " dari ", " dengan ",
	" untuk ", " adalah ", " tidak ", " kepada ",
}

// ExtractPDFPages pulls per-page plain text out of a PDF's own text layer.
// It does not OCR scanned pages — a page with no text layer comes back
// empty, and garbled results are surfaced via Confident so a caller can
// flag which pages need a human (or OCR) to look at, rather than blindly
// trusting whatever the source PDF's embedded text contains. Some
// archive.org "text PDF" scans carry an already-corrupted OCR text layer
// baked in by whoever digitized them — pdftotext reproduces the same
// corruption, so this isn't a gap specific to this library.
func ExtractPDFPages(data []byte) ([]ExtractedPage, error) {
	r, err := pdf.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, err
	}

	pages := make([]ExtractedPage, 0, r.NumPage())
	for i := 1; i <= r.NumPage(); i++ {
		page := r.Page(i)
		if page.V.IsNull() {
			pages = append(pages, ExtractedPage{Number: i})
			continue
		}
		text, err := page.GetPlainText(nil)
		if err != nil {
			pages = append(pages, ExtractedPage{Number: i})
			continue
		}
		pages = append(pages, ExtractedPage{
			Number:    i,
			Text:      text,
			Confident: isLikelyCleanIndonesian(text),
		})
	}
	return pages, nil
}

// isLikelyCleanIndonesian is a cheap sanity check, not a language detector:
// real Indonesian prose reliably contains a handful of very common short
// words as whole tokens. Garbled/scrambled text does not, even when it
// superficially looks like ordinary Latin-letter prose.
func isLikelyCleanIndonesian(text string) bool {
	trimmed := strings.TrimSpace(text)
	if len(trimmed) < 40 {
		return trimmed == ""
	}
	lower := " " + strings.ToLower(trimmed) + " "
	hits := 0
	for _, word := range commonIndonesianWords {
		if strings.Contains(lower, word) {
			hits++
		}
	}
	return hits >= 2
}
