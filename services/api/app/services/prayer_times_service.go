package service

import (
	"fmt"
	"math"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/mnadev/adhango/pkg/calc"
	"github.com/mnadev/adhango/pkg/data"
	"github.com/mnadev/adhango/pkg/util"
)

type PrayerTimesService interface {
	GetByDate(lat, lng float64, date time.Time, method, madhab string) (*model.PrayerTimesResponse, error)
	GetWeekly(lat, lng float64, method, madhab string) ([]model.PrayerTimesResponse, error)
	GetImsakiyah(lat, lng float64, year, month int, method, madhab string) (*model.ImsakiyahResponse, error)
}

type prayerTimesService struct{}

func NewPrayerTimesService() PrayerTimesService { return &prayerTimesService{} }

type calcMethod struct {
	FajrAngle   float64
	IshaAngle   float64
	IshaMinutes float64 // >0 means fixed minutes after Maghrib instead of angle
}

var methods = map[string]calcMethod{
	"kemenag": {20, 18, 0},
	"mwl":     {18, 17, 0},
	"isna":    {15, 15, 0},
	"egypt":   {19.5, 17.5, 0},
	"makkah":  {18.5, 0, 90},
	"karachi": {18, 18, 0},
	"jakim":   {20, 18, 0},
}

func rad(d float64) float64 { return d * math.Pi / 180 }
func deg(r float64) float64 { return r * 180 / math.Pi }

func julianDay(year, month, day int) float64 {
	if month <= 2 {
		year--
		month += 12
	}
	A := math.Floor(float64(year) / 100)
	B := 2 - A + math.Floor(A/4)
	return math.Floor(365.25*(float64(year)+4716)) + math.Floor(30.6001*(float64(month)+1)) + float64(day) + B - 1524.5
}

func sunPosition(jd float64) (decl, eqT float64) {
	D := jd - 2451545.0
	g := rad(357.529 + 0.98560028*D)
	q := rad(280.459 + 0.98564736*D)
	L := rad(math.Mod(280.459+0.98564736*D+1.915*math.Sin(g)+0.020*math.Sin(2*g), 360))
	e := rad(23.439 - 0.00000036*D)
	RA := deg(math.Atan2(math.Cos(e)*math.Sin(L), math.Cos(L))) / 15
	decl = math.Asin(math.Sin(e) * math.Sin(L))
	eqT = (deg(q)/15 - RA) * 60
	return
}

func hourAngle(lat, decl, angle float64) float64 {
	val := (-math.Sin(rad(angle)) - math.Sin(rad(lat))*math.Sin(decl)) / (math.Cos(rad(lat)) * math.Cos(decl))
	if val > 1 || val < -1 {
		return math.NaN()
	}
	return deg(math.Acos(val)) / 15
}

func asrHourAngle(lat, decl, shadowFactor float64) float64 {
	elevation := math.Atan(1.0 / (shadowFactor + math.Tan(math.Abs(rad(lat)-decl))))
	val := (math.Sin(elevation) - math.Sin(rad(lat))*math.Sin(decl)) / (math.Cos(rad(lat)) * math.Cos(decl))
	if val > 1 || val < -1 {
		return math.NaN()
	}
	return deg(math.Acos(val)) / 15
}

func hoursToTime(h float64, tz int) string {
	if math.IsNaN(h) {
		return "--:--"
	}
	h = math.Mod(h+float64(tz), 24)
	if h < 0 {
		h += 24
	}
	hh := int(h)
	mm := int((h - float64(hh)) * 60)
	return fmt.Sprintf("%02d:%02d", hh, mm)
}

func (s *prayerTimesService) calculate(lat, lng float64, date time.Time, method, madhab string) model.PrayerTime {
	if method == "adhango" {
		return s.calculateAdhango(lat, lng, date, madhab)
	}
	m, ok := methods[method]
	if !ok {
		m = methods["kemenag"]
	}

	// Asr shadow factor: Syafi'i/Maliki/Hanbali = 1 (default), Hanafi = 2.
	asrFactor := 1.0
	if madhab == "hanafi" {
		asrFactor = 2.0
	}

	_, offset := date.Zone()
	tz := offset / 3600

	jd := julianDay(date.Year(), int(date.Month()), date.Day())
	decl, eqT := sunPosition(jd)

	transit := 12 + (-lng / 15) - eqT/60

	sunrise := transit - hourAngle(lat, decl, 0.833)
	sunset := transit + hourAngle(lat, decl, 0.833)

	fajr := transit - hourAngle(lat, decl, m.FajrAngle)
	dhuhr := transit + 1.0/60
	asr := transit + asrHourAngle(lat, decl, asrFactor)
	maghrib := sunset
	var isha float64
	if m.IshaMinutes > 0 {
		isha = sunset + m.IshaMinutes/60
	} else {
		isha = transit + hourAngle(lat, decl, m.IshaAngle)
	}
	imsak := fajr - 10.0/60

	return model.PrayerTime{
		Imsak:   hoursToTime(imsak, tz),
		Fajr:    hoursToTime(fajr, tz),
		Sunrise: hoursToTime(sunrise, tz),
		Dhuhr:   hoursToTime(dhuhr, tz),
		Asr:     hoursToTime(asr, tz),
		Maghrib: hoursToTime(maghrib, tz),
		Isha:    hoursToTime(isha, tz),
	}
}

func normalizeMadhab(m string) string {
	if m == "hanafi" {
		return "hanafi"
	}
	return "shafi"
}

func (s *prayerTimesService) GetByDate(lat, lng float64, date time.Time, method, madhab string) (*model.PrayerTimesResponse, error) {
	if _, ok := methods[method]; !ok {
		method = "kemenag"
	}
	madhab = normalizeMadhab(madhab)
	return &model.PrayerTimesResponse{
		Date:    date.Format("2006-01-02"),
		Lat:     lat,
		Lng:     lng,
		Method:  method,
		Madhab:  madhab,
		Prayers: s.calculate(lat, lng, date, method, madhab),
	}, nil
}

func (s *prayerTimesService) GetWeekly(lat, lng float64, method, madhab string) ([]model.PrayerTimesResponse, error) {
	if _, ok := methods[method]; !ok {
		method = "kemenag"
	}
	madhab = normalizeMadhab(madhab)
	var result []model.PrayerTimesResponse
	today := time.Now()
	for i := 0; i < 7; i++ {
		d := today.AddDate(0, 0, i)
		result = append(result, model.PrayerTimesResponse{
			Date:    d.Format("2006-01-02"),
			Lat:     lat,
			Lng:     lng,
			Method:  method,
			Madhab:  madhab,
			Prayers: s.calculate(lat, lng, d, method, madhab),
		})
	}
	return result, nil
}

func (s *prayerTimesService) GetImsakiyah(lat, lng float64, year, month int, method, madhab string) (*model.ImsakiyahResponse, error) {
	if _, ok := methods[method]; !ok {
		method = "kemenag"
	}
	madhab = normalizeMadhab(madhab)
	loc := time.Now().Location()
	daysInMonth := time.Date(year, time.Month(month+1), 0, 0, 0, 0, 0, loc).Day()
	var rows []model.ImsakiyahRow
	for d := 1; d <= daysInMonth; d++ {
		date := time.Date(year, time.Month(month), d, 12, 0, 0, 0, loc)
		rows = append(rows, model.ImsakiyahRow{
			Date:    date.Format("2006-01-02"),
			Prayers: s.calculate(lat, lng, date, method, madhab),
		})
	}
	return &model.ImsakiyahResponse{
		Year:   year,
		Month:  month,
		Lat:    lat,
		Lng:    lng,
		Method: method,
		Madhab: madhab,
		Rows:   rows,
	}, nil
}

func (s *prayerTimesService) calculateAdhango(lat, lng float64, date time.Time, madhab string) model.PrayerTime {
	coords := &util.Coordinates{Latitude: lat, Longitude: lng}
	dc := &data.DateComponents{Year: date.Year(), Month: int(date.Month()), Day: date.Day()}
	cb := calc.NewCalculationParametersBuilder().SetMethod(calc.MUSLIM_WORLD_LEAGUE)
	if madhab == "hanafi" {
		cb.SetMadhab(calc.HANAFI)
	}
	pt, err := calc.NewPrayerTimes(coords, dc, cb.Build())
	if err != nil {
		return model.PrayerTime{}
	}
	f := func(t time.Time) string { return t.Format("15:04") }
	return model.PrayerTime{
		Fajr: f(pt.Fajr), Sunrise: f(pt.Sunrise), Dhuhr: f(pt.Dhuhr),
		Asr: f(pt.Asr), Maghrib: f(pt.Maghrib), Isha: f(pt.Isha),
		Imsak: f(pt.Fajr.Add(-10 * time.Minute)),
	}
}
