export const searchHref = (basePath, q, type) =>
    `${basePath}?q=${encodeURIComponent(q)}&type=${type}`;

export const PUBLIC_ROUTES = {
    section: {
        ayah: (q) => searchHref("/search", q, "ayah"),
        hadith: (q) => searchHref("/search", q, "hadith"),
        dictionary: (q) => `/kamus?q=${encodeURIComponent(q)}`,
        doa: (q) => `/doa?q=${encodeURIComponent(q)}`,
        kajian: (q) => `/kajian?q=${encodeURIComponent(q)}`,
        perawi: (q) => `/perawi?q=${encodeURIComponent(q)}`,
    },
    ayah: ({ surahSlug, number }) => `/quran/surah/${surahSlug}#${number}`,
    hadith: ({ bookSlug, number }) => `/hadith/${bookSlug}#${number}`,
    doa: ({ id }) => `/doa#${id}`,
    dictionary: ({ term }) => `/kamus?q=${encodeURIComponent(term ?? "")}`,
    kajian: ({ id }) => `/kajian/${id}`,
    perawi: ({ id }) => `/perawi/${id}`,
};

export const DASHBOARD_ROUTES = {
    section: {
        ayah: (q) => searchHref("/dashboard/search", q, "ayah"),
        hadith: (q) => searchHref("/dashboard/search", q, "hadith"),
        dictionary: (q) => searchHref("/dashboard/search", q, "dictionary"),
        doa: (q) => searchHref("/dashboard/search", q, "doa"),
        kajian: (q) => searchHref("/dashboard/search", q, "kajian"),
        perawi: (q) => searchHref("/dashboard/search", q, "perawi"),
    },
    ayah: ({ surahSlug, number }) => `/dashboard/quran/${surahSlug}#${number}`,
    hadith: ({ bookSlug, number }) => `/dashboard/hadith/${bookSlug}#${number}`,
    doa: ({ id }) => `/dashboard/doa#${id}`,
    dictionary: ({ term }) =>
        `/dashboard/kamus?q=${encodeURIComponent(term ?? "")}`,
    kajian: ({ id }) => `/dashboard/kajian#${id}`,
    perawi: ({ id }) => `/dashboard/perawi/${id}`,
};

export const getRouteMap = (routeScope) =>
    routeScope === "dashboard" ? DASHBOARD_ROUTES : PUBLIC_ROUTES;
