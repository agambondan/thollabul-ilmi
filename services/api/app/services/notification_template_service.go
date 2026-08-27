package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type NotificationTemplateService interface {
	FindAll() ([]model.NotificationTemplate, error)
	FindByCode(string) (*model.NotificationTemplate, error)
	Create(req *model.CreateNotificationTemplateRequest) (*model.NotificationTemplate, error)
	Delete(int) error
}

type notificationTemplateService struct {
	repo repository.NotificationTemplateRepository
}

func NewNotificationTemplateService(repo repository.NotificationTemplateRepository) NotificationTemplateService {
	return &notificationTemplateService{repo}
}

func (s *notificationTemplateService) FindAll() ([]model.NotificationTemplate, error) {
	return s.repo.FindAll()
}

func (s *notificationTemplateService) FindByCode(code string) (*model.NotificationTemplate, error) {
	return s.repo.FindByCode(code)
}

func (s *notificationTemplateService) Create(req *model.CreateNotificationTemplateRequest) (*model.NotificationTemplate, error) {
	t := &model.NotificationTemplate{
		Code:    req.Code,
		Title:   req.Title,
		Body:    req.Body,
		Channel: req.Channel,
	}
	return s.repo.Save(t)
}

func (s *notificationTemplateService) Delete(id int) error {
	return s.repo.Delete(id)
}
