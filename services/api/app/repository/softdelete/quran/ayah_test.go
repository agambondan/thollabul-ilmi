package quran

import (
	"errors"
	"sort"
	"strconv"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type ayahFixture struct {
	repo repository.AyahRepository

	s1, s2, s3  *model.Surah
	live        *model.Ayah
	gone        *model.Ayah
	goneTr      *model.Ayah
	goneSurahTr *model.Ayah
	goneSurah   *model.Ayah
}

func newAyahFixture(t *testing.T) *ayahFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.Surah{}, &model.Ayah{})
	f := &ayahFixture{repo: repository.NewAyahRepository(db, paginate.New())}

	var goneSurahTranslation, goneAyahTranslation *model.Translation
	f.s1, _ = newSurah(t, db, 1, "live surah")
	f.s2, goneSurahTranslation = newSurah(t, db, 2, "surah translation deleted")
	f.s3, _ = newSurah(t, db, 3, "gone surah")

	f.live, _ = newAyah(t, db, f.s1, 1, 1, 1, "live ayah")
	f.gone, _ = newAyah(t, db, f.s1, 2, 1, 1, "gone ayah")
	f.goneTr, goneAyahTranslation = newAyah(t, db, f.s1, 3, 1, 1, "gone ayah translation")
	f.goneSurahTr, _ = newAyah(t, db, f.s2, 1, 2, 2, "ayah in surah with deleted translation")
	f.goneSurah, _ = newAyah(t, db, f.s3, 1, 1, 1, "ayah in gone surah")

	testdb.Delete(t, db, f.gone)
	testdb.Delete(t, db, f.s3)
	testdb.Delete(t, db, goneAyahTranslation)
	testdb.Delete(t, db, goneSurahTranslation)
	return f
}

func (f *ayahFixture) assertGraph(t *testing.T, ayahs []model.Ayah) {
	t.Helper()
	for _, ayah := range ayahs {
		switch idOf(ayah.ID) {
		case idOf(f.live.ID):
			if ayah.Translation == nil || ayah.Surah == nil || ayah.Surah.Translation == nil {
				t.Fatalf("live ayah must keep its full live graph, got %+v", ayah)
			}
		case idOf(f.goneTr.ID):
			if ayah.Translation != nil {
				t.Fatalf("deleted ayah translation leaked: %+v", ayah.Translation)
			}
			if ayah.Surah == nil {
				t.Fatalf("live surah must be kept")
			}
		case idOf(f.goneSurahTr.ID):
			if ayah.Surah == nil || ayah.Surah.Translation != nil {
				t.Fatalf("surah with deleted translation must be kept with empty translation, got %+v", ayah.Surah)
			}
		case idOf(f.goneSurah.ID):
			if ayah.Surah != nil {
				t.Fatalf("deleted surah leaked: %+v", ayah.Surah)
			}
		}
	}
}

func (f *ayahFixture) liveIDs() []int {
	return wantIDs(f.live.ID, f.goneTr.ID, f.goneSurahTr.ID, f.goneSurah.ID)
}

func TestSoftDeleteAyahFindAll(t *testing.T) {
	f := newAyahFixture(t)

	page := pageOf(t, "/?page=0&size=50", f.repo.FindAll)
	ayahs := sliceOf[model.Ayah](t, page.Items)
	assertIDs(t, "FindAll", ayahIDsOf(ayahs), f.liveIDs())
	if page.Total != 4 {
		t.Fatalf("FindAll total: got %d, want 4", page.Total)
	}
	f.assertGraph(t, ayahs)
}

func TestSoftDeleteAyahFindAllKeyset(t *testing.T) {
	f := newAyahFixture(t)

	first := inFiberCtx(t, "/?limit=2", f.repo.FindAllKeyset)
	assertIDs(t, "keyset first page", ayahIDsOf(sliceOf[model.Ayah](t, first.Items)), wantIDs(f.live.ID, f.goneTr.ID))
	if first.Total != 4 || !first.HasMore || idOf(first.NextCursor) != idOf(f.goneTr.ID) {
		t.Fatalf("keyset first page: total %d, hasMore %v, cursor %v", first.Total, first.HasMore, first.NextCursor)
	}

	cursor := idOf(f.goneTr.ID)
	second := inFiberCtx(t, "/?limit=2&cursor="+strconv.Itoa(cursor), f.repo.FindAllKeyset)
	ayahs := sliceOf[model.Ayah](t, second.Items)
	assertIDs(t, "keyset second page", ayahIDsOf(ayahs), wantIDs(f.goneSurahTr.ID, f.goneSurah.ID))
	if second.HasMore {
		t.Fatalf("keyset second page must be the last one")
	}
	f.assertGraph(t, ayahs)
}

func TestSoftDeleteAyahFindByIDAndMany(t *testing.T) {
	f := newAyahFixture(t)

	if _, err := f.repo.FindById(f.gone.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindById of a deleted ayah: got %v, want ErrRecordNotFound", err)
	}

	for _, ayah := range []*model.Ayah{f.live, f.goneTr, f.goneSurahTr, f.goneSurah} {
		got, err := f.repo.FindById(ayah.ID)
		if err != nil {
			t.Fatalf("FindById(%d): %v", idOf(ayah.ID), err)
		}
		f.assertGraph(t, []model.Ayah{*got})
	}

	many, err := f.repo.FindManyByIds([]int{ayahID(f.live), ayahID(f.gone), ayahID(f.goneTr), ayahID(f.goneSurahTr), ayahID(f.goneSurah)})
	if err != nil {
		t.Fatalf("FindManyByIds: %v", err)
	}
	ids := ayahIDsOf(many)
	sort.Ints(ids)
	assertIDs(t, "FindManyByIds", ids, f.liveIDs())
	f.assertGraph(t, many)
}

func TestSoftDeleteAyahFindDaily(t *testing.T) {
	f := newAyahFixture(t)

	cases := []struct {
		number int
		want   *model.Ayah
	}{
		{number: 1, want: f.live},
		{number: 2, want: f.goneTr},
		{number: 3, want: f.goneSurahTr},
		{number: 4, want: f.goneSurah},
	}
	for _, tc := range cases {
		got, err := f.repo.FindDaily(tc.number)
		if err != nil {
			t.Fatalf("FindDaily(%d): %v", tc.number, err)
		}
		if idOf(got.ID) != idOf(tc.want.ID) {
			t.Fatalf("FindDaily(%d): got ayah %d, want %d", tc.number, idOf(got.ID), idOf(tc.want.ID))
		}
	}

	if _, err := f.repo.FindDaily(5); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindDaily past the last live ayah: got %v, want ErrRecordNotFound", err)
	}
}

func TestSoftDeleteAyahFindByNumber(t *testing.T) {
	f := newAyahFixture(t)

	number := 1
	page := pageOf(t, "/?page=0&size=50", func(ctx *fiber.Ctx) *paginate.Page {
		p, err := f.repo.FindByNumber(ctx, &number)
		if err != nil {
			t.Errorf("FindByNumber: %v", err)
		}
		return p
	})
	ayahs := sliceOf[model.Ayah](t, page.Items)
	assertIDs(t, "FindByNumber(1)", ayahIDsOf(ayahs), wantIDs(f.live.ID, f.goneSurahTr.ID, f.goneSurah.ID))
	f.assertGraph(t, ayahs)

	number = 2
	page = pageOf(t, "/?page=0&size=50", func(ctx *fiber.Ctx) *paginate.Page {
		p, err := f.repo.FindByNumber(ctx, &number)
		if err != nil {
			t.Errorf("FindByNumber: %v", err)
		}
		return p
	})
	assertIDs(t, "FindByNumber(2)", ayahIDsOf(sliceOf[model.Ayah](t, page.Items)), nil)
}

func TestSoftDeleteAyahFindBySurahNumber(t *testing.T) {
	f := newAyahFixture(t)

	find := func(number int) []model.Ayah {
		page := pageOf(t, "/?page=0&size=50", func(ctx *fiber.Ctx) *paginate.Page {
			p, err := f.repo.FindBySurahNumber(ctx, &number)
			if err != nil {
				t.Errorf("FindBySurahNumber: %v", err)
			}
			return p
		})
		return sliceOf[model.Ayah](t, page.Items)
	}

	live := find(1)
	assertIDs(t, "FindBySurahNumber(1)", ayahIDsOf(live), wantIDs(f.live.ID, f.goneTr.ID))
	f.assertGraph(t, live)

	withDeletedTranslation := find(2)
	assertIDs(t, "FindBySurahNumber(2)", ayahIDsOf(withDeletedTranslation), wantIDs(f.goneSurahTr.ID))
	f.assertGraph(t, withDeletedTranslation)

	assertIDs(t, "FindBySurahNumber(3)", ayahIDsOf(find(3)), nil)
}

func TestSoftDeleteAyahFindByPageAndHizbQuarter(t *testing.T) {
	f := newAyahFixture(t)

	byPage, err := f.repo.FindByPage(1)
	if err != nil {
		t.Fatalf("FindByPage: %v", err)
	}
	assertIDs(t, "FindByPage(1)", ayahIDsOf(byPage), wantIDs(f.live.ID, f.goneTr.ID, f.goneSurah.ID))
	f.assertGraph(t, byPage)

	byHizb, err := f.repo.FindByHizbQuarter(1)
	if err != nil {
		t.Fatalf("FindByHizbQuarter: %v", err)
	}
	assertIDs(t, "FindByHizbQuarter(1)", ayahIDsOf(byHizb), wantIDs(f.live.ID, f.goneTr.ID, f.goneSurah.ID))
	f.assertGraph(t, byHizb)

	byPageTwo, err := f.repo.FindByPage(2)
	if err != nil {
		t.Fatalf("FindByPage: %v", err)
	}
	assertIDs(t, "FindByPage(2)", ayahIDsOf(byPageTwo), wantIDs(f.goneSurahTr.ID))
	f.assertGraph(t, byPageTwo)
}

func TestSoftDeleteAyahCount(t *testing.T) {
	f := newAyahFixture(t)

	count, err := f.repo.Count()
	if err != nil {
		t.Fatalf("Count: %v", err)
	}
	if *count != 4 {
		t.Fatalf("Count: got %d, want 4 live ayahs", *count)
	}
}
