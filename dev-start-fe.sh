#!/usr/bin/env bash
# Start frontend only (Vite dev server), no build.
set -euo pipefail

FE_DIR="$(cd "$(dirname "$0")" && pwd)"
PROXY_URL="${PROXY:-http://127.0.0.1:17001}"
VITE_PREFIX_VALUE="${VITE_PREFIX:-}"
PORT="${PORT:-8765}"
FORCE_OPTIMIZE="${FORCE_OPTIMIZE:-1}"
CLEAN_VITE_CACHE="${CLEAN_VITE_CACHE:-1}"
RELEASE_PORT="${RELEASE_PORT:-1}"

cd "$FE_DIR"

if [ ! -d node_modules ]; then
  echo "[INFO] node_modules missing, running npm ci first..."
  npm_config_legacy_peer_deps=true npm ci
fi

if [ "$CLEAN_VITE_CACHE" = "1" ] && [ -d "$FE_DIR/node_modules/.vite" ]; then
  echo "[INFO] Cleaning Vite optimize cache: $FE_DIR/node_modules/.vite"
  rm -rf "$FE_DIR/node_modules/.vite"
fi

# Keep dev URL stable by terminating stale vite instances for this workspace.
EXISTING_PIDS="$(pgrep -f "$FE_DIR/node_modules/.bin/vite" || true)"
if [ -n "$EXISTING_PIDS" ]; then
  echo "[INFO] Stopping stale vite processes: $EXISTING_PIDS"
  kill $EXISTING_PIDS || true
  sleep 1
fi

if [ "$RELEASE_PORT" = "1" ]; then
  PORT_PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN || true)"
  if [ -n "$PORT_PIDS" ]; then
    echo "[INFO] Releasing occupied port $PORT (pids: $PORT_PIDS)"
    kill $PORT_PIDS || true
    # Wait up to 5s for the OS to actually release the port before starting Vite
    for _i in 1 2 3 4 5; do
      sleep 1
      lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 || break
    done
  fi
fi

if [ -n "$VITE_PREFIX_VALUE" ]; then
  echo "[INFO] Starting frontend dev server in subpath mode"
  echo "[INFO] Expected URL: http://127.0.0.1:${PORT}${VITE_PREFIX_VALUE}/"
else
  echo "[INFO] Starting frontend dev server on http://127.0.0.1:${PORT}"
fi
echo "[INFO] API proxy target: $PROXY_URL"

VITE_ARGS=(--port "$PORT" --host --strictPort)
if [ "$FORCE_OPTIMIZE" = "1" ]; then
  VITE_ARGS+=(--force)
fi

PROXY="$PROXY_URL" VITE_PREFIX="$VITE_PREFIX_VALUE" npm_config_legacy_peer_deps=true ./node_modules/.bin/vite "${VITE_ARGS[@]}"
