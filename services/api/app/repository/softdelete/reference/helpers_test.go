package reference

import (
	"errors"
	"reflect"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"gorm.io/gorm"
)

func mustCreate(t *testing.T, db *gorm.DB, value interface{}) {
	t.Helper()
	if err := db.Create(value).Error; err != nil {
		t.Fatalf("seed: %v", err)
	}
}

func seedTranslation(t *testing.T, db *gorm.DB, idn string) *model.Translation {
	t.Helper()
	tr := &model.Translation{Idn: testdb.Str(idn), Ar: testdb.Str("ar " + idn)}
	mustCreate(t, db, tr)
	return tr
}

func seedDeletedTranslation(t *testing.T, db *gorm.DB, idn string) *model.Translation {
	t.Helper()
	tr := seedTranslation(t, db, idn)
	testdb.Delete(t, db, tr)
	return tr
}

func requireNotFound(t *testing.T, label string, err error) {
	t.Helper()
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("%s: want gorm.ErrRecordNotFound, got %v", label, err)
	}
}

func requireStrings(t *testing.T, label string, got, want []string) {
	t.Helper()
	if len(got) == 0 && len(want) == 0 {
		return
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("%s: got %v, want %v", label, got, want)
	}
}

func requireNoTranslation(t *testing.T, label string, tr *model.Translation) {
	t.Helper()
	if tr != nil {
		t.Fatalf("%s: soft-deleted translation leaked: %+v", label, tr)
	}
}

func requireTranslation(t *testing.T, label string, tr *model.Translation, idn string) {
	t.Helper()
	if tr == nil || tr.Idn == nil || *tr.Idn != idn {
		t.Fatalf("%s: want live translation %q, got %+v", label, idn, tr)
	}
}
