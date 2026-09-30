package model

import "github.com/google/uuid"

type SocialModerationTargetType string

const (
	SocialModerationTargetFeedPost SocialModerationTargetType = "feed_post"
	SocialModerationTargetComment  SocialModerationTargetType = "comment"
)

type SocialModerationActionType string

const (
	SocialModerationActionHide   SocialModerationActionType = "hide"
	SocialModerationActionReport SocialModerationActionType = "report"
)

type SocialModerationAction struct {
	BaseID
	UserID     uuid.UUID                  `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_social_moderation_once,priority:1"`
	TargetType SocialModerationTargetType `json:"target_type" gorm:"type:varchar(30);not null;index;uniqueIndex:idx_social_moderation_once,priority:2"`
	TargetID   string                     `json:"target_id" gorm:"type:varchar(64);not null;index;uniqueIndex:idx_social_moderation_once,priority:3"`
	Action     SocialModerationActionType `json:"action" gorm:"type:varchar(20);not null;index;uniqueIndex:idx_social_moderation_once,priority:4"`
	Reason     string                     `json:"reason,omitempty" gorm:"type:text"`
}

type SocialModerationRequest struct {
	Reason string `json:"reason"`
}
