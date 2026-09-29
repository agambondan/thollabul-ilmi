package middlewares

import (
	"log/slog"
	"net/http/httptest"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"gorm.io/gorm"
)

var (
	requestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "api_requests_total",
		Help: "Total number of HTTP requests",
	}, []string{"method", "path", "status"})

	requestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "api_request_duration_seconds",
		Help:    "Duration of HTTP requests in seconds",
		Buckets: prometheus.DefBuckets,
	}, []string{"method", "path"})

	slowRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "api_slow_requests_total",
		Help: "Total number of HTTP requests taking over 1 second",
	}, []string{"method", "path"})

	activeRequests = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "api_requests_active",
		Help: "Number of currently active requests",
	})

	dbQueryDuration = promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "api_db_query_duration_seconds",
		Help:    "Duration of database queries in seconds",
		Buckets: []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1},
	})
)

func MetricsMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		activeRequests.Inc()
		defer activeRequests.Dec()

		err := c.Next()

		path := c.Route().Path
		if path == "/metrics" || path == "/health" {
			return err
		}

		status := c.Response().StatusCode()
		elapsed := time.Since(start)
		duration := elapsed.Seconds()

		requestsTotal.WithLabelValues(c.Method(), path, strconv.Itoa(status)).Inc()
		requestDuration.WithLabelValues(c.Method(), path).Observe(duration)

		if duration >= 1.0 {
			slowRequestsTotal.WithLabelValues(c.Method(), path).Inc()
			slog.Warn("slow request detected",
				"method", c.Method(),
				"path", path,
				"duration_ms", elapsed.Milliseconds(),
				"status", status,
			)
		}

		return err
	}
}

func MetricsHandler() fiber.Handler {
	handler := promhttp.Handler()
	return func(c *fiber.Ctx) error {
		req := httptest.NewRequest("GET", "/", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
		c.Response().Header.Set("Content-Type", "text/plain; version=0.0.4")
		return c.Send(w.Body.Bytes())
	}
}

func ObserveDBQuery(duration time.Duration) {
	dbQueryDuration.Observe(duration.Seconds())
}

const dbMetricsStartKey = "metrics:start"

func dbMetricsBefore(tx *gorm.DB) {
	tx.InstanceSet(dbMetricsStartKey, time.Now())
}

func dbMetricsAfter(tx *gorm.DB) {
	v, ok := tx.InstanceGet(dbMetricsStartKey)
	if !ok {
		return
	}
	if start, ok := v.(time.Time); ok {
		ObserveDBQuery(time.Since(start))
	}
}

// RegisterDBMetrics wires ObserveDBQuery into every GORM operation type so
// api_db_query_duration_seconds reflects real query timing instead of staying empty.
func RegisterDBMetrics(db *gorm.DB) error {
	registrations := []func() error{
		func() error {
			p := db.Callback().Create()
			if err := p.Before("*").Register("metrics:before_create", dbMetricsBefore); err != nil {
				return err
			}
			return p.After("*").Register("metrics:after_create", dbMetricsAfter)
		},
		func() error {
			p := db.Callback().Query()
			if err := p.Before("*").Register("metrics:before_query", dbMetricsBefore); err != nil {
				return err
			}
			return p.After("*").Register("metrics:after_query", dbMetricsAfter)
		},
		func() error {
			p := db.Callback().Update()
			if err := p.Before("*").Register("metrics:before_update", dbMetricsBefore); err != nil {
				return err
			}
			return p.After("*").Register("metrics:after_update", dbMetricsAfter)
		},
		func() error {
			p := db.Callback().Delete()
			if err := p.Before("*").Register("metrics:before_delete", dbMetricsBefore); err != nil {
				return err
			}
			return p.After("*").Register("metrics:after_delete", dbMetricsAfter)
		},
		func() error {
			p := db.Callback().Row()
			if err := p.Before("*").Register("metrics:before_row", dbMetricsBefore); err != nil {
				return err
			}
			return p.After("*").Register("metrics:after_row", dbMetricsAfter)
		},
		func() error {
			p := db.Callback().Raw()
			if err := p.Before("*").Register("metrics:before_raw", dbMetricsBefore); err != nil {
				return err
			}
			return p.After("*").Register("metrics:after_raw", dbMetricsAfter)
		},
	}

	for _, register := range registrations {
		if err := register(); err != nil {
			return err
		}
	}

	return nil
}
