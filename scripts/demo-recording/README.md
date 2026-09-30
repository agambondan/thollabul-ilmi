# Demo video recording

Playwright scripts that drive the public site end-to-end (desktop + mobile
viewport) and record the session as a `.webm` video, used to produce
`docs/media/demo-desktop.mp4` and `docs/media/demo-mobile.mp4`. A third script
records the React Native app itself, see
[Native mobile app](#native-mobile-app-record-mobile-appjs) below.

## Prerequisites

- `apps/web/node_modules/playwright` must already be installed (it's a
  dependency of the web app, so a normal `npm install` in `apps/web/` is
  enough — these scripts import Playwright from there rather than keeping a
  second copy).
- The Chromium browser Playwright drives: `npx playwright install chromium`
  (run from `apps/web/`, or anywhere — the download is cached in
  `~/.cache/ms-playwright/` and shared across projects).
- `ffmpeg` on `PATH`, to convert the recorded `.webm` to `.mp4` afterwards.
- A real, already-verified test account on the target environment (email or
  phone + password) that's allowed to log in. **Do not commit real
  credentials** — pass them as environment variables at run time.

## Running

```bash
DEMO_LOGIN_IDENTIFIER=08xxxxxxxxxx \
DEMO_LOGIN_PASSWORD='xxxxxxxx' \
node scripts/demo-recording/record-desktop.js

DEMO_LOGIN_IDENTIFIER=08xxxxxxxxxx \
DEMO_LOGIN_PASSWORD='xxxxxxxx' \
node scripts/demo-recording/record-mobile.js
```

Optional: `DEMO_BASE_URL` (defaults to the production site,
`https://thollabulilmi.site`) if you want to record against a
different environment instead (e.g. a local `next dev` server).

Each script writes one `.webm` file under `scripts/demo-recording/output/
{desktop,mobile}/` (gitignored — matched by the repo's generic `output/`
rule). Convert and replace the committed videos:

```bash
cd scripts/demo-recording
ffmpeg -y -ss 0.8 -i output/desktop/*.webm -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium ../../docs/media/demo-desktop.mp4
ffmpeg -y -ss 0.8 -i output/mobile/*.webm  -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium ../../docs/media/demo-mobile.mp4
```

The `-ss 0.8` trims the first ~0.8s: Playwright's `recordVideo` starts
capturing the instant the page is created, which is a blank white frame
until the first `goto()` actually paints - without the trim, every
recording opens on a brief blank flash before the homepage appears.

`docs/media/*.mp4` is tracked via Git LFS (see the repo's `.gitattributes`),
so just `git add`/`git commit`/`git push` the two files normally — no special
LFS commands needed for a routine content update.

## Gotchas worth knowing before you touch the script

- **Font size settings persist to the logged-in account**, not just
  `localStorage` (see `apps/web/src/lib/useSettings.js` — it syncs to
  `/api/v1/settings` when authenticated). If the same test account has been
  used for a previous recording, the Arabic/translation font size will
  already be shrunk, and a "before vs. after" shrink demo will show no
  visible difference. Both scripts reset the size to default first (click
  the "`Xpx`" label itself — that's the reset button, see
  `apps/web/src/components/popup/SettingButton.js`) before doing the demo
  shrink, specifically to avoid this.
- **Font family changes visually affect apparent size.** Different Arabic
  typefaces (Naskh/Scheherazade vs. Kemenag/LPMQ) render at different
  visual proportions for the same pixel value. If you re-order the script,
  keep any font-family switching _before_ the size-shrink loop, not after,
  or the "after" shot will be back in a different (and possibly
  larger-looking) typeface than the "before" shot.
- **Bookmark/note button titles toggle.** `Simpan Bookmark` ⇄
  `Hapus Bookmark`, and `Tulis Catatan` ⇄ `Edit Catatan`, depending on
  whether this account already bookmarked/annotated that ayah from a
  previous run. Selectors match either title with a regex — don't narrow
  them back to a single literal string.
- **The bookmark button opens a small "Warna" (color) + "Label" popover.**
  It doesn't close on `Escape`, and clicking its own visible close (×)
  button is occasionally intercepted by the popover's own content while a
  preview re-renders. `closeBookmarkColorPopover()` tries the × button, then
  the popover's "Simpan" button, then a click on a neutral corner of the
  page, in that order.
- **The share ("Bagikan") and audio-player modals behave differently from
  each other.** The share modal's `Escape` key reliably closes it (its own
  "Tutup" button is prone to the same click-interception issue as the
  bookmark popover above). The audio player's `Escape` key does **not**
  close it — you have to click its "Tutup pemutar" button directly.
- **The Kajian hybrid/semantic search takes several seconds** (server-side
  embedding rerank over the full transcript corpus) — don't cut the wait
  short after typing a query or you'll screenshot/record a loading skeleton.
- **The share-image flow needs time to actually show its confirmation
  label, and its clipboard step needs permission granted up front.**
  Clicking a background thumbnail builds a canvas (loads the font +
  background image, then draws the ayah text) before it can share/copy it.
  Both scripts call `context.grantPermissions(['clipboard-read',
'clipboard-write'])` right after creating the browser context - without
  it, headless Chromium has no clipboard access and the flow falls through
  to its worst-case fallback, a red "Clipboard tidak didukung. Gambar
  diunduh." error, instead of the intended "Gambar tersalin ke clipboard!"
  success label. Even with the permission granted, don't assume which one
  you'll get - both scripts wait for text matching `/tersalin|diunduh|Gagal/i`
  (instead of a blind fixed pause) before closing the modal, so the
  recording shows whichever label actually renders rather than cutting away
  while the canvas is still being generated.
- **Kajian's transcript bookmark is per-sentence, not per-video, and lives
  in `localStorage`, not the account.** It can only be created from inside
  the video player (the ⚪ icon next to a transcript line, which turns into
  🔖 once bookmarked, title `Tambah bookmark`/`Hapus bookmark`) — the "🔖
  Bookmark" tab itself is read-only, it just lists what's already saved,
  grouped per video, with a jump-to-timestamp link. Since it's
  `localStorage`-scoped, it only shows up in the same browser/device that
  created it (irrelevant here since the whole recording runs in one
  browser context, but worth knowing if you ever check it manually).
- **Typed note text needs the field cleared first.** Both scripts type the
  ayah/kajian note text with `pressSequentially()` (so it visibly types out
  instead of snapping in all at once like `fill()` does) — but the ayah note
  in particular re-opens as an _edit_ once this account has annotated that
  ayah in a previous run, pre-filled with the old content, and
  `pressSequentially()` types at the current cursor position rather than
  replacing it. Both scripts call `fill('')` right before typing to clear
  whatever's already there; skipping that step silently appends run after
  run until the note is several copies of the same sentence concatenated
  together.
- Both scripts are resilient to transient production flakiness (popups
  appearing at slightly different times, etc.) but not infinitely so — if a
  run fails partway through, it's almost always safe to just re-run it.
  This machine also runs other heavy jobs concurrently (other agent
  sessions, `yt-dlp` scraping, Docker Desktop's VM) - if a run fails with
  timeouts at random, unrelated points (not the same step twice), check
  `uptime`/`free -h` before assuming it's a real site bug; a severely
  loaded local machine makes headless Chromium miss timing everywhere.

## Native mobile app (`record-mobile-app.js`)

Records the React Native app in `apps/mobile` (the 5-tab shell: Beranda ·
Al-Quran · Hadis · Ibadah · Belajar) through Expo's web export. It is separate
from `record-mobile.js`, which drives the _website_ at a phone-sized viewport.
There is no emulator or simulator on this Linux dev machine that can be relied
on, so the app is rendered by `react-native-web` and driven with Playwright.

Whether login credentials are set picks one of two recordings:

| Mode                  | Trigger                                         | Output in `output/mobile-app/` | Video in `docs/media/`        |
| --------------------- | ----------------------------------------------- | ------------------------------ | ----------------------------- |
| Public tour (default) | no credentials                                  | `demo-mobile-app.webm`         | `demo-mobile-app.mp4`         |
| Account clip          | `DEMO_LOGIN_IDENTIFIER` + `DEMO_LOGIN_PASSWORD` | `demo-mobile-app-account.webm` | `demo-mobile-app-account.mp4` |

The public tour walks through every tab as a guest. The account clip signs in,
bookmarks Al-Kahf 18:9, writes a note on it and opens Statistik.

```bash
# public tour (production data): Expo with the default API URL
cd apps/mobile && CI=1 npx expo start --web --port 19010
node scripts/demo-recording/record-mobile-app.js

# account clip: Expo against the local stack (`make docker-up`, API on :29900)
cd apps/mobile && EXPO_PUBLIC_API_URL=http://localhost:29900 CI=1 npx expo start --web --port 19010 --clear
DEMO_LOGIN_IDENTIFIER=admin@tholabul-ilmi.com DEMO_LOGIN_PASSWORD='<admin password>' \
  node scripts/demo-recording/record-mobile-app.js
```

The seeded admin's password is `ADMIN_PASSWORD` or the default in
`services/api/app/db/migrations/seeder_idempotency.go`. That account exists
only on the local API: production's was rotated (`docs/web/FINDINGS.md`, F2).
`DEMO_MOBILE_APP_URL` overrides the Expo URL. Each run writes the `.webm` plus a
`<name>.trim.txt` (seconds of loading time to skip). Convert with:

```bash
cd scripts/demo-recording/output/mobile-app
ffmpeg -y -ss "$(cat demo-mobile-app.trim.txt)" -i demo-mobile-app.webm -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium ../../../../docs/media/demo-mobile-app.mp4
ffmpeg -y -ss "$(cat demo-mobile-app-account.trim.txt)" -i demo-mobile-app-account.webm -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium ../../../../docs/media/demo-mobile-app-account.mp4
```

### Gotchas specific to this script

- **Login only works through a recording-time patch.** The app keeps auth
  tokens in `expo-secure-store`, which does not exist on web, and
  `src/storage/session.js` deliberately refuses to fall back to plaintext
  ("SecureStore tidak tersedia..."). In account mode the script swaps the empty
  `ExpoSecureStore.web` module inside the dev bundle served to the recording
  browser for a localStorage-backed one (`withWebSecureStore`). Nothing in the
  repo, the Metro config or any build changes. The script aborts if it cannot
  find that module (for example after an Expo SDK upgrade).
- **The account must exist on the API that Expo talks to.** Before recording,
  the script logs in once over HTTP (fails fast with the status code) and
  removes that account's bookmark and notes for Al-Kahf 18:9, then removes them
  again afterwards so runs are repeatable. It touches nothing else.
- **The local stack can lack data.** `services/api/.dockerignore` used to
  exclude `data/`, so the static-file seeders (asbabun nuzul, kajian list) did
  not run in the local image and both are empty there. The account clip avoids
  them; the public tour needs the production API or a rebuilt local image.
- **`CI=1` turns off Metro's file watcher**, so Expo keeps serving the old
  bundle after app code changes. Restart it (add `--clear` if old code still
  shows up).
- **Chromium runs with `--disable-web-security`** (recording only): the
  production API's CORS allow-list does not include `http://localhost:19010`.
  Native apps are not subject to CORS, so this is not an app bug.
- **Geolocation is granted to the browser context** (Jakarta coordinates) so
  Jadwal Sholat shows real prayer times and a countdown instead of the "enable
  location" state.
- **Hadis search is server-side since `c9f593f7`.** An API without that change
  (production until the next deploy) ignores the query and returns the
  unfiltered list, so the public tour's "niat" search only looks right against
  a current backend.
- **Kajian: use the "Transkrip" sub-tab.** The list sub-tab only filters the
  items already loaded (20 at a time); transcript search is the real search.
  The stat cards above them show the API totals.
- **Ibadah is visited last.** Sub-screens opened from the hub (Jadwal Sholat
  and friends) can only be left with Android's hardware back; on web there is
  no way back to the hub without a reload.
- **Leave Belajar sub-features with the header back button before switching
  tabs**, otherwise the header keeps showing the previous feature's title.
- The script exits non-zero if the "Terjadi Kesalahan" error boundary shows
  up, so a crashed screen cannot end up in the video unnoticed.
