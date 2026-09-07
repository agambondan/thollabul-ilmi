#!/usr/bin/env bash
set -euo pipefail

# Weekly embeddings backfill for newly scraped kajian transcripts.
# Runs the API image with -backfill-embeddings against the docker network.
# Idempotent: only fills rows where embedding IS NULL.

LOG_DIR="${LOG_DIR:-/var/log}"
LOG_FILE="${LOG_DIR}/thollabul-kajian-backfill.log"
NETWORK="${NETWORK:-tholabul-ilmi_tholabul-ilmi-network}"
IMAGE="${IMAGE:-tholabul-ilmi-api:prod}"

mkdir -p "${LOG_DIR}"
chmod 755 "${LOG_DIR}" 2>/dev/null || true

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
{
  echo "[$(ts)] backfill-kajian-embeddings start"
  docker run --rm \
    --network "${NETWORK}" \
    -e DB_HOST=tholabul-ilmi-postgres \
    -e DB_PORT=5432 \
    -e DB_USER=postgres \
    -e DB_PASS=postgres \
    -e DB_NAME=thullabul_ilmi \
    -e DB_SSLMODE=disable \
    "${IMAGE}" /app/main -environment container -backfill-embeddings
  echo "[$(ts)] backfill-kajian-embeddings done"
} >>"${LOG_FILE}" 2>&1
