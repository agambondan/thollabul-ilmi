const createMockApiObject = () => {
    return new Proxy(
        {},
        {
            get(target, prop) {
                if (
                    prop === "then" ||
                    prop === "$$typeof" ||
                    typeof prop === "symbol"
                ) {
                    return undefined;
                }
                if (!(prop in target)) {
                    target[prop] = jest
                        .fn()
                        .mockResolvedValue({ data: [], meta: {} });
                }
                return target[prop];
            },
        }
    );
};

export const authFetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ data: [] }),
});

export const checkWhatsappAvailability = jest.fn().mockResolvedValue(false);
export const getBooks = jest.fn().mockResolvedValue([]);
export const bookLabel = (book) =>
    book?.name || book?.slug || "Unknown Kitab";
export const bookImageSrc = (slug) => `/assets/images/kitab/hadith/${slug}.png`;
export const bookHref = (slug) => `/hadith/${slug}`;
export const uploadWithProgress = jest.fn().mockResolvedValue({});
export const parseApiError = jest
    .fn()
    .mockImplementation(async (_res, fallback = "Gagal memproses data") => fallback);

export const userApi = createMockApiObject();
export const adminUserApi = createMockApiObject();
export const whatsappApi = createMockApiObject();
export const analyticsApi = createMockApiObject();
export const adminAnalyticsApi = createMockApiObject();
export const bookmarkApi = createMockApiObject();
export const progressApi = createMockApiObject();
export const hafalanApi = createMockApiObject();
export const streakApi = createMockApiObject();
export const searchApi = createMockApiObject();
export const semanticSearchApi = createMockApiObject();
export const doaApi = createMockApiObject();
export const asmaulHusnaApi = createMockApiObject();
export const tafsirApi = createMockApiObject();
export const munasabahApi = createMockApiObject();
export const hadithAyahApi = createMockApiObject();
export const tokohTarikhApi = createMockApiObject();
export const mufrodatApi = createMockApiObject();
export const audioApi = createMockApiObject();
export const sirohApi = createMockApiObject();
export const blogApi = createMockApiObject();
export const libraryApi = createMockApiObject();
export const libraryProgressApi = createMockApiObject();
export const adminBlogApi = createMockApiObject();
export const adminSirohApi = createMockApiObject();
export const statsApi = createMockApiObject();
export const tilawahApi = createMockApiObject();
export const amalanApi = createMockApiObject();
export const hijriApi = createMockApiObject();
export const asbabunNuzulApi = createMockApiObject();
export const dzikirApi = createMockApiObject();
export const leaderboardApi = createMockApiObject();
export const shareApi = createMockApiObject();
export const developerApi = createMockApiObject();
export const adzanSoundApi = createMockApiObject();
export const notificationApi = createMockApiObject();
export const notesApi = createMockApiObject();
export const kamusApi = createMockApiObject();
export const manasikApi = createMockApiObject();
export const quizApi = createMockApiObject();
export const prayerApi = createMockApiObject();
export const sholatTrackerApi = createMockApiObject();
export const muhasabahApi = createMockApiObject();
export const goalsApi = createMockApiObject();
export const lessonsApi = createMockApiObject();
export const kajianApi = createMockApiObject();
export const wiridApi = createMockApiObject();
export const fiqhApi = createMockApiObject();
export const historyApi = createMockApiObject();
export const imsakiyahApi = createMockApiObject();
export const adminDoaApi = createMockApiObject();
export const adminReminderApi = createMockApiObject();
export const adminDzikirApi = createMockApiObject();
export const adminAsmaulHusnaApi = createMockApiObject();
export const adminKajianApi = createMockApiObject();
export const adminLibraryApi = createMockApiObject();
export const adminAmalanApi = createMockApiObject();
export const adminPanduanSholatApi = createMockApiObject();
export const adminAchievementApi = createMockApiObject();
export const adminPerawiApi = createMockApiObject();
export const adminJarhTadilApi = createMockApiObject();
export const adminSanadApi = createMockApiObject();
export const adminTakhrijApi = createMockApiObject();
export const adminHadithAyahApi = createMockApiObject();
export const adminTokohTarikhApi = createMockApiObject();
export const adminLocationApi = createMockApiObject();
export const adminMasjidApi = createMockApiObject();
export const adminRadioIslamicApi = createMockApiObject();
export const adminAdsApi = createMockApiObject();
export const adminKamusApi = createMockApiObject();
export const adminQuizApi = createMockApiObject();
export const adminSejarahApi = createMockApiObject();
export const adminAsbabunNuzulApi = createMockApiObject();
export const adminWiridApi = createMockApiObject();
export const adminManasikApi = createMockApiObject();
export const adminFiqhApi = createMockApiObject();
export const booksApi = createMockApiObject();
export const hadithApi = createMockApiObject();
export const remindersApi = createMockApiObject();
export const achievementApi = createMockApiObject();
export const quranApi = createMockApiObject();
export const kalkulasiZakatApi = createMockApiObject();
export const faraidhSimpanApi = createMockApiObject();
export const forumApi = createMockApiObject();
export const contentReportApi = createMockApiObject();
export const contentAuditLogApi = createMockApiObject();
export const feedApi = createMockApiObject();
export const commentApi = createMockApiObject();
export const notificationInboxApi = createMockApiObject();
export const dzikirLogApi = createMockApiObject();
export const userWirdApi = createMockApiObject();
export const kajianBookmarkApi = createMockApiObject();
export const kajianNoteApi = createMockApiObject();
export const masjidApi = createMockApiObject();
export const radioIslamicApi = createMockApiObject();
export const adsApi = createMockApiObject();
