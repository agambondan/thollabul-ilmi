# Kajian Auto-Scraper (Cron)

Filesystem layout:

```
services/api/scripts/
├── scrape_youtube_kajian.py     # existing: scrape 9 ustadz channels
├── scrape_kajian_cron.sh        # bash wrapper: scrape + rsync + restart
├── scrape_kajian_cron.service   # systemd service template
└── scrape_kajian_cron.timer     # systemd timer (weekly, Sun 02:00 UTC)
```

## Quick start (manual run)

```bash
# From VPS or local dev environment:
services/api/scripts/scrape_kajian_cron.sh
```

Environment variables (override per invocation):

| Variable | Default | Purpose |
| --- | --- | --- |
| `OUT_FILE` | `services/api/data/static/kajian.json` | Output JSON location |
| `LOG_FILE` | `/var/log/thollabul-kajian-scrape.log` | Append log |
| `SCRAPE_BIN` | `python3` | Python interpreter |
| `MAX_VIDEOS` | `20` | Max new videos per channel per run |
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
