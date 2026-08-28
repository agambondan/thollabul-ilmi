package service

import (
	"sync"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type ChatService interface {
	Post(userID *uuid.UUID, author, text string) (*model.ChatMessage, error)
	Latest(limit int) ([]model.ChatMessage, error)
	Subscribe() (chan model.ChatMessage, func())
	Delete(id string, ownerID *uuid.UUID) error
}

type chatService struct {
	repo repository.ChatRepository
	mu   sync.RWMutex
	subs map[chan model.ChatMessage]struct{}
}

func NewChatService(repo repository.ChatRepository) ChatService {
	return &chatService{
		repo: repo,
		subs: make(map[chan model.ChatMessage]struct{}),
	}
}

func (s *chatService) Post(userID *uuid.UUID, author, text string) (*model.ChatMessage, error) {
	msg := &model.ChatMessage{
		BaseUUID:  model.BaseUUID{ID: uuid.New()},
		Text:      text,
		Author:    author,
		AuthorID:  userID,
		Timestamp: time.Now().UnixMilli(),
	}
	saved, err := s.repo.Create(msg)
	if err != nil {
		return nil, err
	}

	s.mu.RLock()
	for ch := range s.subs {
		select {
		case ch <- *saved:
		default:
		}
	}
	s.mu.RUnlock()

	return saved, nil
}

func (s *chatService) Latest(limit int) ([]model.ChatMessage, error) {
	return s.repo.Latest(limit)
}

func (s *chatService) Subscribe() (chan model.ChatMessage, func()) {
	ch := make(chan model.ChatMessage, 20)
	s.mu.Lock()
	s.subs[ch] = struct{}{}
	s.mu.Unlock()

	unsub := func() {
		s.mu.Lock()
		delete(s.subs, ch)
		close(ch)
		s.mu.Unlock()
	}
	return ch, unsub
}

// Delete removes a chat message. ownerID nil means the caller is an admin and
// may remove any message; otherwise the delete is scoped to that author.
func (s *chatService) Delete(id string, ownerID *uuid.UUID) error {
	return s.repo.Delete(id, ownerID)
}
