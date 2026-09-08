package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type MasjidRepository interface {
	Save(*model.Masjid) (*model.Masjid, error)
	Update(int, map[string]interface{}) (*model.Masjid, error)
	FindAll(search, city, province string, limit, offset int) ([]model.Masjid, int64, error)
	FindByID(int) (*model.Masjid, error)
	Delete(int) error
	FindNearby(lat, lng, radiusKm float64, limit int) ([]model.MasjidDistance, int64, error)
}

type masjidRepo struct{ db *gorm.DB }

func NewMasjidRepository(db *gorm.DB) MasjidRepository { return &masjidRepo{db} }

func (r *masjidRepo) Save(m *model.Masjid) (*model.Masjid, error) {
	if err := r.db.Create(m).Error; err != nil {
		return nil, err
	}
	return m, nil
}

func (r *masjidRepo) Update(id int, fields map[string]interface{}) (*model.Masjid, error) {
	if len(fields) > 0 {
		if err := r.db.Model(&model.Masjid{}).Where("id = ?", id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(id)
}

func (r *masjidRepo) FindAll(search, city, province string, limit, offset int) ([]model.Masjid, int64, error) {
	var list []model.Masjid
	var total int64
	query := r.db.Model(&model.Masjid{}).Where("is_active = ?", true)
	if search != "" {
		q := "%" + search + "%"
		query = query.Where("name ILIKE ? OR address ILIKE ? OR district ILIKE ?", q, q, q)
	}
	if city != "" {
		query = query.Where("city ILIKE ?", "%"+city+"%")
	}
	if province != "" {
		query = query.Where("province ILIKE ?", "%"+province+"%")
	}
	query.Count(&total)
	err := query.Order("name asc").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *masjidRepo) FindByID(id int) (*model.Masjid, error) {
	var m model.Masjid
	err := r.db.First(&m, id).Error
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *masjidRepo) Delete(id int) error {
	return r.db.Delete(&model.Masjid{}, id).Error
}

func (r *masjidRepo) FindNearby(lat, lng, radiusKm float64, limit int) ([]model.MasjidDistance, int64, error) {
	var results []model.MasjidDistance
	var total int64

	// Haversine formula directly works on PostgreSQL, MySQL, and SQLite.
	// distance_km is computed in a subquery because Postgres rejects a bare
	// HAVING on a non-aggregated SELECT list without a GROUP BY.
	querySQL := `
		SELECT * FROM (
			SELECT id, name, description, address, district, city, province, latitude, longitude, phone, capacity, facilities, image_url, website, is_active, created_at, updated_at,
				(6371 * acos(
					LEAST(1.0, GREATEST(-1.0,
						cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))
					))
				)) as distance_km
			FROM masjid
			WHERE is_active = true
		) sub
		WHERE distance_km <= ?
		ORDER BY distance_km ASC
		LIMIT ?
	`
	if err := r.db.Raw(querySQL, lat, lng, lat, radiusKm, limit).Scan(&results).Error; err != nil {
		return nil, 0, err
	}

	countSQL := `
		SELECT COUNT(*) FROM (
			SELECT (6371 * acos(
				LEAST(1.0, GREATEST(-1.0,
					cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))
				))
			)) as distance_km
			FROM masjid
			WHERE is_active = true
		) sub
		WHERE distance_km <= ?
	`
	if err := r.db.Raw(countSQL, lat, lng, lat, radiusKm).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	return results, total, nil
}
