package rijal

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"gorm.io/gorm"
)

func seedJarhTadil(t *testing.T) *gorm.DB {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.Perawi{}, &model.JarhTadil{})

	mustCreate(t, db, &model.Translation{BaseID: baseID(1), Idn: testdb.Str("tr-live")})
	mustCreate(t, db, &model.Translation{BaseID: baseID(2), Idn: testdb.Str("tr-dead")})
	testdb.Delete(t, db, &model.Translation{BaseID: baseID(2)})

	perawi := func(id int, name string) {
		mustCreate(t, db, &model.Perawi{
			BaseID:    baseID(id),
			NamaArab:  testdb.Str(name),
			NamaLatin: testdb.Str(name),
		})
	}
	perawi(1, "subject-live")
	perawi(2, "subject-dead")
	perawi(3, "critic-live")
	perawi(4, "critic-dead")
	testdb.Delete(t, db, &model.Perawi{BaseID: baseID(2)})
	testdb.Delete(t, db, &model.Perawi{BaseID: baseID(4)})

	jarh := func(id, perawiID, penilaiID int, translationID int, teks string) {
		jenis := model.JenisTadil
		row := &model.JarhTadil{
			BaseID:     baseID(id),
			PerawiID:   testdb.Int(perawiID),
			PenilaiID:  testdb.Int(penilaiID),
			JenisNilai: &jenis,
			Tingkat:    testdb.Int(1),
			TeksNilai:  testdb.Str(teks),
		}
		if translationID > 0 {
			row.TranslationID = testdb.Int(translationID)
		}
		mustCreate(t, db, row)
	}
	jarh(1, 1, 3, 1, "jt-live")
	jarh(2, 1, 3, 1, "jt-deleted-twin")
	jarh(3, 1, 4, 1, "jt-live-critic-dead")
	jarh(4, 1, 3, 2, "jt-live-translation-dead")
	jarh(5, 2, 3, 1, "jt-live-subject-dead")
	testdb.Delete(t, db, &model.JarhTadil{BaseID: baseID(2)})
	return db
}

func jarhTadilIDs(list []model.JarhTadil) []int {
	ids := make([]int, 0, len(list))
	for _, row := range list {
		ids = append(ids, *row.ID)
	}
	return ids
}

func findJarhTadil(list []model.JarhTadil, id int) *model.JarhTadil {
	for i := range list {
		if *list[i].ID == id {
			return &list[i]
		}
	}
	return nil
}

func assertLiveJarhTadil(t *testing.T, label string, live *model.JarhTadil) {
	t.Helper()
	if live.Perawi == nil || *live.Perawi.ID != 1 {
		t.Fatalf("%s: live row lost its live perawi: %+v", label, live.Perawi)
	}
	if live.Penilai == nil || *live.Penilai.ID != 3 {
		t.Fatalf("%s: live row lost its live penilai: %+v", label, live.Penilai)
	}
	if live.Translation == nil || str(live.Translation.Idn) != "tr-live" {
		t.Fatalf("%s: live row lost its live translation: %+v", label, live.Translation)
	}
}

func assertJarhTadilAssociations(t *testing.T, label string, list []model.JarhTadil) {
	t.Helper()
	live := findJarhTadil(list, 1)
	if live == nil {
		t.Fatalf("%s: live row 1 missing, got %v", label, jarhTadilIDs(list))
	}
	assertLiveJarhTadil(t, label, live)

	criticDead := findJarhTadil(list, 3)
	if criticDead == nil {
		t.Fatalf("%s: live row 3 with soft-deleted penilai was dropped, got %v", label, jarhTadilIDs(list))
	}
	if criticDead.Penilai != nil {
		t.Fatalf("%s: soft-deleted penilai leaked: %+v", label, criticDead.Penilai)
	}

	translationDead := findJarhTadil(list, 4)
	if translationDead == nil {
		t.Fatalf("%s: live row 4 with soft-deleted translation was dropped, got %v", label, jarhTadilIDs(list))
	}
	if translationDead.Translation != nil {
		t.Fatalf("%s: soft-deleted translation leaked: %+v", label, translationDead.Translation)
	}

	for _, row := range list {
		if row.Perawi != nil && (*row.Perawi.ID == 2 || str(row.Perawi.NamaLatin) == "subject-dead") {
			t.Fatalf("%s: soft-deleted subject perawi leaked in row %d", label, *row.ID)
		}
		if row.Penilai != nil && (*row.Penilai.ID == 4 || str(row.Penilai.NamaLatin) == "critic-dead") {
			t.Fatalf("%s: soft-deleted penilai leaked in row %d", label, *row.ID)
		}
		if row.Translation != nil && str(row.Translation.Idn) == "tr-dead" {
			t.Fatalf("%s: soft-deleted translation leaked in row %d", label, *row.ID)
		}
	}
}

func TestSoftDeleteJarhTadilFindAll(t *testing.T) {
	repo := repository.NewJarhTadilRepository(seedJarhTadil(t))

	list, err := repo.FindAll(50, 0)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	assertAbsent(t, "FindAll", jarhTadilIDs(list), 2)
	assertJarhTadilAssociations(t, "FindAll", list)
}

func TestSoftDeleteJarhTadilFindAllPagination(t *testing.T) {
	repo := repository.NewJarhTadilRepository(seedJarhTadil(t))

	first, err := repo.FindAll(1, 0)
	if err != nil || len(first) != 1 || *first[0].ID != 1 {
		t.Fatalf("FindAll(1,0): got %v err=%v", jarhTadilIDs(first), err)
	}
	second, err := repo.FindAll(1, 1)
	if err != nil || len(second) != 1 {
		t.Fatalf("FindAll(1,1): got %v err=%v", jarhTadilIDs(second), err)
	}
	if *second[0].ID == 2 {
		t.Fatalf("FindAll(1,1): soft-deleted row 2 consumed a page slot")
	}
}

func TestSoftDeleteJarhTadilFindByID(t *testing.T) {
	repo := repository.NewJarhTadilRepository(seedJarhTadil(t))

	if _, err := repo.FindByID(testdb.Int(2)); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindByID(soft-deleted): want ErrRecordNotFound, got %v", err)
	}

	live, err := repo.FindByID(testdb.Int(1))
	if err != nil {
		t.Fatalf("FindByID(live): %v", err)
	}
	assertLiveJarhTadil(t, "FindByID(1)", live)

	criticDead, err := repo.FindByID(testdb.Int(3))
	if err != nil {
		t.Fatalf("FindByID(live with soft-deleted penilai) must still be found: %v", err)
	}
	if criticDead.Penilai != nil {
		t.Fatalf("FindByID: soft-deleted penilai leaked: %+v", criticDead.Penilai)
	}

	translationDead, err := repo.FindByID(testdb.Int(4))
	if err != nil {
		t.Fatalf("FindByID(live with soft-deleted translation) must still be found: %v", err)
	}
	if translationDead.Translation != nil {
		t.Fatalf("FindByID: soft-deleted translation leaked: %+v", translationDead.Translation)
	}

	subjectDead, err := repo.FindByID(testdb.Int(5))
	if err == nil && subjectDead.Perawi != nil {
		t.Fatalf("FindByID: soft-deleted subject perawi leaked: %+v", subjectDead.Perawi)
	}
}

func TestSoftDeleteJarhTadilFindByPerawiID(t *testing.T) {
	repo := repository.NewJarhTadilRepository(seedJarhTadil(t))

	list, err := repo.FindByPerawiID(testdb.Int(1))
	if err != nil {
		t.Fatalf("FindByPerawiID: %v", err)
	}
	assertIDs(t, "FindByPerawiID(1)", jarhTadilIDs(list), 1, 3, 4)
	assertJarhTadilAssociations(t, "FindByPerawiID(1)", list)

	deadSubject, err := repo.FindByPerawiID(testdb.Int(2))
	if err != nil {
		t.Fatalf("FindByPerawiID(soft-deleted perawi): %v", err)
	}
	for _, row := range deadSubject {
		if row.Perawi != nil {
			t.Fatalf("FindByPerawiID(soft-deleted perawi): subject payload leaked: %+v", row.Perawi)
		}
	}
}

func TestSoftDeleteJarhTadilMutationsRejectDeletedRow(t *testing.T) {
	repo := repository.NewJarhTadilRepository(seedJarhTadil(t))

	if _, err := repo.UpdateByID(testdb.Int(2), &model.JarhTadil{TeksNilai: testdb.Str("resurrect")}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("UpdateByID(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
	if err := repo.DeleteByID(testdb.Int(2)); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("DeleteByID(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
}
