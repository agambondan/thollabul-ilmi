package model_test

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func newPublicUserTestDB(t *testing.T) (*gorm.DB, uuid.UUID) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
		Logger:         logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.BlogPost{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	name, email, password := "Admin", "admin@example.com", "hashed"
	id := uuid.New()
	if err := db.Create(&model.User{
		BaseUUID: model.BaseUUID{ID: id},
		Name:     &name,
		Email:    &email,
		Password: &password,
		Role:     model.RoleAdmin,
	}).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	return db, id
}

func TestToPublicDropsEmail(t *testing.T) {
	name, email := "Admin", "admin@example.com"
	u := &model.User{Name: &name, Email: &email, Role: model.RoleAdmin}

	pub := u.ToPublic()
	if pub.Email != nil {
		t.Fatalf("ToPublic must not carry the email, got %q", *pub.Email)
	}
	if pub.Name == nil || *pub.Name != name {
		t.Fatalf("ToPublic should keep the display name, got %#v", pub.Name)
	}
	if u.Email == nil {
		t.Fatal("ToPublic must not mutate the original user")
	}
}

func TestToPublicOnNilUser(t *testing.T) {
	var u *model.User
	if u.ToPublic() != nil {
		t.Fatal("ToPublic on a nil user should stay nil")
	}
}

// A blog byline is public, so the preloaded author must never serialize the
// address the account signed up with.
func TestBlogPostAuthorHasNoEmail(t *testing.T) {
	db, authorID := newPublicUserTestDB(t)
	if err := db.Create(&model.BlogPost{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		Title:    "Adab Menuntut Ilmu",
		Slug:     "adab-menuntut-ilmu",
		AuthorID: authorID,
	}).Error; err != nil {
		t.Fatalf("create post: %v", err)
	}

	var post model.BlogPost
	if err := db.Preload("Author").Where("slug = ?", "adab-menuntut-ilmu").First(&post).Error; err != nil {
		t.Fatalf("find post: %v", err)
	}
	if post.Author == nil {
		t.Fatal("author was not preloaded — the test is not exercising the hook")
	}
	if post.Author.Email != nil {
		t.Fatalf("author email leaked: %q", *post.Author.Email)
	}

	encoded, err := json.Marshal(post)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if strings.Contains(string(encoded), "email") {
		t.Fatalf("serialized post still mentions an email: %s", encoded)
	}
}
