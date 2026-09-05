package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LeaderboardRepository interface {
	TopStreak(limit int) ([]model.LeaderboardEntry, error)
	TopHafalan(limit int) ([]model.LeaderboardEntry, error)
	TopMushahhih(limit int) ([]model.LeaderboardEntry, error)
	MyStreakRank(userID uuid.UUID) (*model.LeaderboardMyRank, error)
	MyHafalanRank(userID uuid.UUID) (*model.LeaderboardMyRank, error)
	MyMushahhihRank(userID uuid.UUID) (*model.LeaderboardMyRank, error)
}

type leaderboardRepository struct {
	db *gorm.DB
}

func NewLeaderboardRepository(db *gorm.DB) LeaderboardRepository {
	return &leaderboardRepository{db}
}

func (r *leaderboardRepository) TopStreak(limit int) ([]model.LeaderboardEntry, error) {
	var rows []model.LeaderboardEntry
	err := r.db.Raw(`
		WITH streak_counts AS (
			SELECT user_id, COUNT(*) AS streak
			FROM (
				SELECT user_id, activity_date,
					activity_date::date - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY activity_date)::int AS grp
				FROM (SELECT DISTINCT user_id, activity_date FROM user_activity WHERE deleted_at IS NULL) t
			) g
			GROUP BY user_id, grp
		),
		max_streaks AS (
			SELECT user_id, MAX(streak) AS score FROM streak_counts GROUP BY user_id
		)
		SELECT ROW_NUMBER() OVER (ORDER BY ms.score DESC) AS rank,
			ms.user_id::text, u.name, u.avatar, ms.score
		FROM max_streaks ms
		JOIN "user" u ON u.id = ms.user_id::text
		WHERE u.deleted_at IS NULL
		ORDER BY ms.score DESC
		LIMIT ?`, limit).Scan(&rows).Error
	return rows, err
}

func (r *leaderboardRepository) TopHafalan(limit int) ([]model.LeaderboardEntry, error) {
	var rows []model.LeaderboardEntry
	err := r.db.Raw(`
		SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rank,
			hp.user_id::text, u.name, u.avatar, COUNT(*) AS score
		FROM hafalan_progress hp
		JOIN "user" u ON u.id = hp.user_id::text
		WHERE hp.status = 'memorized' AND hp.deleted_at IS NULL AND u.deleted_at IS NULL
		GROUP BY hp.user_id, u.name, u.avatar
		ORDER BY score DESC
		LIMIT ?`, limit).Scan(&rows).Error
	return rows, err
}

func (r *leaderboardRepository) MyStreakRank(userID uuid.UUID) (*model.LeaderboardMyRank, error) {
	var rank model.LeaderboardMyRank
	err := r.db.Raw(`
		WITH streak_counts AS (
			SELECT user_id, COUNT(*) AS streak
			FROM (
				SELECT user_id, activity_date,
					activity_date::date - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY activity_date)::int AS grp
				FROM (SELECT DISTINCT user_id, activity_date FROM user_activity WHERE deleted_at IS NULL) t
			) g
			GROUP BY user_id, grp
		),
		max_streaks AS (
			SELECT user_id, MAX(streak) AS score FROM streak_counts GROUP BY user_id
		),
		ranked AS (
			SELECT user_id, score, RANK() OVER (ORDER BY score DESC) AS rank,
				COUNT(*) OVER () AS total
			FROM max_streaks
		)
		SELECT rank, score, total FROM ranked WHERE user_id = ?`, userID).Scan(&rank).Error
	return &rank, err
}

func (r *leaderboardRepository) MyHafalanRank(userID uuid.UUID) (*model.LeaderboardMyRank, error) {
	var rank model.LeaderboardMyRank
	err := r.db.Raw(`
		WITH hafalan_counts AS (
			SELECT user_id, COUNT(*) AS score FROM hafalan_progress
			WHERE status = 'memorized' AND deleted_at IS NULL
			GROUP BY user_id
		),
		ranked AS (
			SELECT user_id, score, RANK() OVER (ORDER BY score DESC) AS rank,
				COUNT(*) OVER () AS total
			FROM hafalan_counts
		)
		SELECT rank, score, total FROM ranked WHERE user_id = ?`, userID).Scan(&rank).Error
	return &rank, err
}

func (r *leaderboardRepository) TopMushahhih(limit int) ([]model.LeaderboardEntry, error) {
	var rows []model.LeaderboardEntry
	err := r.db.Raw(`
		SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rank,
			cr.user_id::text, u.name, u.avatar, COUNT(*) AS score
		FROM content_reports cr
		JOIN "user" u ON u.id = cr.user_id::text
		WHERE cr.status = 'resolved' AND cr.deleted_at IS NULL AND u.deleted_at IS NULL
		GROUP BY cr.user_id, u.name, u.avatar
		ORDER BY score DESC
		LIMIT ?`, limit).Scan(&rows).Error
	return rows, err
}

func (r *leaderboardRepository) MyMushahhihRank(userID uuid.UUID) (*model.LeaderboardMyRank, error) {
	var rank model.LeaderboardMyRank
	err := r.db.Raw(`
		WITH report_counts AS (
			SELECT user_id, COUNT(*) AS score FROM content_reports
			WHERE status = 'resolved' AND deleted_at IS NULL
			GROUP BY user_id
		),
		ranked AS (
			SELECT user_id, score, RANK() OVER (ORDER BY score DESC) AS rank,
				COUNT(*) OVER () AS total
			FROM report_counts
		)
		SELECT rank, score, total FROM ranked WHERE user_id = ?`, userID).Scan(&rank).Error
	return &rank, err
}
