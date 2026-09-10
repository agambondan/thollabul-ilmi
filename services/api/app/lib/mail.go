package lib

import (
	"bytes"
	"errors"
	"fmt"
	"text/template"

	emailverifier "github.com/AfterShip/email-verifier"
	"github.com/spf13/viper"
	"gopkg.in/gomail.v2"
)

// SendEmail to sending email to with smtp
func SendEmail(to, subject, templateFile string, cc map[string]string, attach []string, data interface{}) error {
	var err error
	result, err := ParseTemplate(templateFile, data)
	if err != nil {
		return err
	}
	m := gomail.NewMessage()
	m.SetHeader("From", ConfigSenderName)
	m.SetHeader("To", to)
	for k, v := range cc {
		m.SetAddressHeader("Cc", k, v)
	}
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", result)
	for _, v := range attach {
		m.Attach(v) // attach whatever you want
	}
	d := gomail.NewDialer(ConfigSmtpHost, ConfigSmtpPort, ConfigAuthEmail, ConfigAuthPassword)
	err = d.DialAndSend(m)
	if err != nil {
		return err
	}
	return nil
}

// SendHTMLEmail sends a raw HTML email body.
func SendHTMLEmail(to, subject, body string) error {
	smtpHost := viper.GetString("SMTP_HOST")
	if smtpHost == "" {
		smtpHost = ConfigSmtpHost
	}
	smtpPort := viper.GetInt("SMTP_PORT")
	if smtpPort == 0 {
		smtpPort = ConfigSmtpPort
	}
	smtpUser := viper.GetString("SMTP_USER")
	if smtpUser == "" {
		smtpUser = ConfigAuthEmail
	}
	smtpPass := viper.GetString("SMTP_PASS")
	if smtpPass == "" {
		smtpPass = ConfigAuthPassword
	}
	senderName := viper.GetString("SMTP_SENDER")
	if senderName == "" {
		senderName = ConfigSenderName
	}

	m := gomail.NewMessage()
	m.SetHeader("From", senderName)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer(smtpHost, smtpPort, smtpUser, smtpPass)
	return d.DialAndSend(m)
}

// ParseTemplate Parse Template Html
func ParseTemplate(templateFileName string, data interface{}) (string, error) {
	t, err := template.ParseFiles(templateFileName)
	if err != nil {
		return "", err
	}
	buf := new(bytes.Buffer)
	if err = t.Execute(buf, data); err != nil {
		fmt.Println(err)
		return "", err
	}
	return buf.String(), nil
}

// SendPasswordResetEmail sends a reset-password link to the given address.
func SendPasswordResetEmail(toEmail, resetToken string) error {
	appURL := viper.GetString("APP_URL")
	if appURL == "" {
		appURL = "https://tholabul-ilmi.app"
	}
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", appURL, resetToken)

	smtpHost := viper.GetString("SMTP_HOST")
	if smtpHost == "" {
		smtpHost = ConfigSmtpHost
	}
	smtpPort := viper.GetInt("SMTP_PORT")
	if smtpPort == 0 {
		smtpPort = ConfigSmtpPort
	}
	smtpUser := viper.GetString("SMTP_USER")
	if smtpUser == "" {
		smtpUser = ConfigAuthEmail
	}
	smtpPass := viper.GetString("SMTP_PASS")
	if smtpPass == "" {
		smtpPass = ConfigAuthPassword
	}
	senderName := viper.GetString("SMTP_SENDER")
	if senderName == "" {
		senderName = ConfigSenderName
	}

	body := fmt.Sprintf(`<p>Assalamu'alaikum,</p>
<p>Kami menerima permintaan reset password untuk akun Thalabul Ilmi Anda.</p>
<p>Klik link berikut untuk membuat password baru (berlaku 1 jam):</p>
<p><a href="%s">%s</a></p>
<p>Jika Anda tidak meminta reset password, abaikan email ini.</p>`, resetLink, resetLink)

	m := gomail.NewMessage()
	m.SetHeader("From", senderName)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Reset Password — Thalabul Ilmi")
	m.SetBody("text/html", body)

	d := gomail.NewDialer(smtpHost, smtpPort, smtpUser, smtpPass)
	return d.DialAndSend(m)
}

// SendVerificationEmail sends an account-activation link to the given
// address. Mirrors SendPasswordResetEmail's config lookup and inline-HTML
// style exactly.
func SendVerificationEmail(toEmail, verifyToken string) error {
	appURL := viper.GetString("APP_URL")
	if appURL == "" {
		appURL = "https://tholabul-ilmi.app"
	}
	verifyLink := fmt.Sprintf("%s/auth/verify-email?token=%s", appURL, verifyToken)

	smtpHost := viper.GetString("SMTP_HOST")
	if smtpHost == "" {
		smtpHost = ConfigSmtpHost
	}
	smtpPort := viper.GetInt("SMTP_PORT")
	if smtpPort == 0 {
		smtpPort = ConfigSmtpPort
	}
	smtpUser := viper.GetString("SMTP_USER")
	if smtpUser == "" {
		smtpUser = ConfigAuthEmail
	}
	smtpPass := viper.GetString("SMTP_PASS")
	if smtpPass == "" {
		smtpPass = ConfigAuthPassword
	}
	senderName := viper.GetString("SMTP_SENDER")
	if senderName == "" {
		senderName = ConfigSenderName
	}

	body := fmt.Sprintf(`<p>Assalamu'alaikum,</p>
<p>Terima kasih sudah mendaftar di Thalabul Ilmi. Klik link berikut untuk mengaktifkan akun Anda:</p>
<p><a href="%s">%s</a></p>
<p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>`, verifyLink, verifyLink)

	m := gomail.NewMessage()
	m.SetHeader("From", senderName)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Aktivasi Akun — Thalabul Ilmi")
	m.SetBody("text/html", body)

	d := gomail.NewDialer(smtpHost, smtpPort, smtpUser, smtpPass)
	return d.DialAndSend(m)
}

// CheckEmailExists is Check Email Exists or not
func CheckEmailExists(email *string) error {
	verifier := emailverifier.NewVerifier()
	ret, err := verifier.EnableGravatarCheck().EnableSMTPCheck().EnableAutoUpdateDisposable().EnableDomainSuggest().Verify(*email)
	if err != nil {
		return errors.New(fmt.Sprint("verify email address failed, error is: ", err))
	}
	if !ret.Syntax.Valid {
		return errors.New("email address syntax is invalid")
	}
	if ret.Reachable != "yes" {
		return errors.New("email doesn't exists or storage is full")
	}
	return nil
}
