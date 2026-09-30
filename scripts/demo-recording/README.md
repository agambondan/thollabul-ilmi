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
Al-Quran · Hadis · Ibadah · Belajar) through Expo's web export, and produces
`docs/media/demo-mobile-app.mp4`. It is separate from `record-mobile.js`, which
drives the _website_ at a phone-sized viewport.

There is no emulator or simulator on this Linux dev machine that can be relied
on, so the app is rendered by `react-native-web` and driven with Playwright. No
credentials are needed: the tour runs as a guest.

```bash
# terminal 1 - keep it running (restart after editing app code, see below)
cd apps/mobile && CI=1 npx expo start --web --port 19010

# terminal 2
node scripts/demo-recording/record-mobile-app.js
```

`DEMO_MOBILE_APP_URL` overrides the URL. The script writes
`output/mobile-app/demo-mobile-app.webm` plus `trim.txt` (seconds of blank
loading time to skip). Convert with:

```bash
cd scripts/demo-recording
ffmpeg -y -ss "$(cat output/mobile-app/trim.txt)" -i output/mobile-app/demo-mobile-app.webm -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium ../../docs/media/demo-mobile-app.mp4
```

### Gotchas specific to this script

- **Guest only: login cannot work on the web export.** The app keeps auth
  tokens in `expo-secure-store`, which does not exist on web, and
  `src/storage/session.js` deliberately refuses to fall back to plaintext
  ("SecureStore tidak tersedia..."). The API login itself succeeds, the app
  just cannot keep the session. Do not weaken that check to make a recording.
  Bookmarks, notes and progress are therefore not shown. The seeded admin's
  default password is also rotated on production (`docs/web/FINDINGS.md`, F2).
- **`CI=1` turns off Metro's file watcher**, so Expo keeps serving the old
  bundle after app code changes. Restart it (add `--clear` if old code still
  shows up).
- **Chromium runs with `--disable-web-security`** (recording only): the
  production API's CORS allow-list does not include `http://localhost:19010`.
  Native apps are not subject to CORS, so this is not an app bug.
- **Geolocation is granted to the browser context** (Jakarta coordinates) so
  Jadwal Sholat shows real prayer times and a countdown instead of the "enable
  location" state.
- **Hadis uses the search-first flow on purpose.** The "Hadith" pill has no
  `onPress` (it only reflects state), and "Buka Reader" intermittently leaves
  the previous list on screen under the new book's header. Typing in the search
  box is reliable, but it only filters the ~20 hadith already loaded, so the
  query (`Funerals`) has to match one of those.
- **Kajian: use the "Transkrip" sub-tab.** The "Kajian" list sub-tab also
  filters only loaded items, and the stat cards at the top (20 / 20 / 9) show
  that loaded count, not the real totals. The transcript result line shows the
  real numbers.
- **Ibadah is visited last.** Sub-screens opened from the hub (Jadwal Sholat
  and friends) can only be left with Android's hardware back; on web there is
  no way back to the hub without a reload.
- **Leave Belajar sub-features with the header back button before switching
  tabs**, otherwise the header keeps showing the previous feature's title.
- The script exits non-zero if the "Terjadi Kesalahan" error boundary shows
  up, so a crashed screen cannot end up in the video unnoticed.
