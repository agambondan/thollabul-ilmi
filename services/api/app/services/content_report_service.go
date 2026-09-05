package service

import (
	"errors"
	"strings"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type ContentReportService interface {
	Create(userID uuid.UUID, req *model.CreateContentReportRequest) (*model.ContentReport, error)
	FindByID(id string) (*model.ContentReport, error)
	FindAll(status model.ContentReportStatus, targetType model.ContentReportTargetType, page, limit int) ([]model.ContentReport, int64, error)
	UpdateStatus(id string, reviewerID uuid.UUID, req *model.UpdateContentReportStatusRequest) (*model.ContentReport, error)
	FindMine(userID uuid.UUID, page, limit int) ([]model.ContentReport, int64, error)
}

type contentReportService struct {
	repo repository.ContentReportRepository
}

func NewContentReportService(repo repository.ContentReportRepository) ContentReportService {
	return &contentReportService{repo: repo}
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
	model.ContentReportCategoryTranslation: true,
	model.ContentReportCategoryArabicText:  true,
	model.ContentReportCategoryTafsir:      true,
	model.ContentReportCategorySanadGrading: true,
	model.ContentReportCategoryTypo:        true,
	model.ContentReportCategoryOther:       true,
}

var validReportStatus = map[model.ContentReportStatus]bool{
	model.ContentReportStatusPending:  true,
	model.ContentReportStatusReviewed: true,
	model.ContentReportStatusResolved: true,
	model.ContentReportStatusRejected: true,
}

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
	return s.repo.UpdateStatus(id, req.Status, strings.TrimSpace(req.AdminNote), reviewerID)
}

func (s *contentReportService) FindMine(userID uuid.UUID, page, limit int) ([]model.ContentReport, int64, error) {
	return s.repo.FindByUser(userID, page, limit)
}
