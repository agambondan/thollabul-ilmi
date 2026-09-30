package service

import (
	"crypto/sha256"
	"encoding/hex"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/spf13/viper"
)

type recordingPageViewRepo struct {
	repository.PageViewRepository
	recorded []*model.PageView
}

func (r *recordingPageViewRepo) Record(view *model.PageView) error {
	r.recorded = append(r.recorded, view)
	return nil
}

func useSecrets(t *testing.T, accessSecret, ipHashSecret string) {
	t.Helper()
	viper.Set("ACCESS_SECRET", accessSecret)
	viper.Set("IP_HASH_SECRET", ipHashSecret)
	t.Cleanup(func() {
		viper.Set("ACCESS_SECRET", "")
		viper.Set("IP_HASH_SECRET", "")
	})
}

func TestHashIPIsKeyedNotAPlainDigest(t *testing.T) {
	useSecrets(t, "access-secret-one", "")

	const ip = "203.0.113.7"
	plain := sha256.Sum256([]byte(ip))
	got := hashIP(ip)

	if got == hex.EncodeToString(plain[:]) {
		t.Fatal("ip hash equals the plain sha256 of the address, which can be brute-forced back to the ip")
	}
	if got != hashIP(ip) {
		t.Fatal("ip hash is not stable for the same address")
	}
	if got == hashIP("203.0.113.8") {
		t.Fatal("different addresses share a hash")
	}

	useSecrets(t, "access-secret-two", "")
	if got == hashIP(ip) {
		t.Fatal("ip hash does not depend on the server secret")
	}
}

func TestHashIPPrefersDedicatedSecret(t *testing.T) {
	useSecrets(t, "access-secret", "")
	fromAccess := hashIP("198.51.100.4")

	useSecrets(t, "access-secret", "dedicated-ip-secret")
	dedicated := hashIP("198.51.100.4")
	if dedicated == fromAccess {
		t.Fatal("IP_HASH_SECRET was ignored")
	}

	useSecrets(t, "another-access-secret", "dedicated-ip-secret")
	if hashIP("198.51.100.4") != dedicated {
		t.Fatal("changing ACCESS_SECRET altered hashes even though IP_HASH_SECRET is set")
	}
}

func TestPageViewRecordStoresKeyedHash(t *testing.T) {
	useSecrets(t, "access-secret", "")
	repo := &recordingPageViewRepo{}
	svc := NewPageViewService(repo)

	const ip = "203.0.113.7"
	if err := svc.Record(&model.CreatePageViewRequest{Path: "/quran"}, ip, "agent", nil); err != nil {
		t.Fatalf("Record: %v", err)
	}
	if len(repo.recorded) != 1 {
		t.Fatalf("recorded %d views", len(repo.recorded))
	}
	view := repo.recorded[0]
	plain := sha256.Sum256([]byte(ip))
	if view.IPHash == hex.EncodeToString(plain[:]) {
		t.Fatal("stored ip_hash is the reversible plain digest")
	}
	if view.IPHash != hashIP(ip) {
		t.Fatalf("stored ip_hash = %q, want the keyed hash", view.IPHash)
	}
	if view.VisitorID != view.IPHash {
		t.Fatalf("visitor id should fall back to the hash when the client sends none, got %q", view.VisitorID)
	}
}
