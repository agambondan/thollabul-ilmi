package controllers_test

import (
	"strconv"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/google/uuid"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupContentReportTestEnv(t *testing.T) (*gorm.DB, *service.Services) {
	viper.Set("ACCESS_SECRET", "test-secret-key-12345")
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	err = db.AutoMigrate(&model.User{}, &model.ContentReport{}, &model.UserNotification{}, &model.UserPoints{}, &model.Doa{}, &model.Translation{}, &model.PushToken{})
	assert.NoError(t, err)

	repo, err := repository.NewRepositories(db, nil)
	assert.NoError(t, err)

	return db, service.NewServices(repo)
}

func createReportUser(t *testing.T, db *gorm.DB, role model.UserRole) *model.User {
	name := "Test User"
	email := "test-" + uuid.New().String() + "@example.com"
	password := "password"
	u := &model.User{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		Name:     &name,
		Email:    &email,
		Password: &password,
		Role:     role,
	}
	err := db.Create(u).Error
	assert.NoError(t, err)
	return u
}

func TestContentReportServiceLifecycle(t *testing.T) {
	db, svc := setupContentReportTestEnv(t)
	user := createReportUser(t, db, model.RoleUser)
	admin := createReportUser(t, db, model.RoleAdmin)

	repo := repository.NewContentReportRepository(db)

	// 1. Create
	created, err := svc.ContentReport.Create(user.ID, &model.CreateContentReportRequest{
		TargetType:  model.ContentReportTargetQuran,
		TargetID:    "1:1",
		TargetTitle: "QS. Al-Fatihah: 1",
		Category:    model.ContentReportCategoryTranslation,
		Description: "Terjemahan kurang tepat pada kata Ar-Rahman",
		Correction:  "Maha Pengasih",
	})
	assert.NoError(t, err)
	assert.NotNil(t, created)
	assert.Equal(t, model.ContentReportStatusPending, created.Status)
	assert.Equal(t, user.ID, created.UserID)
	assert.Equal(t, "quran", string(created.TargetType))

	// 2. Find by ID
	found, err := repo.FindByID(created.ID.String())
	assert.NoError(t, err)
	assert.Equal(t, created.ID, found.ID)

	// 3. Find all (admin filter)
	items, total, err := svc.ContentReport.FindAll(model.ContentReportStatusPending, "", 1, 20)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, items, 1)

	// 4. Update status (admin reviews)
	reviewed, err := svc.ContentReport.UpdateStatus(created.ID.String(), admin.ID, &model.UpdateContentReportStatusRequest{
		Status:    model.ContentReportStatusResolved,
		AdminNote: "Koreksi sudah diverifikasi.",
	})
	assert.NoError(t, err)
	assert.Equal(t, model.ContentReportStatusResolved, reviewed.Status)
	assert.NotNil(t, reviewed.ReviewedBy)
	assert.Equal(t, admin.ID, *reviewed.ReviewedBy)
	assert.NotNil(t, reviewed.ReviewedAt)

	// Check that notification was sent to user
	notifs, err := svc.NotificationInbox.List(user.ID)
	assert.NoError(t, err)
	assert.Len(t, notifs, 1)
	assert.Contains(t, notifs[0].Title, "QS. Al-Fatihah: 1")
	assert.Contains(t, notifs[0].Body, "telah disetujui/diperbaiki")

	// 5. Validation: invalid target
	_, err = svc.ContentReport.Create(user.ID, &model.CreateContentReportRequest{
		TargetType:  "bogus",
		TargetID:    "1:1",
		Category:    model.ContentReportCategoryTranslation,
		Description: "x",
	})
	assert.Error(t, err)

	// 6. Validation: invalid category
	_, err = svc.ContentReport.Create(user.ID, &model.CreateContentReportRequest{
		TargetType:  model.ContentReportTargetQuran,
		TargetID:    "1:1",
		Category:    "bogus",
		Description: "x",
	})
	assert.Error(t, err)

	// 7. Validation: empty description
	_, err = svc.ContentReport.Create(user.ID, &model.CreateContentReportRequest{
		TargetType:  model.ContentReportTargetQuran,
		TargetID:    "1:1",
		Category:    model.ContentReportCategoryTranslation,
		Description: "  ",
	})
	assert.Error(t, err)

	// 8. Find mine
	items, total, err = svc.ContentReport.FindMine(user.ID, 1, 20)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, items, 1)

	// 9. Apply correction to Doa and assert points reward
	tr := &model.Translation{Idn: stringPtr("Teks lama")}
	db.Create(tr)
	doa := &model.Doa{
		Category:        model.DoaCategoryUmum,
		Title:           "Doa Test",
		Arabic:          "دُعَاء",
		TranslationText: "Teks lama",
		TranslationID:   tr.ID,
	}
	db.Create(doa)

	doaReport, err := svc.ContentReport.Create(user.ID, &model.CreateContentReportRequest{
		TargetType:  model.ContentReportTargetDoa,
		TargetID:    stringPtrToStr(doa.ID),
		TargetTitle: "Doa Test",
		Category:    model.ContentReportCategoryTranslation,
		Description: "Terjemahan keliru",
		Correction:  "Teks baru hasil koreksi",
	})
	assert.NoError(t, err)

	applied, err := svc.ContentReport.ApplyCorrection(doaReport.ID.String(), admin.ID, &model.ApplyContentReportRequest{
		AdminNote: "Koreksi doa disetujui",
	})
	assert.NoError(t, err)
	assert.Equal(t, model.ContentReportStatusResolved, applied.Status)

	// User points should be increased by 25
	points, err := svc.Achievement.GetUserPoints(user.ID)
	assert.NoError(t, err)
	assert.Equal(t, 25, points.TotalPoints)
}

func stringPtr(s string) *string {
	return &s
}

func stringPtrToStr(id *int) string {
	if id == nil {
		return ""
	}
	return strconv.Itoa(*id)
}

func TestContentReportServiceFindAllFilters(t *testing.T) {
	db, svc := setupContentReportTestEnv(t)
	user := createReportUser(t, db, model.RoleUser)
	repo := repository.NewContentReportRepository(db)

	// 2 reports with different target types
	_, _ = svc.ContentReport.Create(user.ID, &model.CreateContentReportRequest{
		TargetType:  model.ContentReportTargetQuran,
		TargetID:    "1:1",
		Category:    model.ContentReportCategoryTranslation,
		Description: "Q1",
	})
	_, _ = svc.ContentReport.Create(user.ID, &model.CreateContentReportRequest{
		TargetType:  model.ContentReportTargetHadith,
		TargetID:    "bukhari-1",
		Category:    model.ContentReportCategoryArabicText,
		Description: "H1",
	})

	qItems, qTotal, _ := svc.ContentReport.FindAll("", model.ContentReportTargetQuran, 1, 20)
	assert.Equal(t, int64(1), qTotal)
	assert.Len(t, qItems, 1)
	assert.Equal(t, model.ContentReportTargetQuran, qItems[0].TargetType)

	hItems, hTotal, _ := svc.ContentReport.FindAll("", model.ContentReportTargetHadith, 1, 20)
	assert.Equal(t, int64(1), hTotal)
	assert.Len(t, hItems, 1)
	assert.Equal(t, model.ContentReportTargetHadith, hItems[0].TargetType)

	_ = repo
}
