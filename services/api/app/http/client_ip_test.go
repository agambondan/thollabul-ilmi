package http

import (
	"io"
	"net"
	nethttp "net/http"
	"reflect"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/spf13/viper"
)

func serve(t *testing.T, app *fiber.App) string {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	go func() { _ = app.Listener(listener) }()
	t.Cleanup(func() { _ = app.Shutdown() })
	return "http://" + listener.Addr().String()
}

func get(t *testing.T, url, clientIP string) (int, string) {
	t.Helper()
	req, err := nethttp.NewRequest(nethttp.MethodGet, url, nil)
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	if clientIP != "" {
		req.Header.Set(clientIPHeader, clientIP)
	}
	resp, err := nethttp.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("do: %v", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, string(body)
}

func trustedProxiesFrom(t *testing.T, value string) {
	t.Helper()
	viper.Set("TRUSTED_PROXIES", value)
	t.Cleanup(func() { viper.Set("TRUSTED_PROXIES", "") })
}

func TestWithClientIPKeepsExistingConfig(t *testing.T) {
	cfg := WithClientIP(fiber.Config{BodyLimit: 1234, Prefork: false})

	if cfg.BodyLimit != 1234 {
		t.Fatalf("BodyLimit was overwritten: %d", cfg.BodyLimit)
	}
	if cfg.ProxyHeader != "CF-Connecting-IP" {
		t.Fatalf("ProxyHeader = %q", cfg.ProxyHeader)
	}
	if !cfg.EnableTrustedProxyCheck || !cfg.EnableIPValidation {
		t.Fatalf("trusted proxy check and IP validation must both be on: %+v", cfg)
	}
}

func TestTrustedProxiesDefaultAndOverride(t *testing.T) {
	trustedProxiesFrom(t, "")
	if got := TrustedProxies(); !reflect.DeepEqual(got, defaultTrustedProxies) {
		t.Fatalf("default = %v", got)
	}

	trustedProxiesFrom(t, " 10.1.0.0/16, 192.0.2.5 ,, ")
	want := []string{"10.1.0.0/16", "192.0.2.5"}
	if got := TrustedProxies(); !reflect.DeepEqual(got, want) {
		t.Fatalf("override = %v, want %v", got, want)
	}
}

func TestClientIPResolution(t *testing.T) {
	cases := []struct {
		name    string
		trusted string
		header  string
		want    string
	}{
		{"trusted peer with ipv4 header", "", "203.0.113.7", "203.0.113.7"},
		{"trusted peer with ipv6 header", "", "2001:db8::1", "2001:db8::1"},
		{"trusted peer without header falls back to peer", "", "", "127.0.0.1"},
		{"trusted peer with garbage header falls back to peer", "", "not-an-ip", "127.0.0.1"},
		{"untrusted peer cannot spoof the header", "192.0.2.1", "203.0.113.7", "127.0.0.1"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			trustedProxiesFrom(t, tc.trusted)
			app := fiber.New(WithClientIP(fiber.Config{}))
			app.Get("/ip", func(c *fiber.Ctx) error { return c.SendString(c.IP()) })
			base := serve(t, app)

			status, body := get(t, base+"/ip", tc.header)
			if status != nethttp.StatusOK || body != tc.want {
				t.Fatalf("status=%d ip=%q, want ip=%q", status, body, tc.want)
			}
		})
	}
}

func TestRateLimitBucketsFollowTheClient(t *testing.T) {
	trustedProxiesFrom(t, "")
	app := fiber.New(WithClientIP(fiber.Config{}))
	app.Use(limiter.New(limiter.Config{
		Max:               2,
		Expiration:        time.Minute,
		LimiterMiddleware: limiter.SlidingWindow{},
		KeyGenerator: func(c *fiber.Ctx) string {
			return "ip:" + c.IP()
		},
	}))
	app.Get("/ping", func(c *fiber.Ctx) error { return c.SendString("ok") })
	base := serve(t, app)

	for i, want := range []int{200, 200, 429} {
		if status, _ := get(t, base+"/ping", "203.0.113.1"); status != want {
			t.Fatalf("client A request %d: status %d, want %d", i+1, status, want)
		}
	}
	if status, _ := get(t, base+"/ping", "203.0.113.2"); status != 200 {
		t.Fatalf("client B was throttled by client A: status %d", status)
	}
	if status, _ := get(t, base+"/ping", ""); status != 200 {
		t.Fatalf("header-less caller was throttled by client A: status %d", status)
	}
	if status, _ := get(t, base+"/ping", "203.0.113.1"); status != 429 {
		t.Fatalf("client A should still be throttled: status %d", status)
	}
}
