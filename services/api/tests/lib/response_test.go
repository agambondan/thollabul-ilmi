//go:build !integration
// +build !integration

package lib

import (
	"errors"
	"net/http/httptest"
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
)

func TestSend(t *testing.T) {
	type sample struct {
		Name *string `json:"name,omitempty" validate:"required,gte=9"`
	}

	app := fiber.New()
	app.Post("/send", func(c *fiber.Ctx) error {
		data := new(sample)
		if err := lib.BodyParser(c, data); nil != err {
			return lib.Send(c, 400, err)
		}

		return lib.Send(c, 200, lib.Response{Message: "OK"})
	})

	response, body, err := lib.PostTest(app, "/send", nil, `{"name":"John doew"}`)
	utils.AssertEqual(t, nil, err, "sending request")
	utils.AssertEqual(t, 200, response.StatusCode, "Example 200 response")
	utils.AssertEqual(t, false, nil == body, "validate response body")

	response, _, err = lib.PostTest(app, "/send", nil, `{}`)
	utils.AssertEqual(t, nil, err, "sending request")
	utils.AssertEqual(t, 400, response.StatusCode, "Example 400 response")
}

func TestErrorBadRequest(t *testing.T) {
	app := fiber.New()

	app.Use(func(c *fiber.Ctx) error {
		return lib.ErrorBadRequest(c)
	})

	response, err := app.Test(httptest.NewRequest("GET", "/", nil))
	if nil != err {
		t.Error(err)
		return
	}

	utils.AssertEqual(t, 400, response.StatusCode, "Example 400 response")
}

func TestErrorNotFound(t *testing.T) {
	app := fiber.New()

	app.Use(func(c *fiber.Ctx) error {
		return lib.ErrorNotFound(c)
	})

	response, err := app.Test(httptest.NewRequest("GET", "/", nil))
	if nil != err {
		t.Error(err)
		return
	}

	utils.AssertEqual(t, 404, response.StatusCode, "Example 404 response")
}

func TestErrorConflict(t *testing.T) {
	app := fiber.New()

	app.Get("/default", func(c *fiber.Ctx) error {
		return lib.ErrorConflict(c)
	})

	app.Get("/unique", func(c *fiber.Ctx) error {
		return lib.ErrorConflict(c, "UNIQUE: table.field_name")
	})

	app.Get("/error", func(c *fiber.Ctx) error {
		return lib.ErrorConflict(c, errors.New("ERROR: null value in column \"idx_table_table_name\" violates not-null constraint (SQLSTATE 23502)"))
	})

	response, err := app.Test(httptest.NewRequest("GET", "/default", nil))
	utils.AssertEqual(t, nil, err, "sending request")
	utils.AssertEqual(t, 409, response.StatusCode, "Example 409 response")

	response, err = app.Test(httptest.NewRequest("GET", "/unique", nil))
	utils.AssertEqual(t, nil, err, "sending request")
	utils.AssertEqual(t, 409, response.StatusCode, "Example 409 response")

	response, err = app.Test(httptest.NewRequest("GET", "/error", nil))
	utils.AssertEqual(t, nil, err, "sending request")
	utils.AssertEqual(t, 400, response.StatusCode, "Example 400 response")
}

func TestErrorInternal(t *testing.T) {
	app := fiber.New()

	app.Use(func(c *fiber.Ctx) error {
		return lib.ErrorInternal(c)
	})

	response, err := app.Test(httptest.NewRequest("GET", "/", nil))
	if nil != err {
		t.Error(err)
		return
	}

	utils.AssertEqual(t, 500, response.StatusCode, "Example 500 response")
}

func TestOK(t *testing.T) {
	app := fiber.New()

	app.Use(func(c *fiber.Ctx) error {
		return lib.OK(c)
	})

	response, err := app.Test(httptest.NewRequest("GET", "/", nil))
	if nil != err {
		t.Error(err)
		return
	}

	utils.AssertEqual(t, 200, response.StatusCode, "Example 200 response")
}
