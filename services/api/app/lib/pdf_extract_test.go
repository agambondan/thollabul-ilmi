package lib

import (
	"bytes"
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func createTestPDFWithWidths(contentStreams ...string) []byte {
	var pdfBuf bytes.Buffer
	pdfBuf.WriteString("%PDF-1.4\n")

	numPages := len(contentStreams)
	pageObjIDs := make([]int, numPages)
	for i := 0; i < numPages; i++ {
		pageObjIDs[i] = 3 + i
	}

	offsets := make(map[int]int)
	writeObject := func(number int, body string) {
		offsets[number] = pdfBuf.Len()
		fmt.Fprintf(&pdfBuf, "%d 0 obj\n%s\nendobj\n", number, body)
	}
	writeStream := func(number int, dict, content string) {
		writeObject(number, fmt.Sprintf("<< %s /Length %d >>\nstream\n%s\nendstream", dict, len(content), content))
	}

	writeObject(1, "<< /Type /Catalog /Pages 2 0 R >>")

	kids := ""
	for _, id := range pageObjIDs {
		kids += fmt.Sprintf("%d 0 R ", id)
	}
	writeObject(2, fmt.Sprintf("<< /Type /Pages /Kids [%s] /Count %d >>", kids, numPages))

	fontObjID := 3 + numPages*2
	for i, cs := range contentStreams {
		pID := pageObjIDs[i]
		cID := 3 + numPages + i
		writeObject(pID, fmt.Sprintf("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 %d 0 R >> >> /Contents %d 0 R >>", fontObjID, cID))
		writeStream(cID, "", cs)
	}

	// Font with FirstChar=32, LastChar=126, Widths array 500 for each char (0.5 em)
	widths := "["
	for i := 32; i <= 126; i++ {
		widths += " 500"
	}
	widths += " ]"
	writeObject(fontObjID, fmt.Sprintf("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding /FirstChar 32 /LastChar 126 /Widths %s >>", widths))

	totalObjs := fontObjID
	xrefOffset := pdfBuf.Len()
	pdfBuf.WriteString(fmt.Sprintf("xref\n0 %d\n0000000000 65535 f \n", totalObjs+1))
	for num := 1; num <= totalObjs; num++ {
		fmt.Fprintf(&pdfBuf, "%010d 00000 n \n", offsets[num])
	}
	fmt.Fprintf(&pdfBuf, "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", totalObjs+1, xrefOffset)
	return pdfBuf.Bytes()
}

func createTestPDFWithoutWidths(contentStreams ...string) []byte {
	var pdfBuf bytes.Buffer
	pdfBuf.WriteString("%PDF-1.4\n")

	numPages := len(contentStreams)
	pageObjIDs := make([]int, numPages)
	for i := 0; i < numPages; i++ {
		pageObjIDs[i] = 3 + i
	}

	offsets := make(map[int]int)
	writeObject := func(number int, body string) {
		offsets[number] = pdfBuf.Len()
		fmt.Fprintf(&pdfBuf, "%d 0 obj\n%s\nendobj\n", number, body)
	}
	writeStream := func(number int, dict, content string) {
		writeObject(number, fmt.Sprintf("<< %s /Length %d >>\nstream\n%s\nendstream", dict, len(content), content))
	}

	writeObject(1, "<< /Type /Catalog /Pages 2 0 R >>")

	kids := ""
	for _, id := range pageObjIDs {
		kids += fmt.Sprintf("%d 0 R ", id)
	}
	writeObject(2, fmt.Sprintf("<< /Type /Pages /Kids [%s] /Count %d >>", kids, numPages))

	fontObjID := 3 + numPages*2
	for i, cs := range contentStreams {
		pID := pageObjIDs[i]
		cID := 3 + numPages + i
		writeObject(pID, fmt.Sprintf("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 %d 0 R >> >> /Contents %d 0 R >>", fontObjID, cID))
		writeStream(cID, "", cs)
	}

	writeObject(fontObjID, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")

	totalObjs := fontObjID
	xrefOffset := pdfBuf.Len()
	pdfBuf.WriteString(fmt.Sprintf("xref\n0 %d\n0000000000 65535 f \n", totalObjs+1))
	for num := 1; num <= totalObjs; num++ {
		fmt.Fprintf(&pdfBuf, "%010d 00000 n \n", offsets[num])
	}
	fmt.Fprintf(&pdfBuf, "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", totalObjs+1, xrefOffset)
	return pdfBuf.Bytes()
}

func TestExtractPDFPages_WithWidths(t *testing.T) {
	cs := `
BT
/F1 12 Tf
50 750 Td
[ (Kitab) -300 (Tauhid) ] TJ
0 -20 Td
[ (Syaikh) -250 (Muhammad) -250 (At-Tamimi) ] TJ
0 -30 Td
(Daftar Isi Tentang Dokumen Ini) Tj
ET
`
	pdfData := createTestPDFWithWidths(cs)
	pages, err := ExtractPDFPages(pdfData)
	assert.NoError(t, err)
	assert.Len(t, pages, 1)

	text := pages[0].Text
	t.Logf("Extracted with widths:\n%s", text)

	assert.Contains(t, text, "Kitab Tauhid")
	assert.Contains(t, text, "Syaikh Muhammad At-Tamimi")
	assert.Contains(t, text, "Daftar Isi Tentang Dokumen Ini")

	lines := strings.Split(strings.TrimSpace(text), "\n")
	assert.Equal(t, 3, len(lines))
	assert.Equal(t, "Kitab Tauhid", strings.TrimSpace(lines[0]))
	assert.Equal(t, "Syaikh Muhammad At-Tamimi", strings.TrimSpace(lines[1]))
	assert.Equal(t, "Daftar Isi Tentang Dokumen Ini", strings.TrimSpace(lines[2]))
}

func TestExtractPDFPages_WithoutWidths(t *testing.T) {
	cs := `
BT
/F1 12 Tf
50 750 Td
[ (Kitab) -300 (Tauhid) ] TJ
0 -20 Td
[ (Syaikh) -250 (Muhammad) -250 (At-Tamimi) ] TJ
0 -30 Td
(Daftar Isi Tentang Dokumen Ini) Tj
ET
`
	pdfData := createTestPDFWithoutWidths(cs)
	pages, err := ExtractPDFPages(pdfData)
	assert.NoError(t, err)
	assert.Len(t, pages, 1)

	text := pages[0].Text
	t.Logf("Extracted without widths:\n%s", text)

	assert.Contains(t, text, "Kitab Tauhid")
	assert.Contains(t, text, "Syaikh Muhammad At-Tamimi")
	assert.Contains(t, text, "Daftar Isi Tentang Dokumen Ini")

	lines := strings.Split(strings.TrimSpace(text), "\n")
	assert.Equal(t, 3, len(lines))
}

func TestExtractPDFPages_IndonesianConfidence(t *testing.T) {
	cs := `
BT
/F1 12 Tf
50 750 Td
(Ini adalah buku tentang aqidah yang sangat penting dan bermanfaat untuk kita.) Tj
0 -20 Td
(Buku ini menjelaskan tauhid dari berbagai aspek dengan dalil yang shahih.) Tj
ET
`
	pdfData := createTestPDFWithWidths(cs)
	pages, err := ExtractPDFPages(pdfData)
	assert.NoError(t, err)
	assert.Len(t, pages, 1)
	assert.True(t, pages[0].Confident)
}

func TestExtractPDFPages_KerningVsSpace(t *testing.T) {
	// Kerning between 'A' and 'V' (-50 kerning units = 0.6pt), space between words (-300 = 3.6pt)
	cs := `
BT
/F1 12 Tf
50 750 Td
[ (A) -50 (V) -300 (W) -50 (A) ] TJ
ET
`
	pdfData := createTestPDFWithoutWidths(cs)
	pages, err := ExtractPDFPages(pdfData)
	assert.NoError(t, err)
	assert.Len(t, pages, 1)

	text := pages[0].Text
	t.Logf("Kerning test output: %q", text)
	assert.Equal(t, "AV WA", text)
}
