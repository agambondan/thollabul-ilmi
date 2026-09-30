package rijal

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

func seedPerawi(t *testing.T) *gorm.DB {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.Perawi{}, &model.JarhTadil{})

	mustCreate(t, db, &model.Translation{BaseID: baseID(1), Idn: testdb.Str("perawi-tr-live")})
	mustCreate(t, db, &model.Translation{BaseID: baseID(2), Idn: testdb.Str("perawi-tr-dead")})
	testdb.Delete(t, db, &model.Translation{BaseID: baseID(2)})

	perawi := func(id int, name, tabaqah string, translationID int) {
		row := &model.Perawi{
			BaseID:    baseID(id),
			NamaArab:  testdb.Str(name),
			NamaLatin: testdb.Str(name),
			Tabaqah:   testdb.Str(tabaqah),
		}
		if translationID > 0 {
			row.TranslationID = testdb.Int(translationID)
		}
		mustCreate(t, db, row)
	}
	perawi(1, "perawi-target", "sahabat", 1)
	perawi(2, "perawi-translation-dead", "sahabat", 2)
	perawi(3, "perawi-deleted", "sahabat", 1)
	perawi(4, "guru-live", "tabiin", 2)
	perawi(5, "guru-deleted", "tabiin", 1)
	perawi(6, "murid-live", "tabiin", 1)
	perawi(7, "murid-deleted", "tabiin", 1)
	perawi(8, "penilai-live", "tabiin", 0)
	perawi(9, "penilai-deleted", "tabiin", 0)
	for _, id := range []int{3, 5, 7, 9} {
		testdb.Delete(t, db, &model.Perawi{BaseID: baseID(id)})
	}

	mustExec(t, db, "INSERT INTO perawi_guru (guru_id, murid_id) VALUES (?, ?)", 4, 1)
	mustExec(t, db, "INSERT INTO perawi_guru (guru_id, murid_id) VALUES (?, ?)", 5, 1)
	mustExec(t, db, "INSERT INTO perawi_guru (guru_id, murid_id) VALUES (?, ?)", 1, 6)
	mustExec(t, db, "INSERT INTO perawi_guru (guru_id, murid_id) VALUES (?, ?)", 1, 7)

	jarh := func(id, penilaiID, translationID int) {
		jenis := model.JenisTadil
		row := &model.JarhTadil{
			BaseID:     baseID(id),
			PerawiID:   testdb.Int(1),
			PenilaiID:  testdb.Int(penilaiID),
			JenisNilai: &jenis,
			Tingkat:    testdb.Int(1),
			TeksNilai:  testdb.Str("jt"),
		}
		if translationID > 0 {
			row.TranslationID = testdb.Int(translationID)
		}
		mustCreate(t, db, row)
	}
	jarh(1, 8, 1)
	jarh(2, 8, 1)
	jarh(3, 9, 1)
	jarh(4, 8, 2)
	testdb.Delete(t, db, &model.JarhTadil{BaseID: baseID(2)})
	return db
}

func perawiIDs(list []model.Perawi) []int {
	ids := make([]int, 0, len(list))
	for _, row := range list {
		ids = append(ids, *row.ID)
	}
	return ids
}

func findPerawi(list []model.Perawi, id int) *model.Perawi {
	for i := range list {
		if *list[i].ID == id {
			return &list[i]
		}
	}
	return nil
}

func perawiPage(t *testing.T, page *paginate.Page) []model.Perawi {
	t.Helper()
	if page == nil || page.RawError != nil {
		t.Fatalf("paginated perawi query failed: %+v", page)
	}
	items, ok := page.Items.(*[]model.Perawi)
	if !ok {
		t.Fatalf("unexpected items type %T", page.Items)
	}
	return *items
}

func TestSoftDeletePerawiFindByID(t *testing.T) {
	repo := repository.NewPerawiRepository(seedPerawi(t), paginate.New())

	if _, err := repo.FindByID(testdb.Int(3)); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindByID(soft-deleted): want ErrRecordNotFound, got %v", err)
	}

	live, err := repo.FindByID(testdb.Int(1))
	if err != nil {
		t.Fatalf("FindByID(live): %v", err)
	}
	if live.Translation == nil || str(live.Translation.Idn) != "perawi-tr-live" {
		t.Fatalf("live perawi lost its live translation: %+v", live.Translation)
	}
	assertIDs(t, "FindByID(1) guru", perawiIDs(live.Guru), 4)
	assertIDs(t, "FindByID(1) murid", perawiIDs(live.Murid), 6)
	if live.Guru[0].Translation != nil {
		t.Fatalf("soft-deleted guru translation leaked: %+v", live.Guru[0].Translation)
	}
	if live.Murid[0].Translation == nil {
		t.Fatalf("live murid lost its live translation")
	}

	jarhIDs := make([]int, 0, len(live.JarhTadil))
	for _, jt := range live.JarhTadil {
		jarhIDs = append(jarhIDs, *jt.ID)
		switch *jt.ID {
		case 1:
			if jt.Penilai == nil || *jt.Penilai.ID != 8 {
				t.Fatalf("live jarh_tadil lost its live penilai: %+v", jt.Penilai)
			}
			if jt.Translation == nil {
				t.Fatalf("live jarh_tadil lost its live translation")
			}
		case 3:
			if jt.Penilai != nil {
				t.Fatalf("soft-deleted penilai leaked: %+v", jt.Penilai)
			}
		case 4:
			if jt.Translation != nil {
				t.Fatalf("soft-deleted jarh_tadil translation leaked: %+v", jt.Translation)
			}
		}
	}
	assertIDs(t, "FindByID(1) jarh_tadil", jarhIDs, 1, 3, 4)

	translationDead, err := repo.FindByID(testdb.Int(2))
	if err != nil {
		t.Fatalf("FindByID(live, translation soft-deleted) must be found: %v", err)
	}
	if translationDead.Translation != nil {
		t.Fatalf("FindByID(2): soft-deleted translation leaked: %+v", translationDead.Translation)
	}
}

func TestSoftDeletePerawiFindGuru(t *testing.T) {
	repo := repository.NewPerawiRepository(seedPerawi(t), paginate.New())

	list, err := repo.FindGuru(testdb.Int(1))
	if err != nil {
		t.Fatalf("FindGuru: %v", err)
	}
	assertIDs(t, "FindGuru(1)", perawiIDs(list), 4)
	if list[0].Translation != nil {
		t.Fatalf("FindGuru: soft-deleted translation leaked: %+v", list[0].Translation)
	}
}

func TestSoftDeletePerawiFindMurid(t *testing.T) {
	repo := repository.NewPerawiRepository(seedPerawi(t), paginate.New())

	list, err := repo.FindMurid(testdb.Int(1))
	if err != nil {
		t.Fatalf("FindMurid: %v", err)
	}
	assertIDs(t, "FindMurid(1)", perawiIDs(list), 6)
	if list[0].Translation == nil || str(list[0].Translation.Idn) != "perawi-tr-live" {
		t.Fatalf("FindMurid: live murid lost its live translation: %+v", list[0].Translation)
	}
}

func TestSoftDeletePerawiFindAll(t *testing.T) {
	db := seedPerawi(t)
	qualifyOrderByForSQLite(t, db, "id", "perawi.id")
	repo := repository.NewPerawiRepository(db, paginate.New())

	page := repo.FindAll(newFiberCtx(t, "/?size=50"))
	list := perawiPage(t, page)
	assertIDs(t, "FindAll", perawiIDs(list), 1, 2, 4, 6, 8)
	if page.Total != 5 {
		t.Fatalf("FindAll: total %d counts soft-deleted rows, want 5", page.Total)
	}
	if live := findPerawi(list, 1); live.Translation == nil || str(live.Translation.Idn) != "perawi-tr-live" {
		t.Fatalf("FindAll: live perawi lost its live translation: %+v", live.Translation)
	}
	if dead := findPerawi(list, 2); dead.Translation != nil {
		t.Fatalf("FindAll: soft-deleted translation leaked: %+v", dead.Translation)
	}
}

func TestSoftDeletePerawiFindByTabaqah(t *testing.T) {
	db := seedPerawi(t)
	qualifyOrderByForSQLite(t, db, "id", "perawi.id")
	repo := repository.NewPerawiRepository(db, paginate.New())

	sahabat := repo.FindByTabaqah(newFiberCtx(t, "/?size=50"), "sahabat")
	list := perawiPage(t, sahabat)
	assertIDs(t, "FindByTabaqah(sahabat)", perawiIDs(list), 1, 2)
	if sahabat.Total != 2 {
		t.Fatalf("FindByTabaqah(sahabat): total %d counts soft-deleted rows, want 2", sahabat.Total)
	}
	if dead := findPerawi(list, 2); dead.Translation != nil {
		t.Fatalf("FindByTabaqah: soft-deleted translation leaked: %+v", dead.Translation)
	}

	tabiin := repo.FindByTabaqah(newFiberCtx(t, "/?size=50"), "tabiin")
	assertIDs(t, "FindByTabaqah(tabiin)", perawiIDs(perawiPage(t, tabiin)), 4, 6, 8)
	if tabiin.Total != 3 {
		t.Fatalf("FindByTabaqah(tabiin): total %d counts soft-deleted rows, want 3", tabiin.Total)
	}
}

func TestSoftDeletePerawiCount(t *testing.T) {
	repo := repository.NewPerawiRepository(seedPerawi(t), paginate.New())

	count, err := repo.Count()
	if err != nil {
		t.Fatalf("Count: %v", err)
	}
	if *count != 5 {
		t.Fatalf("Count: %d includes soft-deleted rows, want 5", *count)
	}
}

func TestSoftDeletePerawiMutationsRejectDeletedRow(t *testing.T) {
	repo := repository.NewPerawiRepository(seedPerawi(t), paginate.New())

	if _, err := repo.UpdateByID(testdb.Int(3), &model.Perawi{Kunyah: testdb.Str("resurrect")}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("UpdateByID(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
	if err := repo.DeleteByID(testdb.Int(3)); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("DeleteByID(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
}

func TestSoftDeletePerawiFindHadithsSkipsDeletedSanad(t *testing.T) {
	db := testdb.Open(t, &model.Translation{}, &model.Book{}, &model.Hadith{}, &model.Perawi{}, &model.Sanad{}, &model.MataSanad{})

	for id := 1; id <= 7; id++ {
		mustCreate(t, db, &model.Hadith{BaseID: baseID(id), Number: testdb.Int(id)})
	}
	testdb.Delete(t, db, &model.Hadith{BaseID: baseID(4)})
	for id := 1; id <= 2; id++ {
		mustCreate(t, db, &model.Perawi{
			BaseID:    baseID(id),
			NamaArab:  testdb.Str("narrator"),
			NamaLatin: testdb.Str(""),
		})
	}

	chain := func(sanadID, hadithID, mataID, perawiID int) {
		mustCreate(t, db, &model.Sanad{BaseID: baseID(sanadID), HadithID: testdb.Int(hadithID)})
		mustCreate(t, db, &model.MataSanad{
			BaseID:   baseID(mataID),
			SanadID:  testdb.Int(sanadID),
			PerawiID: testdb.Int(perawiID),
			Urutan:   testdb.Int(1),
		})
	}
	chain(1, 1, 1, 1)
	chain(2, 2, 2, 1)
	chain(3, 3, 3, 1)
	chain(4, 4, 4, 1)
	chain(5, 5, 5, 2)
	chain(6, 6, 6, 1)
	chain(7, 6, 7, 1)
	chain(8, 7, 8, 1)
	testdb.Delete(t, db, &model.Sanad{BaseID: baseID(2)})
	testdb.Delete(t, db, &model.MataSanad{BaseID: baseID(3)})
	testdb.Delete(t, db, &model.Sanad{BaseID: baseID(7)})
	testdb.Delete(t, db, &model.MataSanad{BaseID: baseID(8)})

	repo := repository.NewPerawiRepository(db, paginate.New())
	page := repo.FindHadiths(newFiberCtx(t, "/?size=50"), testdb.Int(1))
	if page == nil || page.RawError != nil {
		t.Fatalf("FindHadiths failed: %+v", page)
	}
	items, ok := page.Items.(*[]model.Hadith)
	if !ok {
		t.Fatalf("unexpected items type %T", page.Items)
	}
	ids := make([]int, 0, len(*items))
	for _, hadith := range *items {
		ids = append(ids, *hadith.ID)
	}
	assertIDs(t, "FindHadiths(1)", ids, 1, 6)
	if page.Total != 2 {
		t.Fatalf("FindHadiths total %d, want 2", page.Total)
	}
}
