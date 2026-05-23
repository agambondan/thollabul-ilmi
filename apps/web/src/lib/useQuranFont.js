'use client';

import { useEffect, useState } from 'react';

const FONT_KEY = 'quranFont';
const FONT_SIZE_KEY = 'quranArabicFontSize';
const DEFAULT_ARABIC_FONT_SIZE = 40;
const MIN_ARABIC_FONT_SIZE = 28;
const MAX_ARABIC_FONT_SIZE = 64;
const FONT_SIZE_STEP = 4;

export const QURAN_FONTS = [
    { id: 'kitab', label: 'Uthmani', cls: 'font-kitab' },
    { id: 'indopak', label: 'Indopak', cls: 'font-nh' },
    { id: 'naskh', label: 'Naskh', cls: 'font-scheherazade' },
];

const DEFAULT_FONT = QURAN_FONTS[0];

export const useQuranFont = () => {
    const [fontId, setFontId] = useState(DEFAULT_FONT.id);
    const [arabicFontSize, setArabicFontSizeState] = useState(DEFAULT_ARABIC_FONT_SIZE);

    useEffect(() => {
        const stored = localStorage.getItem(FONT_KEY);
        if (stored && QURAN_FONTS.find((f) => f.id === stored)) {
            setFontId(stored);
        }
        const storedSize = Number.parseInt(localStorage.getItem(FONT_SIZE_KEY) ?? '', 10);
        if (Number.isFinite(storedSize)) {
            setArabicFontSizeState(clampArabicFontSize(storedSize));
        }
        const handler = (e) => {
            if (e.key === FONT_KEY && QURAN_FONTS.find((f) => f.id === e.newValue)) {
                setFontId(e.newValue);
            }
            if (e.key === FONT_SIZE_KEY) {
                const nextSize = Number.parseInt(e.newValue ?? '', 10);
                if (Number.isFinite(nextSize)) {
                    setArabicFontSizeState(clampArabicFontSize(nextSize));
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
        localStorage.setItem(FONT_SIZE_KEY, `${nextSize}`);
        window.dispatchEvent(new StorageEvent('storage', { key: FONT_SIZE_KEY, newValue: `${nextSize}` }));
        setArabicFontSizeState(nextSize);
    };

    const increaseArabicFontSize = () => setArabicFontSize(arabicFontSize + FONT_SIZE_STEP);
    const decreaseArabicFontSize = () => setArabicFontSize(arabicFontSize - FONT_SIZE_STEP);
    const resetArabicFontSize = () => setArabicFontSize(DEFAULT_ARABIC_FONT_SIZE);

    const current = QURAN_FONTS.find((f) => f.id === fontId) ?? DEFAULT_FONT;
    return {
        arabicFontSize,
        decreaseArabicFontSize,
        fontId,
        fontCls: current.cls,
        increaseArabicFontSize,
        resetArabicFontSize,
        setArabicFontSize,
        setFont,
    };
};

const clampArabicFontSize = (value) => {
    const numeric = Number.parseInt(`${value ?? ''}`, 10);
    if (!Number.isFinite(numeric)) return DEFAULT_ARABIC_FONT_SIZE;
    return Math.max(MIN_ARABIC_FONT_SIZE, Math.min(MAX_ARABIC_FONT_SIZE, numeric));
};
