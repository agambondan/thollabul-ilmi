package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type SanadRepository interface {
	Save(*model.Sanad) (*model.Sanad, error)
	FindAll() ([]model.Sanad, error)
	FindByID(*int) (*model.Sanad, error)
	FindByHadithID(*int) ([]model.Sanad, error)
	UpdateByID(*int, *model.Sanad) (*model.Sanad, error)
	DeleteByID(*int) error

	SaveMataSanad(*model.MataSanad) (*model.MataSanad, error)
	FindMataSanadByID(*int) (*model.MataSanad, error)
	UpdateMataSanad(*int, *model.MataSanad) (*model.MataSanad, error)
	DeleteMataSanad(*int) error
}

type sanadRepo struct {
	db *gorm.DB
}

func NewSanadRepository(db *gorm.DB) SanadRepository {
	return &sanadRepo{db}
}

func (r *sanadRepo) tableNames() (sanadTbl, mataTbl, perawiTbl string) {
	sanadTbl = "sanads"
	if r.db.Migrator().HasTable("sanad") {
		sanadTbl = "sanad"
	}
	mataTbl = "mata_sanads"
	if r.db.Migrator().HasTable("mata_sanad") {
		mataTbl = "mata_sanad"
	}
	perawiTbl = "perawis"
	if r.db.Migrator().HasTable("perawi") {
		perawiTbl = "perawi"
	}
	return
}

type sanadJoinRow struct {
	ID          *int
	HadithID    *int
	NomorJalur  *int
	Jenis       *model.SanadJenis
	StatusSanad *model.SanadStatus
	Catatan     *string
	CreatedAt   *time.Time
	UpdatedAt   *time.Time
	DeletedAt   gorm.DeletedAt

	MsID        *int
	MsSanadID   *int
	MsPerawiID  *int
	MsUrutan    *int
	MsMetode    *model.MetodePeriwayatan
	MsCatatan   *string
	MsCreatedAt *time.Time
	MsUpdatedAt *time.Time
	MsDeletedAt gorm.DeletedAt

	PID            *int
	PNamaArab      *string
	PNamaLatin     *string
	PNamaLengkap   *string
	PKunyah        *string
	PLaqab         *string
	PNisbah        *string
	PTahunLahir    *int
	PTahunWafat    *int
	PTahunHijri    *bool
	PTempatLahir   *string
	PTempatWafat   *string
	PTabaqah       *string
	PStatus        *string
	PBiografis     *string
	PTranslationID *int
	PCreatedAt     *time.Time
	PUpdatedAt     *time.Time
	PDeletedAt     gorm.DeletedAt
}

func (r *sanadRepo) joinSelectSQL(sanadTbl, mataTbl, perawiTbl string) string {
	return `
		SELECT
			s.id, s.hadith_id, s.nomor_jalur, s.jenis, s.status_sanad, s.catatan,
			s.created_at, s.updated_at, s.deleted_at,
			ms.id AS ms_id, ms.sanad_id AS ms_sanad_id, ms.perawi_id AS ms_perawi_id,
			ms.urutan AS ms_urutan, ms.metode AS ms_metode, ms.catatan AS ms_catatan,
			ms.created_at AS ms_created_at, ms.updated_at AS ms_updated_at, ms.deleted_at AS ms_deleted_at,
			p.id AS p_id, p.nama_arab AS p_nama_arab, p.nama_latin AS p_nama_latin,
			p.nama_lengkap AS p_nama_lengkap, p.kunyah AS p_kunyah, p.laqab AS p_laqab,
			p.nisbah AS p_nisbah, p.tahun_lahir AS p_tahun_lahir, p.tahun_wafat AS p_tahun_wafat,
			p.tahun_hijri AS p_tahun_hijri, p.tempat_lahir AS p_tempat_lahir,
			p.tempat_wafat AS p_tempat_wafat, p.tabaqah AS p_tabaqah, p.status AS p_status,
			p.biografis AS p_biografis, p.translation_id AS p_translation_id,
			p.created_at AS p_created_at, p.updated_at AS p_updated_at, p.deleted_at AS p_deleted_at
		FROM ` + sanadTbl + ` s
		LEFT JOIN ` + mataTbl + ` ms ON ms.sanad_id = s.id AND ms.deleted_at IS NULL
		LEFT JOIN ` + perawiTbl + ` p ON p.id = ms.perawi_id AND p.deleted_at IS NULL
	`
}

func foldSanads(rows []sanadJoinRow) []model.Sanad {
	if len(rows) == 0 {
		return []model.Sanad{}
	}

	sanadMap := make(map[int]*model.Sanad)
	var orderedSanads []*model.Sanad

	for _, r := range rows {
		if r.ID == nil {
			continue
		}
		s, exists := sanadMap[*r.ID]
		if !exists {
			s = &model.Sanad{
				HadithID:    r.HadithID,
				NomorJalur:  r.NomorJalur,
				Jenis:       r.Jenis,
				StatusSanad: r.StatusSanad,
				Catatan:     r.Catatan,
				MataSanad:   make([]model.MataSanad, 0),
			}
			s.ID = r.ID
			s.CreatedAt = r.CreatedAt
			s.UpdatedAt = r.UpdatedAt
			s.DeletedAt = r.DeletedAt

			sanadMap[*r.ID] = s
			orderedSanads = append(orderedSanads, s)
		}

		if r.MsID != nil {
			ms := model.MataSanad{
				SanadID:  r.MsSanadID,
				PerawiID: r.MsPerawiID,
				Urutan:   r.MsUrutan,
				Metode:   r.MsMetode,
				Catatan:  r.MsCatatan,
			}
			ms.ID = r.MsID
			ms.CreatedAt = r.MsCreatedAt
			ms.UpdatedAt = r.MsUpdatedAt
			ms.DeletedAt = r.MsDeletedAt

			if r.PID != nil {
				p := &model.Perawi{
					NamaArab:      r.PNamaArab,
					NamaLatin:     r.PNamaLatin,
					NamaLengkap:   r.PNamaLengkap,
					Kunyah:        r.PKunyah,
					Laqab:         r.PLaqab,
					Nisbah:        r.PNisbah,
					TahunLahir:    r.PTahunLahir,
					TahunWafat:    r.PTahunWafat,
					TahunHijri:    r.PTahunHijri,
					TempatLahir:   r.PTempatLahir,
					TempatWafat:   r.PTempatWafat,
					Tabaqah:       r.PTabaqah,
					Status:        r.PStatus,
					Biografis:     r.PBiografis,
					TranslationID: r.PTranslationID,
				}
				p.ID = r.PID
				p.CreatedAt = r.PCreatedAt
				p.UpdatedAt = r.PUpdatedAt
				p.DeletedAt = r.PDeletedAt
				ms.Perawi = p
			}
			s.MataSanad = append(s.MataSanad, ms)
		}
	}

	res := make([]model.Sanad, len(orderedSanads))
	for i, s := range orderedSanads {
		res[i] = *s
	}
	return res
}

func (r *sanadRepo) Save(s *model.Sanad) (*model.Sanad, error) {
	if err := r.db.Create(s).Error; err != nil {
		return nil, err
	}
	return s, nil
}

func (r *sanadRepo) FindAll() ([]model.Sanad, error) {
	sanadTbl, mataTbl, perawiTbl := r.tableNames()
	var rows []sanadJoinRow
	err := r.db.Raw(r.joinSelectSQL(sanadTbl, mataTbl, perawiTbl)+`
		WHERE s.deleted_at IS NULL
		ORDER BY s.hadith_id ASC, s.id ASC, ms.urutan ASC
		LIMIT 500
	`).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return foldSanads(rows), nil
}

func (r *sanadRepo) FindByID(id *int) (*model.Sanad, error) {
	sanadTbl, mataTbl, perawiTbl := r.tableNames()
	var rows []sanadJoinRow
	err := r.db.Raw(r.joinSelectSQL(sanadTbl, mataTbl, perawiTbl)+`
		WHERE s.id = ? AND s.deleted_at IS NULL
		ORDER BY ms.urutan ASC
	`, id).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	sanads := foldSanads(rows)
	if len(sanads) == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &sanads[0], nil
}

func (r *sanadRepo) FindByHadithID(hadithID *int) ([]model.Sanad, error) {
	sanadTbl, mataTbl, perawiTbl := r.tableNames()
	var rows []sanadJoinRow
	err := r.db.Raw(r.joinSelectSQL(sanadTbl, mataTbl, perawiTbl)+`
		WHERE s.hadith_id = ? AND s.deleted_at IS NULL
		ORDER BY s.nomor_jalur ASC, ms.urutan ASC
	`, hadithID).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return foldSanads(rows), nil
}

func (r *sanadRepo) UpdateByID(id *int, s *model.Sanad) (*model.Sanad, error) {
	if _, err := r.FindByID(id); err != nil {
		return nil, err
	}
	s.ID = id
	if err := r.db.Updates(s).Error; err != nil {
		return nil, err
	}
	return s, nil
}

func (r *sanadRepo) DeleteByID(id *int) error {
	if _, err := r.FindByID(id); err != nil {
		return err
	}
	r.db.Where("sanad_id = ?", id).Delete(&model.MataSanad{})
	return r.db.Delete(&model.Sanad{}, id).Error
}

func (r *sanadRepo) SaveMataSanad(m *model.MataSanad) (*model.MataSanad, error) {
	if err := r.db.Create(m).Error; err != nil {
		return nil, err
	}
	return r.FindMataSanadByID(m.ID)
}

func (r *sanadRepo) FindMataSanadByID(id *int) (*model.MataSanad, error) {
	_, mataTbl, perawiTbl := r.tableNames()
	type mataSanadSingleRow struct {
		ID        *int
		SanadID   *int
		PerawiID  *int
		Urutan    *int
		Metode    *model.MetodePeriwayatan
		Catatan   *string
		CreatedAt *time.Time
		UpdatedAt *time.Time
		DeletedAt gorm.DeletedAt

		PID            *int
		PNamaArab      *string
		PNamaLatin     *string
		PNamaLengkap   *string
		PKunyah        *string
		PLaqab         *string
		PNisbah        *string
		PTahunLahir    *int
		PTahunWafat    *int
		PTahunHijri    *bool
		PTempatLahir   *string
		PTempatWafat   *string
		PTabaqah       *string
		PStatus        *string
		PBiografis     *string
		PTranslationID *int
		PCreatedAt     *time.Time
		PUpdatedAt     *time.Time
		PDeletedAt     gorm.DeletedAt
	}

	var row mataSanadSingleRow
	err := r.db.Raw(`
		SELECT
			ms.id, ms.sanad_id, ms.perawi_id, ms.urutan, ms.metode, ms.catatan,
			ms.created_at, ms.updated_at, ms.deleted_at,
			p.id AS p_id, p.nama_arab AS p_nama_arab, p.nama_latin AS p_nama_latin,
			p.nama_lengkap AS p_nama_lengkap, p.kunyah AS p_kunyah, p.laqab AS p_laqab,
			p.nisbah AS p_nisbah, p.tahun_lahir AS p_tahun_lahir, p.tahun_wafat AS p_tahun_wafat,
			p.tahun_hijri AS p_tahun_hijri, p.tempat_lahir AS p_tempat_lahir,
			p.tempat_wafat AS p_tempat_wafat, p.tabaqah AS p_tabaqah, p.status AS p_status,
			p.biografis AS p_biografis, p.translation_id AS p_translation_id,
			p.created_at AS p_created_at, p.updated_at AS p_updated_at, p.deleted_at AS p_deleted_at
		FROM `+mataTbl+` ms
		LEFT JOIN `+perawiTbl+` p ON p.id = ms.perawi_id AND p.deleted_at IS NULL
		WHERE ms.id = ? AND ms.deleted_at IS NULL
		LIMIT 1
	`, id).Scan(&row).Error
	if err != nil {
		return nil, err
	}
	if row.ID == nil {
		return nil, gorm.ErrRecordNotFound
	}

	ms := model.MataSanad{
		SanadID:  row.SanadID,
		PerawiID: row.PerawiID,
		Urutan:   row.Urutan,
		Metode:   row.Metode,
		Catatan:  row.Catatan,
	}
	ms.ID = row.ID
	ms.CreatedAt = row.CreatedAt
	ms.UpdatedAt = row.UpdatedAt
	ms.DeletedAt = row.DeletedAt

	if row.PID != nil {
		p := &model.Perawi{
			NamaArab:      row.PNamaArab,
			NamaLatin:     row.PNamaLatin,
			NamaLengkap:   row.PNamaLengkap,
			Kunyah:        row.PKunyah,
			Laqab:         row.PLaqab,
			Nisbah:        row.PNisbah,
			TahunLahir:    row.PTahunLahir,
			TahunWafat:    row.PTahunWafat,
			TahunHijri:    row.PTahunHijri,
			TempatLahir:   row.PTempatLahir,
			TempatWafat:   row.PTempatWafat,
			Tabaqah:       row.PTabaqah,
			Status:        row.PStatus,
			Biografis:     row.PBiografis,
			TranslationID: row.PTranslationID,
		}
		p.ID = row.PID
		p.CreatedAt = row.PCreatedAt
		p.UpdatedAt = row.PUpdatedAt
		p.DeletedAt = row.PDeletedAt
		ms.Perawi = p
	}

	return &ms, nil
}

func (r *sanadRepo) UpdateMataSanad(id *int, m *model.MataSanad) (*model.MataSanad, error) {
	if _, err := r.FindMataSanadByID(id); err != nil {
		return nil, err
	}
	m.ID = id
	if err := r.db.Updates(m).Error; err != nil {
		return nil, err
	}
	return m, nil
}

func (r *sanadRepo) DeleteMataSanad(id *int) error {
	if _, err := r.FindMataSanadByID(id); err != nil {
		return err
	}
	return r.db.Delete(&model.MataSanad{}, id).Error
}