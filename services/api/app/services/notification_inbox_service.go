package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type NotificationInboxService interface {
	List(userID uuid.UUID) ([]model.UserNotification, error)
	UnreadCount(userID uuid.UUID) (int64, error)
	MarkRead(id uuid.UUID, userID uuid.UUID) error
	MarkAllRead(userID uuid.UUID) error
	Delete(id uuid.UUID, userID uuid.UUID) error
}

type notificationInboxService struct {
	repo repository.NotificationInboxRepository
}

func NewNotificationInboxService(repo repository.NotificationInboxRepository) NotificationInboxService {
	return &notificationInboxService{repo}
}

func (s *notificationInboxService) List(userID uuid.UUID) ([]model.UserNotification, error) {
	return s.repo.ListByUser(userID, 50)
}

func (s *notificationInboxService) UnreadCount(userID uuid.UUID) (int64, error) {
	return s.repo.UnreadCount(userID)
}

func (s *notificationInboxService) MarkRead(id uuid.UUID, userID uuid.UUID) error {
	return s.repo.MarkRead(id, userID)
}

func (s *notificationInboxService) MarkAllRead(userID uuid.UUID) error {
	return s.repo.MarkAllRead(userID)
}

func (s *notificationInboxService) Delete(id uuid.UUID, userID uuid.UUID) error {
	return s.repo.Delete(id, userID)
}
