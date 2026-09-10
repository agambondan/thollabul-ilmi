#!/usr/bin/env bash
set -uo pipefail

# Run this ON THE NEW VPS to restore a backup made by vps-migration-backup.sh.
#
# Order of operations on the new box:
#   1. cd /works/me/thollabul-ilmi && docker compose up -d \
#        tholabul-ilmi-postgres tholabul-ilmi-redis tholabul-ilmi-minio
#      (starts empty data containers only — do NOT deploy api/web yet)
#   2. rsync/scp the backup directory here (put it somewhere Docker can bind
#      mount — your home dir or the repo checkout, not a sandboxed tmp path)
#   3. ./vps-migration-restore.sh /path/to/thollabul-ilmi-<timestamp>
#   4. Only then deploy api/web (`make thollabul` from the laptop) so the
#      app boots against already-populated data instead of seeding fresh.
#
# Progress: shows a `pv` progress bar per step if `pv` is installed
# (apt-get install -y pv) — falls back to plain, silent copies otherwise.
#
# Resume: the Postgres restore is split into pre-data / data / post-data
# passes. Completed passes are recorded in <backup-dir>/.restore-state, so
# killing the script (or losing the SSH session) and re-running it later
# skips whatever already finished instead of starting over. This is
# section-level resume, not row-level: if it dies mid "data", that pass
# retries from scratch (tables are truncated first so retrying never
# duplicates rows) rather than resuming table-by-table.
#
# To pause briefly instead of killing it: Ctrl+Z suspends the running pass
# (`fg` resumes it) — fine for a short pause, but don't leave it suspended
# for a long time, since the open Postgres connection can hit a server-side
# idle timeout. For an actual multi-hour or multi-day pause, kill it and
# resume later via the state file instead of suspending the process.
#
# Usage: ./vps-migration-restore.sh <backup-dir>

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-tholabul-ilmi-tholabul-ilmi-postgres-1}"
POSTGRES_DB="${POSTGRES_DB:-thullabul_ilmi}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
MINIO_VOLUME="${MINIO_VOLUME:-tholabul-ilmi_tholabul-ilmi-minio-data}"
NETWORK="${NETWORK:-tholabul-ilmi_tholabul-ilmi-network}"
RESTORE_IMAGE="${RESTORE_IMAGE:-pgvector/pgvector:pg18}"

BACKUP_DIR="${1:?Usage: $0 <backup-dir>}"
DUMP_FILE="${BACKUP_DIR}/postgres-${POSTGRES_DB}.dump"
MINIO_ARCHIVE="${BACKUP_DIR}/minio-data.tar.gz"
STATE_FILE="${BACKUP_DIR}/.restore-state"

[ -f "${DUMP_FILE}" ] || { echo "Missing ${DUMP_FILE}"; exit 1; }
[ -f "${MINIO_ARCHIVE}" ] || { echo "Missing ${MINIO_ARCHIVE}"; exit 1; }
touch "${STATE_FILE}"

HAVE_PV=0
if command -v pv >/dev/null 2>&1; then
    HAVE_PV=1
else
    echo "(tip: 'apt-get install -y pv' gives you a progress bar next time)"
fi

section_done() { grep -qx "$1" "${STATE_FILE}" 2>/dev/null; }
mark_done() { echo "$1" >>"${STATE_FILE}"; }

run_pg_restore() {
    local section="$1"
    local dump_size
    dump_size="$(stat -c%s "${DUMP_FILE}" 2>/dev/null || stat -f%z "${DUMP_FILE}")"
    if [ "${HAVE_PV}" = "1" ]; then
        pv -s "${dump_size}" -N "restore-${section}" "${DUMP_FILE}" \
            | docker run --rm -i --network "${NETWORK}" \
                -e PGPASSWORD="${POSTGRES_PASSWORD}" "${RESTORE_IMAGE}" \
                pg_restore -h "${POSTGRES_CONTAINER}" -U "${POSTGRES_USER}" \
                -d "${POSTGRES_DB}" --no-owner --role="${POSTGRES_USER}" \
                --section="${section}"
    else
        docker run --rm -i --network "${NETWORK}" \
            -e PGPASSWORD="${POSTGRES_PASSWORD}" "${RESTORE_IMAGE}" \
            pg_restore -h "${POSTGRES_CONTAINER}" -U "${POSTGRES_USER}" \
            -d "${POSTGRES_DB}" --no-owner --role="${POSTGRES_USER}" \
            --section="${section}" \
            <"${DUMP_FILE}"
    fi
}

echo "==> Restoring Postgres dump into ${POSTGRES_CONTAINER}/${POSTGRES_DB} (network ${NETWORK})"
echo "    (target database must already exist — this does not drop it)"
if [ -z "${FORCE:-}" ]; then
    read -r -p "Continue? [y/N] " confirm
    [ "${confirm}" = "y" ] || { echo "Aborted."; exit 1; }
fi

if section_done pre-data; then
    echo "==> pre-data already done, skipping (resume)"
else
    echo "==> Restoring section: pre-data (schema)"
    run_pg_restore pre-data
    mark_done pre-data
fi

if section_done data; then
    echo "==> data already done, skipping (resume)"
else
    if section_done data-started; then
        echo "==> Previous 'data' attempt was interrupted — truncating tables before retry"
        tables="$(docker run --rm --network "${NETWORK}" -e PGPASSWORD="${POSTGRES_PASSWORD}" "${RESTORE_IMAGE}" \
            psql -h "${POSTGRES_CONTAINER}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -tAc \
            "SELECT string_agg(format('%I.%I', schemaname, tablename), ',') FROM pg_tables WHERE schemaname = 'public'")"
        if [ -n "${tables}" ]; then
            docker run --rm --network "${NETWORK}" -e PGPASSWORD="${POSTGRES_PASSWORD}" "${RESTORE_IMAGE}" \
                psql -h "${POSTGRES_CONTAINER}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "TRUNCATE ${tables} CASCADE"
        fi
    fi
    mark_done data-started
    echo "==> Restoring section: data (this is the slow part)"
    run_pg_restore data
    mark_done data
fi

if section_done post-data; then
    echo "==> post-data already done, skipping (resume)"
else
    echo "==> Restoring section: post-data (indexes, constraints, FKs)"
    run_pg_restore post-data
    mark_done post-data
fi

if section_done minio; then
    echo "==> MinIO already restored, skipping (resume)"
else
    echo "==> Restoring MinIO volume (${MINIO_VOLUME})"
    if [ "${HAVE_PV}" = "1" ]; then
        pv -N minio-restore "${MINIO_ARCHIVE}" \
            | docker run --rm -i -v "${MINIO_VOLUME}:/to" alpine tar xzf - -C /to
    else
        docker run --rm -v "${MINIO_VOLUME}:/to" -v "${BACKUP_DIR}:/from:ro" alpine \
            sh -c "tar xzf /from/minio-data.tar.gz -C /to"
    fi
    mark_done minio
fi

echo "==> Restore complete. Verify with:"
echo "    docker exec ${POSTGRES_CONTAINER} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c '\\dt' | head"
echo "==> Then deploy api/web normally (make thollabul from the laptop)."
