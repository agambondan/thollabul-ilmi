package service

import (
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
	"github.com/morkid/paginate"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestUserServiceFindSessionsFiltersExpiredAndMarksCurrent(t *testing.T) {
	db := newUserServiceTestDB(t)
	svc := NewUserService(repository.NewUserRepository(db, paginate.New()))
	userID := uuid.New().String()
	now := time.Now()

	seedRefreshToken(t, db, userID, "expired-token", now.Add(-72*time.Hour), now.Add(-24*time.Hour))
	seedRefreshToken(t, db, userID, "current-token", now.Add(-3*time.Hour), now.Add(24*time.Hour))
	seedRefreshToken(t, db, userID, "other-token", now.Add(-2*time.Hour), now.Add(24*time.Hour))
	seedRefreshToken(t, db, uuid.New().String(), "other-user-token", now.Add(-1*time.Hour), now.Add(24*time.Hour))

	sessions, err := svc.FindSessions(userID, "current-token")
	if err != nil {
		t.Fatalf("FindSessions: %v", err)
	}
	if len(sessions) != 2 {
		t.Fatalf("expected two active sessions, got %d: %#v", len(sessions), sessions)
	}
	if sessions[0].Current {
		t.Fatalf("expected newest other token first without current marker: %#v", sessions[0])
	}
	if !sessions[1].Current {
		t.Fatalf("expected current token session to be marked: %#v", sessions)
	}
}

func TestUserServiceDeleteSelfRevokesTokensAndSoftDeletesUser(t *testing.T) {
	db := newUserServiceTestDB(t)
	repo := repository.NewUserRepository(db, paginate.New())
	svc := NewUserService(repo)

	userID := uuid.New()
	name := "Delete Me"
	email := "delete-me@example.com"
	password := lib.PasswordEncrypt("password-123")
	if err := db.Create(&model.User{
		BaseUUID: model.BaseUUID{ID: userID},
		Name:     &name,
		Email:    &email,
		Password: &password,
		Role:     model.RoleUser,
	}).Error; err != nil {
		t.Fatalf("seed user: %v", err)
	}
	now := time.Now()
	seedRefreshToken(t, db, userID.String(), "token-a", now.Add(-time.Hour), now.Add(24*time.Hour))
	seedRefreshToken(t, db, userID.String(), "token-b", now.Add(-time.Minute), now.Add(24*time.Hour))

	if err := svc.DeleteSelf(userID.String()); err != nil {
		t.Fatalf("DeleteSelf: %v", err)
	}
	if _, err := repo.FindById(userID.String()); err == nil {
		t.Fatal("expected soft-deleted user to be hidden from FindById")
	}
	var tokens int64
	if err := db.Model(&model.RefreshToken{}).Where("user_id = ?", userID.String()).Count(&tokens).Error; err != nil {
		t.Fatalf("count refresh tokens: %v", err)
	}
	if tokens != 0 {
		t.Fatalf("expected refresh tokens revoked, got %d", tokens)
	}
}

func TestUserServiceRevokeSessionDeletesOnlyRequestedNonCurrentSession(t *testing.T) {
	db := newUserServiceTestDB(t)
	svc := NewUserService(repository.NewUserRepository(db, paginate.New()))
	userID := uuid.New().String()
	otherUserID := uuid.New().String()
	now := time.Now()

	currentID := seedRefreshToken(t, db, userID, "current-token", now.Add(-3*time.Hour), now.Add(24*time.Hour))
	otherID := seedRefreshToken(t, db, userID, "other-token", now.Add(-time.Hour), now.Add(24*time.Hour))
	otherUserTokenID := seedRefreshToken(t, db, otherUserID, "other-user-token", now.Add(-time.Minute), now.Add(24*time.Hour))

	if err := svc.RevokeSession(userID, currentID, "current-token"); err == nil {
		t.Fatal("expected current session revoke to be rejected")
	}
	if err := svc.RevokeSession(userID, otherUserTokenID, "current-token"); err == nil {
		t.Fatal("expected other user session revoke to be rejected")
	}
	if err := svc.RevokeSession(userID, otherID, "current-token"); err != nil {
		t.Fatalf("RevokeSession: %v", err)
	}

	var tokens []model.RefreshToken
	if err := db.Order("token asc").Find(&tokens).Error; err != nil {
		t.Fatalf("find refresh tokens: %v", err)
	}
	got := map[string]bool{}
	for _, token := range tokens {
		got[token.Token] = true
	}
	if got["other-token"] {
		t.Fatal("expected requested session token to be deleted")
	}
	if !got["current-token"] || !got["other-user-token"] {
		t.Fatalf("expected current and other-user tokens to remain, got %#v", got)
	}
}

func newUserServiceTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.RefreshToken{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	return db
}

func seedRefreshToken(t *testing.T, db *gorm.DB, userID, token string, createdAt, expiresAt time.Time) uint {
	t.Helper()

	refreshToken := &model.RefreshToken{
		UserID:    userID,
		Token:     token,
		CreatedAt: createdAt,
		ExpiresAt: expiresAt,
	}
	if err := db.Create(refreshToken).Error; err != nil {
		t.Fatalf("seed refresh token %q: %v", token, err)
	}
	return refreshToken.ID
}
