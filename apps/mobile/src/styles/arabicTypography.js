import { QURAN_FONT_FAMILIES } from "../constants/quranFonts";

const base = {
    fontFamily: QURAN_FONT_FAMILIES.kitab,
    fontWeight: "400",
    includeFontPadding: true,
    letterSpacing: 0,
    textAlign: "right",
    writingDirection: "rtl",
    fontFeatureSettings: '"cv02" 1, "cv03" 1, "ss01" 1',
};

const lineHeightForSize = (size) => Math.round(size * 2.8);

export const arabicTypography = {
    base,
    small: {
        ...base,
        fontSize: 18,
        lineHeight: lineHeightForSize(18),
    },
    compact: {
        ...base,
        fontSize: 21,
        lineHeight: lineHeightForSize(21),
    },
    body: {
        ...base,
        fontSize: 24,
        lineHeight: lineHeightForSize(24),
    },
    large: {
        ...base,
        fontSize: 29,
        lineHeight: lineHeightForSize(29),
    },
    centered: {
        ...base,
        fontSize: 26,
        lineHeight: lineHeightForSize(26),
        textAlign: "center",
    },
    hero: {
        ...base,
        fontSize: 38,
        lineHeight: lineHeightForSize(38),
        textAlign: "center",
    },
    input: {
        ...base,
        fontSize: 22,
        lineHeight: lineHeightForSize(22),
        minHeight: 96,
        textAlignVertical: "top",
    },
    dynamic: (fontSize) => ({
        ...base,
        fontSize,
        lineHeight: lineHeightForSize(fontSize),
    }),
};