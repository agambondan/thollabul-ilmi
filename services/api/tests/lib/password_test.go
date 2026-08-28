package lib

import (
	"fmt"
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"

	"github.com/gofiber/fiber/v2/utils"
)

func TestPasswordEncrypt(t *testing.T) {
	raw := "password"
	utils.AssertEqual(t, false, lib.PasswordEncrypt(raw) == "")
}

func TestPasswordCompare(t *testing.T) {
	raw := "password"
	hashed := lib.PasswordEncrypt(raw)
	utils.AssertEqual(t, true, lib.PasswordCompare(hashed, raw))
}

func TestCipherEncryptDecrypt(t *testing.T) {
	plaintext := "password"
	key := "CIPHER_SECRETKEY_MUST_HAVE_32BIT"

	_, err := lib.CipherEncrypt(plaintext, key[:28])
	// Invalid Key just have 28 byte in Encrypt
	utils.AssertEqual(t, fmt.Sprint("crypto/aes: invalid key size ", len(key[:28])), err.Error())

	cipherEncrypt, _ := lib.CipherEncrypt(plaintext, key)
	cipherDecrypt, _ := lib.CipherDecrypt(cipherEncrypt, key)
	// Success Decrypt
	utils.AssertEqual(t, plaintext, string(cipherDecrypt))

	_, err = lib.CipherDecrypt(cipherEncrypt, key[:28])
	// Invalid Key just have 28 byte in Decrypt
	utils.AssertEqual(t, fmt.Sprint("crypto/aes: invalid key size ", len(key[:28])), err.Error())

	_, err = lib.CipherDecrypt([]byte(string(cipherEncrypt)[:5]), key)
	// Len byte is different
	utils.AssertEqual(t, "ciphertext too short", err.Error())
}

func TestGeneratePassword(t *testing.T) {
	password := lib.GeneratePassword(20, 6, 6, 6)

	utils.AssertEqual(t, 20, len(password))
}

func TestRandomChars(t *testing.T) {
	utils.AssertEqual(t, 10, len(lib.RandomChars(10)))
}
