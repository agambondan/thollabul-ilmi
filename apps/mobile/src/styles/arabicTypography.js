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
        lineHeight: 32,
    },
    compact: {
        ...base,
        fontSize: 21,
        lineHeight: 38,
    },
    body: {
        ...base,
        fontSize: 24,
        lineHeight: 44,
    },
    large: {
        ...base,
        fontSize: 29,
        lineHeight: 54,
    },
    centered: {
        ...base,
        fontSize: 26,
        lineHeight: 42,
        textAlign: "center",
    },
    hero: {
        ...base,
        fontSize: 38,
        lineHeight: 66,
        textAlign: "center",
    },
    input: {
        ...base,
        fontSize: 22,
        lineHeight: 40,
        minHeight: 96,
        textAlignVertical: "top",
    },
};
