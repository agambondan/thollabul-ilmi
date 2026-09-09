# Kajian Auto-Scraper (Cron)

Filesystem layout:

```
services/api/
├── cmd/scrape-kajian/main.go    # native Go scraper CLI (calls yt-dlp binary)
├── scripts/
│   ├── scrape_youtube_kajian.py # Python fallback (same flags, single-file legacy)
│   ├── scrape_kajian_cron.sh    # bash wrapper: Go scrape + rsync + migrate + restart
│   ├── scrape_kajian_cron.service# systemd oneshot template
│   └── scrape_kajian_cron.timer # systemd timer (weekly, Sun 02:00 UTC)
└── data/static/kajian/          # output: one <channel-slug>.json per channel,
                                  # plus a generated _index.json summary (not
                                  # read by the seeder — for operators only)
```

One file per channel instead of a single combined `kajian.json` — that file
grew past 48 MB as the catalog widened, too heavy to open in an editor. Use
`go run ./cmd/scrape-kajian -list-channels` to print every channel's slug
without scraping anything.

## Quick start (manual run)

```bash
# Direct Go run — full history for one channel:
cd services/api && go run ./cmd/scrape-kajian -channel "https://www.youtube.com/@khalidbasalamah" -speaker "Ust. Dr. Khalid Basalamah, Lc., M.A." -max 20

# All channels from list_ustad_sunnah.json, whole history (default -max 0):
cd services/api && go run ./cmd/scrape-kajian

# Or via wrapper (runs Go -> syncs -> migrates DB -> restarts API):
services/api/scripts/scrape_kajian_cron.sh
```

Environment variables (override per invocation):

| Variable | Default | Purpose |
| --- | --- | --- |
| `OUT_DIR` | `services/api/data/static/kajian` | Output directory, one JSON file per channel |
| `LOG_FILE` | `/var/log/thollabul-kajian-scrape.log` | Append log |
| `CHANNELS_FILE` | `list_ustad_sunnah.json` | Source ustadz/channel registry |
| `MAX_VIDEOS` | `0` | Videos per channel per run, `0` = whole channel history. A capped value (e.g. `500`) re-scans only the newest N videos every run and can never discover older ones once that window is fully cached — leave at `0` unless you have a specific reason to bound a single run's wall time. |
| `COOKIES` | _empty_ | `chrome` / `firefox` / path to cookies.txt |
| `VPS_SSH_HOST` | `sumopod` | SSH host alias for the VPS |
| `VPS_REMOTE_DIR` | `/works/me/thollabul-ilmi` | Remote compose root |
| `DOCKER_SERVICE` | `tholabul-ilmi-api` | Compose service name to migrate/restart |

The script:

1. Runs the Go scraper, writing/updating one `<slug>.json` per channel under
   `OUT_DIR` (already-scraped videos and skip-cached no-transcript videos are
   never re-fetched, so a re-run only spends time on genuinely new content).
2. `rsync`s the whole directory to the VPS bind-mount
   (`services/api/data/static/kajian/`, mirrored into `data/static/kajian/`).
3. Runs `docker compose run --rm --no-deps --entrypoint /app/main
   <service> -migrate` so the new/changed rows actually reach Postgres. A
   plain container restart does **not** do this — `main.go` only calls
   `Migrations()`/`Seeder()` when started with `-migrate`, and the container's
   normal boot command never passes that flag.
4. `docker compose restart <service>` so the running process picks up
   anything migration alone doesn't (cache warmup, etc.).

## Install on VPS (systemd)

```bash
# Copy units
sudo cp services/api/scripts/scrape_kajian_cron.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload

# Enable and start timer
sudo systemctl enable --now scrape_kajian_cron.timer

# Verify
systemctl list-timers scrape_kajian_cron.timer
journalctl -u scrape_kajian_cron.service -n 20

# Trigger manually for a one-off run
sudo systemctl start scrape_kajian_cron.service
```

The timer fires weekly on Sunday 02:00 UTC with a 15 minute randomized delay
to avoid hitting the YouTube rate-limit window at the same time as other tools.
A full-history, no-`-max` run across ~57 channels takes considerably longer
than the old 500-per-channel cap; the timer's `Type=oneshot` has no built-in
timeout, but if the run needs to be interrupted, killing it and re-running is
safe (see Idempotency below).

## Idempotency

- Per channel, a video already present with transcripts is skipped
  (`↷ ... Sudah ada - skip`); one that failed transcript extraction is
  deferred `-skip-retry-days` (default 14) via `kajian_scrape_state.json`
  before being retried.
- `seedKajianFromFile` matches existing `kajian` rows by `speaker + title` and
  updates in place, so re-running the seeder is safe.
- Re-scraping never deletes existing videos from a channel's file; it only
  appends new ones. If a network failure (e.g. an intercepting proxy) causes
  every fetch in a run to fail, every attempted video gets skip-cached with
  the same failure reason — inspect `kajian_scrape_state.json` for a burst of
  entries sharing one `retry_after` date after any run that looks suspicious,
  and delete those entries so they are retried on the next good run instead
  of waiting out the full interval.

## Safety guardrails

- The script never touches the database directly during the scrape step;
  only the per-channel JSON files are updated. The database is only touched
  by the explicit `-migrate` step afterward.
- If `rsync`, `-migrate`, or the API restart fails, the script exits non-zero
  so the systemd timer will log the failure.
