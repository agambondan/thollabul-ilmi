package service

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ContentReportService interface {
	Create(userID uuid.UUID, req *model.CreateContentReportRequest) (*model.ContentReport, error)
	FindByID(id string) (*model.ContentReport, error)
	FindAll(status model.ContentReportStatus, targetType model.ContentReportTargetType, page, limit int) ([]model.ContentReport, int64, error)
	UpdateStatus(id string, reviewerID uuid.UUID, req *model.UpdateContentReportStatusRequest) (*model.ContentReport, error)
	FindMine(userID uuid.UUID, page, limit int) ([]model.ContentReport, int64, error)
	ApplyCorrection(id string, reviewerID uuid.UUID, req *model.ApplyContentReportRequest) (*model.ContentReport, error)
}

type contentReportService struct {
	repo          repository.ContentReportRepository
	inbox         repository.NotificationInboxRepository
	repos         *repository.Repositories
	notification  NotificationService
}

func NewContentReportService(
	repo repository.ContentReportRepository,
	inbox repository.NotificationInboxRepository,
	repos *repository.Repositories,
	notification NotificationService,
) ContentReportService {
	return &contentReportService{
		repo:         repo,
		inbox:        inbox,
		repos:        repos,
		notification: notification,
	}
}

var validReportTarget = map[model.ContentReportTargetType]bool{
	model.ContentReportTargetQuran:   true,
	model.ContentReportTargetHadith:  true,
	model.ContentReportTargetFiqh:    true,
	model.ContentReportTargetDoa:     true,
	model.ContentReportTargetSiroh:   true,
	model.ContentReportTargetDzikir:  true,
	model.ContentReportTargetGeneral: true,
}

var validReportCategory = map[model.ContentReportCategory]bool{
	model.ContentReportCategoryTranslation:  true,
	model.ContentReportCategoryArabicText:   true,
	model.ContentReportCategoryTafsir:       true,
	model.ContentReportCategorySanadGrading: true,
	model.ContentReportCategoryTypo:         true,
	model.ContentReportCategoryOther:        true,
}

var validReportStatus = map[model.ContentReportStatus]bool{
	model.ContentReportStatusPending:  true,
	model.ContentReportStatusReviewed: true,
	model.ContentReportStatusResolved: true,
	model.ContentReportStatusRejected: true,
}

const rewardPointsPerAcceptedReport = 25

func (s *contentReportService) Create(userID uuid.UUID, req *model.CreateContentReportRequest) (*model.ContentReport, error) {
	if req == nil {
		return nil, errors.New("request body required")
	}
	if !validReportTarget[req.TargetType] {
		return nil, errors.New("invalid target_type")
	}
	if !validReportCategory[req.Category] {
		return nil, errors.New("invalid category")
	}
	if strings.TrimSpace(req.TargetID) == "" {
		return nil, errors.New("target_id required")
	}
	if strings.TrimSpace(req.Description) == "" {
		return nil, errors.New("description required")
	}

	report := &model.ContentReport{
		UserID:      userID,
		TargetType:  req.TargetType,
		TargetID:    strings.TrimSpace(req.TargetID),
		TargetTitle: strings.TrimSpace(req.TargetTitle),
		Category:    req.Category,
		Description: strings.TrimSpace(req.Description),
		Correction:  strings.TrimSpace(req.Correction),
		Status:      model.ContentReportStatusPending,
	}
	return s.repo.Create(report)
}

func (s *contentReportService) FindByID(id string) (*model.ContentReport, error) {
	return s.repo.FindByID(id)
}

func (s *contentReportService) FindAll(status model.ContentReportStatus, targetType model.ContentReportTargetType, page, limit int) ([]model.ContentReport, int64, error) {
	if status != "" && !validReportStatus[status] {
		return nil, 0, errors.New("invalid status")
	}
	if targetType != "" && !validReportTarget[targetType] {
		return nil, 0, errors.New("invalid target_type")
	}
	return s.repo.FindAll(status, targetType, page, limit)
}

func (s *contentReportService) UpdateStatus(id string, reviewerID uuid.UUID, req *model.UpdateContentReportStatusRequest) (*model.ContentReport, error) {
	if req == nil || !validReportStatus[req.Status] {
		return nil, errors.New("invalid status")
	}
	updated, err := s.repo.UpdateStatus(id, req.Status, strings.TrimSpace(req.AdminNote), reviewerID)
	if err != nil {
		return nil, err
	}

	s.notifyReporter(updated, req.Status, req.AdminNote)
	return updated, nil
}

func (s *contentReportService) FindMine(userID uuid.UUID, page, limit int) ([]model.ContentReport, int64, error) {
	return s.repo.FindByUser(userID, page, limit)
}

func (s *contentReportService) ApplyCorrection(id string, reviewerID uuid.UUID, req *model.ApplyContentReportRequest) (*model.ContentReport, error) {
	if req == nil {
		return nil, errors.New("request body required")
	}
	report, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("report not found")
	}
	correctionText := strings.TrimSpace(req.CorrectionText)
	if correctionText == "" {
		correctionText = strings.TrimSpace(report.Correction)
	}
	if correctionText == "" {
		return nil, errors.New("correction text is empty")
	}
	if s.repos == nil {
		return nil, errors.New("entity repository unavailable")
	}

	if err := s.applyToEntity(report.TargetType, report.TargetID, req.Field, correctionText); err != nil {
		return nil, err
	}

	updated, err := s.repo.UpdateStatus(id, model.ContentReportStatusResolved, strings.TrimSpace(req.AdminNote), reviewerID)
	if err != nil {
		return nil, err
	}

	if s.repos.Achievement != nil && updated.UserID != uuid.Nil {
		_ = s.repos.Achievement.AddPoints(updated.UserID, rewardPointsPerAcceptedReport)
	}

	s.notifyReporter(updated, model.ContentReportStatusResolved, req.AdminNote)
	return updated, nil
}

func (s *contentReportService) applyToEntity(targetType model.ContentReportTargetType, targetID, field, text string) error {
	if s.repos == nil {
		return errors.New("repos unavailable")
	}
	lang := resolveFieldLang(field)
	if lang == "" {
		return fmt.Errorf("unsupported field %q (use: idn, en, latin_idn, description_idn, description_en, content, translation)", field)
	}
	db := s.repos.GetDB()

	switch targetType {
	case model.ContentReportTargetQuran:
		ayahID, err := parseAyahID(targetID)
		if err != nil {
			return err
		}
		return s.updateTranslationByAyahNumber(db, ayahID, lang, text)
	case model.ContentReportTargetHadith:
		bookSlug, number, err := parseHadithTarget(targetID)
		if err != nil {
			return err
		}
		return s.updateTranslationByHadithSlugNumber(db, bookSlug, number, lang, text)
	case model.ContentReportTargetDoa:
		return s.updateDoaTranslation(db, targetID, lang, text)
	case model.ContentReportTargetDzikir:
		return s.updateDzikirTranslation(db, targetID, lang, text)
	case model.ContentReportTargetFiqh:
		return s.updateFiqhItemContent(db, targetID, lang, text)
	case model.ContentReportTargetSiroh:
		return s.updateSirohContent(db, targetID, lang, text)
	default:
		return fmt.Errorf("apply correction not supported for target_type %q", targetType)
	}
}

func (s *contentReportService) updateTranslationByAyahNumber(db *gorm.DB, ayahRef string, lang, text string) error {
	if lang == "content" {
		lang = "idn"
	}
	parts := strings.SplitN(ayahRef, ":", 2)
	if len(parts) != 2 {
		return fmt.Errorf("invalid quran target id %q (expected surah:ayah)", ayahRef)
	}
	surahNumber, err := strconv.Atoi(parts[0])
	if err != nil {
		return fmt.Errorf("invalid surah number: %v", err)
	}
	ayahNumber, err := strconv.Atoi(parts[1])
	if err != nil {
		return fmt.Errorf("invalid ayah number: %v", err)
	}

	var ayah model.Ayah
	if err := db.Joins("JOIN surahs ON surahs.id = ayahs.surah_id").
		Where("surahs.number = ? AND ayahs.number = ?", surahNumber, ayahNumber).
		First(&ayah).Error; err != nil {
		return fmt.Errorf("ayah not found: %v", err)
	}
	if ayah.TranslationID == nil {
		return errors.New("ayah has no translation row")
	}
	return s.updateTranslationRow(db, *ayah.TranslationID, lang, text)
}

func (s *contentReportService) updateTranslationByHadithSlugNumber(db *gorm.DB, bookSlug string, number int, lang, text string) error {
	if lang == "content" {
		lang = "idn"
	}
	var hadith model.Hadith
	if err := db.Joins("JOIN books ON books.id = hadiths.book_id").
		Where("books.slug = ? AND hadiths.number = ?", bookSlug, number).
		First(&hadith).Error; err != nil {
		return fmt.Errorf("hadith not found: %v", err)
	}
	if hadith.TranslationID == nil {
		return errors.New("hadith has no translation row")
	}
	return s.updateTranslationRow(db, *hadith.TranslationID, lang, text)
}

func (s *contentReportService) updateDoaTranslation(db *gorm.DB, targetID, lang, text string) error {
	if lang == "content" {
		lang = "idn"
	}
	var doa model.Doa
	if err := db.Where("id = ?", targetID).First(&doa).Error; err != nil {
		return fmt.Errorf("doa not found: %v", err)
	}
	if doa.TranslationID != nil {
		_ = s.updateTranslationRow(db, *doa.TranslationID, lang, text)
	}
	// Also sync legacy translation column
	_ = db.Table("doas").Where("id = ?", targetID).Update("translation", text)
	return nil
}

func (s *contentReportService) updateDzikirTranslation(db *gorm.DB, targetID, lang, text string) error {
	if lang == "content" {
		lang = "idn"
	}
	var dzikir model.Dzikir
	if err := db.Where("id = ?", targetID).First(&dzikir).Error; err != nil {
		return fmt.Errorf("dzikir not found: %v", err)
	}
	if dzikir.TranslationID != nil {
		_ = s.updateTranslationRow(db, *dzikir.TranslationID, lang, text)
	}
	// Also sync legacy translation column
	_ = db.Table("dzikirs").Where("id = ?", targetID).Update("translation", text)
	return nil
}

func (s *contentReportService) updateFiqhItemContent(db *gorm.DB, targetID, lang, text string) error {
	var item model.FiqhItem
	if err := db.Where("id = ?", targetID).First(&item).Error; err != nil {
		return fmt.Errorf("fiqh item not found: %v", err)
	}
	if item.TranslationID != nil {
		_ = s.updateTranslationRow(db, *item.TranslationID, lang, text)
	}
	res := db.Table("fiqh_items").Where("id = ?", targetID).Update("content", text)
	if res.Error != nil {
		return res.Error
	}
	return nil
}

func (s *contentReportService) updateSirohContent(db *gorm.DB, targetID, lang, text string) error {
	var item model.SirohContent
	if err := db.Where("id = ?", targetID).First(&item).Error; err != nil {
		return fmt.Errorf("siroh content not found: %v", err)
	}
	if item.TranslationID != nil {
		_ = s.updateTranslationRow(db, *item.TranslationID, lang, text)
	}
	res := db.Table("siroh_contents").Where("id = ?", targetID).Update("content", text)
	if res.Error != nil {
		return res.Error
	}
	return nil
}

func (s *contentReportService) updateTranslationRow(db *gorm.DB, translationID int, lang, text string) error {
	col := translationColumnForLang(lang)
	if col == "" {
		return fmt.Errorf("unsupported lang %q for translation update", lang)
	}
	res := db.Table("translations").Where("id = ?", translationID).Update(col, text)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("translation row %d not found", translationID)
	}
	return nil
}

func (s *contentReportService) notifyReporter(report *model.ContentReport, status model.ContentReportStatus, adminNote string) {
	if report == nil || report.UserID == uuid.Nil {
		return
	}
	statusText := map[model.ContentReportStatus]string{
		model.ContentReportStatusReviewed: "sedang ditinjau",
		model.ContentReportStatusResolved: "telah disetujui/diperbaiki",
		model.ContentReportStatusRejected: "ditolak",
	}[status]
	if statusText == "" {
		statusText = string(status)
	}

	title := fmt.Sprintf("Laporan Koreksi: %s", report.TargetTitle)
	if report.TargetTitle == "" {
		title = "Laporan Koreksi Konten"
	}
	body := fmt.Sprintf("Laporan koreksi Anda untuk %s %s.", report.TargetType, statusText)
	if status == model.ContentReportStatusResolved {
		body += fmt.Sprintf(" Koreksi Anda telah diterapkan dan mendapat +%d poin kontribusi.", rewardPointsPerAcceptedReport)
	}
	if adminNote != "" {
		body += fmt.Sprintf(" Catatan admin: %s", adminNote)
	}

	if s.inbox != nil {
		_, _ = s.inbox.Create(model.UserNotification{
			UserID: report.UserID,
			Title:  title,
			Body:   body,
			Type:   model.NotificationTypeReport,
			RefID:  report.ID.String(),
			IsRead: false,
		})
	}
	if s.notification != nil {
		_, _ = s.notification.SendPushToUser(report.UserID, title, body, "/dashboard/reports")
	}
}

func parseAyahID(targetID string) (string, error) {
	if !strings.Contains(targetID, ":") {
		return "", fmt.Errorf("invalid quran target id %q", targetID)
	}
	return targetID, nil
}

func parseHadithTarget(targetID string) (string, int, error) {
	idx := strings.LastIndex(targetID, "-")
	if idx < 0 {
		return "", 0, fmt.Errorf("invalid hadith target id %q (expected bookSlug-number)", targetID)
	}
	bookSlug := targetID[:idx]
	number, err := strconv.Atoi(targetID[idx+1:])
	if err != nil {
		return "", 0, fmt.Errorf("invalid hadith number: %v", err)
	}
	return bookSlug, number, nil
}

func resolveFieldLang(field string) string {
	switch strings.ToLower(strings.TrimSpace(field)) {
	case "idn", "translation_idn", "id", "indonesian":
		return "idn"
	case "en", "translation_en", "english":
		return "en"
	case "latin_idn", "latin", "latinidn":
		return "latin_idn"
	case "description_idn":
		return "description_idn"
	case "description_en":
		return "description_en"
	case "content", "body", "text", "isi", "translation", "":
		return "content"
	default:
		return ""
	}
}

func translationColumnForLang(lang string) string {
	switch lang {
	case "idn":
		return "idn"
	case "en":
		return "en"
	case "latin_idn":
		return "latin_idn"
	case "description_idn":
		return "description_idn"
	case "description_en":
		return "description_en"
	case "content":
		return "content"
	}
	return ""
}

