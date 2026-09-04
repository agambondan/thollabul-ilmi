package controllers

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

type NotificationController interface {
	FindSettings(ctx *fiber.Ctx) error
	FindPushTokens(ctx *fiber.Ctx) error
	RegisterPushToken(ctx *fiber.Ctx) error
	SendTestPush(ctx *fiber.Ctx) error
	BroadcastPush(ctx *fiber.Ctx) error
	GetVapidPublicKey(ctx *fiber.Ctx) error
	UpsertSettings(ctx *fiber.Ctx) error
}

type notificationController struct {
	svc service.NotificationService
}

func NewNotificationController(services *service.Services) NotificationController {
	return &notificationController{services.Notification}
}

// @Summary Get notification settings
// @Tags Personal
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /notifications/settings [get]
func (c *notificationController) FindSettings(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	items, err := c.svc.FindSettings(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, items)
}

// @Summary Get registered push tokens
// @Tags Personal
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /notifications/push-tokens [get]
func (c *notificationController) FindPushTokens(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	status, err := c.svc.FindPushTokenStatus(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, status)
}

// @Summary Register push notification token
// @Tags Personal
// @Accept json
// @Produce json
// @Param body body model.PushTokenRegisterRequest true "Push token data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /notifications/push-token [put]
func (c *notificationController) RegisterPushToken(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.PushTokenRegisterRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.RegisterPushToken(userID, req)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx, item)
}

// @Summary Send test push notification
// @Tags Personal
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /notifications/push-test [post]
func (c *notificationController) SendTestPush(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	result, err := c.svc.SendTestPush(userID)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx, result)
}

// @Summary Update notification settings
// @Tags Personal
// @Accept json
// @Produce json
// @Param body body model.NotificationSettingsUpsertRequest true "Settings data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /notifications/settings [put]
func (c *notificationController) GetVapidPublicKey(ctx *fiber.Ctx) error {
	key := viper.GetString("VAPID_PUBLIC_KEY")
	return lib.OK(ctx, fiber.Map{"publicKey": key})
}

func (c *notificationController) BroadcastPush(ctx *fiber.Ctx) error {
	adminID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.BroadcastPushRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.BroadcastPush(adminID, req)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx, result)
}

func (c *notificationController) UpsertSettings(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.NotificationSettingsUpsertRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	items, err := c.svc.UpsertSettings(userID, req)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx, items)
}
