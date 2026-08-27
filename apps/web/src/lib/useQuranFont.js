'use client';

import { useEffect, useState } from 'react';

const FONT_KEY = 'quranFont';
const ARABIC_FONT_SIZE_KEY = 'quranArabicFontSize';
const TRANSLATION_FONT_SIZE_KEY = 'quranTranslationFontSize';
const DEFAULT_ARABIC_FONT_SIZE = 40;
const MIN_ARABIC_FONT_SIZE = 14;
const MAX_ARABIC_FONT_SIZE = 64;
const ARABIC_FONT_SIZE_STEP = 4;
const DEFAULT_TRANSLATION_FONT_SIZE = 16;
const MIN_TRANSLATION_FONT_SIZE = 12;
const MAX_TRANSLATION_FONT_SIZE = 28;
const TRANSLATION_FONT_SIZE_STEP = 2;

export const QURAN_FONTS = [
    { id: 'kitab', label: 'Uthmani (King Fahd)', cls: 'font-kitab' },
    { id: 'lpmq', label: 'Kemenag (LPMQ)', cls: 'font-lpmq' },
    { id: 'indopak', label: 'Indopak', cls: 'font-nh' },
    { id: 'naskh', label: 'Naskh', cls: 'font-scheherazade' },
];

const DEFAULT_FONT = QURAN_FONTS[1]; // LPMQ Kemenag jadi default untuk tampilan lokal Indo

export const useQuranFont = () => {
    const [fontId, setFontId] = useState(DEFAULT_FONT.id);
    const [arabicFontSize, setArabicFontSizeState] = useState(DEFAULT_ARABIC_FONT_SIZE);
    const [translationFontSize, setTranslationFontSizeState] = useState(DEFAULT_TRANSLATION_FONT_SIZE);

    useEffect(() => {
        const stored = localStorage.getItem(FONT_KEY);
        if (stored && QURAN_FONTS.find((f) => f.id === stored)) {
            setFontId(stored);
        }
        const storedArabicSize = Number.parseInt(localStorage.getItem(ARABIC_FONT_SIZE_KEY) ?? '', 10);
        if (Number.isFinite(storedArabicSize)) {
            setArabicFontSizeState(clampArabicFontSize(storedArabicSize));
        }
        const storedTranslationSize = Number.parseInt(localStorage.getItem(TRANSLATION_FONT_SIZE_KEY) ?? '', 10);
        if (Number.isFinite(storedTranslationSize)) {
            setTranslationFontSizeState(clampTranslationFontSize(storedTranslationSize));
        }
        const handler = (e) => {
            if (e.key === FONT_KEY && QURAN_FONTS.find((f) => f.id === e.newValue)) {
                setFontId(e.newValue);
            }
            if (e.key === ARABIC_FONT_SIZE_KEY) {
                const nextSize = Number.parseInt(e.newValue ?? '', 10);
                if (Number.isFinite(nextSize)) {
                    setArabicFontSizeState(clampArabicFontSize(nextSize));
                }
            }
            if (e.key === TRANSLATION_FONT_SIZE_KEY) {
                const nextSize = Number.parseInt(e.newValue ?? '', 10);
                if (Number.isFinite(nextSize)) {
                    setTranslationFontSizeState(clampTranslationFontSize(nextSize));
                }
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    const setFont = (id) => {
        localStorage.setItem(FONT_KEY, id);
        window.dispatchEvent(new StorageEvent('storage', { key: FONT_KEY, newValue: id }));
        setFontId(id);
    };

    const setArabicFontSize = (value) => {
        const nextSize = clampArabicFontSize(value);
        localStorage.setItem(ARABIC_FONT_SIZE_KEY, `${nextSize}`);
        window.dispatchEvent(new StorageEvent('storage', { key: ARABIC_FONT_SIZE_KEY, newValue: `${nextSize}` }));
        setArabicFontSizeState(nextSize);
    };

    const setTranslationFontSize = (value) => {
        const nextSize = clampTranslationFontSize(value);
        localStorage.setItem(TRANSLATION_FONT_SIZE_KEY, `${nextSize}`);
        window.dispatchEvent(new StorageEvent('storage', { key: TRANSLATION_FONT_SIZE_KEY, newValue: `${nextSize}` }));
        setTranslationFontSizeState(nextSize);
    };

    const increaseArabicFontSize = () => setArabicFontSize(arabicFontSize + ARABIC_FONT_SIZE_STEP);
    const decreaseArabicFontSize = () => setArabicFontSize(arabicFontSize - ARABIC_FONT_SIZE_STEP);
    const resetArabicFontSize = () => setArabicFontSize(DEFAULT_ARABIC_FONT_SIZE);
    const increaseTranslationFontSize = () => setTranslationFontSize(translationFontSize + TRANSLATION_FONT_SIZE_STEP);
    const decreaseTranslationFontSize = () => setTranslationFontSize(translationFontSize - TRANSLATION_FONT_SIZE_STEP);
    const resetTranslationFontSize = () => setTranslationFontSize(DEFAULT_TRANSLATION_FONT_SIZE);

    const current = QURAN_FONTS.find((f) => f.id === fontId) ?? DEFAULT_FONT;
    return {
        arabicFontSize,
        decreaseArabicFontSize,
        decreaseTranslationFontSize,
        fontId,
        fontCls: current.cls,
        increaseArabicFontSize,
        increaseTranslationFontSize,
        resetArabicFontSize,
        resetTranslationFontSize,
        setArabicFontSize,
        setFont,
        setTranslationFontSize,
        translationFontSize,
    };
};

const clampArabicFontSize = (value) => {
    const numeric = Number.parseInt(`${value ?? ''}`, 10);
    if (!Number.isFinite(numeric)) return DEFAULT_ARABIC_FONT_SIZE;
    return Math.max(MIN_ARABIC_FONT_SIZE, Math.min(MAX_ARABIC_FONT_SIZE, numeric));
};

const clampTranslationFontSize = (value) => {
    const numeric = Number.parseInt(`${value ?? ''}`, 10);
    if (!Number.isFinite(numeric)) return DEFAULT_TRANSLATION_FONT_SIZE;
    return Math.max(MIN_TRANSLATION_FONT_SIZE, Math.min(MAX_TRANSLATION_FONT_SIZE, numeric));
};
