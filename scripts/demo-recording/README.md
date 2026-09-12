# Demo video recording

Playwright scripts that drive the public site end-to-end (desktop + mobile
viewport) and record the session as a `.webm` video, used to produce
`docs/media/demo-desktop.mp4` and `docs/media/demo-mobile.mp4`.

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
ffmpeg -y -i output/desktop/*.webm -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium ../../docs/media/demo-desktop.mp4
ffmpeg -y -i output/mobile/*.webm  -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium ../../docs/media/demo-mobile.mp4
```

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
  keep any font-family switching *before* the size-shrink loop, not after,
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
- Both scripts are resilient to transient production flakiness (popups
  appearing at slightly different times, etc.) but not infinitely so — if a
  run fails partway through, it's almost always safe to just re-run it.
