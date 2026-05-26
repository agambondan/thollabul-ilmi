import { useCallback, useEffect, useState } from 'react';
import { preferenceKeys, readPreference, writePreference } from '../storage/preferences';

const MIN_ARABIC_FONT_SIZE = 14;
const MAX_ARABIC_FONT_SIZE = 48;

const VALID_ARABIC_FONTS = new Set(['kitab', 'indopak', 'naskh']);
const VALID_DISPLAY_MODES = new Set(['line', 'card', 'focus', 'mushaf']);
const VALID_MEMORIZATION_MODES = new Set(['off', 'hide_arabic', 'hide_translation', 'hide_all']);

const LEGACY_ARABIC_FONT_MAP = {
  amiri: 'naskh',
  default: 'kitab',
  mono: 'naskh',
  sans: 'indopak',
  serif: 'kitab',
  system: 'kitab',
  uthmani: 'kitab',
};

const normalizeArabicFontKey = (key) => LEGACY_ARABIC_FONT_MAP[key] ?? key;
const normalizeDisplayMode = (key) => (key === 'normal' ? 'card' : key);
const clampFontSize = (nextSize) =>
  Math.max(MIN_ARABIC_FONT_SIZE, Math.min(MAX_ARABIC_FONT_SIZE, Number(nextSize) || 28));

export function useQuranReaderPreferences({ onMemorizationModeChange } = {}) {
  const [fontSize, setFontSize] = useState(28);
  const [arabicFont, setArabicFont] = useState('kitab');
  const [displayMode, setDisplayMode] = useState('card');
  const [memorizationMode, setMemorizationMode] = useState('off');

  const updateFontSize = useCallback(async (nextSize) => {
    const normalized = clampFontSize(nextSize);
    setFontSize(normalized);
    await writePreference(preferenceKeys.quranFontSize, normalized);
  }, []);

  const updateArabicFont = useCallback(async (key) => {
    const normalized = normalizeArabicFontKey(key);
    if (!VALID_ARABIC_FONTS.has(normalized)) return;
    setArabicFont(normalized);
    await writePreference(preferenceKeys.quranArabicFont, normalized);
  }, []);

  const updateDisplayMode = useCallback(async (key) => {
    const normalized = normalizeDisplayMode(key);
    if (!VALID_DISPLAY_MODES.has(normalized)) return;
    setDisplayMode(normalized);
    await writePreference(preferenceKeys.quranDisplayMode, normalized);
  }, []);

  const updateMemorizationMode = useCallback(
    async (mode) => {
      if (!VALID_MEMORIZATION_MODES.has(mode)) return;
      setMemorizationMode(mode);
      onMemorizationModeChange?.(mode);
      await writePreference(preferenceKeys.quranMemorizationMode, mode);
    },
    [onMemorizationModeChange],
  );

  useEffect(() => {
    let mounted = true;

    readPreference(preferenceKeys.quranFontSize, 28).then((value) => {
      if (mounted && typeof value === 'number') setFontSize(clampFontSize(value));
    });

    readPreference(preferenceKeys.quranMemorizationMode, 'off').then((value) => {
      if (mounted && VALID_MEMORIZATION_MODES.has(value)) setMemorizationMode(value);
    });

    readPreference(preferenceKeys.quranArabicFont, 'kitab').then((value) => {
      const normalized = normalizeArabicFontKey(value);
      if (mounted && VALID_ARABIC_FONTS.has(normalized)) {
        setArabicFont(normalized);
        if (normalized !== value) writePreference(preferenceKeys.quranArabicFont, normalized).catch(e => console.error(e));
      }
    });

    readPreference(preferenceKeys.quranDisplayMode, 'card').then((value) => {
      const normalized = normalizeDisplayMode(value);
      if (mounted && VALID_DISPLAY_MODES.has(normalized)) {
        setDisplayMode(normalized);
        if (normalized !== value) writePreference(preferenceKeys.quranDisplayMode, normalized).catch(e => console.error(e));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    arabicFont,
    displayMode,
    fontSize,
    memorizationMode,
    updateArabicFont,
    updateDisplayMode,
    updateFontSize,
    updateMemorizationMode,
  };
}
