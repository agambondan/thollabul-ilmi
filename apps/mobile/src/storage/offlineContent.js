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

export const getOfflineAudioOverview = async () => ({
    count: 0,
    totalBytes: 0,
    supported: false,
});

export const downloadSurahAudio = async () => {
    throw new Error("Download audio hanya didukung di aplikasi native.");
};

export const getOfflineAudioUri = async () => null;

export const saveOfflineAudioRecord = async () => {};

export const deleteOfflineAudio = async () => getOfflineAudioOverview();

export const cleanupExpiredOfflineAudio = async () => ({
    removedCount: 0,
    freedBytes: 0,
});

export const enforceOfflineAudioStorageLimit = async () => ({
    removedCount: 0,
    freedBytes: 0,
});
