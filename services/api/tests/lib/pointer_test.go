package lib

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"

	"github.com/gofiber/fiber/v2/utils"
	"github.com/google/uuid"
)

func TestUUIDPtr(t *testing.T) {
	var a uuid.UUID = uuid.New()
	b := lib.UUIDPtr(a)
	utils.AssertEqual(t, a, *b)
}

func TestIntptr(t *testing.T) {
	var a int = 1
	b := lib.Intptr(a)
	utils.AssertEqual(t, a, *b)
}

func TestInt64ptr(t *testing.T) {
	var a int64 = 1
	b := lib.Int64ptr(a)
	utils.AssertEqual(t, a, *b)
}

func TestStrptr(t *testing.T) {
	var a string = "1"
	b := lib.Strptr(a)
	utils.AssertEqual(t, a, *b)
}

func TestBoolptr(t *testing.T) {
	b := lib.Boolptr(true)
	utils.AssertEqual(t, true, *b)
}

func TestFloat64ptr(t *testing.T) {
	var a float64 = 1.2
	b := lib.Float64ptr(a)
	utils.AssertEqual(t, a, *b)
}
