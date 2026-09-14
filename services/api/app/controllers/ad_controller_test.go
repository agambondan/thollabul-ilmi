package controllers_test

import (
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestAdServiceAndRepository(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	err = db.AutoMigrate(&model.Ad{})
	assert.NoError(t, err)

	repo := repository.NewAdRepository(db)
	svc := service.NewAdService(repo)

	// 1. Create ad
	isActive := true
	ad, err := svc.Create(&model.CreateAdRequest{
		Title:    "Kajian Akbar Direct Ad",
		ClickURL: "https://thollabul-ilmi.com/kajian",
		SlotType: "banner",
		ImageURL: "https://thollabul-ilmi.com/banner.png",
		Priority: 10,
		IsActive: &isActive,
	})
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, ad.ID)
	assert.Equal(t, "Kajian Akbar Direct Ad", ad.Title)

	// 2. Get active by slot
	activeAd, err := svc.GetActiveBySlot("banner")
	assert.NoError(t, err)
	assert.Equal(t, ad.ID, activeAd.ID)

	// 3. List
	ads, err := svc.List()
	assert.NoError(t, err)
	assert.Len(t, ads, 1)

	// 4. Update
	newTitle := "Kajian Akbar Updated"
	updated, err := svc.Update(ad.ID, &model.UpdateAdRequest{
		Title: &newTitle,
	})
	assert.NoError(t, err)
	assert.Equal(t, "Kajian Akbar Updated", updated.Title)

	// 5. Check inactive or expired ad
	inactive := false
	_, err = svc.Update(ad.ID, &model.UpdateAdRequest{
		IsActive: &inactive,
	})
	assert.NoError(t, err)

	_, err = svc.GetActiveBySlot("banner")
	assert.Error(t, err)

	// Reactivate with past end_at
	past := time.Now().Add(-1 * time.Hour)
	_, err = svc.Update(ad.ID, &model.UpdateAdRequest{
		IsActive: &isActive,
		EndAt:    &past,
	})
	assert.NoError(t, err)

	_, err = svc.GetActiveBySlot("banner")
	assert.Error(t, err)

	// 6. Delete
	err = svc.Delete(ad.ID)
	assert.NoError(t, err)

	adsAfterDelete, err := svc.List()
	assert.NoError(t, err)
	assert.Len(t, adsAfterDelete, 0)
}
