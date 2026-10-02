//go:build ignore

package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/ledongthuc/pdf"
	"github.com/morkid/paginate"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func main() {
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASS")
	dbName := os.Getenv("DB_NAME")

	if dbHost == "" {
		dbHost = "localhost"
	}
	if dbPort == "" {
		dbPort = "54320"
	}
	if dbUser == "" {
		dbUser = "postgres"
	}
	if dbPass == "" {
		dbPass = "postgres"
	}
	if dbName == "" {
		dbName = "thullabul_ilmi"
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", dbHost, dbPort, dbUser, dbPass, dbName)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatal(err)
	}

	repo := repository.NewLibraryBookRepository(db, paginate.New())

	var books []model.LibraryBook
	db.Where("format = ? AND source_type = ? AND (extraction_status = ? OR extraction_status = ?)",
		model.LibraryBookFormatPDF,
		model.LibraryBookSourceUploaded,
		model.LibraryBookExtractNeedsOCR,
		model.LibraryBookExtractProcessing,
	).Order("id asc").Find(&books)

	if len(books) == 0 {
		log.Println("No books need OCR")
		return
	}

	log.Printf("Found %d books needing OCR\n", len(books))

	client := &http.Client{Timeout: 3 * time.Minute}
	tmpDir := "/tmp/ocr-library"
	os.MkdirAll(tmpDir, 0755)
	defer os.RemoveAll(tmpDir)

	for _, book := range books {
		bookID := *book.ID
		log.Printf("\n=== [%d] %s ===\n", bookID, book.Title)

		_ = repo.SetExtractionStatus(bookID, model.LibraryBookExtractProcessing, "OCR in progress...")

		resp, err := client.Get(book.SourceURL)
		if err != nil {
			log.Printf("Download failed: %v\n", err)
			_ = repo.SetExtractionStatus(bookID, model.LibraryBookExtractFailed, err.Error())
			continue
		}
		pdfBytes, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode != 200 {
			log.Printf("HTTP %d\n", resp.StatusCode)
			_ = repo.SetExtractionStatus(bookID, model.LibraryBookExtractFailed, fmt.Sprintf("HTTP %d", resp.StatusCode))
			continue
		}

		log.Printf("Downloaded %d KB\n", len(pdfBytes)/1024)

		// Try get page count
		r, err := pdf.NewReader(bytes.NewReader(pdfBytes), int64(len(pdfBytes)))
		if err != nil {
			log.Printf("PDF read failed: %v\n", err)
			_ = repo.SetExtractionStatus(bookID, model.LibraryBookExtractFailed, err.Error())
			continue
		}

		numPages := r.NumPage()
		log.Printf("Processing %d pages with OCR (throttled, low priority)...\n", numPages)

		// Save PDF once, then convert all pages to PNG in one go
		pdfPath := filepath.Join(tmpDir, fmt.Sprintf("book%d.pdf", bookID))
		os.WriteFile(pdfPath, pdfBytes, 0644)

		imgPrefix := filepath.Join(tmpDir, fmt.Sprintf("book%d_page", bookID))
		cmd := exec.Command("nice", "-n", "19", "pdftoppm",
			"-r", "300",
			"-png",
			pdfPath,
			imgPrefix,
		)
		if err := cmd.Run(); err != nil {
			log.Printf("pdftoppm failed: %v\n", err)
			_ = repo.SetExtractionStatus(bookID, model.LibraryBookExtractFailed, fmt.Sprintf("pdftoppm failed: %v", err))
			os.Remove(pdfPath)
			continue
		}

		// Determine zero-padding width based on total pages
		padWidth := len(strconv.Itoa(numPages))
		if padWidth < 2 {
			padWidth = 2
		}

		var ocrPages []model.LibraryBookExtractedText
		confidentCount := 0

		for pageNum := 1; pageNum <= numPages; pageNum++ {
			log.Printf("  Page %d/%d...", pageNum, numPages)

			// Find generated PNG with correct zero-padding
			pngPath := fmt.Sprintf("%s-%0*d.png", imgPrefix, padWidth, pageNum)
			if _, err := os.Stat(pngPath); os.IsNotExist(err) {
				log.Printf(" PNG not found: %s\n", pngPath)
				continue
			}

			// Run Tesseract OCR (low priority)
			txtPath := filepath.Join(tmpDir, fmt.Sprintf("page%d", pageNum))
			cmd = exec.Command("nice", "-n", "19", "tesseract",
				pngPath,
				txtPath,
				"-l", "ind+ara",
				"--psm", "6",
				"--oem", "1",
			)
			if err := cmd.Run(); err != nil {
				log.Printf(" tesseract failed: %v\n", err)
				os.Remove(pngPath)
				continue
			}

			// Read OCR result
			txtFile := txtPath + ".txt"
			textBytes, err := os.ReadFile(txtFile)
			if err != nil {
				log.Printf(" read txt failed: %v\n", err)
				os.Remove(pngPath)
				continue
			}

			text := strings.TrimSpace(string(textBytes))
			if text == "" {
				log.Printf(" empty\n")
				os.Remove(pngPath)
				os.Remove(txtFile)
				continue
			}

			// Check confidence (simple heuristic: has common Indonesian words)
			confident := strings.Contains(strings.ToLower(text), " yang ") ||
				strings.Contains(strings.ToLower(text), " dan ") ||
				strings.Contains(strings.ToLower(text), " adalah ")

			if confident {
				confidentCount++
			}

			ocrPages = append(ocrPages, model.LibraryBookExtractedText{
				LibraryBookID:    bookID,
				PageNumber:       pageNum,
				Text:             text,
				ExtractionMethod: "tesseract_ocr",
				Confident:        confident,
			})

			log.Printf(" OK (%d chars, confident: %v)\n", len(text), confident)

			// Cleanup temp files
			os.Remove(pngPath)
			os.Remove(txtFile)
		}

		// Cleanup PDF
		os.Remove(pdfPath)

		if len(ocrPages) == 0 {
			log.Printf("No text extracted from OCR\n")
			_ = repo.SetExtractionStatus(bookID, model.LibraryBookExtractFailed, "OCR produced no text")
			continue
		}

		// Upsert / save in batches or as we go, but here we can just save all
		// Update book pages count
		_ = db.Model(&model.LibraryBook{}).Where("id = ?", bookID).Update("pages", len(ocrPages))

		// Save to database
		if err := repo.SaveExtractedPages(bookID, ocrPages); err != nil {
			log.Printf("Save failed: %v\n", err)
			_ = repo.SetExtractionStatus(bookID, model.LibraryBookExtractFailed, err.Error())
			continue
		}

		status := model.LibraryBookExtractDone
		note := fmt.Sprintf("OCR: %d pages extracted via Tesseract", len(ocrPages))
		if confidentCount < len(ocrPages)/2 {
			status = model.LibraryBookExtractLowConfidence
			note = fmt.Sprintf("OCR: Hanya %d dari %d halaman yang lolos cek kualitas — hasil OCR mungkin kurang akurat", confidentCount, len(ocrPages))
		}

		_ = repo.SetExtractionStatus(bookID, status, note)
		log.Printf("DONE: %s, %d pages, %d confident\n", status, len(ocrPages), confidentCount)
	}

	log.Println("\n=== OCR Complete ===")
}
