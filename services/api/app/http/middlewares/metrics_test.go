package middlewares

import (
	"io"
	"net"
	"net/http"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/prometheus/client_golang/prometheus"
	dto "github.com/prometheus/client_model/go"
	"github.com/valyala/fasthttp"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type metricsTestModel struct {
	ID   uint `gorm:"primarykey"`
	Name string
}

func dbQueryDurationSampleCount(t *testing.T) uint64 {
	t.Helper()
	m := &dto.Metric{}
	if err := dbQueryDuration.Write(m); err != nil {
		t.Fatalf("failed to read dbQueryDuration: %v", err)
	}
	return m.GetHistogram().GetSampleCount()
}

func TestRegisterDBMetricsObservesQueryDuration(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&metricsTestModel{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	if err := RegisterDBMetrics(db); err != nil {
		t.Fatalf("RegisterDBMetrics returned error: %v", err)
	}

	before := dbQueryDurationSampleCount(t)

	if err := db.Create(&metricsTestModel{Name: "test"}).Error; err != nil {
		t.Fatalf("create failed: %v", err)
	}
	var out metricsTestModel
	if err := db.First(&out).Error; err != nil {
		t.Fatalf("query failed: %v", err)
	}
	if err := db.Model(&out).Update("name", "updated").Error; err != nil {
		t.Fatalf("update failed: %v", err)
	}
	if err := db.Delete(&out).Error; err != nil {
		t.Fatalf("delete failed: %v", err)
	}

	after := dbQueryDurationSampleCount(t)
	if after < before+4 {
		t.Fatalf("expected at least 4 new observations (create/query/update/delete), before=%d after=%d", before, after)
	}
}

func metricLabelValues(t *testing.T, family, label string) map[string]bool {
	t.Helper()
	families, err := prometheus.DefaultGatherer.Gather()
	if err != nil {
		t.Fatalf("gathering metrics failed, /metrics would return an error page: %v", err)
	}
	values := map[string]bool{}
	for _, f := range families {
		if f.GetName() != family {
			continue
		}
		for _, m := range f.GetMetric() {
			for _, l := range m.GetLabel() {
				if l.GetName() == label {
					values[l.GetValue()] = true
				}
			}
		}
	}
	return values
}

func TestMetricsMiddlewareLabelsSurviveConnectionReuse(t *testing.T) {
	app := fiber.New()
	app.Use(MetricsMiddleware())
	ok := func(c *fiber.Ctx) error { return c.SendString("ok") }
	app.Post("/reuse", ok)
	app.Get("/reuse", ok)

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	go func() { _ = app.Listener(listener) }()
	t.Cleanup(func() { _ = app.Shutdown() })

	client := &http.Client{Transport: &http.Transport{MaxIdleConnsPerHost: 1}}
	base := "http://" + listener.Addr().String() + "/reuse"
	for i := 0; i < 4; i++ {
		for _, method := range []string{http.MethodPost, http.MethodGet} {
			req, _ := http.NewRequest(method, base, nil)
			resp, err := client.Do(req)
			if err != nil {
				t.Fatalf("%s: %v", method, err)
			}
			_, _ = io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
		}
	}

	methods := metricLabelValues(t, "api_requests_total", "method")
	for _, want := range []string{"GET", "POST"} {
		if !methods[want] {
			t.Errorf("method label %q missing, got %v", want, methods)
		}
	}
	allowed := map[string]bool{"GET": true, "HEAD": true, "POST": true, "PUT": true, "PATCH": true, "DELETE": true, "OPTIONS": true, "OTHER": true}
	for value := range methods {
		if !allowed[value] {
			t.Errorf("method label %q is not a known method: the string was aliased to a reused request buffer", value)
		}
	}
}

func TestMethodLabelBoundsCardinality(t *testing.T) {
	app := fiber.New()
	for method, want := range map[string]string{
		"GET": "GET", "POST": "POST", "DELETE": "DELETE", "PROPFIND": "OTHER", "GETT": "OTHER",
	} {
		fctx := &fasthttp.RequestCtx{}
		fctx.Request.Header.SetMethod(method)
		c := app.AcquireCtx(fctx)
		got := methodLabel(c)
		app.ReleaseCtx(c)
		if got != want {
			t.Errorf("methodLabel(%q) = %q, want %q", method, got, want)
		}
	}
}
