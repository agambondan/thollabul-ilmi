/**
 * Aggregate dictionary. Kept for tooling and tests that check ID/EN parity.
 *
 * Application code must NOT import this: it pulls every language and the
 * admin-only strings into the bundle, which is exactly what splitting into
 * `i18n/id.js` / `i18n/en.js` / `i18n/id-admin.js` / `i18n/en-admin.js` was
 * meant to avoid. Use `useLocale().t` instead.
 */
import en from "./i18n/en";
import enAdmin from "./i18n/en-admin";
import id from "./i18n/id";
import idAdmin from "./i18n/id-admin";

export const translations = {
    ID: { ...id, ...idAdmin },
    EN: { ...en, ...enAdmin },
};
