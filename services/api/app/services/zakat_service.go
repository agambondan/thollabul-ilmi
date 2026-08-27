package service

import (
	"encoding/json"
	"math"
	"net/http"
	"sync"
	"time"
)

type ZakatMaalRequest struct {
	TotalWealth      float64 `json:"total_wealth" validate:"min=0"`
	GoldPricePerGram float64 `json:"gold_price_per_gram" validate:"min=0"`
}

type ZakatFitrahRequest struct {
	PersonCount      int     `json:"person_count" validate:"required,min=1"`
	StaplePricePerKg float64 `json:"staple_price_per_kg" validate:"min=0"`
}

type ZakatMaalResult struct {
	TotalWealth   float64 `json:"total_wealth"`
	Nishab        float64 `json:"nishab"`
	IsObligated   bool    `json:"is_obligated"`
	ZakatAmount   float64 `json:"zakat_amount"`
	Rate          float64 `json:"rate"`
	NishabGrams   float64 `json:"nishab_grams"`
	GoldPriceUsed float64 `json:"gold_price_used"`
}

type ZakatFitrahResult struct {
	PersonCount     int     `json:"person_count"`
	PerPersonRice   float64 `json:"per_person_rice_kg"`
	TotalRice       float64 `json:"total_rice_kg"`
	MoneyEquivalent float64 `json:"money_equivalent"`
}

type NishabInfo struct {
	GoldGrams   float64 `json:"gold_grams"`
	SilverGrams float64 `json:"silver_grams"`
	Description string  `json:"description"`
}

type ZakatService interface {
	CalculateMaal(req *ZakatMaalRequest) *ZakatMaalResult
	CalculateFitrah(req *ZakatFitrahRequest) *ZakatFitrahResult
	GetNishab() *NishabInfo
	GetGoldPrice() float64
}

type zakatService struct {
	goldMu    sync.RWMutex
	goldPrice float64
	goldAt    time.Time
}

func NewZakatService() ZakatService {
	s := &zakatService{goldPrice: 1400000.0}
	go s.refreshGoldLoop()
	return s
}

func (s *zakatService) refreshGoldLoop() {
	for {
		s.fetchGoldPrice()
		time.Sleep(6 * time.Hour)
	}
}

func (s *zakatService) fetchGoldPrice() {
	resp, err := http.Get("https://api.exchangerate-api.com/v4/latest/USD")
	if err != nil {
		return
	}
	defer resp.Body.Close()
	var data struct {
		Rates struct {
			IDR float64 `json:"IDR"`
		} `json:"rates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil || data.Rates.IDR == 0 {
		return
	}
	usdToIdr := data.Rates.IDR
	goldOunce := 2400.0
	goldPerGram := (goldOunce * usdToIdr) / 31.1035
	s.goldMu.Lock()
	s.goldPrice = math.Round(goldPerGram/100) * 100
	s.goldAt = time.Now()
	s.goldMu.Unlock()
}

func (s *zakatService) GetGoldPrice() float64 {
	s.goldMu.RLock()
	defer s.goldMu.RUnlock()
	return s.goldPrice
}

const (
	nishabGoldGrams   = 85.0
	nishabSilverGrams = 595.0
	zakatRate         = 0.025
	fitrahRiceKg      = 2.5
)

func (s *zakatService) CalculateMaal(req *ZakatMaalRequest) *ZakatMaalResult {
	goldPrice := req.GoldPricePerGram
	if goldPrice <= 0 {
		goldPrice = 950000
	}
	nishab := nishabGoldGrams * goldPrice
	obligated := req.TotalWealth >= nishab
	amount := 0.0
	if obligated {
		amount = math.Round(req.TotalWealth*zakatRate*100) / 100
	}
	return &ZakatMaalResult{
		TotalWealth:   req.TotalWealth,
		Nishab:        nishab,
		IsObligated:   obligated,
		ZakatAmount:   amount,
		Rate:          zakatRate * 100,
		NishabGrams:   nishabGoldGrams,
		GoldPriceUsed: goldPrice,
	}
}

func (s *zakatService) CalculateFitrah(req *ZakatFitrahRequest) *ZakatFitrahResult {
	pricePerKg := req.StaplePricePerKg
	if pricePerKg <= 0 {
		pricePerKg = 12000
	}
	totalRice := float64(req.PersonCount) * fitrahRiceKg
	money := totalRice * pricePerKg
	return &ZakatFitrahResult{
		PersonCount:     req.PersonCount,
		PerPersonRice:   fitrahRiceKg,
		TotalRice:       totalRice,
		MoneyEquivalent: money,
	}
}

func (s *zakatService) GetNishab() *NishabInfo {
	return &NishabInfo{
		GoldGrams:   nishabGoldGrams,
		SilverGrams: nishabSilverGrams,
		Description: "Nishab zakat maal setara 85 gram emas atau 595 gram perak. Zakat wajib jika kepemilikan mencapai nishab selama 1 tahun (haul).",
	}
}
