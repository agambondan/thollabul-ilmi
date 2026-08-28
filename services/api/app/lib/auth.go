package lib

import (
	"errors"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/spf13/viper"
)

func TokenValid(c *fiber.Ctx) error {
	_, err := VerifyToken(c)
	return err
}

func VerifyToken(c *fiber.Ctx) (*jwt.Token, error) {
	reqToken := c.Request().Header.Cookie("token")
	if string(reqToken) == "" {
		bearerToken := c.Get("Authorization")
		if bearerToken != "" {
			tokens := strings.Fields(bearerToken)
			if len(tokens) != 2 || !strings.EqualFold(tokens[0], "Bearer") {
				return nil, errors.New("token is empty")
			}
			reqToken = []byte(tokens[1])
		}
	}
	return extractToken(string(reqToken))
}

// VerifyTokenCookies is to verify token by cookie
func VerifyTokenCookies(c *fiber.Ctx) (*jwt.Token, error) {
	reqToken := c.Request().Header.Cookie("token")
	return extractToken(string(reqToken))
}

// VerifyTokenHeaders is to verify token by header
func VerifyTokenHeaders(c *fiber.Ctx) (*jwt.Token, error) {
	bearerToken := c.Get("Authorization")
	tokens := strings.Fields(bearerToken)
	if len(tokens) == 2 && strings.EqualFold(tokens[0], "Bearer") {
		return extractToken(tokens[1])
	}
	return nil, errors.New("token is empty")
}

func jwtSecret() []byte {
	secret := viper.GetString("ACCESS_SECRET")
	if secret == "" {
		secret = "tholabul-ilmi-secret"
	}
	return []byte(secret)
}

func extractToken(reqToken string) (*jwt.Token, error) {
	token, err := jwt.Parse(reqToken, func(token *jwt.Token) (interface{}, error) {
		// Make sure that the token method conform to "SigningMethodHMAC"
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret(), nil
	})
	if err != nil {
		return nil, err
	}
	return token, nil
}

// GetPreferredLang reads preferred_lang from JWT claims.
// Falls back to ?lang= query param, then defaults to "idn".
func GetPreferredLang(c *fiber.Ctx) string {
	token, err := VerifyToken(c)
	if err == nil {
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if lang, ok := claims["preferred_lang"].(string); ok && lang != "" {
				return lang
			}
		}
	}
	if lang := c.Query("lang"); lang != "" {
		return lang
	}
	return "idn"
}

func ExtractToken(c *fiber.Ctx) (map[string]interface{}, error) {
	token, err := VerifyToken(c)
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if ok {
		return claims, nil
	}
	return nil, errors.New("invalid token")
}
