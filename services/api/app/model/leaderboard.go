package model

type LeaderboardEntry struct {
	Rank   int     `json:"rank"`
	UserID string  `json:"user_id"`
	Name   string  `json:"name"`
	Avatar *string `json:"avatar,omitempty"`
	Score  int     `json:"score"`
}

type LeaderboardMyRank struct {
	Rank  int `json:"rank"`
	Score int `json:"score"`
	Total int `json:"total"`
}
