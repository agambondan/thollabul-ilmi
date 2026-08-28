const pickText = (...values) =>
    values.find((value) => typeof value === "string" && value.trim())?.trim() ??
    "";

export const getTafsirAyahNumber = (entry = {}) =>
    entry.ayah?.number ?? entry.ayah_number ?? entry.number ?? null;

export const getTafsirArabic = (entry = {}) =>
    pickText(
        entry.ayah?.translation?.ar,
        entry.ayah?.translation?.arab,
        entry.ayah?.arabic,
        entry.arabic,
        entry.arab,
    );

export const getTafsirTranslation = (entry = {}, lang = "ID") => {
    const ayahTranslation = entry.ayah?.translation ?? {};
    if (lang === "EN") {
        return pickText(
            ayahTranslation.en,
            entry.translation?.en,
            ayahTranslation.idn,
            entry.translation?.idn,
        );
    }
    return pickText(
        ayahTranslation.idn,
        entry.translation?.idn,
        ayahTranslation.en,
        entry.translation?.en,
    );
};

export const getTafsirPrimary = (entry = {}) =>
    pickText(
        entry.kemenag?.description_idn,
        entry.kemenag?.description_en,
        entry.kemenag?.text_idn,
        entry.kemenag?.text_en,
        entry.content,
        entry.text,
        entry.description,
    );

export const getTafsirSecondary = (entry = {}) =>
    pickText(
        entry.ibnu_katsir?.description_idn,
        entry.ibnu_katsir?.description_en,
        entry.ibnu_katsir?.text_idn,
        entry.ibnu_katsir?.text_en,
    );

export const normalizeTafsirEntry = (entry = {}, index = 0) => ({
    ...entry,
    ayahNumber: getTafsirAyahNumber(entry) ?? index + 1,
    arabic: getTafsirArabic(entry),
    primaryTafsir: getTafsirPrimary(entry),
    secondaryTafsir: getTafsirSecondary(entry),
});
