package db

import (
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"github.com/agambondan/islamic-explorer/app/config"
	"github.com/agambondan/islamic-explorer/app/http/middlewares"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func NewPostgresql(env *config.Environment) *gorm.DB {
	logLevel := logger.Info

	switch viper.GetString("ENVIRONMENT") {
	case "staging":
		logLevel = logger.Error
	case "production":
		logLevel = logger.Silent
	}

	config := gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   viper.GetString("DB_TABLE_PREFIX"),
			SingularTable: true,
		},
		DisableForeignKeyConstraintWhenMigrating: true,
		PrepareStmt:                              true,
		SkipDefaultTransaction:                   true,
	}

	var dsn string

	if env != nil {
		dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
			*env.DBHost,
			*env.DBPort,
			*env.DBUser,
			*env.DBPassword,
			*env.DBName,
		)
	} else {
		dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
			viper.GetString("DB_HOST"),
			viper.GetString("DB_PORT"),
			viper.GetString("DB_USER"),
			viper.GetString("DB_PASS"),
			viper.GetString("DB_NAME"),
		)
	}

	var sqlDB *sql.DB
	var db *gorm.DB
	var err error

	for i := 0; i < 5; i++ {
		sqlDB, err = sql.Open("pgx", dsn)
		if err != nil {
			time.Sleep(2 * time.Second)
			continue
		}
		// https://aws.amazon.com/blogs/database/performance-impact-of-idle-postgresql-connections
		// Increased from 10 → 50 to handle concurrent mobile/web user load.
		// 50 is safe for a typical Postgres instance (max_connections default = 100).
		sqlDB.SetMaxOpenConns(50)
		sqlDB.SetMaxIdleConns(25)
		sqlDB.SetConnMaxLifetime(30 * time.Minute)
		sqlDB.SetConnMaxIdleTime(5 * time.Minute)

		db, err = gorm.Open(postgres.New(postgres.Config{
			Conn: sqlDB,
		}), &config)

		if err == nil {
			break
		}
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		panic(err)
	}

	if err := middlewares.RegisterDBMetrics(db); err != nil {
		slog.Error("failed to register db metrics callbacks", "error", err)
	}

	return db
}

func PingDB(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

func PoolStats(db *gorm.DB) map[string]interface{} {
	sqlDB, err := db.DB()
	if err != nil {
		return map[string]interface{}{"error": err.Error()}
	}
	stats := sqlDB.Stats()
	return map[string]interface{}{
		"open":          stats.OpenConnections,
		"in_use":        stats.InUse,
		"idle":          stats.Idle,
		"wait_count":    stats.WaitCount,
		"wait_duration": stats.WaitDuration.String(),
		"max_open":      stats.MaxOpenConnections,
	}
}
