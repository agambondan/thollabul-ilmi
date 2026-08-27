package middlewares

import (
	"net/http/httptest"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
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

		path := c.Path()
		if path == "/metrics" || path == "/health" {
			return c.Next()
		}

		err := c.Next()

		status := c.Response().StatusCode()
		duration := time.Since(start).Seconds()

		requestsTotal.WithLabelValues(c.Method(), path, strconv.Itoa(status)).Inc()
		requestDuration.WithLabelValues(c.Method(), path).Observe(duration)

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
