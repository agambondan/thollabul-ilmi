package controllers

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
)

func TestInferLibraryResource(t *testing.T) {
	tests := []struct {
		filename    string
		contentType string
		format      model.LibraryBookFormat
		wantErr     bool
	}{
		{filename: "riyadhus-shalihin.pdf", contentType: "", format: model.LibraryBookFormatPDF},
		{filename: "arabic.epub", contentType: "application/octet-stream", format: model.LibraryBookFormatEPUB},
		{filename: "lesson.html", contentType: "text/html", format: model.LibraryBookFormatHTML},
		{filename: "notes.txt", contentType: "text/plain", wantErr: true},
	}

	for _, tt := range tests {
		format, contentType, err := inferLibraryResource(tt.filename, tt.contentType)
		if tt.wantErr {
			if err == nil {
				t.Fatalf("expected error for %s", tt.filename)
			}
			continue
		}
		if err != nil {
			t.Fatalf("infer %s: %v", tt.filename, err)
		}
		if format != tt.format {
			t.Fatalf("expected format %s, got %s", tt.format, format)
		}
		if contentType == "" {
			t.Fatalf("expected content type for %s", tt.filename)
		}
	}
}

func TestSafeLibraryFilename(t *testing.T) {
	got := safeLibraryFilename("../Riyadhus Shalihin (final).pdf")
	if got != "Riyadhus-Shalihin-final-.pdf" {
		t.Fatalf("unexpected safe filename: %s", got)
	}
	if got := safeLibraryFilename(".."); got != "resource" {
		t.Fatalf("expected resource fallback, got %s", got)
	}
}
