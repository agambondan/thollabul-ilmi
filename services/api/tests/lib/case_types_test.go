package lib

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"

	"github.com/gofiber/fiber/v2/utils"
)

func TestSnakeCase(t *testing.T) {
	data := map[string]string{
		"":                           "",
		"F":                          "f",
		"Foo":                        "foo",
		"FooB":                       "foo_b",
		"FooID":                      "foo_id",
		" FooBar\t":                  "foo_bar",
		"HTTPStatusCode":             "http_status_code",
		"ParseURL.DoParse":           "parse_url.do_parse",
		"Convert Space":              "convert_space",
		"Convert-dash":               "convert_dash",
		"Skip___MultipleUnderscores": "skip_multiple_underscores",
		"Skip   MultipleSpaces":      "skip_multiple_spaces",
		"Skip---MultipleDashes":      "skip_multiple_dashes",
	}

	for camel, snake := range data {
		converted := lib.SnakeCase(camel)
		utils.AssertEqual(t, snake, converted)
	}
}

func TestUpperSnakeCase(t *testing.T) {
	data := map[string]string{
		"":                           "",
		"F":                          "F",
		"Foo":                        "FOO",
		"FooB":                       "FOO_B",
		"FooID":                      "FOO_ID",
		" FooBar\t":                  "FOO_BAR",
		"HTTPStatusCode":             "HTTP_STATUS_CODE",
		"ParseURL.DoParse":           "PARSE_URL.DO_PARSE",
		"Convert Space":              "CONVERT_SPACE",
		"Convert-dash":               "CONVERT_DASH",
		"Skip___MultipleUnderscores": "SKIP_MULTIPLE_UNDERSCORES",
		"Skip   MultipleSpaces":      "SKIP_MULTIPLE_SPACES",
		"Skip---MultipleDashes":      "SKIP_MULTIPLE_DASHES",
	}

	for camel, snake := range data {
		converted := lib.UpperSnakeCase(camel)
		utils.AssertEqual(t, snake, converted)
	}
}

func TestKebabCase(t *testing.T) {
	data := map[string]string{
		"":                           "",
		"F":                          "f",
		"Foo":                        "foo",
		"FooB":                       "foo-b",
		"FooID":                      "foo-id",
		" FooBar\t":                  "foo-bar",
		"HTTPStatusCode":             "http-status-code",
		"ParseURL.DoParse":           "parse-url.do-parse",
		"Convert Space":              "convert-space",
		"Convert-dash":               "convert-dash",
		"Skip___MultipleUnderscores": "skip-multiple-underscores",
		"Skip   MultipleSpaces":      "skip-multiple-spaces",
		"Skip---MultipleDashes":      "skip-multiple-dashes",
	}

	for camel, snake := range data {
		converted := lib.KebabCase(camel)
		utils.AssertEqual(t, snake, converted)
	}
}

func TestUpperKebabCase(t *testing.T) {
	data := map[string]string{
		"":                           "",
		"F":                          "F",
		"Foo":                        "FOO",
		"FooB":                       "FOO-B",
		"FooID":                      "FOO-ID",
		" FooBar\t":                  "FOO-BAR",
		"HTTPStatusCode":             "HTTP-STATUS-CODE",
		"ParseURL.DoParse":           "PARSE-URL.DO-PARSE",
		"Convert Space":              "CONVERT-SPACE",
		"Convert-dash":               "CONVERT-DASH",
		"Skip___MultipleUnderscores": "SKIP-MULTIPLE-UNDERSCORES",
		"Skip   MultipleSpaces":      "SKIP-MULTIPLE-SPACES",
		"Skip---MultipleDashes":      "SKIP-MULTIPLE-DASHES",
	}

	for camel, snake := range data {
		converted := lib.UpperKebabCase(camel)
		utils.AssertEqual(t, snake, converted)
	}
}
