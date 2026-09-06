#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Weekly cron scraper for YouTube kajian channels.
# Runs scrape_youtube_kajian.py, syncs the JSON to the VPS
# bind-mount, and triggers a one-shot container restart so
# the API picks up the new dataset.
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

OUT_FILE="${OUT_FILE:-${REPO_ROOT}/services/api/data/static/kajian.json}"
LOG_FILE="${LOG_FILE:-/var/log/thollabul-kajian-scrape.log}"
SCRAPE_BIN="${SCRAPE_BIN:-python3}"
SCRAPE_ARGS="${SCRAPE_ARGS:-}"
COOKIES="${COOKIES:-}"        # pass-through: chrome / firefox / path
MAX_VIDEOS="${MAX_VIDEOS:-20}"
VPS_SSH_HOST="${VPS_SSH_HOST:-sumopod}"
VPS_REMOTE_DIR="${VPS_REMOTE_DIR:-/works/me/thollabul-ilmi}"

mkdir -p "$(dirname "${OUT_FILE}")"

log() {
    local ts
    ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "[${ts}] $*" | tee -a "${LOG_FILE}"
}

run_scrape() {
    log "Scraping up to ${MAX_VIDEOS} videos per channel -> ${OUT_FILE}"
    local args=()
    args+=("--max" "${MAX_VIDEOS}")
    args+=("--out" "${OUT_FILE}")
    [[ -n "${COOKIES}" ]] && args+=("--cookies" "${COOKIES}")
    [[ -n "${SCRAPE_ARGS}" ]] && args+=(${SCRAPE_ARGS})

    cd "${REPO_ROOT}/services/api"
    "${SCRAPE_BIN}" scripts/scrape_youtube_kajian.py "${args[@]}"
}

sync_to_vps() {
    log "Syncing ${OUT_FILE} to ${VPS_SSH_HOST}:${VPS_REMOTE_DIR}/services/api/data/static/kajian.json"
    rsync -avz --progress \
        "${OUT_FILE}" \
        "${VPS_SSH_HOST}:${VPS_REMOTE_DIR}/services/api/data/static/kajian.json"
}

restart_api() {
    log "Restarting tholabul-ilmi-api on ${VPS_SSH_HOST}"
    ssh "${VPS_SSH_HOST}" "cd ${VPS_REMOTE_DIR} && docker compose restart tholabul-ilmi-api"
}

main() {
    log "--- scrape_kajian_cron START ---"
    run_scrape
    sync_to_vps
    restart_api
    log "--- scrape_kajian_cron DONE ---"
}

main "$@"
