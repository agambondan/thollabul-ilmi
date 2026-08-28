const tabAliases = {
    alquran: "quran",
    hadits: "hadith",
    hadis: "hadith",
    kiblat: "ibadah",
    qibla: "ibadah",
    quran: "quran",
    // old keys → new canonical tab keys
    prayer: "ibadah",
    sholat: "ibadah",
    ibadah: "ibadah",
    explore: "belajar",
    ilmu: "belajar",
    belajar: "belajar",
    search: "home",
    "global-search": "home",
};

const knownTabs = ["home", "quran", "hadith", "ibadah", "belajar", "profile"];

const normalizeSegments = (url) => {
    try {
        const parsed = new URL(url);
        const hashPath = parsed.hash?.startsWith("#/")
            ? parsed.hash.slice(1)
            : "";
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return [...(hashPath || parsed.pathname).split("/")].filter(
                Boolean,
            );
        }

        const segments = [
            parsed.hostname,
            ...(hashPath || parsed.pathname).split("/"),
        ].filter(Boolean);
        const expoPathIndex = segments.indexOf("--");
        if (expoPathIndex >= 0) {
            return segments.slice(expoPathIndex + 1);
        }

        const [first, ...rest] = segments;
        if (
            first &&
            !knownTabs.includes(tabAliases[first] ?? first) &&
            /[.:]/.test(first)
        ) {
            return rest;
        }

        return segments;
    } catch {
        return `${url ?? ""}`
            .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
            .split(/[/?#]/)
            .filter(Boolean);
    }
};

const numberOrNull = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const parseDeepLink = (url) => {
    const segments = normalizeSegments(url).map((item) =>
        decodeURIComponent(item).toLowerCase(),
    );
    const [rawTab, second, third, fourth] = segments;
    const tab = tabAliases[rawTab] ?? rawTab;

    if (!knownTabs.includes(tab)) return null;

    if (tab === "home") {
        if (rawTab === "search" || rawTab === "global-search") {
            return {
                params: {
                    filter: third ?? "all",
                    query: second ?? "",
                    view: "global-search",
                },
                tab,
            };
        }

        return {
            params:
                second === "search" || second === "global-search"
                    ? {
                          filter: fourth ?? "all",
                          query: third ?? "",
                          view: "global-search",
                      }
                    : {},
            tab,
        };
    }

    if (tab === "quran") {
        if (second === "page") {
            return {
                params: third ? { pageNumber: numberOrNull(third) } : {},
                tab,
            };
        }

        if (second === "hizb") {
            return {
                params: third ? { hizbNumber: numberOrNull(third) } : {},
                tab,
            };
        }

        const rawSurah = second === "surah" ? third : second;
        const rawAyah = second === "surah" ? fourth : third;
        return {
            params: rawSurah
                ? {
                      ayahNumber: rawAyah ? numberOrNull(rawAyah) : null,
                      surahNumber: numberOrNull(rawSurah),
                      surahSlug: rawSurah,
                  }
                : {},
            tab,
        };
    }

    if (tab === "hadith") {
        const rawHadith = second === "hadith" ? third : second;
        return {
            params: rawHadith ? { hadithId: rawHadith } : {},
            tab,
        };
    }

    if (tab === "belajar") {
        return {
            params: second ? { featureKey: second } : {},
            tab,
        };
    }

    if (tab === "ibadah") {
        if (
            rawTab === "prayer" ||
            rawTab === "sholat" ||
            second === "prayer" ||
            second === "jadwal-sholat"
        ) {
            return {
                params: {
                    view:
                        second === "settings" || third === "settings"
                            ? "settings"
                            : "prayer",
                },
                tab,
            };
        }

        if (
            rawTab === "qibla" ||
            rawTab === "kiblat" ||
            second === "qibla" ||
            second === "kiblat"
        ) {
            return {
                params: { view: "qibla" },
                tab,
            };
        }

        return {
            params: second === "settings" ? { view: "settings" } : {},
            tab,
        };
    }

    if (tab === "profile") {
        const profileViews = {
            account: "settings-account",
            appearance: "settings-appearance",
            notifications: "settings-notifications",
            settings: "settings",
            storage: "settings-storage",
        };

        return {
            params: profileViews[second] ? { view: profileViews[second] } : {},
            tab,
        };
    }

    return { params: {}, tab };
};
