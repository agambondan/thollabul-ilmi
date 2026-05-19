//go:build ignore

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

type locationFile struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Category    string  `json:"category"`
	Era         string  `json:"era"`
}

func main() {
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()
	_ = viper.ReadInConfig()

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		viper.GetString("DB_HOST"),
		viper.GetString("DB_PORT"),
		viper.GetString("DB_USER"),
		viper.GetString("DB_PASS"),
		viper.GetString("DB_NAME"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Warn),
		NamingStrategy: schema.NamingStrategy{TablePrefix: viper.GetString("DB_TABLE_PREFIX")},
	})
	if err != nil {
		log.Fatalf("DB connect: %v", err)
	}

	raw, err := os.ReadFile("data/locations.json")
	if err != nil {
		log.Fatalf("read data/locations.json: %v", err)
	}

	var locations []locationFile
	if err := json.Unmarshal(raw, &locations); err != nil {
		log.Fatalf("parse locations.json: %v", err)
	}

	if err := db.AutoMigrate(&model.Location{}); err != nil {
		log.Fatalf("auto migrate: %v", err)
	}

	count := 0
	for _, loc := range locations {
		item := model.Location{
			Name:        loc.Name,
			Description: loc.Description,
			Latitude:    loc.Latitude,
			Longitude:   loc.Longitude,
			Category:    loc.Category,
			Era:         loc.Era,
		}
		if err := db.Where("name = ?", loc.Name).FirstOrCreate(&item).Error; err != nil {
			log.Printf("skip %s: %v", loc.Name, err)
			continue
		}
		count++
	}

	log.Printf("Seeded %d lokasi dari %d total.", count, len(locations))
}
