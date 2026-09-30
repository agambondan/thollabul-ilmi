const SEARCH_FIELDS = ["name", "district", "city", "address"];
const SEPARATORS = /[\s'’`"().,;:!?\-_/\\]+/g;

const normalizeText = (value) =>
    String(value ?? "")
        .toLowerCase()
        .replace(SEPARATORS, " ")
        .trim();

const searchableText = (masjid) =>
    normalizeText(SEARCH_FIELDS.map((field) => masjid?.[field]).join(" "));

export const filterMasjids = (items, query) => {
    const tokens = normalizeText(query).split(" ").filter(Boolean);
    if (!tokens.length) return items;
    return items.filter((masjid) => {
        const haystack = searchableText(masjid);
        return tokens.every((token) => haystack.includes(token));
    });
};

export const withTimeout = (promise, ms) =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timeout")), ms);
        Promise.resolve(promise).then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                reject(error);
            },
        );
    });
