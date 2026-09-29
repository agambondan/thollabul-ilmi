import AsyncStorage from "@react-native-async-storage/async-storage";

const cache = new Map();

const DEFAULT_TTL_MS = 5 * 60 * 1000;

function getCacheKey(key, auth = false) {
    return auth ? `auth:${key}` : `public:${key}`;
}

export function fetchCached(key, fetcher, options = {}) {
    const { ttl = DEFAULT_TTL_MS, auth = false, persist = true } = options;
    const cacheKey = getCacheKey(key, auth);
    const hit = cache.get(cacheKey);

    if (hit && hit.expires > Date.now()) {
        return Promise.resolve(hit.data);
    }

    return Promise.resolve(fetcher())
        .then(async (data) => {
            cache.set(cacheKey, { data, expires: Date.now() + ttl });
            if (persist && !auth) {
                try {
                    await AsyncStorage.setItem(
                        `tholabul:apicache:${cacheKey}`,
                        JSON.stringify({ data, savedAt: Date.now() }),
                    );
                } catch {}
            }
            return data;
        })
        .catch(async (err) => {
            if (hit && hit.data) {
                return hit.data;
            }
            if (persist && !auth) {
                try {
                    const raw = await AsyncStorage.getItem(
                        `tholabul:apicache:${cacheKey}`,
                    );
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed?.data) return parsed.data;
                    }
                } catch {}
            }
            throw err;
        });
}

export function invalidateCache(key, auth = false) {
    const cacheKey = getCacheKey(key, auth);
    cache.delete(cacheKey);
    if (!auth) {
        AsyncStorage.removeItem(`tholabul:apicache:${cacheKey}`).catch(() => {});
    }
}

export function clearCache() {
    cache.clear();
}

export const cacheKeys = {
    surahs: () => "surahs:all",
    ayahsBySurah: (surahNumber, page) => `ayahs:surah:${surahNumber}:page:${page}`,
    ayahsByPage: (page) => `ayahs:page:${page}`,
    hadithBooks: () => "hadith:books:all",
    hadithsByBook: (bookSlug, page) => `hadiths:book:${bookSlug}:page:${page}`,
    asmaulHusna: () => "asmaul:all",
    doaList: () => "doa:all",
    libraryBooks: () => "library:books:all",
    blogPosts: () => "blog:posts:all",
    exploreFeature: (featureKey, page = 0) => `explore:${featureKey}:page:${page}`,
};
