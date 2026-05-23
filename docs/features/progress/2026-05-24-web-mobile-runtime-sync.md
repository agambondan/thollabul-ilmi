# Web-Mobile Runtime Sync Follow-up

Date: 2026-05-24
Status: VERIFIED

## Scope

This note captures the web runtime changes that mobile must mirror when the
web-inspired mobile layout option is implemented. The intent is not to replace
the current native mobile app. The existing native layout remains the `classic`
baseline, while the dashboard-like mobile web layout becomes an optional
`web_app` mode.

## Decisions

| Area | Decision |
| --- | --- |
| Mobile layout modes | Keep `classic`; add `web_app` incrementally as a layout option. Layout switching must not remove features. |
| Quran ayah actions | Treat the three-dot ayah menu as an action sheet/menu, not a separate feature. It must include play audio, tafsir, mufrodat, ayat terkait, bookmark, catatan, share, copy link, copy image, and copy ayah. |
| Share journey | Share must continue past image generation/selection into an actual channel choice: system share sheet, WhatsApp, copy link, download/copy image, or equivalent native target. |
| Quran audio | Qari choices should come from playable ayah audio data. Surah audio consumers may use the first playable ayah source as fallback when full surah audio is unavailable. |
| Prayer location | Do not hardcode district labels such as Cileungsi. Ask location permission, store the resolved location, refresh stale GPS location, and use the same stored location across home/dashboard/prayer pages. |
| Notification permission | Permission should be requested early but respectfully. Web dismiss TTL is 24 hours; mobile should use an equivalent native prompt cooldown. |
| Date handling | Prayer schedule requests must use the local calendar date, not UTC slicing, to avoid date drift around midnight. |

## Web Verification Snapshot

- `node scripts/check-feature-parity.js` passed.
- `cd apps/web && npm test -- PrayerCountdownWidget.test.js date.test.js userLocation.test.js --runInBand` passed.
- `cd apps/web && npm run build` passed.
- Runtime Playwright verified first-visit GPS storage for Kecamatan Cakung,
  dashboard schedule requests using Cakung coordinates only, stale location
  prompt recovery, prompt dismiss TTL, and legacy dismiss expiry.

## Mobile Follow-up Contract

When implementing `web_app` layout mode on mobile:

1. Reuse existing mobile feature screens and data/API modules wherever possible.
2. Add presentation preferences without forking business behavior.
3. Keep guest access for public reader/prayer surfaces.
4. Gate personal server-backed actions with auth handoff or local-first storage.
5. Run `node scripts/check-feature-parity.js` plus targeted mobile Jest for
   Quran reader actions, prayer permission/location storage, and notification
   settings.
