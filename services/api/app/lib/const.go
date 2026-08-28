package lib

const DummyUserID = "8e910844-496b-41ab-b9ab-f5a9b19eb8ec"

// SMTP defaults — override via env vars SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SENDER
const (
	ConfigSmtpHost     = "smtp.gmail.com"
	ConfigSmtpPort     = 587
	ConfigSenderName   = "Thalabul Ilmi <noreply@tholabul-ilmi.app>"
	ConfigAuthEmail    = ""
	ConfigAuthPassword = ""
)
