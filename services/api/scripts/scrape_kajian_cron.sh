#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Weekly cron scraper for YouTube kajian channels.
# Runs the Go scraper (one <slug>.json per channel), syncs the
# directory to the VPS bind-mount, migrates the DB, and restarts
# the container so the API serves the new dataset.
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

OUT_DIR="${OUT_DIR:-${REPO_ROOT}/services/api/data/static/kajian}"
LOG_FILE="${LOG_FILE:-/var/log/thollabul-kajian-scrape.log}"
CHANNELS_FILE="${CHANNELS_FILE:-${REPO_ROOT}/list_ustad_sunnah.json}"
SCRAPE_ARGS="${SCRAPE_ARGS:-}"
COOKIES="${COOKIES:-}"        # pass-through: chrome / firefox / path
MAX_VIDEOS="${MAX_VIDEOS:-0}" # 0 = whole channel history, no cap
VPS_SSH_HOST="${VPS_SSH_HOST:-sumopod}"
VPS_REMOTE_DIR="${VPS_REMOTE_DIR:-/works/me/thollabul-ilmi}"
DOCKER_SERVICE="${DOCKER_SERVICE:-tholabul-ilmi-api}"

mkdir -p "${OUT_DIR}"

log() {
    local ts
    ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "[${ts}] $*" | tee -a "${LOG_FILE}"
}

run_scrape() {
    if [[ "${MAX_VIDEOS}" == "0" ]]; then
        log "Scraping full channel history -> ${OUT_DIR}"
    else
        log "Scraping up to ${MAX_VIDEOS} videos per channel -> ${OUT_DIR}"
    fi
    local args=()
    args+=("-max" "${MAX_VIDEOS}")
    args+=("-out-dir" "${OUT_DIR}")
    args+=("-channels-file" "${CHANNELS_FILE}")
    [[ -n "${COOKIES}" ]] && args+=("-cookies" "${COOKIES}")
    [[ -n "${SCRAPE_ARGS}" ]] && args+=(${SCRAPE_ARGS})

    cd "${REPO_ROOT}/services/api"
    if [[ -f "${REPO_ROOT}/services/api/bin/scrape-kajian" ]]; then
        "${REPO_ROOT}/services/api/bin/scrape-kajian" "${args[@]}"
    elif command -v go >/dev/null 2>&1; then
        go run ./cmd/scrape-kajian "${args[@]}"
    else
        log "no scrape-kajian binary and no 'go' in PATH — cannot scrape"
        return 1
    fi
}

# One <slug>.json per channel instead of one multi-tens-of-megabytes
# kajian.json — that file grew too large to open in an editor as the
# catalog widened. See services/api/cmd/scrape-kajian for the writer.
sync_to_vps() {
    if [[ -d "${VPS_REMOTE_DIR}/data/static" ]]; then
        log "Local environment detected on VPS; copying ${OUT_DIR} to ${VPS_REMOTE_DIR}/data/static/kajian"
        mkdir -p "${VPS_REMOTE_DIR}/data/static/kajian"
        cp -f "${OUT_DIR}"/*.json "${VPS_REMOTE_DIR}/data/static/kajian/" 2>/dev/null || true
        return 0
    fi
    log "Syncing ${OUT_DIR} to ${VPS_SSH_HOST}:${VPS_REMOTE_DIR}/services/api/data/static/kajian"
    ssh "${VPS_SSH_HOST}" "mkdir -p ${VPS_REMOTE_DIR}/services/api/data/static/kajian ${VPS_REMOTE_DIR}/data/static/kajian"
    rsync -avz --progress \
        "${OUT_DIR}/" \
        "${VPS_SSH_HOST}:${VPS_REMOTE_DIR}/services/api/data/static/kajian/"
    ssh "${VPS_SSH_HOST}" "cp -f ${VPS_REMOTE_DIR}/services/api/data/static/kajian/*.json ${VPS_REMOTE_DIR}/data/static/kajian/"
}

# A plain `docker compose restart` does NOT re-seed: main.go only calls
# Migrations()+Seeder() when started with -migrate, and the container's
# normal CMD never passes that flag. Without this step the JSON on disk
# changes but the running API keeps serving the old dataset forever.
migrate_db() {
    log "Running -migrate in ${DOCKER_SERVICE} so the new dataset reaches the DB"
    if [[ -d "${VPS_REMOTE_DIR}" && -f "${VPS_REMOTE_DIR}/docker-compose.yml" ]]; then
        docker compose -f "${VPS_REMOTE_DIR}/docker-compose.yml" run --rm --no-deps --entrypoint /app/main "${DOCKER_SERVICE}" -environment container -migrate
        return 0
    fi
    ssh "${VPS_SSH_HOST}" "cd ${VPS_REMOTE_DIR} && docker compose run --rm --no-deps --entrypoint /app/main ${DOCKER_SERVICE} -environment container -migrate"
}

restart_api() {
    if [[ -d "${VPS_REMOTE_DIR}" && -f "${VPS_REMOTE_DIR}/docker-compose.yml" && "$(hostname)" =~ "sumopod" || ! -n "${SSH_CLIENT:-}" && -d "/works/me/thollabul-ilmi" ]]; then
        log "Restarting ${DOCKER_SERVICE} locally"
        docker compose -f "${VPS_REMOTE_DIR}/docker-compose.yml" restart "${DOCKER_SERVICE}"
        return 0
    fi
    log "Restarting ${DOCKER_SERVICE} on ${VPS_SSH_HOST}"
    ssh "${VPS_SSH_HOST}" "cd ${VPS_REMOTE_DIR} && docker compose restart ${DOCKER_SERVICE}"
}

main() {
    log "--- scrape_kajian_cron START ---"
    run_scrape
    sync_to_vps
    migrate_db
    restart_api
    log "--- scrape_kajian_cron DONE ---"
}

main "$@"
