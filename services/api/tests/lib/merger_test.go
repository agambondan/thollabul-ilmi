//go:build !integration
// +build !integration

package lib

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
)

func TestMerge(t *testing.T) {
	oldData := fiber.Map{"message": "hello world"}
	newData := fiber.Map{}

	lib.Merge(oldData, &newData)

	utils.AssertEqual(t, oldData["message"], newData["message"], "Merger")
}
