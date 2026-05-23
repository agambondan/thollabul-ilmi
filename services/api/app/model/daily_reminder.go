package model

type DailyReminderType string

const (
	DailyReminderTypeUlama  DailyReminderType = "ulama"
	DailyReminderTypeQuote  DailyReminderType = "quote"
	DailyReminderTypeAdvice DailyReminderType = "advice"
)

type DailyReminder struct {
	BaseID
	Type         DailyReminderType `json:"type" gorm:"type:varchar(40);not null;default:'ulama';index"`
	Title        string            `json:"title" gorm:"type:varchar(160);not null;uniqueIndex:idx_daily_reminder_title_author_source"`
	Text         string            `json:"text" gorm:"type:text;not null"`
	Author       string            `json:"author" gorm:"type:varchar(160);index;uniqueIndex:idx_daily_reminder_title_author_source"`
	Source       string            `json:"source" gorm:"type:varchar(256);uniqueIndex:idx_daily_reminder_title_author_source"`
	Lang         string            `json:"lang" gorm:"type:varchar(12);not null;default:'idn';index"`
	IsActive     bool              `json:"is_active" gorm:"not null;default:true;index"`
	DisplayOrder int               `json:"display_order" gorm:"not null;default:0;index"`
}

type DailyReminderRequest struct {
	Type         DailyReminderType `json:"type" validate:"required,oneof=ulama quote advice"`
	Title        string            `json:"title" validate:"required"`
	Text         string            `json:"text" validate:"required"`
	Author       string            `json:"author"`
	Source       string            `json:"source"`
	Lang         string            `json:"lang"`
	IsActive     bool              `json:"is_active"`
	DisplayOrder int               `json:"display_order"`
}

func (r DailyReminderRequest) ToModel() *DailyReminder {
	reminderType := r.Type
	if reminderType == "" {
		reminderType = DailyReminderTypeUlama
	}
	lang := r.Lang
	if lang == "" {
		lang = "idn"
	}
	return &DailyReminder{
		Type:         reminderType,
		Title:        r.Title,
		Text:         r.Text,
		Author:       r.Author,
		Source:       r.Source,
		Lang:         lang,
		IsActive:     r.IsActive,
		DisplayOrder: r.DisplayOrder,
	}
}
