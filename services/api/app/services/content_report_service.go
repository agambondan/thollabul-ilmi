package service

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

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

	lang := resolveFieldLang(req.Field)
	if lang == "" {
		return nil, fmt.Errorf("unsupported field %q", req.Field)
	}
	oldValue, err := s.applyToEntity(report.TargetType, report.TargetID, lang, correctionText)
	if err != nil {
		return nil, err
	}

	updated, err := s.repo.UpdateStatus(id, model.ContentReportStatusResolved, strings.TrimSpace(req.AdminNote), reviewerID)
	if err != nil {
		return nil, err
	}

	if s.repos.ContentAuditLog != nil {
		reportID := updated.ID
		_ = s.repos.ContentAuditLog.Create(&model.ContentAuditLog{
			TargetType:  report.TargetType,
			TargetID:    report.TargetID,
			TargetTitle: report.TargetTitle,
			Field:       lang,
			OldValue:    oldValue,
			NewValue:    correctionText,
			ReportID:    &reportID,
			ModifiedBy:  reviewerID,
			Reason:      strings.TrimSpace(req.AdminNote),
		})
	}

	if s.repos.Achievement != nil && updated.UserID != uuid.Nil {
		_ = s.repos.Achievement.AddPoints(updated.UserID, rewardPointsPerAcceptedReport)
		_ = s.evaluateMushahhihAchievements(updated.UserID)
	}

	s.notifyReporter(updated, model.ContentReportStatusResolved, req.AdminNote)
	return updated, nil
}

func (s *contentReportService) applyToEntity(targetType model.ContentReportTargetType, targetID, lang, text string) (string, error) {
	if s.repos == nil {
		return "", errors.New("repos unavailable")
	}
	db := s.repos.GetDB()

	switch targetType {
	case model.ContentReportTargetQuran:
		ayahID, err := parseAyahID(targetID)
		if err != nil {
			return "", err
		}
		return s.updateTranslationByAyahNumber(db, ayahID, lang, text)
	case model.ContentReportTargetHadith:
		bookSlug, number, err := parseHadithTarget(targetID)
		if err != nil {
			return "", err
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
		return "", fmt.Errorf("apply correction not supported for target_type %q", targetType)
	}
}

func (s *contentReportService) updateTranslationByAyahNumber(db *gorm.DB, ayahRef string, lang, text string) (string, error) {
	if lang == "content" {
		lang = "idn"
	}
	parts := strings.SplitN(ayahRef, ":", 2)
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid quran target id %q (expected surah:ayah)", ayahRef)
	}
	surahNumber, err := strconv.Atoi(parts[0])
	if err != nil {
		return "", fmt.Errorf("invalid surah number: %v", err)
	}
	ayahNumber, err := strconv.Atoi(parts[1])
	if err != nil {
		return "", fmt.Errorf("invalid ayah number: %v", err)
	}

	var ayah model.Ayah
	if err := db.Joins("JOIN surahs ON surahs.id = ayahs.surah_id").
		Where("surahs.number = ? AND ayahs.number = ?", surahNumber, ayahNumber).
		First(&ayah).Error; err != nil {
		return "", fmt.Errorf("ayah not found: %v", err)
	}
	if ayah.TranslationID == nil {
		return "", errors.New("ayah has no translation row")
	}
	return s.updateTranslationRow(db, *ayah.TranslationID, lang, text)
}

func (s *contentReportService) updateTranslationByHadithSlugNumber(db *gorm.DB, bookSlug string, number int, lang, text string) (string, error) {
	if lang == "content" {
		lang = "idn"
	}
	var hadith model.Hadith
	if err := db.Joins("JOIN books ON books.id = hadiths.book_id").
		Where("books.slug = ? AND hadiths.number = ?", bookSlug, number).
		First(&hadith).Error; err != nil {
		return "", fmt.Errorf("hadith not found: %v", err)
	}
	if hadith.TranslationID == nil {
		return "", errors.New("hadith has no translation row")
	}
	return s.updateTranslationRow(db, *hadith.TranslationID, lang, text)
}

func (s *contentReportService) updateDoaTranslation(db *gorm.DB, targetID, lang, text string) (string, error) {
	if lang == "content" {
		lang = "idn"
	}
	var doa model.Doa
	if err := db.Where("id = ?", targetID).First(&doa).Error; err != nil {
		return "", fmt.Errorf("doa not found: %v", err)
	}
	var oldVal string
	if doa.TranslationID != nil {
		oldVal, _ = s.updateTranslationRow(db, *doa.TranslationID, lang, text)
	} else {
		oldVal = doa.TranslationText
	}
	_ = db.Table("doas").Where("id = ?", targetID).Update("translation", text)
	return oldVal, nil
}

func (s *contentReportService) updateDzikirTranslation(db *gorm.DB, targetID, lang, text string) (string, error) {
	if lang == "content" {
		lang = "idn"
	}
	var dzikir model.Dzikir
	if err := db.Where("id = ?", targetID).First(&dzikir).Error; err != nil {
		return "", fmt.Errorf("dzikir not found: %v", err)
	}
	var oldVal string
	if dzikir.TranslationID != nil {
		oldVal, _ = s.updateTranslationRow(db, *dzikir.TranslationID, lang, text)
	} else {
		oldVal = dzikir.TranslationText
	}
	_ = db.Table("dzikirs").Where("id = ?", targetID).Update("translation", text)
	return oldVal, nil
}

func (s *contentReportService) updateFiqhItemContent(db *gorm.DB, targetID, lang, text string) (string, error) {
	var item model.FiqhItem
	if err := db.Where("id = ?", targetID).First(&item).Error; err != nil {
		return "", fmt.Errorf("fiqh item not found: %v", err)
	}
	oldVal := item.Content
	if item.TranslationID != nil {
		_, _ = s.updateTranslationRow(db, *item.TranslationID, lang, text)
	}
	res := db.Table("fiqh_items").Where("id = ?", targetID).Update("content", text)
	if res.Error != nil {
		return "", res.Error
	}
	return oldVal, nil
}

func (s *contentReportService) updateSirohContent(db *gorm.DB, targetID, lang, text string) (string, error) {
	var item model.SirohContent
	if err := db.Where("id = ?", targetID).First(&item).Error; err != nil {
		return "", fmt.Errorf("siroh content not found: %v", err)
	}
	oldVal := item.Content
	if item.TranslationID != nil {
		_, _ = s.updateTranslationRow(db, *item.TranslationID, lang, text)
	}
	res := db.Table("siroh_contents").Where("id = ?", targetID).Update("content", text)
	if res.Error != nil {
		return "", res.Error
	}
	return oldVal, nil
}

func (s *contentReportService) updateTranslationRow(db *gorm.DB, translationID int, lang, text string) (string, error) {
	col := translationColumnForLang(lang)
	if col == "" {
		return "", fmt.Errorf("unsupported lang %q for translation update", lang)
	}
	var current model.Translation
	if err := db.Where("id = ?", translationID).First(&current).Error; err != nil {
		return "", err
	}

	var oldVal string
	switch col {
	case "idn":
		if current.Idn != nil {
			oldVal = *current.Idn
		}
	case "en":
		if current.En != nil {
			oldVal = *current.En
		}
	case "latin_idn":
		if current.LatinIdn != nil {
			oldVal = *current.LatinIdn
		}
	case "description_idn":
		if current.DescriptionIdn != nil {
			oldVal = *current.DescriptionIdn
		}
	case "description_en":
		if current.DescriptionEn != nil {
			oldVal = *current.DescriptionEn
		}
	}

	res := db.Table("translations").Where("id = ?", translationID).Update(col, text)
	if res.Error != nil {
		return "", res.Error
	}
	return oldVal, nil
}

func (s *contentReportService) evaluateMushahhihAchievements(userID uuid.UUID) error {
	if s.repos == nil || s.repos.Achievement == nil {
		return nil
	}
	db := s.repos.GetDB()
	var count int64
	db.Model(&model.ContentReport{}).Where("user_id = ? AND status = ?", userID, model.ContentReportStatusResolved).Count(&count)

	badges := []struct {
		code      string
		name      string
		nameEn    string
		desc      string
		descEn    string
		icon      string
		threshold int
	}{
		{"mushahhih_1", "Mushahhih Pemula", "Novice Reviewer", "1 laporan koreksi telah disetujui", "1 content correction approved", "✍️", 1},
		{"mushahhih_5", "Mushahhih Teladan", "Exemplary Reviewer", "5 laporan koreksi telah disetujui", "5 content corrections approved", "🔍", 5},
		{"mushahhih_10", "Khadimul Dalil", "Custodian of Texts", "10 laporan koreksi telah disetujui", "10 content corrections approved", "🛡️", 10},
	}

	for _, b := range badges {
		if int(count) >= b.threshold {
			ach, err := s.repos.Achievement.FindByCode(b.code)
			if err != nil {
				ach = &model.Achievement{
					Code:        b.code,
					Name:        b.name,
					NameEn:      b.nameEn,
					Description: b.desc,
					DescEn:      b.descEn,
					Icon:        b.icon,
					Category:    "mushahhih",
					Threshold:   b.threshold,
				}
				_ = db.Create(ach).Error
			}
			if ach != nil && ach.ID != nil && !s.repos.Achievement.HasEarned(userID, *ach.ID) {
				ua := &model.UserAchievement{
					BaseUUID:      model.BaseUUID{ID: uuid.New()},
					UserID:        userID,
					AchievementID: *ach.ID,
					EarnedAt:      time.Now(),
				}
				_ = s.repos.Achievement.Award(ua)
			}
		}
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

