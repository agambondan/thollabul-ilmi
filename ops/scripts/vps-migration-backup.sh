#!/usr/bin/env bash
set -euo pipefail

# Run this ON THE OLD VPS to snapshot thollabul-ilmi's stateful data before
# migrating to a new server. Redis is intentionally not backed up — it is
# pure cache/session state, safe to start empty on the new box.
#
# Shows a progress bar for both steps if `pv` is installed (apt-get install
# -y pv) — falls back to plain, silent copies otherwise.
#
# Usage: ./vps-migration-backup.sh [output-dir]
# Produces <output-dir>/thollabul-ilmi-YYYYmmdd-HHMMSS/ with:
#   - postgres-thullabul_ilmi.dump  (pg_dump custom format, portable across pg17/18 hosts)
#   - minio-data.tar.gz             (raw contents of the MinIO volume)
# Then scp/rsync that whole directory to the new VPS and run
# vps-migration-restore.sh there.

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-tholabul-ilmi-tholabul-ilmi-postgres-1}"
POSTGRES_DB="${POSTGRES_DB:-thullabul_ilmi}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
MINIO_VOLUME="${MINIO_VOLUME:-tholabul-ilmi_tholabul-ilmi-minio-data}"

OUT_ROOT="${1:-$HOME/thollabul-ilmi-migration}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT_DIR="${OUT_ROOT}/thollabul-ilmi-${STAMP}"
mkdir -p "${OUT_DIR}"

HAVE_PV=0
if command -v pv >/dev/null 2>&1; then
    HAVE_PV=1
else
    echo "(tip: 'apt-get install -y pv' gives you a progress bar next time)"
fi

echo "==> Dumping Postgres (${POSTGRES_DB}) from ${POSTGRES_CONTAINER}"
# pg_database_size is only an estimate for the dump's final (compressed,
# custom-format) size, so the bar may reach 100% a little before or after
# the copy actually finishes — that's expected, not a bug.
DB_SIZE="$(docker exec "${POSTGRES_CONTAINER}" \
    psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -tAc \
    "SELECT pg_database_size('${POSTGRES_DB}')")"

if [ "${HAVE_PV}" = "1" ]; then
    docker exec "${POSTGRES_CONTAINER}" \
        pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Fc \
        | pv -s "${DB_SIZE}" -N postgres-dump \
        >"${OUT_DIR}/postgres-${POSTGRES_DB}.dump"
else
    docker exec "${POSTGRES_CONTAINER}" \
        pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Fc \
        >"${OUT_DIR}/postgres-${POSTGRES_DB}.dump"
fi

echo "==> Archiving MinIO volume (${MINIO_VOLUME})"
VOL_SIZE="$(docker run --rm -v "${MINIO_VOLUME}:/from:ro" alpine \
    du -sb /from | awk '{print $1}')"

if [ "${HAVE_PV}" = "1" ]; then
    docker run --rm -v "${MINIO_VOLUME}:/from:ro" alpine \
        tar cf - -C /from . \
        | pv -s "${VOL_SIZE}" -N minio-tar \
        | gzip >"${OUT_DIR}/minio-data.tar.gz"
else
    docker run --rm -v "${MINIO_VOLUME}:/from:ro" -v "${OUT_DIR}:/to" alpine \
        sh -c "tar czf /to/minio-data.tar.gz -C /from ."
fi

du -sh "${OUT_DIR}"/* 2>/dev/null || true
echo "==> Backup ready at: ${OUT_DIR}"
echo "==> Next: rsync/scp this directory to the new VPS, then run"
echo "    ops/scripts/vps-migration-restore.sh ${OUT_DIR##*/} there."
