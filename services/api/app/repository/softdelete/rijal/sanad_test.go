package rijal

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"gorm.io/gorm"
)

func seedSanad(t *testing.T) *gorm.DB {
	t.Helper()
	db := testdb.Open(t, &model.Hadith{}, &model.Perawi{}, &model.Sanad{}, &model.MataSanad{})
	hadith := func(id int) {
		mustCreate(t, db, &model.Hadith{BaseID: baseID(id)})
	}
	hadith(10)
	hadith(11)
	hadith(12)
	testdb.Delete(t, db, &model.Hadith{BaseID: baseID(12)})

	perawi := func(id int, name string) {
		mustCreate(t, db, &model.Perawi{
			BaseID:    baseID(id),
			NamaArab:  testdb.Str(name),
			NamaLatin: testdb.Str(name),
		})
	}
	perawi(1, "narrator-live")
	perawi(2, "narrator-dead")
	testdb.Delete(t, db, &model.Perawi{BaseID: baseID(2)})

	sanad := func(id, hadithID, jalur int, catatan string) {
		mustCreate(t, db, &model.Sanad{
			BaseID:     baseID(id),
			HadithID:   testdb.Int(hadithID),
			NomorJalur: testdb.Int(jalur),
			Catatan:    testdb.Str(catatan),
		})
	}
	sanad(1, 10, 1, "sanad-live")
	sanad(2, 10, 2, "sanad-deleted")
	sanad(3, 10, 3, "sanad-live-empty")
	sanad(4, 11, 1, "other-hadith-live")
	sanad(5, 11, 2, "other-hadith-deleted")
	sanad(6, 12, 1, "sanad-in-deleted-hadith")
	testdb.Delete(t, db, &model.Sanad{BaseID: baseID(2)})
	testdb.Delete(t, db, &model.Sanad{BaseID: baseID(5)})

	mata := func(id, sanadID, perawiID, urutan int) {
		mustCreate(t, db, &model.MataSanad{
			BaseID:   baseID(id),
			SanadID:  testdb.Int(sanadID),
			PerawiID: testdb.Int(perawiID),
			Urutan:   testdb.Int(urutan),
		})
	}
	mata(1, 1, 1, 1)
	mata(2, 1, 2, 2)
	mata(3, 1, 1, 3)
	mata(4, 1, 1, 4)
	mata(5, 2, 1, 1)
	mata(6, 4, 1, 1)
	testdb.Delete(t, db, &model.MataSanad{BaseID: baseID(3)})
	return db
}

func sanadIDs(list []model.Sanad) []int {
	ids := make([]int, 0, len(list))
	for _, row := range list {
		ids = append(ids, *row.ID)
	}
	return ids
}

func mataSanadIDs(list []model.MataSanad) []int {
	ids := make([]int, 0, len(list))
	for _, row := range list {
		ids = append(ids, *row.ID)
	}
	return ids
}

func findSanad(list []model.Sanad, id int) *model.Sanad {
	for i := range list {
		if *list[i].ID == id {
			return &list[i]
		}
	}
	return nil
}

func assertLiveSanadChain(t *testing.T, label string, sanad *model.Sanad) {
	t.Helper()
	assertIDs(t, label+" mata_sanad", mataSanadIDs(sanad.MataSanad), 1, 2, 4)
	for _, ms := range sanad.MataSanad {
		switch *ms.ID {
		case 1, 4:
			if ms.Perawi == nil || *ms.Perawi.ID != 1 {
				t.Fatalf("%s: mata_sanad %d lost its live perawi: %+v", label, *ms.ID, ms.Perawi)
			}
		case 2:
			if ms.Perawi != nil {
				t.Fatalf("%s: soft-deleted perawi leaked into mata_sanad 2: %+v", label, ms.Perawi)
			}
		}
	}
}

func TestSoftDeleteSanadFindByHadithID(t *testing.T) {
	repo := repository.NewSanadRepository(seedSanad(t))

	list, err := repo.FindByHadithID(testdb.Int(10))
	if err != nil {
		t.Fatalf("FindByHadithID: %v", err)
	}
	assertIDs(t, "FindByHadithID(10)", sanadIDs(list), 1, 3)

	live := findSanad(list, 1)
	assertLiveSanadChain(t, "FindByHadithID(10) sanad 1", live)

	empty := findSanad(list, 3)
	if len(empty.MataSanad) != 0 {
		t.Fatalf("sanad 3 has no mata_sanad, got %v", mataSanadIDs(empty.MataSanad))
	}

	other, err := repo.FindByHadithID(testdb.Int(11))
	if err != nil {
		t.Fatalf("FindByHadithID(11): %v", err)
	}
	assertIDs(t, "FindByHadithID(11)", sanadIDs(other), 4)

	deadHadithList, err := repo.FindByHadithID(testdb.Int(12))
	if err != nil {
		t.Fatalf("FindByHadithID(12): %v", err)
	}
	if len(deadHadithList) != 0 {
		t.Fatalf("FindByHadithID(deleted hadith): want 0 sanad, got %v", sanadIDs(deadHadithList))
	}
}

func TestSoftDeleteSanadFindAll(t *testing.T) {
	repo := repository.NewSanadRepository(seedSanad(t))

	list, err := repo.FindAll()
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	assertIDs(t, "FindAll", sanadIDs(list), 1, 3, 4)
	assertLiveSanadChain(t, "FindAll sanad 1", findSanad(list, 1))
	for _, sanad := range list {
		for _, ms := range sanad.MataSanad {
			if *ms.ID == 5 || *ms.ID == 3 {
				t.Fatalf("FindAll: soft-deleted or orphaned mata_sanad %d leaked", *ms.ID)
			}
		}
	}
}

func TestSoftDeleteSanadFindByID(t *testing.T) {
	repo := repository.NewSanadRepository(seedSanad(t))

	for _, id := range []int{2, 5} {
		if _, err := repo.FindByID(testdb.Int(id)); !errors.Is(err, gorm.ErrRecordNotFound) {
			t.Fatalf("FindByID(soft-deleted %d): want ErrRecordNotFound, got %v", id, err)
		}
	}

	live, err := repo.FindByID(testdb.Int(1))
	if err != nil {
		t.Fatalf("FindByID(live): %v", err)
	}
	assertLiveSanadChain(t, "FindByID(1)", live)
}

func TestSoftDeleteSanadFindMataSanadByID(t *testing.T) {
	repo := repository.NewSanadRepository(seedSanad(t))

	if _, err := repo.FindMataSanadByID(testdb.Int(3)); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindMataSanadByID(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
	if _, err := repo.FindMataSanadByID(testdb.Int(5)); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindMataSanadByID(mata of soft-deleted sanad): want ErrRecordNotFound, got %v", err)
	}

	live, err := repo.FindMataSanadByID(testdb.Int(1))
	if err != nil {
		t.Fatalf("FindMataSanadByID(live): %v", err)
	}
	if live.Perawi == nil || *live.Perawi.ID != 1 {
		t.Fatalf("FindMataSanadByID(1): lost its live perawi: %+v", live.Perawi)
	}

	deadPerawi, err := repo.FindMataSanadByID(testdb.Int(2))
	if err != nil {
		t.Fatalf("FindMataSanadByID(live, perawi soft-deleted) must be found: %v", err)
	}
	if deadPerawi.Perawi != nil {
		t.Fatalf("FindMataSanadByID(2): soft-deleted perawi leaked: %+v", deadPerawi.Perawi)
	}
}

func TestSoftDeleteSanadMutationsRejectDeletedRow(t *testing.T) {
	repo := repository.NewSanadRepository(seedSanad(t))

	if _, err := repo.UpdateByID(testdb.Int(2), &model.Sanad{Catatan: testdb.Str("resurrect")}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("UpdateByID(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
	if err := repo.DeleteByID(testdb.Int(2)); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("DeleteByID(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
	if _, err := repo.UpdateMataSanad(testdb.Int(3), &model.MataSanad{Catatan: testdb.Str("resurrect")}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("UpdateMataSanad(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
	if err := repo.DeleteMataSanad(testdb.Int(3)); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("DeleteMataSanad(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
}
