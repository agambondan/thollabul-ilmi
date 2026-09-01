"use client";

import { useCallback } from "react";

import { useSettings } from "@/lib/useSettings";

const DEFAULT_ARABIC_FONT_SIZE = 40;
const MIN_ARABIC_FONT_SIZE = 14;
const MAX_ARABIC_FONT_SIZE = 64;
const ARABIC_FONT_SIZE_STEP = 4;
const DEFAULT_TRANSLATION_FONT_SIZE = 16;
const MIN_TRANSLATION_FONT_SIZE = 12;
const MAX_TRANSLATION_FONT_SIZE = 28;
const TRANSLATION_FONT_SIZE_STEP = 2;

export const QURAN_FONTS = [
    { id: "kitab", label: "Uthmani (King Fahd)", cls: "font-kitab" },
    { id: "lpmq", label: "Kemenag (LPMQ)", cls: "font-lpmq" },
    { id: "indopak", label: "Indopak", cls: "font-nh" },
    { id: "naskh", label: "Naskh", cls: "font-scheherazade" },
];

const DEFAULT_FONT = QURAN_FONTS[1];

const clampArabicFontSize = (value) => {
    const numeric = Number.parseInt(`${value ?? ""}`, 10);
    if (!Number.isFinite(numeric)) return DEFAULT_ARABIC_FONT_SIZE;
    return Math.max(
        MIN_ARABIC_FONT_SIZE,
        Math.min(MAX_ARABIC_FONT_SIZE, numeric),
    );
};

const clampTranslationFontSize = (value) => {
    const numeric = Number.parseInt(`${value ?? ""}`, 10);
    if (!Number.isFinite(numeric)) return DEFAULT_TRANSLATION_FONT_SIZE;
    return Math.max(
        MIN_TRANSLATION_FONT_SIZE,
        Math.min(MAX_TRANSLATION_FONT_SIZE, numeric),
    );
};

/**
 * Reading preferences for the Quran and Hadith readers.
 *
 * Backed by `useSettings` so there is exactly one store: the floating gear
 * button and the Settings page now write the same values, and they sync to the
 * account. Previously this hook kept its own localStorage keys, which is why
 * the font and size controls on /dashboard/settings changed nothing.
 *
 * Reading through context also removes the per-ayah `storage` listener this
 * hook used to register — a surah like Al-Baqarah mounted hundreds of them.
 */
export const useQuranFont = () => {
    const { settings, updateSetting } = useSettings();

    const fontId = settings.quranFontId ?? DEFAULT_FONT.id;
    const arabicFontSize = clampArabicFontSize(settings.quranArabicSize);
    const translationFontSize = clampTranslationFontSize(
        settings.quranTranslationSize,
    );

    const setFont = useCallback(
        (id) => {
            if (!QURAN_FONTS.some((f) => f.id === id)) return;
            updateSetting("quranFontId", id);
        },
        [updateSetting],
    );

    const setArabicFontSize = useCallback(
        (value) => updateSetting("quranArabicSize", clampArabicFontSize(value)),
        [updateSetting],
    );

    const setTranslationFontSize = useCallback(
        (value) =>
            updateSetting(
                "quranTranslationSize",
                clampTranslationFontSize(value),
            ),
        [updateSetting],
    );

    const current = QURAN_FONTS.find((f) => f.id === fontId) ?? DEFAULT_FONT;

    return {
        arabicFontSize,
        decreaseArabicFontSize: () =>
            setArabicFontSize(arabicFontSize - ARABIC_FONT_SIZE_STEP),
        decreaseTranslationFontSize: () =>
            setTranslationFontSize(
                translationFontSize - TRANSLATION_FONT_SIZE_STEP,
            ),
        fontId: current.id,
        fontCls: current.cls,
        increaseArabicFontSize: () =>
            setArabicFontSize(arabicFontSize + ARABIC_FONT_SIZE_STEP),
        increaseTranslationFontSize: () =>
            setTranslationFontSize(
                translationFontSize + TRANSLATION_FONT_SIZE_STEP,
            ),
        resetArabicFontSize: () => setArabicFontSize(DEFAULT_ARABIC_FONT_SIZE),
        resetTranslationFontSize: () =>
            setTranslationFontSize(DEFAULT_TRANSLATION_FONT_SIZE),
        setArabicFontSize,
        setFont,
        setTranslationFontSize,
        translationFontSize,
    };
};
