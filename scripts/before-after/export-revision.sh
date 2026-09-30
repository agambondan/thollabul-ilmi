#!/usr/bin/env bash
set -eu

if [ "$#" -ne 2 ]; then
    echo "Pakai: export-revision.sh <revisi-git> <folder-tujuan>" >&2
    exit 2
fi

REVISION=$1
TARGET=$2
ROOT=$(git rev-parse --show-toplevel)

if [ -e "$TARGET/apps/mobile" ]; then
    echo "$TARGET/apps/mobile sudah ada, pilih folder lain atau hapus dulu." >&2
    exit 1
fi

if ! git -C "$ROOT" diff --quiet "$REVISION" HEAD -- apps/mobile/package.json; then
    echo "Peringatan: apps/mobile/package.json berbeda antara $REVISION dan HEAD, node_modules hasil symlink mungkin tidak cocok." >&2
fi

mkdir -p "$TARGET"
git -C "$ROOT" archive "$REVISION" apps/mobile | tar -x -C "$TARGET"
ln -s "$ROOT/apps/mobile/node_modules" "$TARGET/apps/mobile/node_modules"
echo "Revisi $REVISION diekspor ke $TARGET/apps/mobile"
