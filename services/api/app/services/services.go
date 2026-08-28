package service

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/spf13/viper"
)

type Services struct {
	User                 UserService
	Ayah                 AyahService
	Surah                SurahService
	Juz                  JuzService
	Book                 BookService
	Theme                ThemeService
	Chapter              ChapterService
	Hadith               HadithService
	Bookmark             BookmarkService
	UserWird             UserWirdService
	ReadingProgress      ReadingProgressService
	Hafalan              HafalanService
	Streak               StreakService
	Search               SearchService
	Mufrodat             MufrodatService
	Notification         NotificationService
	NotificationInbox    NotificationInboxService
	Feed                 FeedService
	Tafsir               TafsirService
	Doa                  DoaService
	DailyReminder        DailyReminderService
	AsmaUlHusna          AsmaUlHusnaService
	Audio                AudioService
	Siroh                SirohService
	Blog                 BlogService
	LibraryBook          LibraryBookService
	LibraryBookProgress  LibraryBookProgressService
	Stats                StatsService
	Tilawah              TilawahService
	Amalan               AmalanService
	Dzikir               DzikirService
	DzikirLog            DzikirLogService
	Achievement          AchievementService
	Leaderboard          LeaderboardService
	Zakat                ZakatService
	KalkulasiZakat       KalkulasiZakatService
	SimpanFaraidh        SimpanFaraidhService
	HadithAyah           HadithAyahService
	Forum                ForumService
	Munasabah            MunasabahService
	PageView             PageViewService
	NotificationTemplate NotificationTemplateService
	TokohTarikh          TokohTarikhService
	Location             LocationService
	Sholat               SholatService
	Murojaah             MurojaahService
	Fiqh                 FiqhService
	Kajian               KajianService
	Muhasabah            MuhasabahService
	Goal                 GoalService
	Hijri                HijriService
	AsbabunNuzul         AsbabunNuzulService
	Kiblat               KiblatService
	PrayerTimes          PrayerTimesService
	History              HistoryService
	Manasik              ManasikService
	Quiz                 QuizService
	Note                 NoteService
	Dictionary           DictionaryService
	Comment              CommentService
	APIKey               APIKeyService
	Perawi               PerawiService
	JarhTadil            JarhTadilService
	Sanad                SanadService
	Takhrij              TakhrijService
	Sync                 SyncService
	Dashboard            DashboardService
}

func NewServices(repo *repository.Repositories) *Services {
	if repo == nil {
		return &Services{}
	}
	cacheTTL := viper.GetInt64("CACHE_TTL_SECONDS")
	db := repo.GetDB()
	sqlDB, _ := db.DB()
	client := repo.GetRedis()

	var cache *lib.CacheService
	if sqlDB != nil {
		cache = lib.NewCacheService(client, cacheTTL)
	}

	streak := NewStreakService(repo.UserActivity)
	doaSvc := NewDoaServiceWithCache(repo.Doa, cache)
	dailyReminderSvc := NewDailyReminderServiceWithCache(repo.DailyReminder, cache)
	dzikirSvc := NewDzikirServiceWithCache(repo.Dzikir, cache)
	asmaulHusnaSvc := NewAsmaUlHusnaServiceWithCache(repo.AsmaUlHusna, cache)
	svc := &Services{
		User:                 NewUserService(repo.User),
		Ayah:                 NewAyahServiceWithCache(repo.Ayah, cache),
		Surah:                NewSurahServiceWithCache(repo.Surah, cache),
		Juz:                  NewJuzServiceWithCache(repo.Juz, cache),
		Book:                 NewBookServiceWithCache(repo.Book, cache),
		Theme:                NewThemeServiceWithCache(repo.Theme, cache),
		Chapter:              NewChapterServiceWithCache(repo.Chapter, cache),
		Hadith:               NewHadithServiceWithCache(repo.Hadith, cache),
		Bookmark:             NewBookmarkService(repo.Bookmark, repo.Ayah, repo.Hadith, repo.LibraryBook),
		UserWird:             NewUserWirdService(repo.UserWird),
		ReadingProgress:      NewReadingProgressService(repo.ReadingProgress, repo.UserActivity),
		Hafalan:              NewHafalanService(repo.Hafalan),
		Streak:               streak,
		Search:               NewSearchService(repo.Search),
		Mufrodat:             NewMufrodatService(repo.Mufrodat),
		Notification:         NewNotificationService(repo.Notification, repo.NotificationInbox),
		NotificationInbox:    NewNotificationInboxService(repo.NotificationInbox),
		Feed:                 NewFeedService(repo.Feed, repo.SocialModeration, NewAyahService(repo.Ayah), NewHadithService(repo.Hadith)),
		Tafsir:               NewTafsirServiceWithCache(repo.Tafsir, cache),
		Doa:                  doaSvc,
		DailyReminder:        dailyReminderSvc,
		AsmaUlHusna:          asmaulHusnaSvc,
		Audio:                NewAudioService(repo.Audio),
		Siroh:                NewSirohServiceWithCache(repo.Siroh, cache),
		Blog:                 NewBlogService(repo.Blog),
		LibraryBook:          NewLibraryBookService(repo.LibraryBook),
		LibraryBookProgress:  NewLibraryBookProgressService(repo.LibraryBookProgress),
		Stats:                NewStatsServiceWithTilawah(repo.Bookmark, repo.Hafalan, repo.UserActivity, repo.Tilawah, streak),
		Tilawah:              NewTilawahService(repo.Tilawah),
		Amalan:               NewAmalanService(repo.Amalan),
		Dzikir:               dzikirSvc,
		DzikirLog:            NewDzikirLogService(repo.DzikirLog),
		Achievement:          NewAchievementService(repo.Achievement),
		Leaderboard:          NewLeaderboardService(repo.Leaderboard),
		Zakat:                NewZakatService(),
		KalkulasiZakat:       NewKalkulasiZakatService(repo.KalkulasiZakat),
		SimpanFaraidh:        NewSimpanFaraidhService(repo.SimpanFaraidh),
		HadithAyah:           NewHadithAyahService(repo.HadithAyah),
		Forum:                NewForumServiceWithCache(repo.Forum, cache),
		Munasabah:            NewMunasabahService(repo.Munasabah),
		PageView:             NewPageViewService(repo.PageView),
		NotificationTemplate: NewNotificationTemplateService(repo.NotificationTemplate),
		TokohTarikh:          NewTokohTarikhServiceWithCache(repo.TokohTarikh, cache),
		Location:             NewLocationServiceWithCache(repo.Location, cache),
		Sholat:               NewSholatService(repo.Sholat),
		Murojaah:             NewMurojaahService(repo.Murojaah, repo.Hafalan),
		Fiqh:                 NewFiqhServiceWithCache(repo.Fiqh, cache),
		Kajian:               NewKajianServiceWithCache(repo.Kajian, cache),
		Muhasabah:            NewMuhasabahService(repo.Muhasabah),
		Goal:                 NewGoalService(repo.Goal),
		Hijri:                NewHijriService(repo.IslamicEvent),
		AsbabunNuzul:         NewAsbabunNuzulServiceWithCache(repo.AsbabunNuzul, cache),
		Kiblat:               NewKiblatService(),
		PrayerTimes:          NewPrayerTimesService(),
		History:              NewHistoryServiceWithCache(repo.History, cache),
		Manasik:              NewManasikServiceWithCache(repo.Manasik, cache),
		Quiz:                 NewQuizService(repo.Quiz),
		Note:                 NewNoteService(repo.Note),
		Dictionary:           NewDictionaryServiceWithCache(repo.Dictionary, cache),
		Comment:              NewCommentService(repo.Comment, repo.SocialModeration),
		APIKey:               NewAPIKeyService(repo.APIKey),
		Perawi:               NewPerawiServiceWithCache(repo.Perawi, cache),
		JarhTadil:            NewJarhTadilServiceWithCache(repo.JarhTadil, cache),
		Sanad:                NewSanadService(repo.Sanad),
		Takhrij:              NewTakhrijService(repo.Takhrij),
		Sync:                 NewSyncService(db, cache, doaSvc, dzikirSvc, asmaulHusnaSvc),
	}
	svc.Dashboard = NewDashboardService(db, svc.Ayah, svc.Hadith, svc.Streak, svc.Sholat, svc.NotificationInbox, svc.Tilawah)
	return svc
}
