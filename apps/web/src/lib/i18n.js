/**
 * Aggregate dictionary. Kept for tooling and tests that check ID/EN parity.
 *
 * Application code must NOT import this: it pulls both languages into the
 * bundle, which is exactly what the split into `i18n/id.js` and `i18n/en.js`
 * was meant to avoid. Use `useLocale().t` instead.
 */
import en from "./i18n/en";
import id from "./i18n/id";

export const translations = { ID: id, EN: en };
