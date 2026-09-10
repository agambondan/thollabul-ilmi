// Package whatsapp embeds a single WhatsApp multi-device session (via
// whatsmeow) directly in the API process, following the pattern used in the
// sibling saas-jangkauin project: no external gateway, no Business API — the
// admin pairs one real WhatsApp number via QR code, and the app sends OTP
// text messages through it like a personal WhatsApp Web client.
//
// This app is single-tenant, so unlike saas-jangkauin's per-tenant channel
// manager, there is exactly one Manager instance and one WhatsAppChannel row.
package whatsapp

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	_ "github.com/glebarez/go-sqlite"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/skip2/go-qrcode"
	"go.mau.fi/whatsmeow"
	waE2E "go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"
	"gorm.io/gorm"
)

// PairEvent is one step of the QR-pairing lifecycle, streamed to the admin
// panel over SSE.
type PairEvent struct {
	Status string `json:"status"` // "pending" | "connected" | "error" | "timeout"
	QR     string `json:"qr,omitempty"`
	Phone  string `json:"phone,omitempty"`
	Error  string `json:"error,omitempty"`
}

var ErrAlreadyConnected = errors.New("whatsapp channel is already connected")
var ErrNotConnected = errors.New("whatsapp channel is not connected")

type Manager struct {
	db          *gorm.DB
	sessionPath string

	mu        sync.Mutex
	container *sqlstore.Container
	client    *whatsmeow.Client
}

func NewManager(db *gorm.DB, sessionPath string) *Manager {
	return &Manager{db: db, sessionPath: sessionPath}
}

// Bootstrap opens the on-disk session store and, if a device was already
// paired in a previous run, reconnects silently — so a container restart
// doesn't require re-scanning the QR code.
func (m *Manager) Bootstrap(ctx context.Context) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if err := os.MkdirAll(filepath.Dir(m.sessionPath), 0o755); err != nil {
		return fmt.Errorf("create whatsapp session dir: %w", err)
	}
	// "sqlite" (not "sqlite3") matches the driver name glebarez/go-sqlite
	// registers under — this project also links mattn/go-sqlite3 elsewhere
	// (app/db/db_sqlite.go), which owns "sqlite3" and is CGO-only, so it
	// would silently no-op under CGO_ENABLED=0 if selected by name here.
	container, err := sqlstore.New(ctx, "sqlite", fmt.Sprintf("file:%s?_pragma=foreign_keys(1)", m.sessionPath), waLog.Noop)
	if err != nil {
		return fmt.Errorf("open whatsapp session store: %w", err)
	}
	m.container = container

	device, err := container.GetFirstDevice(ctx)
	if err != nil {
		return fmt.Errorf("load whatsapp device: %w", err)
	}
	client := whatsmeow.NewClient(device, waLog.Noop)
	client.AddEventHandler(m.handleEvent)
	m.client = client

	if client.Store.ID != nil {
		if err := client.Connect(); err != nil {
			slog.Warn("whatsapp: reconnect on startup failed", "err", err)
			m.persistStatus(model.WhatsAppStatusDisconnected, nil)
			return nil
		}
		m.persistStatus(model.WhatsAppStatusConnected, jidPhone(client.Store.ID))
	} else {
		m.persistStatus(model.WhatsAppStatusDisconnected, nil)
	}
	return nil
}

func (m *Manager) handleEvent(evt interface{}) {
	switch v := evt.(type) {
	case *events.Connected:
		if m.client != nil && m.client.Store.ID != nil {
			m.persistStatus(model.WhatsAppStatusConnected, jidPhone(m.client.Store.ID))
		}
	case *events.LoggedOut:
		slog.Warn("whatsapp: session logged out remotely", "reason", v.Reason)
		m.persistStatus(model.WhatsAppStatusDisconnected, nil)
	case *events.Disconnected:
		m.persistStatus(model.WhatsAppStatusDisconnected, nil)
	}
}

func (m *Manager) persistStatus(status string, phone *string) {
	if m.db == nil {
		return
	}
	now := time.Now()
	var existing model.WhatsAppChannel
	err := m.db.First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		m.db.Create(&model.WhatsAppChannel{Status: status, Phone: phone, SessionPath: m.sessionPath, LastSeenAt: &now})
		return
	}
	m.db.Model(&existing).Updates(map[string]interface{}{
		"status":       status,
		"phone":        phone,
		"session_path": m.sessionPath,
		"last_seen_at": now,
	})
}

// IsConnected reports whether the paired session can currently send messages.
func (m *Manager) IsConnected() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.client != nil && m.client.IsLoggedIn() && m.client.IsConnected()
}

// StartPairing begins (or restarts) the QR-login flow and streams its
// lifecycle. The returned channel is closed once pairing reaches a terminal
// state (connected, error, or timeout) — mirrors the login-stream pattern
// used for WhatsApp pairing in the sibling saas-jangkauin project.
func (m *Manager) StartPairing(ctx context.Context) (<-chan PairEvent, error) {
	m.mu.Lock()
	if m.client == nil {
		m.mu.Unlock()
		return nil, errors.New("whatsapp manager not initialized")
	}
	client := m.client
	if client.Store.ID != nil && client.IsLoggedIn() {
		m.mu.Unlock()
		return nil, ErrAlreadyConnected
	}
	m.mu.Unlock()

	// A previous pairing attempt whose SSE client disconnected before
	// finishing (browser closed, page reload) can leave the socket
	// half-connected without ever completing pairing. GetQRChannel refuses
	// to run again while IsConnected() is true, so reset it before retrying
	// — this is what makes hitting "pair" again after an abandoned attempt
	// self-healing instead of permanently stuck.
	if client.IsConnected() {
		client.Disconnect()
	}

	qrChan, err := client.GetQRChannel(ctx)
	if err != nil {
		return nil, fmt.Errorf("start qr channel: %w", err)
	}
	if err := client.Connect(); err != nil {
		return nil, fmt.Errorf("connect: %w", err)
	}

	out := make(chan PairEvent, 4)
	go func() {
		defer close(out)
		for item := range qrChan {
			switch item.Event {
			case whatsmeow.QRChannelEventCode:
				dataURI, encErr := encodeQR(item.Code)
				if encErr != nil {
					out <- PairEvent{Status: "error", Error: encErr.Error()}
					continue
				}
				m.persistStatus(model.WhatsAppStatusPending, nil)
				out <- PairEvent{Status: model.WhatsAppStatusPending, QR: dataURI}
			case "success":
				phone := ""
				if client.Store.ID != nil {
					phone = jidPhoneString(client.Store.ID)
					p := phone
					m.persistStatus(model.WhatsAppStatusConnected, &p)
				}
				out <- PairEvent{Status: model.WhatsAppStatusConnected, Phone: phone}
			case "timeout":
				m.persistStatus(model.WhatsAppStatusDisconnected, nil)
				out <- PairEvent{Status: "timeout"}
			case whatsmeow.QRChannelEventError:
				m.persistStatus(model.WhatsAppStatusDisconnected, nil)
				msg := "pairing error"
				if item.Error != nil {
					msg = item.Error.Error()
				}
				out <- PairEvent{Status: "error", Error: msg}
			default:
				out <- PairEvent{Status: "error", Error: "unexpected event: " + item.Event}
			}
		}
	}()
	return out, nil
}

// Status returns the last-known connection state and, when connected, the
// paired number — read from the persisted row so it works even without an
// active pairing stream.
func (m *Manager) Status() (status string, phone *string) {
	var ch model.WhatsAppChannel
	if err := m.db.First(&ch).Error; err != nil {
		return model.WhatsAppStatusDisconnected, nil
	}
	return ch.Status, ch.Phone
}

// Logout disconnects and clears the paired session so a different number can
// be paired.
func (m *Manager) Logout(ctx context.Context) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.client == nil || m.client.Store.ID == nil {
		return ErrNotConnected
	}
	if err := m.client.Logout(ctx); err != nil {
		slog.Warn("whatsapp: logout call failed, disconnecting locally anyway", "err", err)
		m.client.Disconnect()
	}
	m.persistStatus(model.WhatsAppStatusDisconnected, nil)
	return nil
}

// SendOTP sends a one-time verification code to phone (E.164, e.g.
// "+6281234567890") as a plain WhatsApp text message.
func (m *Manager) SendOTP(phone, code string) error {
	if !m.IsConnected() {
		return ErrNotConnected
	}
	text := fmt.Sprintf("Kode verifikasi kamu: %s\nKode ini berlaku 10 menit. Jangan bagikan kepada siapa pun.", code)
	digits := strings.TrimPrefix(strings.TrimSpace(phone), "+")
	jid := types.NewJID(digits, types.DefaultUserServer)

	m.mu.Lock()
	client := m.client
	m.mu.Unlock()
	if client == nil {
		return ErrNotConnected
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_, err := client.SendMessage(ctx, jid, &waE2E.Message{Conversation: proto.String(text)})
	return err
}

func encodeQR(code string) (string, error) {
	png, err := qrcode.Encode(code, qrcode.Medium, 256)
	if err != nil {
		return "", err
	}
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(png), nil
}

func jidPhone(jid *types.JID) *string {
	if jid == nil {
		return nil
	}
	s := "+" + jid.User
	return &s
}

func jidPhoneString(jid *types.JID) string {
	if jid == nil {
		return ""
	}
	return "+" + jid.User
}
