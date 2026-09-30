package http

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

const clientIPHeader = "CF-Connecting-IP"

var defaultTrustedProxies = []string{
	"127.0.0.0/8",
	"::1",
	"10.0.0.0/8",
	"172.16.0.0/12",
	"192.168.0.0/16",
	"fc00::/7",
}

func TrustedProxies() []string {
	raw := strings.TrimSpace(viper.GetString("TRUSTED_PROXIES"))
	if raw == "" {
		return defaultTrustedProxies
	}
	proxies := make([]string, 0)
	for _, entry := range strings.Split(raw, ",") {
		if entry = strings.TrimSpace(entry); entry != "" {
			proxies = append(proxies, entry)
		}
	}
	return proxies
}

func WithClientIP(config fiber.Config) fiber.Config {
	config.ProxyHeader = clientIPHeader
	config.EnableTrustedProxyCheck = true
	config.TrustedProxies = TrustedProxies()
	config.EnableIPValidation = true
	return config
}
