package http

import (
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

func limitedApp(t *testing.T, trusted string) string {
	t.Helper()
	viper.Set("RATE_LIMIT_GLOBAL", 2)
	viper.Set("RATE_LIMIT_INTERNAL", 4)
	t.Cleanup(func() {
		viper.Set("RATE_LIMIT_GLOBAL", 0)
		viper.Set("RATE_LIMIT_INTERNAL", 0)
	})
	trustedProxiesFrom(t, trusted)

	app := fiber.New(WithClientIP(fiber.Config{}))
	public, internal := globalLimiters()
	app.Use(public, internal)
	app.Get("/ping", func(c *fiber.Ctx) error { return c.SendString("ok") })
	app.Get("/health", func(c *fiber.Ctx) error { return c.SendString("ok") })
	return serve(t, app)
}

func statuses(t *testing.T, url, clientIP string, n int) []int {
	t.Helper()
	out := make([]int, n)
	for i := range out {
		out[i], _ = get(t, url, clientIP)
	}
	return out
}

func equal(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func TestInternalCallsGetTheirOwnGenerousBucket(t *testing.T) {
	base := limitedApp(t, "")

	if got := statuses(t, base+"/ping", "", 5); !equal(got, []int{200, 200, 200, 200, 429}) {
		t.Fatalf("header-less trusted caller: %v, want four 200s then 429", got)
	}
	if got := statuses(t, base+"/ping", "203.0.113.1", 3); !equal(got, []int{200, 200, 429}) {
		t.Fatalf("real client A: %v, want two 200s then 429", got)
	}
	if status, _ := get(t, base+"/ping", "203.0.113.2"); status != 200 {
		t.Fatalf("real client B throttled by others: %d", status)
	}
	if status, _ := get(t, base+"/ping", ""); status != 429 {
		t.Fatalf("internal bucket should still be exhausted: %d", status)
	}
}

func TestInternalBucketDoesNotShieldRealClients(t *testing.T) {
	base := limitedApp(t, "")

	statuses(t, base+"/ping", "", 6)
	if got := statuses(t, base+"/ping", "198.51.100.9", 3); !equal(got, []int{200, 200, 429}) {
		t.Fatalf("real client must keep the public cap even next to internal traffic: %v", got)
	}
}

func TestUntrustedPeerNeverGetsTheInternalTier(t *testing.T) {
	base := limitedApp(t, "192.0.2.1")

	if got := statuses(t, base+"/ping", "", 3); !equal(got, []int{200, 200, 429}) {
		t.Fatalf("untrusted header-less caller got the internal cap: %v", got)
	}
}

func TestHealthIsNeverMetered(t *testing.T) {
	base := limitedApp(t, "")

	for _, clientIP := range []string{"", "203.0.113.7"} {
		for _, status := range statuses(t, base+"/health", clientIP, 8) {
			if status != 200 {
				t.Fatalf("/health throttled for %q: %d", clientIP, status)
			}
		}
	}
}
