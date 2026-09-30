#!/usr/bin/env bash
set -u

if [ "$#" -lt 3 ]; then
    echo "Pakai: run-with-expo.sh <folder-ekspor> <port> <perintah...>" >&2
    exit 2
fi

DIR=$1
PORT=$2
shift 2

cd "$DIR/apps/mobile" || exit 1

if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
    echo "Port $PORT sudah dipakai proses lain, pilih port lain." >&2
    exit 1
fi

CI=1 EXPO_OFFLINE=1 npx expo start --web --port "$PORT" > "$DIR/expo.log" 2>&1 &
EXPO_PID=$!

cleanup() {
    pkill -P "$EXPO_PID" 2>/dev/null
    kill "$EXPO_PID" 2>/dev/null
    for pid in $(lsof -ti:"$PORT" 2>/dev/null); do
        case "$(ps -o args= -p "$pid")" in
            *expo*|*metro*|*"$DIR"*) kill "$pid" 2>/dev/null ;;
        esac
    done
    echo "[server Expo port $PORT dihentikan]"
}
trap cleanup EXIT

echo "[menunggu server Expo port $PORT]"
WAITED=0
until curl -s -o /dev/null --max-time 3 "http://localhost:$PORT"; do
    WAITED=$((WAITED + 2))
    if [ "$WAITED" -ge 240 ]; then
        echo "Expo tidak siap dalam 240 detik, lihat $DIR/expo.log" >&2
        exit 1
    fi
    sleep 2
done

BUNDLE=$(curl -s "http://localhost:$PORT" | grep -o 'src="[^"]*bundle[^"]*"' | head -1 | sed 's/src="//;s/"$//')
echo "[memanaskan bundle]"
curl -s -o /dev/null --max-time 540 "http://localhost:$PORT$BUNDLE"
echo "[bundle siap, menjalankan: $*]"
"$@"
