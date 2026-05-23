package service

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type DailyReminderService interface {
	FindAll(reminderType, lang string, activeOnly bool, limit, offset int) ([]model.DailyReminder, error)
	FindByID(int) (*model.DailyReminder, error)
	Create(*model.DailyReminder) (*model.DailyReminder, error)
	Update(int, *model.DailyReminder) (*model.DailyReminder, error)
	Delete(int) error
}

type dailyReminderService struct {
	repo  repository.DailyReminderRepository
	cache *lib.CacheService
}

func NewDailyReminderService(repo repository.DailyReminderRepository) DailyReminderService {
	return &dailyReminderService{repo: repo}
}

func NewDailyReminderServiceWithCache(repo repository.DailyReminderRepository, cache *lib.CacheService) DailyReminderService {
	return &dailyReminderService{repo: repo, cache: cache}
}

func (s *dailyReminderService) FindAll(reminderType, lang string, activeOnly bool, limit, offset int) ([]model.DailyReminder, error) {
	if s.cache == nil {
		return s.repo.FindAll(reminderType, lang, activeOnly, limit, offset)
	}

	var result []model.DailyReminder
	key := lib.CacheKey("daily-reminders", "type", reminderType, "lang", lang, "active", activeOnly, "limit", limit, "offset", offset)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindAll(reminderType, lang, activeOnly, limit, offset)
	})
	return result, err
}

func (s *dailyReminderService) FindByID(id int) (*model.DailyReminder, error) {
	return s.repo.FindByID(id)
}

func (s *dailyReminderService) Create(item *model.DailyReminder) (*model.DailyReminder, error) {
	result, err := s.repo.Create(item)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("daily-reminders:*")
	}
	return result, err
}

func (s *dailyReminderService) Update(id int, item *model.DailyReminder) (*model.DailyReminder, error) {
	result, err := s.repo.Update(id, item)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("daily-reminders:*")
	}
	return result, err
}

func (s *dailyReminderService) Delete(id int) error {
	err := s.repo.Delete(id)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("daily-reminders:*")
	}
	return err
}
