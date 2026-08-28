const unsupportedOverview = {
    supported: false,
    includeQuran: false,
    quranSurahs: 0,
    quranAyahs: 0,
    hadiths: 0,
    hadithBooks: [],
    prayerDays: 0,
    savedAt: null,
    error: "Fitur offline tersedia di aplikasi mobile.",
};

export const getOfflineOverview = async () => unsupportedOverview;

export const buildOfflinePack = async () => {
    throw new Error(unsupportedOverview.error);
};

export const clearOfflinePack = async () => unsupportedOverview;

export const getPrayerOfflineOverview = async () => ({
    days: 0,
    error: unsupportedOverview.error,
    locationKey: null,
    savedAt: null,
    supported: false,
});

export const buildPrayerOfflinePack = async () => {
    throw new Error(unsupportedOverview.error);
};

export const clearPrayerOfflinePack = async () => getPrayerOfflineOverview();

export const getOfflinePrayerForDate = async () => null;

export const getOfflineItems = async () => [];

export const getOfflineHadithCountByBook = async () => 0;

export const getOfflineHadithCountsBySlug = async () => ({});
