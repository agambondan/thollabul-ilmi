import {
  defaultMobileLanguage,
  mobileTranslationKeys,
  normalizeMobileLanguage,
  translateMobile,
} from '../i18n/translations';

describe('mobile i18n translations', () => {
  test('normalizes API, web, and local language codes', () => {
    expect(normalizeMobileLanguage(undefined)).toBe(defaultMobileLanguage);
    expect(normalizeMobileLanguage('id')).toBe('idn');
    expect(normalizeMobileLanguage('ID')).toBe('idn');
    expect(normalizeMobileLanguage('idn')).toBe('idn');
    expect(normalizeMobileLanguage('EN')).toBe('en');
    expect(normalizeMobileLanguage('en')).toBe('en');
  });

  test('translates shell labels and falls back to Indonesian before key', () => {
    expect(translateMobile('en', 'nav.search')).toBe('Search');
    expect(translateMobile('idn', 'nav.search')).toBe('Cari');
    expect(translateMobile('en', 'missing.key')).toBe('missing.key');
  });

  test('keeps a non-empty Indonesian dictionary for shell migration', () => {
    expect(mobileTranslationKeys.length).toBeGreaterThan(80);
  });
});
