package repository

import (
	"log/slog"
	"time"

	"github.com/agambondan/islamic-explorer/app/db/migrations"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/go-redis/redis/v8"
	"github.com/morkid/gocache"
	cache_redis "github.com/morkid/gocache-redis/v8"
	"github.com/morkid/paginate"
	"github.com/spf13/viper"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repositories struct {
	User                 UserRepository
	Ayah                 AyahRepository
	Surah                SurahRepository
	Juz                  JuzRepository
	Book                 BookRepository
	Theme                ThemeRepository
	Chapter              ChapterRepository
	Hadith               HadithRepository
	Bookmark             BookmarkRepository
	UserWird             UserWirdRepository
	ReadingProgress      ReadingProgressRepository
	Hafalan              HafalanRepository
	UserActivity         UserActivityRepository
	Search               SearchRepository
	Mufrodat             MufrodatRepository
	Notification         NotificationRepository
	NotificationInbox    NotificationInboxRepository
	Feed                 FeedRepository
	SocialModeration     SocialModerationRepository
	Tafsir               TafsirRepository
	Doa                  DoaRepository
	DailyReminder        DailyReminderRepository
	AsmaUlHusna          AsmaUlHusnaRepository
	Audio                AudioRepository
	Siroh                SirohRepository
	Blog                 BlogRepository
	LibraryBook          LibraryBookRepository
	LibraryBookProgress  LibraryBookProgressRepository
	Tilawah              TilawahRepository
	Amalan               AmalanRepository
	Dzikir               DzikirRepository
	DzikirLog            DzikirLogRepository
	Achievement          AchievementRepository
	Leaderboard          LeaderboardRepository
	Sholat               SholatRepository
	Murojaah             MurojaahRepository
	Fiqh                 FiqhRepository
	Kajian               KajianRepository
	Muhasabah            MuhasabahRepository
	Goal                 GoalRepository
	History              HistoryRepository
	Manasik              ManasikRepository
	Quiz                 QuizRepository
	Note                 NoteRepository
	Dictionary           DictionaryRepository
	Comment              CommentRepository
	APIKey               APIKeyRepository
	IslamicEvent         IslamicEventRepository
	KalkulasiZakat       KalkulasiZakatRepository
	SimpanFaraidh        SimpanFaraidhRepository
	HadithAyah           HadithAyahRepository
	Forum                ForumRepository
	Munasabah            MunasabahRepository
	PageView             PageViewRepository
	NotificationTemplate NotificationTemplateRepository
	TokohTarikh          TokohTarikhRepository
	Location             LocationRepository
	AsbabunNuzul         AsbabunNuzulRepository
	Perawi               PerawiRepository
	JarhTadil            JarhTadilRepository
	Sanad                SanadRepository
	Takhrij              TakhrijRepository
	Settings             SettingsRepository
	Chat                 ChatRepository
	Lesson               LessonRepository
	AdzanSound           AdzanSoundRepository
	db                   *gorm.DB
	pg                   *paginate.Pagination
	redis                *redis.Client
}

func NewRepositories(db *gorm.DB, client *redis.Client) (*Repositories, error) {
	var cache *gocache.AdapterInterface
	cacheSeconds := viper.GetInt64("CACHE_TTL_SECONDS")

	if nil != client && cacheSeconds > 0 {
		cache = cache_redis.NewRedisCache(cache_redis.RedisCacheConfig{
			Client:    client,
			ExpiresIn: time.Duration(cacheSeconds) * time.Second,
		})
	}
	pg := paginate.New(&paginate.Config{
		CacheAdapter:         cache,
		FieldSelectorEnabled: true,
	})

	return &Repositories{
		User:                 NewUserRepository(db, pg),
		Ayah:                 NewAyahRepository(db, pg),
		Surah:                NewSurahRepository(db, pg),
		Juz:                  NewJuzRepository(db, pg),
		Book:                 NewBookRepository(db, pg),
		Theme:                NewThemeRepository(db, pg),
		Chapter:              NewChapterRepository(db, pg),
		Hadith:               NewHadithRepository(db, pg),
		Bookmark:             NewBookmarkRepository(db),
		UserWird:             NewUserWirdRepository(db),
		ReadingProgress:      NewReadingProgressRepository(db),
		Hafalan:              NewHafalanRepository(db),
		UserActivity:         NewUserActivityRepository(db),
		Search:               NewSearchRepository(db),
		Mufrodat:             NewMufrodatRepository(db),
		Notification:         NewNotificationRepository(db),
		NotificationInbox:    NewNotificationInboxRepository(db),
		Feed:                 NewFeedRepository(db, pg),
		SocialModeration:     NewSocialModerationRepository(db),
		Tafsir:               NewTafsirRepository(db, pg),
		Doa:                  NewDoaRepository(db),
		DailyReminder:        NewDailyReminderRepository(db),
		AsmaUlHusna:          NewAsmaUlHusnaRepository(db),
		Audio:                NewAudioRepository(db),
		Siroh:                NewSirohRepository(db, pg),
		Blog:                 NewBlogRepository(db, pg),
		LibraryBook:          NewLibraryBookRepository(db, pg),
		LibraryBookProgress:  NewLibraryBookProgressRepository(db),
		Tilawah:              NewTilawahRepository(db),
		Amalan:               NewAmalanRepository(db),
		Dzikir:               NewDzikirRepository(db),
		DzikirLog:            NewDzikirLogRepository(db),
		Achievement:          NewAchievementRepository(db),
		Leaderboard:          NewLeaderboardRepository(db),
		Sholat:               NewSholatRepository(db),
		Murojaah:             NewMurojaahRepository(db),
		Fiqh:                 NewFiqhRepository(db),
		Kajian:               NewKajianRepository(db, pg),
		Muhasabah:            NewMuhasabahRepository(db),
		Goal:                 NewGoalRepository(db),
		History:              NewHistoryRepository(db),
		Manasik:              NewManasikRepository(db),
		Quiz:                 NewQuizRepository(db),
		Note:                 NewNoteRepository(db),
		Dictionary:           NewDictionaryRepository(db),
		Comment:              NewCommentRepository(db),
		APIKey:               NewAPIKeyRepository(db),
		IslamicEvent:         NewIslamicEventRepository(db),
		KalkulasiZakat:       NewKalkulasiZakatRepository(db),
		SimpanFaraidh:        NewSimpanFaraidhRepository(db),
		HadithAyah:           NewHadithAyahRepository(db),
		Forum:                NewForumRepository(db),
		Munasabah:            NewMunasabahRepository(db),
		PageView:             NewPageViewRepository(db),
		NotificationTemplate: NewNotificationTemplateRepository(db),
		TokohTarikh:          NewTokohTarikhRepository(db),
		Location:             NewLocationRepository(db),
		AsbabunNuzul:         NewAsbabunNuzulRepository(db),
		Perawi:               NewPerawiRepository(db, pg),
		JarhTadil:            NewJarhTadilRepository(db),
		Sanad:                NewSanadRepository(db),
		Takhrij:              NewTakhrijRepository(db),
		Settings:             NewSettingsRepository(db),
		Chat:                 NewChatRepository(db),
		Lesson:               NewLessonRepository(db),
		AdzanSound:           NewAdzanSoundRepository(db),
		db:                   db,
		pg:                   pg,
		redis:                client,
	}, nil
}

func (s *Repositories) GetDB() *gorm.DB {
	return s.db
}

func (s *Repositories) GetRedis() *redis.Client {
	return s.redis
}

// Close closes the  database connection
func (s *Repositories) Close() error {
	db, _ := s.db.DB()
	return db.Close()
}

// Migrations convert model to design table
func (s *Repositories) Migrations() error {
	migrations.DeduplicateSeedData(s.db)
	migrations.PreMigrateAsbabunNuzul(s.db)
	migrations.DropTahlilTables(s.db)
	err := s.db.AutoMigrate(migrations.ModelMigrations...)
	if err != nil {
		return err
	}
	s.db.Migrator().DropTable("schema_migration")
	s.createCompositeIndexes()
	return nil
}

// createCompositeIndexes adds composite indexes that include deleted_at for high-traffic tables.
// Also adds pg_trgm GIN indexes for ILIKE search performance.
// GORM struct tags can't express composite indexes on embedded fields, so we do it here.
func (s *Repositories) createCompositeIndexes() {
	s.db.Exec(`CREATE EXTENSION IF NOT EXISTS pg_trgm`)

	indexes := []string{
		`CREATE INDEX IF NOT EXISTS idx_hadith_book_del    ON hadith (book_id, deleted_at)`,
		`CREATE INDEX IF NOT EXISTS idx_hadith_book_number_del ON hadith (book_id, number, deleted_at)`,
		`CREATE INDEX IF NOT EXISTS idx_hadith_theme_del   ON hadith (theme_id, deleted_at)`,
		`CREATE INDEX IF NOT EXISTS idx_hadith_chapter_del ON hadith (chapter_id, deleted_at)`,
		`CREATE INDEX IF NOT EXISTS idx_ua_uid_date_del    ON user_activity (user_id, activity_date, deleted_at)`,
		`CREATE INDEX IF NOT EXISTS idx_hafalan_uid_del    ON hafalan_progress (user_id, deleted_at)`,
		`CREATE INDEX IF NOT EXISTS idx_hafalan_status_del ON hafalan_progress (status, deleted_at)`,
		`CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_view (created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_page_views_source_created ON page_view (source, created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_page_views_user_created ON page_view (user_id, created_at DESC)`,

		// pg_trgm GIN indexes for ILIKE search optimization
		`CREATE INDEX IF NOT EXISTS idx_trgm_translation_ar  ON translation USING GIN (ar gin_trgm_ops)`,
		`CREATE INDEX IF NOT EXISTS idx_trgm_translation_idn ON translation USING GIN (idn gin_trgm_ops)`,
		`CREATE INDEX IF NOT EXISTS idx_trgm_translation_en  ON translation USING GIN (en gin_trgm_ops)`,
		`CREATE INDEX IF NOT EXISTS idx_fts_translation_idn_en ON translation USING GIN (to_tsvector('simple', coalesce(idn,'') || ' ' || coalesce(en,'')))`,
		`CREATE INDEX IF NOT EXISTS idx_trgm_islamic_term    ON islamic_term USING GIN (term gin_trgm_ops)`,
		`CREATE INDEX IF NOT EXISTS idx_trgm_islamic_def     ON islamic_term USING GIN (definition gin_trgm_ops)`,
		`CREATE INDEX IF NOT EXISTS idx_trgm_doa_title       ON doa USING GIN (title gin_trgm_ops)`,
		`CREATE INDEX IF NOT EXISTS idx_trgm_doa_arabic      ON doa USING GIN (arabic gin_trgm_ops)`,
		`CREATE INDEX IF NOT EXISTS idx_trgm_kajian_title    ON kajian USING GIN (title gin_trgm_ops)`,
		`CREATE INDEX IF NOT EXISTS idx_trgm_kajian_speaker  ON kajian USING GIN (speaker gin_trgm_ops)`,
		`CREATE INDEX IF NOT EXISTS idx_trgm_perawi_latin    ON perawi USING GIN (nama_latin gin_trgm_ops)`,
		`CREATE INDEX IF NOT EXISTS idx_trgm_perawi_arab     ON perawi USING GIN (nama_arab gin_trgm_ops)`,
	}
	for _, sql := range indexes {
		s.db.Exec(sql)
	}
}

// Seeder is insert data to table
func (s *Repositories) Seeder() error {
	var count int64
	s.db.Model(&model.Surah{}).Count(&count)
	if count == 0 {
		migrations.DeduplicateSeedData(s.db)
		seeds := migrations.DataSeeds(s.db)
		for i := range seeds {
			tx := s.db.Begin()
			defer func() {
				if r := recover(); r != nil {
					tx.Rollback()
				}
			}()

			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(seeds[i]).Error; nil != err {
				tx.Rollback()
			}

			if err := tx.Commit().Error; nil != err {
				tx.Rollback()
			}
		}
	} else {
		slog.Info("base Quran seed already exists, continuing idempotent seeders")
	}
	if err := migrations.UpsertSeedData(s.db); err != nil {
		return err
	}
	migrations.SeedRelated(s.db)
	migrations.SeedLibraryBooks(s.db)
	migrations.SeedTier3(s.db)
	if err := migrations.BackfillTranslations(s.db); err != nil {
		return err
	}
	// File-based seeds: baca dari data/ jika belum ada di DB
	migrations.SeedQuranFromFile(s.db)
	migrations.SeedTafsirFromFiles(s.db)
	migrations.SeedMufrodatFromFile(s.db)
	migrations.SeedHadithFromFiles(s.db)
	if err := migrations.BackfillHadithSectionTranslations(s.db); err != nil {
		return err
	}
	migrations.SeedStaticFromFiles(s.db)
	migrations.SeedAudioFromCDN(s.db)
	migrations.SeedLocationsFromFile(s.db)
	migrations.SeedLessons(s.db)
	if err := migrations.BackfillTranslations(s.db); err != nil {
		return err
	}
	// IlmuRijal: PerawiGuru, Sanad, MataSanad, Takhrij — depends on Perawi + Hadith being seeded first
	migrations.SeedIlmuRijal(s.db)
	// Hadith grade: set derajat keshahihan — depends on Hadith being seeded
	migrations.SeedHadithGrade(s.db)
	return nil
}

func (s *Repositories) AddForeignKey() error {
	var err error
	return err
}
