package rijal

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/agambondan/islamic-explorer/app/controllers"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func seedTokohTarikh(t *testing.T) *gorm.DB {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.TokohTarikh{})

	mustCreate(t, db, &model.Translation{BaseID: baseID(1), Idn: testdb.Str("tokoh-tr-live")})
	mustCreate(t, db, &model.Translation{BaseID: baseID(2), Idn: testdb.Str("tokoh-tr-dead")})
	testdb.Delete(t, db, &model.Translation{BaseID: baseID(2)})

	tokoh := func(id int, nama, era, kategori string, translationID int) {
		mustCreate(t, db, &model.TokohTarikh{
			BaseID:        baseID(id),
			Nama:          nama,
			Era:           era,
			Kategori:      kategori,
			Biografi:      "biografi " + nama,
			TranslationID: testdb.Int(translationID),
		})
	}
	tokoh(1, "tokoh-live", "Sahabat", "sahabat", 1)
	tokoh(2, "tokoh-deleted", "Sahabat", "sahabat", 1)
	tokoh(3, "tokoh-translation-dead", "Tabiin", "ulama", 2)
	tokoh(4, "tokoh-other-era", "Tabiin", "sahabat", 1)
	tokoh(5, "tokoh-deleted-ulama", "Tabiin", "ulama", 1)
	testdb.Delete(t, db, &model.TokohTarikh{BaseID: baseID(2)})
	testdb.Delete(t, db, &model.TokohTarikh{BaseID: baseID(5)})
	return db
}

func tokohTarikhIDs(list []model.TokohTarikh) []int {
	ids := make([]int, 0, len(list))
	for _, row := range list {
		ids = append(ids, *row.ID)
	}
	return ids
}

func TestSoftDeleteTokohTarikhFindAll(t *testing.T) {
	repo := repository.NewTokohTarikhRepository(seedTokohTarikh(t))

	cases := []struct {
		name     string
		era      string
		kategori string
		limit    int
		offset   int
		wantIDs  []int
		want     int64
	}{
		{name: "unfiltered", limit: 50, wantIDs: []int{1, 3, 4}, want: 3},
		{name: "era Sahabat", era: "Sahabat", limit: 50, wantIDs: []int{1}, want: 1},
		{name: "era Tabiin", era: "Tabiin", limit: 50, wantIDs: []int{3, 4}, want: 2},
		{name: "kategori ulama", kategori: "ulama", limit: 50, wantIDs: []int{3}, want: 1},
		{name: "kategori sahabat", kategori: "sahabat", limit: 50, wantIDs: []int{1, 4}, want: 2},
		{name: "era and kategori", era: "Tabiin", kategori: "sahabat", limit: 50, wantIDs: []int{4}, want: 1},
		{name: "second page", limit: 2, offset: 1, wantIDs: []int{3, 4}, want: 3},
		{name: "no limit", wantIDs: []int{1, 3, 4}, want: 3},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			items, total, err := repo.FindAll("", tc.era, tc.kategori, tc.limit, tc.offset)
			if err != nil {
				t.Fatalf("FindAll: %v", err)
			}
			assertIDs(t, "FindAll", tokohTarikhIDs(items), tc.wantIDs...)
			if total != tc.want {
				t.Fatalf("FindAll: total %d counts soft-deleted rows, want %d", total, tc.want)
			}
		})
	}
}

func TestSoftDeleteTokohTarikhFindAllTranslation(t *testing.T) {
	repo := repository.NewTokohTarikhRepository(seedTokohTarikh(t))

	items, _, err := repo.FindAll("", "", "", 50, 0)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	for _, item := range items {
		switch *item.ID {
		case 1, 4:
			if item.Translation == nil || str(item.Translation.Idn) != "tokoh-tr-live" {
				t.Fatalf("FindAll: live tokoh %d lost its live translation: %+v", *item.ID, item.Translation)
			}
		case 3:
			if item.Translation != nil {
				t.Fatalf("FindAll: soft-deleted translation leaked: %+v", item.Translation)
			}
		}
	}
}

func TestSoftDeleteTokohTarikhFindByID(t *testing.T) {
	repo := repository.NewTokohTarikhRepository(seedTokohTarikh(t))

	for _, id := range []int{2, 5} {
		if _, err := repo.FindByID(id); !errors.Is(err, gorm.ErrRecordNotFound) {
			t.Fatalf("FindByID(soft-deleted %d): want ErrRecordNotFound, got %v", id, err)
		}
	}

	live, err := repo.FindByID(1)
	if err != nil {
		t.Fatalf("FindByID(live): %v", err)
	}
	if live.Translation == nil || str(live.Translation.Idn) != "tokoh-tr-live" {
		t.Fatalf("FindByID(1): live tokoh lost its live translation: %+v", live.Translation)
	}

	translationDead, err := repo.FindByID(3)
	if err != nil {
		t.Fatalf("FindByID(live, translation soft-deleted) must be found: %v", err)
	}
	if translationDead.Translation != nil {
		t.Fatalf("FindByID(3): soft-deleted translation leaked: %+v", translationDead.Translation)
	}
}

func TestSoftDeleteTokohTarikhUpdateRejectsDeletedRow(t *testing.T) {
	repo := repository.NewTokohTarikhRepository(seedTokohTarikh(t))

	if _, err := repo.Update(2, &model.TokohTarikh{Kontribusi: "resurrect"}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("Update(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
}

func TestTokohTarikhControllerBoundsSizeQuery(t *testing.T) {
	db := testdb.Open(t, &model.Translation{}, &model.TokohTarikh{})
	for i := 1; i <= 25; i++ {
		mustCreate(t, db, &model.TokohTarikh{
			BaseID:   baseID(i),
			Nama:     fmt.Sprintf("tokoh-%02d", i),
			Biografi: "biografi",
		})
	}
	mustCreate(t, db, &model.TokohTarikh{BaseID: baseID(26), Nama: "tokoh-deleted", Biografi: "biografi"})
	testdb.Delete(t, db, &model.TokohTarikh{BaseID: baseID(26)})

	repo := repository.NewTokohTarikhRepository(db)
	ctrl := controllers.NewTokohTarikhController(&service.Services{TokohTarikh: service.NewTokohTarikhService(repo)})
	app := fiber.New()
	app.Get("/tokoh", ctrl.FindAll)

	cases := []struct {
		name      string
		query     string
		wantItems int
		wantSize  int
	}{
		{name: "missing", query: "", wantItems: 20, wantSize: 20},
		{name: "zero", query: "?size=0", wantItems: 20, wantSize: 20},
		{name: "negative", query: "?size=-5", wantItems: 20, wantSize: 20},
		{name: "non numeric", query: "?size=abc", wantItems: 20, wantSize: 20},
		{name: "empty", query: "?size=", wantItems: 20, wantSize: 20},
		{name: "explicit", query: "?size=5", wantItems: 5, wantSize: 5},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			resp, err := app.Test(httptest.NewRequest(fiber.MethodGet, "/tokoh"+tc.query, nil))
			if err != nil {
				t.Fatalf("request: %v", err)
			}
			defer resp.Body.Close()
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				t.Fatalf("read body: %v", err)
			}
			var payload struct {
				Items []json.RawMessage `json:"items"`
				Total int64             `json:"total"`
				Size  int               `json:"size"`
			}
			if err := json.Unmarshal(body, &payload); err != nil {
				t.Fatalf("decode %s: %v", body, err)
			}
			if len(payload.Items) != tc.wantItems {
				t.Fatalf("size query %q returned %d items, want %d", tc.query, len(payload.Items), tc.wantItems)
			}
			if payload.Size != tc.wantSize {
				t.Fatalf("size query %q reported size %d, want %d", tc.query, payload.Size, tc.wantSize)
			}
			if payload.Total != 25 {
				t.Fatalf("total %d must exclude the soft-deleted row, want 25", payload.Total)
			}
		})
	}
}
