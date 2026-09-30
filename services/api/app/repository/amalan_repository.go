package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type AmalanRepository interface {
	FindAllItems() ([]model.AmalanItem, error)
	FindItemByID(id int) (*model.AmalanItem, error)
	CreateItem(item *model.AmalanItem) (*model.AmalanItem, error)
	UpdateItem(id int, item *model.AmalanItem) (*model.AmalanItem, error)
	DeleteItem(id int) error
	FindTodayStatus(userID uuid.UUID, date string) ([]model.AmalanWithStatus, error)
	ToggleLog(userID uuid.UUID, amalanItemID int, date string, isDone bool) error
	FindHistory(userID uuid.UUID, from, to string) ([]model.AmalanLog, error)
}

type amalanRepository struct {
	db *gorm.DB
}

func NewAmalanRepository(db *gorm.DB) AmalanRepository {
	return &amalanRepository{db}
}

func (r *amalanRepository) FindAllItems() ([]model.AmalanItem, error) {
	var items []model.AmalanItem
	err := r.db.Order("category, name").Limit(500).Find(&items).Error
	return items, err
}

const amalanItemByIDSQL = `
SELECT
    ai.id, ai.created_at, ai.updated_at, ai.name, ai.description, ai.source,
    ai.category, ai.is_active, ai.translation_id,
    t.id as t_id, t.idn as t_idn, t.en as t_en, t.ar as t_ar
FROM amalan_item ai
LEFT JOIN translation t ON t.id = ai.translation_id AND t.deleted_at IS NULL
WHERE ai.id = ? AND ai.deleted_at IS NULL
`

func (r *amalanRepository) FindItemByID(id int) (*model.AmalanItem, error) {
	rows, err := r.db.Raw(amalanItemByIDSQL, id).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return nil, gorm.ErrRecordNotFound
	}

	var item model.AmalanItem
	var tID *int
	var tIdn, tEn, tAr *string
	err = rows.Scan(
		&item.ID, &item.CreatedAt, &item.UpdatedAt, &item.Name, &item.Description, &item.Source,
		&item.Category, &item.IsActive, &item.TranslationID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return nil, err
	}
	if tID != nil {
		item.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}
	return &item, nil
}

func (r *amalanRepository) CreateItem(item *model.AmalanItem) (*model.AmalanItem, error) {
	if err := r.db.Create(item).Error; err != nil {
		return nil, err
	}
	return r.FindItemByID(*item.ID)
}

func (r *amalanRepository) UpdateItem(id int, item *model.AmalanItem) (*model.AmalanItem, error) {
	if err := r.db.Model(&model.AmalanItem{}).Where("id = ?", id).Updates(item).Error; err != nil {
		return nil, err
	}
	return r.FindItemByID(id)
}

func (r *amalanRepository) DeleteItem(id int) error {
	return r.db.Delete(&model.AmalanItem{}, id).Error
}

func (r *amalanRepository) FindTodayStatus(userID uuid.UUID, date string) ([]model.AmalanWithStatus, error) {
	items, err := r.FindAllItems()
	if err != nil {
		return nil, err
	}
	var logs []model.AmalanLog
	r.db.Where("user_id = ? AND date = ?", userID, date).Find(&logs)

	logMap := make(map[int]model.AmalanLog)
	for _, l := range logs {
		logMap[l.AmalanItemID] = l
	}

	result := make([]model.AmalanWithStatus, len(items))
	for i, item := range items {
		ws := model.AmalanWithStatus{AmalanItem: item}
		if l, ok := logMap[*item.ID]; ok {
			ws.IsDone = l.IsDone
			ws.LogID = l.ID
		}
		result[i] = ws
	}
	return result, nil
}

func (r *amalanRepository) ToggleLog(userID uuid.UUID, amalanItemID int, date string, isDone bool) error {
	log := model.AmalanLog{
		UserID:       userID,
		AmalanItemID: amalanItemID,
		Date:         date,
		IsDone:       isDone,
	}
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "amalan_item_id"}, {Name: "date"}},
		DoUpdates: clause.AssignmentColumns([]string{"is_done"}),
	}).Create(&log).Error
}

const amalanHistorySQL = `
SELECT
    al.id, al.created_at, al.updated_at, al.user_id, al.amalan_item_id, al.date, al.is_done,
    ai.id as ai_id, ai.created_at as ai_created_at, ai.updated_at as ai_updated_at,
    ai.name as ai_name, ai.description as ai_desc, ai.source as ai_source,
    ai.category as ai_cat, ai.is_active as ai_active, ai.translation_id as ai_tr_id,
    t.id as t_id, t.idn as t_idn, t.en as t_en, t.ar as t_ar
FROM amalan_log al
LEFT JOIN amalan_item ai ON ai.id = al.amalan_item_id AND ai.deleted_at IS NULL
LEFT JOIN translation t ON t.id = ai.translation_id AND t.deleted_at IS NULL
WHERE al.user_id = ? AND al.date BETWEEN ? AND ? AND al.deleted_at IS NULL
ORDER BY al.date DESC
`

func (r *amalanRepository) FindHistory(userID uuid.UUID, from, to string) ([]model.AmalanLog, error) {
	rows, err := r.db.Raw(amalanHistorySQL, userID, from, to).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []model.AmalanLog
	for rows.Next() {
		var l model.AmalanLog
		var ai model.AmalanItem
		var tID *int
		var tIdn, tEn, tAr *string
		if err := rows.Scan(
			&l.ID, &l.CreatedAt, &l.UpdatedAt, &l.UserID, &l.AmalanItemID, &l.Date, &l.IsDone,
			&ai.ID, &ai.CreatedAt, &ai.UpdatedAt,
			&ai.Name, &ai.Description, &ai.Source,
			&ai.Category, &ai.IsActive, &ai.TranslationID,
			&tID, &tIdn, &tEn, &tAr,
		); err != nil {
			return nil, err
		}
		if ai.ID != nil {
			if tID != nil {
				ai.Translation = &model.Translation{
					BaseID: model.BaseID{ID: tID},
					Idn:    tIdn,
					En:     tEn,
					Ar:     tAr,
				}
			}
			l.AmalanItem = &ai
		}
		logs = append(logs, l)
	}
	return logs, rows.Err()
}
