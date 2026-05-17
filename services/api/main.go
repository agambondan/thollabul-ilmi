package main

import (
	"context"
	"flag"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/agambondan/islamic-explorer/app/config"
	"github.com/agambondan/islamic-explorer/app/db"
	"github.com/agambondan/islamic-explorer/app/http"
	"github.com/agambondan/islamic-explorer/app/http/middlewares"
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/repository"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/go-redis/redis/v8"
	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

// @title Master API
// @version 1.0.0
// @description API Documentation
// @termsOfService https://e-invitation.com/tnc.html
// @contact.name Developer
// @contact.email e-invitation@gmail.com
// @host https://wedding-be-cxvkr667ca-et.a.run.app:9999
// @schemes https http
// @BasePath /api/v1/
// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	if viper.GetString("ENVIRONMENT") == "production" {
		slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	} else {
		slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, nil)))
	}
	environment := config.Environment{}
	env := environment.Init()

	redisDB, err := db.NewRedisDB(env)
	if err != nil {
		slog.Warn("redis unavailable, running without cache layer", "err", err)
	}

	if err := middlewares.SetupSentry(); err != nil {
		slog.Warn("sentry init failed", "err", err)
	}
	var redisClient *redis.Client
	if redisDB != nil {
		redisClient = redisDB.Client
	}

	newPostgresql := db.NewPostgresql(env)

	newRepositories, err := repository.NewRepositories(newPostgresql, redisClient)
	if err != nil {
		panic(err)
	}

	switch {
	case *migrateFlag:
		err = newRepositories.Migrations()
		if err != nil {
			panic(err)
		}
		err = newRepositories.Seeder()
		if err != nil {
			panic(err)
		}
		err = newRepositories.AddForeignKey()
		if err != nil {
			panic(err)
		}
		return
	case *seedFlag:
		err = newRepositories.Seeder()
		if err != nil {
			panic(err)
		}
		return
	}

	services := service.NewServices(newRepositories)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT, syscall.SIGQUIT)
	defer stop()

	services.Notification.StartReminderScheduler(ctx, time.Minute)

	bodyLimit := viper.GetInt("BODY_LIMIT_BYTES")
	if bodyLimit <= 0 {
		bodyLimit = 25 * 1024 * 1024
	}
	app := fiber.New(fiber.Config{
		Prefork:   viper.GetString("PREFORK") == "true",
		BodyLimit: bodyLimit,
	})

	http.Handle(app, newRepositories)

	go func() {
		if err := app.Listen(":" + viper.GetString("PORT")); err != nil {
			log.Fatal(err)
		}
	}()

	<-ctx.Done()
	stop()
	slog.Info("shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := app.ShutdownWithContext(shutdownCtx); err != nil {
		slog.Error("server shutdown error", "err", err)
	}
	middlewares.FlushSentry()
	slog.Info("server stopped gracefully")
}

var (
	migrateFlag = flag.Bool("migrate", false, "run migrations and seed, then exit")
	seedFlag    = flag.Bool("seed", false, "run seed only, then exit")
)

func init() {
	env := flag.String("environment", "", "set environment")
	healthCheck := flag.Bool("healthcheck", false, "run health check and exit")
	flag.Parse()

	if *healthCheck {
		os.Exit(0)
	}
	switch *env {
	case "development":
		if err := lib.LoadEnvironmentLocalFlag(".env.development"); err != nil {
			panic(err)
		}
	case "staging":
		if err := lib.LoadEnvironmentLocalFlag(".env.staging"); err != nil {
			panic(err)
		}
	case "production":
		if err := lib.LoadEnvironmentLocalFlag(".env.production"); err != nil {
			panic(err)
		}
	case "container":
		// Baca langsung dari OS env vars (docker-compose / k8s)
		viper.AutomaticEnv()
	default:
		if err := lib.LoadEnvironmentLocalFlag(".env.local"); err != nil {
			panic(err)
		}
	}
}
