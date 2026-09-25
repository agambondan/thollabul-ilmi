import { QURAN_FONT_FAMILIES } from "../constants/quranFonts";

const base = {
    fontFamily: QURAN_FONT_FAMILIES.kitab,
    fontWeight: "400",
    includeFontPadding: true,
    letterSpacing: 0,
    textAlign: "right",
    writingDirection: "rtl",
};

export const arabicTypography = {
    base,
    small: {
        ...base,
        fontSize: 18,
        lineHeight: 34,
    },
    compact: {
        ...base,
        fontSize: 21,
        lineHeight: 40,
    },
    body: {
        ...base,
        fontSize: 24,
        lineHeight: 46,
    },
    large: {
        ...base,
        fontSize: 29,
        lineHeight: 56,
    },
    centered: {
        ...base,
        fontSize: 26,
        lineHeight: 50,
        textAlign: "center",
    },
    hero: {
        ...base,
        fontSize: 38,
        lineHeight: 72,
        textAlign: "center",
    },
    input: {
        ...base,
        fontSize: 22,
        lineHeight: 42,
        minHeight: 96,
        textAlignVertical: "top",
    },
};
