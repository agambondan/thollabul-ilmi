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
CHANNELS_FILE="${CHANNELS_FILE:-${REPO_ROOT}/list_ustad_sunnah.json}"
SCRAPE_ARGS="${SCRAPE_ARGS:-}"
COOKIES="${COOKIES:-}"        # pass-through: chrome / firefox / path
MAX_VIDEOS="${MAX_VIDEOS:-5}"
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
    args+=("-max" "${MAX_VIDEOS}")
    args+=("-out" "${OUT_FILE}")
    args+=("-channels-file" "${CHANNELS_FILE}")
    [[ -n "${COOKIES}" ]] && args+=("-cookies" "${COOKIES}")
    [[ -n "${SCRAPE_ARGS}" ]] && args+=(${SCRAPE_ARGS})

    cd "${REPO_ROOT}/services/api"
    if command -v go >/dev/null 2>&1; then
        go run ./cmd/scrape-kajian "${args[@]}"
    elif [[ -f "${REPO_ROOT}/services/api/bin/scrape-kajian" ]]; then
        "${REPO_ROOT}/services/api/bin/scrape-kajian" "${args[@]}"
    else
        python3 scripts/scrape_youtube_kajian.py --max "${MAX_VIDEOS}" --out "${OUT_FILE}" --channels-file "${CHANNELS_FILE}"
    fi
}

sync_to_vps() {
    if [[ -d "${VPS_REMOTE_DIR}/data/static" && -f "${OUT_FILE}" ]]; then
        log "Local environment detected on VPS; copying ${OUT_FILE} to ${VPS_REMOTE_DIR}/data/static/kajian.json"
        cp -f "${OUT_FILE}" "${VPS_REMOTE_DIR}/data/static/kajian.json"
        return 0
    fi
    log "Syncing ${OUT_FILE} to ${VPS_SSH_HOST}:${VPS_REMOTE_DIR}/services/api/data/static/kajian.json"
    rsync -avz --progress \
        "${OUT_FILE}" \
        "${VPS_SSH_HOST}:${VPS_REMOTE_DIR}/services/api/data/static/kajian.json"
    ssh "${VPS_SSH_HOST}" "mkdir -p ${VPS_REMOTE_DIR}/data/static && cp -f ${VPS_REMOTE_DIR}/services/api/data/static/kajian.json ${VPS_REMOTE_DIR}/data/static/kajian.json"
}

restart_api() {
    if [[ -d "${VPS_REMOTE_DIR}" && -f "${VPS_REMOTE_DIR}/docker-compose.yml" && "$(hostname)" =~ "sumopod" || ! -n "${SSH_CLIENT:-}" && -d "/works/me/thollabul-ilmi" ]]; then
        log "Restarting tholabul-ilmi-api locally"
        docker compose -f "${VPS_REMOTE_DIR}/docker-compose.yml" restart tholabul-ilmi-api
        return 0
    fi
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
