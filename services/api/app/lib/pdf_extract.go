package lib

import (
	"bytes"
	"math"
	"sort"
	"strings"

	"github.com/ledongthuc/pdf"
)

type ExtractedPage struct {
	Number    int
	Text      string
	Confident bool
}

type lineItem struct {
	x  float64
	w  float64
	s  string
	fs float64
}

type textLine struct {
	y     float64
	items []lineItem
}

var commonIndonesianWords = []string{
	" yang ", " dan ", " ini ", " itu ", " dari ", " dengan ",
	" untuk ", " adalah ", " tidak ", " kepada ",
}

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

		text := extractPageText(page)
		pages = append(pages, ExtractedPage{
			Number:    i,
			Text:      text,
			Confident: isLikelyCleanIndonesian(text),
		})
	}
	return pages, nil
}

func extractPageText(page pdf.Page) (result string) {
	defer func() {
		if r := recover(); r != nil {
			fallback, _ := page.GetPlainText(nil)
			result = strings.TrimSpace(fallback)
		}
	}()

	content := page.Content()
	texts := content.Text
	if len(texts) == 0 {
		fallback, _ := page.GetPlainText(nil)
		return strings.TrimSpace(fallback)
	}

	var lines []*textLine
	for _, t := range texts {
		if t.S == "" || t.S == "\n" {
			continue
		}

		tol := t.FontSize * 0.35
		if tol < 2.5 {
			tol = 2.5
		}

		var target *textLine
		for _, l := range lines {
			if math.Abs(l.y-t.Y) <= tol {
				target = l
				break
			}
		}

		if target == nil {
			target = &textLine{y: t.Y}
			lines = append(lines, target)
		}

		target.items = append(target.items, lineItem{
			x:  t.X,
			w:  t.W,
			s:  t.S,
			fs: t.FontSize,
		})
	}

	if len(lines) == 0 {
		fallback, _ := page.GetPlainText(nil)
		return strings.TrimSpace(fallback)
	}

	sort.SliceStable(lines, func(i, j int) bool {
		return lines[i].y > lines[j].y
	})

	for _, l := range lines {
		sort.SliceStable(l.items, func(i, j int) bool {
			return l.items[i].x < l.items[j].x
		})
	}

	var out strings.Builder
	var lastY float64
	var lastFS float64
	var hasPrev bool

	for _, l := range lines {
		lineStr := formatLine(l)
		if lineStr == "" {
			continue
		}

		if hasPrev {
			gapY := lastY - l.y
			fs := lastFS
			if fs <= 0 {
				fs = 12
			}
			if gapY > fs*2.5 {
				out.WriteString("\n\n")
			} else {
				out.WriteByte('\n')
			}
		}

		out.WriteString(lineStr)
		lastY = l.y
		if len(l.items) > 0 {
			lastFS = l.items[0].fs
		}
		hasPrev = true
	}

	return strings.TrimSpace(out.String())
}

func formatLine(l *textLine) string {
	var b strings.Builder
	for i, it := range l.items {
		if i > 0 {
			prev := l.items[i-1]
			spaceThreshold := math.Max(1.5, prev.fs*0.15)

			needsSpace := false
			if prev.w > 0 {
				gap := it.x - (prev.x + prev.w)
				if gap >= spaceThreshold {
					needsSpace = true
				}
			} else {
				if it.x-prev.x >= spaceThreshold {
					needsSpace = true
				}
			}

			if needsSpace && !strings.HasSuffix(b.String(), " ") && !strings.HasPrefix(it.s, " ") {
				b.WriteByte(' ')
			}
		}
		b.WriteString(it.s)
	}
	return strings.TrimSpace(b.String())
}

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
