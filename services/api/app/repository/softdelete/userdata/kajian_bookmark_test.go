package userdata

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func seedKajianBookmark(t *testing.T, db *gorm.DB, userID uuid.UUID, chunk *model.KajianTranscript, kajian *model.Kajian, createdAt int64) *model.KajianUserBookmark {
	t.Helper()
	bookmark := &model.KajianUserBookmark{
		UserID:    userID,
		ChunkID:   *chunk.ID,
		KajianID:  *kajian.ID,
		Note:      "note",
		CreatedAt: &createdAt,
	}
	create(t, db, bookmark)
	return bookmark
}

func TestSoftDeleteKajianBookmarkListByUser(t *testing.T) {
	db := testdb.Open(t, &model.Kajian{}, &model.KajianTranscript{}, &model.KajianUserBookmark{})
	repo := repository.NewKajianBookmarkRepository(db)
	alice := uuid.New()
	bob := uuid.New()

	liveKajian := seedKajian(t, db, "live")
	otherKajian := seedKajian(t, db, "other")
	goneKajian := seedKajian(t, db, "gone")
	testdb.Delete(t, db, goneKajian)

	chunkLive := seedChunk(t, db, *liveKajian.ID, 0)
	chunkGone := seedChunk(t, db, *liveKajian.ID, 60)
	testdb.Delete(t, db, chunkGone)
	chunkUnderGoneKajian := seedChunk(t, db, *goneKajian.ID, 0)
	chunkOfDeletedBookmark := seedChunk(t, db, *otherKajian.ID, 0)
	chunkOfBob := seedChunk(t, db, *otherKajian.ID, 60)

	seedKajianBookmark(t, db, alice, chunkLive, liveKajian, 300)
	seedKajianBookmark(t, db, alice, chunkGone, liveKajian, 200)
	seedKajianBookmark(t, db, alice, chunkUnderGoneKajian, goneKajian, 100)
	deletedBookmark := seedKajianBookmark(t, db, alice, chunkOfDeletedBookmark, otherKajian, 400)
	testdb.Delete(t, db, deletedBookmark)
	seedKajianBookmark(t, db, bob, chunkLive, liveKajian, 500)
	seedKajianBookmark(t, db, bob, chunkOfBob, otherKajian, 600)

	got, err := repo.ListByUser(alice, 0)
	if err != nil {
		t.Fatalf("ListByUser: %v", err)
	}

	byChunk := map[int]model.KajianUserBookmark{}
	for _, bookmark := range got {
		if bookmark.UserID != alice {
			t.Fatalf("bookmark of another user leaked: %#v", bookmark)
		}
		byChunk[bookmark.ChunkID] = bookmark
	}
	if _, leaked := byChunk[*chunkOfDeletedBookmark.ID]; leaked {
		t.Fatalf("soft-deleted bookmark leaked: %#v", got)
	}
	if _, leaked := byChunk[*chunkOfBob.ID]; leaked {
		t.Fatalf("bookmark of another user leaked: %#v", got)
	}
	if len(got) != 3 {
		t.Fatalf("expected 3 live bookmarks, got %d: %#v", len(got), got)
	}

	full := byChunk[*chunkLive.ID]
	if full.Chunk == nil || full.Kajian == nil || full.Chunk.Kajian == nil {
		t.Fatalf("live bookmark should carry live chunk and kajian: %#v", full)
	}

	orphanChunk, ok := byChunk[*chunkGone.ID]
	if !ok {
		t.Fatalf("live bookmark with soft-deleted chunk must still be listed")
	}
	if orphanChunk.Chunk != nil {
		t.Fatalf("soft-deleted chunk leaked through bookmark: %#v", orphanChunk.Chunk)
	}
	if orphanChunk.Kajian == nil {
		t.Fatalf("live kajian should stay attached when only the chunk is deleted")
	}

	orphanKajian, ok := byChunk[*chunkUnderGoneKajian.ID]
	if !ok {
		t.Fatalf("live bookmark with soft-deleted kajian must still be listed")
	}
	if orphanKajian.Kajian != nil {
		t.Fatalf("soft-deleted kajian leaked through bookmark: %#v", orphanKajian.Kajian)
	}
	if orphanKajian.Chunk == nil {
		t.Fatalf("live chunk should stay attached when only the kajian is deleted")
	}
	if orphanKajian.Chunk.Kajian != nil {
		t.Fatalf("soft-deleted kajian leaked through chunk: %#v", orphanKajian.Chunk.Kajian)
	}

	bobs, err := repo.ListByUser(bob, 0)
	if err != nil {
		t.Fatalf("ListByUser bob: %v", err)
	}
	if len(bobs) != 2 {
		t.Fatalf("expected 2 bookmarks for bob, got %d", len(bobs))
	}
}

func TestSoftDeleteKajianBookmarkListByUserLimitSkipsDeleted(t *testing.T) {
	db := testdb.Open(t, &model.Kajian{}, &model.KajianTranscript{}, &model.KajianUserBookmark{})
	repo := repository.NewKajianBookmarkRepository(db)
	alice := uuid.New()

	kajian := seedKajian(t, db, "limit")
	chunkOld := seedChunk(t, db, *kajian.ID, 0)
	chunkNewDeleted := seedChunk(t, db, *kajian.ID, 60)

	seedKajianBookmark(t, db, alice, chunkOld, kajian, 100)
	newest := seedKajianBookmark(t, db, alice, chunkNewDeleted, kajian, 900)
	testdb.Delete(t, db, newest)

	got, err := repo.ListByUser(alice, 1)
	if err != nil {
		t.Fatalf("ListByUser: %v", err)
	}
	if len(got) != 1 || got[0].ChunkID != *chunkOld.ID {
		t.Fatalf("limit must be applied to live rows only, got %#v", got)
	}
}

func TestSoftDeleteKajianBookmarkChunkIDsByUser(t *testing.T) {
	db := testdb.Open(t, &model.Kajian{}, &model.KajianTranscript{}, &model.KajianUserBookmark{})
	repo := repository.NewKajianBookmarkRepository(db)
	alice := uuid.New()
	bob := uuid.New()

	kajianA := seedKajian(t, db, "a")
	kajianB := seedKajian(t, db, "b")
	chunkA1 := seedChunk(t, db, *kajianA.ID, 0)
	chunkA2 := seedChunk(t, db, *kajianA.ID, 60)
	chunkB1 := seedChunk(t, db, *kajianB.ID, 0)
	chunkBob := seedChunk(t, db, *kajianB.ID, 60)

	seedKajianBookmark(t, db, alice, chunkA1, kajianA, 1)
	seedKajianBookmark(t, db, alice, chunkB1, kajianB, 2)
	deleted := seedKajianBookmark(t, db, alice, chunkA2, kajianA, 3)
	testdb.Delete(t, db, deleted)
	seedKajianBookmark(t, db, bob, chunkBob, kajianB, 4)

	all, err := repo.ChunkIDsByUser(alice, 0)
	if err != nil {
		t.Fatalf("ChunkIDsByUser: %v", err)
	}
	if !equalInts(all, []int{*chunkA1.ID, *chunkB1.ID}) {
		t.Fatalf("expected live chunk ids only, got %v", all)
	}

	scoped, err := repo.ChunkIDsByUser(alice, *kajianA.ID)
	if err != nil {
		t.Fatalf("ChunkIDsByUser scoped: %v", err)
	}
	if !equalInts(scoped, []int{*chunkA1.ID}) {
		t.Fatalf("soft-deleted bookmark leaked into kajian scope, got %v", scoped)
	}
}

func TestSoftDeleteKajianBookmarkRemoveHidesFromRepositoryReads(t *testing.T) {
	db := testdb.Open(t, &model.Kajian{}, &model.KajianTranscript{}, &model.KajianUserBookmark{})
	repo := repository.NewKajianBookmarkRepository(db)
	alice := uuid.New()

	kajian := seedKajian(t, db, "remove")
	chunk := seedChunk(t, db, *kajian.ID, 0)
	seedKajianBookmark(t, db, alice, chunk, kajian, 1)

	if err := repo.Remove(alice, *chunk.ID); err != nil {
		t.Fatalf("Remove: %v", err)
	}

	list, err := repo.ListByUser(alice, 0)
	if err != nil {
		t.Fatalf("ListByUser: %v", err)
	}
	ids, err := repo.ChunkIDsByUser(alice, 0)
	if err != nil {
		t.Fatalf("ChunkIDsByUser: %v", err)
	}
	if len(list) != 0 || len(ids) != 0 {
		t.Fatalf("removed bookmark still visible: list=%#v ids=%v", list, ids)
	}
}
