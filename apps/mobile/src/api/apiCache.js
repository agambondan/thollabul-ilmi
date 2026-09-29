const cache = new Map();

const DEFAULT_TTL_MS = 5 * 60 * 1000;

function getCacheKey(key, auth = false) {
    return auth ? `auth:${key}` : `public:${key}`;
}

export function fetchCached(key, fetcher, options = {}) {
    const { ttl = DEFAULT_TTL_MS, auth = false } = options;
    const cacheKey = getCacheKey(key, auth);
    const hit = cache.get(cacheKey);

    if (hit && hit.expires > Date.now()) {
        return Promise.resolve(hit.data);
    }

    return Promise.resolve(fetcher()).then((data) => {
        cache.set(cacheKey, { data, expires: Date.now() + ttl });
        return data;
    });
}

export function invalidateCache(key, auth = false) {
    const cacheKey = getCacheKey(key, auth);
    cache.delete(cacheKey);
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
};
