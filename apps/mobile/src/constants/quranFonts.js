export const QURAN_FONT_FAMILIES = {
    indopak: "QuranNooreHidayah",
    kitab: "QuranKitab",
    naskh: "QuranNaskh",
};

export const quranFontAssets = {
    [QURAN_FONT_FAMILIES.kitab]: require("../../assets/fonts/Kitab-Regular.ttf"),
    [QURAN_FONT_FAMILIES.indopak]: require("../../assets/fonts/noorehidayat.ttf"),
    [QURAN_FONT_FAMILIES.naskh]: require("../../assets/fonts/kfc_naskh-webfont.ttf"),
};
