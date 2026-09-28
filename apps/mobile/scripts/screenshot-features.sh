#!/usr/bin/env bash
set -euo pipefail

# Screenshot app screens by jumping to them via the app's thullaabulilmi://
# deep link scheme (see src/utils/deepLinks.js) and capturing with
# `adb exec-out screencap`. No tap-coordinate guessing needed.
#
# Usage:
#   ./scripts/screenshot-features.sh [--out-dir DIR] [--skip-install] [--apk PATH]
#
# Requires: an already-booted emulator/device with `adb devices` showing it,
# and the app already installed (or pass a fresh APK path to install first).
#
# To add a new screen: append a "label|deeplink-path" entry to FEATURES
# below. deeplink-path is whatever comes after "thullaabulilmi://":
#   belajar/<featureKey>  -> opens that feature in the Belajar hub (works for
#                            most features; see the `key:` values in
#                            src/data/mobileFeatures.js for the full list)
#   quran/surah/<n>       -> surah reader for surah number n
#   quran/page/<n>        -> mushaf page n
#   hadith/<id>           -> hadith detail by id
#   ibadah/prayer         -> Jadwal Sholat
#   ibadah/qibla          -> Kiblat
#   profile/account       -> Profile > Akun settings
#   profile/appearance    -> Profile > Tampilan settings
#   profile/notifications -> Profile > Notifikasi settings
# src/utils/deepLinks.js (parseDeepLink) is the source of truth for routing -
# read it before adding a path that isn't already covered below.
#
# Caveats: a deep link only jumps to a screen, it does not tap through
# further sub-navigation (e.g. selecting a specific lesson inside "Modul &
# Kelas") - those still need manual `adb shell input tap x y` after landing.
# Login-gated features (protected-list type) will show their gated state on
# a guest session, same as a real fresh install.

PACKAGE="com.anonymous.thullaabulilmimobile"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
OUT_DIR="output/native/$(date +%F)"
SKIP_INSTALL=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --out-dir)
            OUT_DIR="$2"
            shift 2
            ;;
        --skip-install)
            SKIP_INSTALL=1
            shift
            ;;
        --apk)
            APK_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

FEATURES=(
    "beranda|home"
    "quran-alfatihah|quran/surah/1"
    "hadith-1|hadith/1"
    "ibadah-jadwal-sholat|ibadah/prayer"
    "ibadah-qibla|ibadah/qibla"
    "belajar-doa|belajar/doa"
    "belajar-dzikir|belajar/dzikir"
    "belajar-asmaul-husna|belajar/asmaul-husna"
    "belajar-tafsir|belajar/tafsir"
    "belajar-siroh|belajar/siroh"
    "belajar-tokoh|belajar/tokoh"
    "belajar-historical-map|belajar/historical-map"
    "belajar-fiqh|belajar/fiqh"
    "belajar-panduan-sholat|belajar/panduan-sholat"
    "belajar-kamus|belajar/kamus"
    "belajar-kajian|belajar/kajian"
    "belajar-quiz|belajar/quiz"
    "belajar-leaderboard|belajar/leaderboard"
    "belajar-kelas-modul|belajar/kelas-modul"
    "belajar-forum|belajar/forum"
    "belajar-library|belajar/library"
    "belajar-komunitas|belajar/komunitas"
    "belajar-muhasabah|belajar/muhasabah"
    "belajar-goals|belajar/goals"
    "belajar-hafalan|belajar/hafalan"
    "belajar-murojaah|belajar/murojaah"
    "belajar-tilawah|belajar/tilawah"
    "belajar-amalan|belajar/amalan"
    "belajar-masjid|belajar/masjid"
    "belajar-radio-islamic|belajar/radio-islamic"
    "belajar-sejarah|belajar/sejarah"
    "belajar-asbabun-nuzul|belajar/asbabun-nuzul"
    "belajar-zakat|belajar/zakat"
    "belajar-faraidh|belajar/faraidh"
    "belajar-imsakiyah|belajar/imsakiyah"
    "belajar-hijri|belajar/hijri"
    "belajar-manasik|belajar/manasik"
    "belajar-wirid|belajar/wirid"
    "belajar-asmaul-wirid|belajar/asmaul-wirid"
    "belajar-asmaul-flashcard|belajar/asmaul-flashcard"
    "belajar-tasbih|belajar/tasbih"
    "profile-account|profile/account"
    "profile-appearance|profile/appearance"
    "profile-notifications|profile/notifications"
)

if ! adb devices | grep -q "device$"; then
    echo "No device/emulator detected. Boot one first, e.g.:" >&2
    echo "  emulator -avd tholabul_pixel_7_api36 -no-window -gpu swiftshader_indirect -no-snapshot -no-boot-anim &" >&2
    exit 1
fi

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
    if [[ -f "$APK_PATH" ]]; then
        echo "Installing $APK_PATH ..."
        adb install -r "$APK_PATH"
    else
        echo "APK not found at $APK_PATH, skipping install (assuming it's already on the device)." >&2
    fi
fi

mkdir -p "$OUT_DIR"

for entry in "${FEATURES[@]}"; do
    name="${entry%%|*}"
    path="${entry#*|}"
    echo "-> $name (thullaabulilmi://$path)"
    adb shell am start -a android.intent.action.VIEW -d "thullaabulilmi://$path" "$PACKAGE" >/dev/null
    sleep 2.5
    adb exec-out screencap -p > "$OUT_DIR/$name.png"
done

echo "Done. Screenshots saved to $OUT_DIR/"
