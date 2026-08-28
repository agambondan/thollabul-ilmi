package lib

import (
	"time"

	"github.com/go-resty/resty/v2"
)

// HttpRequest create a simple request object with resty
func HttpRequest(headers map[string]string, result interface{}) *resty.Request {
	if headers == nil {
		headers = map[string]string{}
	}

	if headers["Content-Type"] == "" {
		headers["Content-Type"] = "application/json"
	}

	return resty.New().SetRetryCount(1).EnableTrace().SetDebug(true).SetTimeout(30 * time.Second).R().SetHeaders(headers).SetResult(&result)
}
