# Kajian Auto-Scraper (Cron)

Filesystem layout:

```
services/api/
├── cmd/scrape-kajian/main.go    # native Go scraper CLI (calls yt-dlp binary)
├── scripts/
│   ├── scrape_youtube_kajian.py # Python fallback (same flags)
│   ├── scrape_kajian_cron.sh    # bash wrapper: Go scrape + rsync + restart
│   ├── scrape_kajian_cron.service# systemd oneshot template
│   └── scrape_kajian_cron.timer # systemd timer (weekly, Sun 02:00 UTC)
└── data/static/kajian.json      # output live dataset
```

## Quick start (manual run)

```bash
# Direct Go run:
cd services/api && go run ./cmd/scrape-kajian -max 5

# Or via wrapper (runs Go -> syncs -> restarts API):
services/api/scripts/scrape_kajian_cron.sh
```

Environment variables (override per invocation):

| Variable | Default | Purpose |
| --- | --- | --- |
| `OUT_FILE` | `services/api/data/static/kajian.json` | Output JSON location |
| `LOG_FILE` | `/var/log/thollabul-kajian-scrape.log` | Append log |
| `CHANNELS_FILE` | `list_ustad_sunnah.json` | Source ustadz/channel registry |
| `MAX_VIDEOS` | `5` | Max new videos per channel per run (kept low to avoid YouTube throttling across 56 channels) |
| `COOKIES` | _empty_ | `chrome` / `firefox` / path to cookies.txt |
| `VPS_SSH_HOST` | `sumopod` | SSH host alias for the VPS |
| `VPS_REMOTE_DIR` | `/works/me/thollabul-ilmi` | Remote compose root |

The script:

1. Runs `scrape_youtube_kajian.py --max $MAX_VIDEOS`, merging into the existing JSON.
2. `rsync` the JSON to the VPS bind-mount (`services/api/data/static/kajian.json`).
3. `docker compose restart tholabul-ilmi-api` so the API reloads the dataset (one-shot migration is unnecessary — `seedKajianFromFile` uses `FirstOrCreate` so it is idempotent).

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

## Idempotency

- `scrape_youtube_kajian.py` merges new videos into the existing JSON keyed by `video_id`.
- `seedKajianFromFile` in the Go service uses `Where("speaker = ? AND title = ?").FirstOrCreate` so re-running the seeder is safe.
- Re-scraping never deletes existing videos; it only appends new ones and overwrites the JSON file.

## Safety guardrails

- `MAX_VIDEOS=20` per channel keeps a single run under ~10 minutes wall time even on slow uplinks.
- The script never touches the database directly; only the JSON file is updated.
- If `rsync` or the API restart fails, the script exits non-zero so the systemd timer will log the failure.
