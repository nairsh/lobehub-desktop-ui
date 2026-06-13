#!/usr/bin/env bash
#
# playwright-electron.sh — Reliable Electron dev testing via Playwright launch
#
# Manages a long-running daemon (playwright-electron-daemon.mjs) that owns the
# Electron process via Playwright's _electron.launch() API. The daemon exposes
# an HTTP API on localhost:7323 for screenshots, JS eval, click, type, etc.
#
# Usage:
#   ./playwright-electron.sh start    # Build main if stale, start daemon, wait until ready
#   ./playwright-electron.sh stop     # Gracefully stop daemon + Electron
#   ./playwright-electron.sh status   # Check if daemon is up and show current URL
#   ./playwright-electron.sh restart  # stop then start
#   ./playwright-electron.sh build    # (Re)build the main + renderer
#
# Environment variables:
#   DAEMON_PORT     — HTTP control port (default: 7323)
#   DAEMON_LOG      — Log file path (default: /tmp/playwright-electron-daemon.log)
#   WAIT_TIMEOUT_S  — Max seconds to wait for daemon (default: 90)
#   SKIP_BUILD      — Set to 1 to skip the stale-build check
#
set -euo pipefail

DAEMON_PORT="${DAEMON_PORT:-7323}"
DAEMON_LOG="${DAEMON_LOG:-/tmp/playwright-electron-daemon.log}"
WAIT_TIMEOUT_S="${WAIT_TIMEOUT_S:-90}"
SKIP_BUILD="${SKIP_BUILD:-0}"
PLAYWRIGHT_SPA_PORT="${PLAYWRIGHT_SPA_PORT:-9876}"
PLAYWRIGHT_RENDERER_MODE="${PLAYWRIGHT_RENDERER_MODE:-dev}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
DESKTOP_DIR="$PROJECT_ROOT/apps/desktop"
DAEMON_SCRIPT="$SCRIPT_DIR/playwright-electron-daemon.mjs"
PIDFILE="/tmp/playwright-electron-daemon-${DAEMON_PORT}.pid"

# ── Helpers ──────────────────────────────────────────────────────────

log() { echo "[playwright-electron] $*"; }

api() {
  local method="$1" path="$2" data="${3:-}"
  if [ -n "$data" ]; then
    curl -s -X "$method" "http://127.0.0.1:$DAEMON_PORT$path" \
      -H 'Content-Type: application/json' \
      -d "$data" 2>/dev/null
  else
    curl -s -X "$method" "http://127.0.0.1:$DAEMON_PORT$path" 2>/dev/null
  fi
}

is_daemon_up() {
  api GET /status >/dev/null 2>&1
}

# ── Build ─────────────────────────────────────────────────────────────

do_build() {
  log "Building Electron app bundles (electron-vite build)…"
  (cd "$DESKTOP_DIR" && npx electron-vite build 2>&1)
  log "Build complete."
}

needs_build() {
  local main_entry="$DESKTOP_DIR/dist/main/index.js"
  local preload_entry="$DESKTOP_DIR/dist/preload/index.js"
  [ ! -f "$main_entry" ] && return 0  # missing — must build
  [ ! -f "$preload_entry" ] && return 0

  # Rebuild if any main/preload source is newer than the built artifacts.
  if find "$DESKTOP_DIR/src/main" -name "*.ts" -newer "$main_entry" 2>/dev/null | grep -q .; then
    return 0
  fi
  if find "$DESKTOP_DIR/src/preload" -name "*.ts" -newer "$preload_entry" 2>/dev/null | grep -q .; then
    return 0
  fi
  return 1
}

# ── Stop ──────────────────────────────────────────────────────────────

do_stop() {
  log "Stopping daemon…"

  # Try graceful HTTP stop first
  if is_daemon_up; then
    api POST /stop '{}' >/dev/null 2>&1 || true
    sleep 1
  fi

  # Kill by PID file
  if [ -f "$PIDFILE" ]; then
    local pid
    pid=$(cat "$PIDFILE")
    if kill -0 "$pid" 2>/dev/null; then
      log "Killing daemon PID $pid"
      kill "$pid" 2>/dev/null || true
      local waited=0
      while kill -0 "$pid" 2>/dev/null && [ $waited -lt 5 ]; do
        sleep 1; waited=$((waited+1))
      done
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$PIDFILE"
  fi

  # Catch any stray Electron processes from our project (belt-and-suspenders)
  pkill -f "Electron.*--remote-debugging-port" 2>/dev/null || true
  pkill -f "lobehub-desktop-ui/apps/desktop/node_modules/.pnpm/electron@" 2>/dev/null || true
  pkill -f "$PROJECT_ROOT/apps/desktop/node_modules/.pnpm/electron@" 2>/dev/null || true
  pkill -f "renderer.dev.vite.config.ts" 2>/dev/null || true
  pkill -f "playwright-electron-daemon" 2>/dev/null || true

  log "Stopped."
}

# ── Status ────────────────────────────────────────────────────────────

do_status() {
  if ! is_daemon_up; then
    log "Daemon is NOT running (port $DAEMON_PORT unreachable)."
    return 1
  fi
  local info
  info=$(api GET /status)
  local url title
  url=$(echo "$info" | grep -o '"url":"[^"]*"' | head -1 | sed 's/"url":"\(.*\)"/\1/')
  title=$(echo "$info" | grep -o '"title":"[^"]*"' | head -1 | sed 's/"title":"\(.*\)"/\1/')
  log "Daemon is UP (port $DAEMON_PORT). URL: $url  Title: $title"
  return 0
}

# ── Start ─────────────────────────────────────────────────────────────

do_start() {
  # Idempotent: skip if already healthy
  if is_daemon_up; then
    log "Daemon is already running. Skipping start. Use 'restart' to force a fresh session."
    do_status
    return 0
  fi

  do_stop  # clean up stale processes

  # The daemon shares the LobeHub production profile (single-instance lock).
  # Quit the production app gracefully if it's running.
  if osascript -e 'tell application "System Events" to (name of processes) contains "LobeHub"' 2>/dev/null | grep -q true; then
    log "Quitting production LobeHub app to release single-instance lock…"
    osascript -e 'tell application "LobeHub" to quit' 2>/dev/null || true
    sleep 2
  fi

  # Build if stale (or forced)
  if [ "$SKIP_BUILD" != "1" ] && needs_build; then
    do_build
  elif [ "$SKIP_BUILD" != "1" ]; then
    log "Build is up to date — skipping rebuild. Set SKIP_BUILD=0 to force."
  else
    log "SKIP_BUILD=1 — skipping build check."
  fi

  log "Starting daemon…"
  log "  Port: $DAEMON_PORT"
  log "  Renderer: $PLAYWRIGHT_RENDERER_MODE on port $PLAYWRIGHT_SPA_PORT"
  log "  Log:  $DAEMON_LOG"

  : > "$DAEMON_LOG"  # truncate

  local pid
  pid=$(
    PLAYWRIGHT_DAEMON_PORT="$DAEMON_PORT" \
    PLAYWRIGHT_SPA_PORT="$PLAYWRIGHT_SPA_PORT" \
    PLAYWRIGHT_RENDERER_MODE="$PLAYWRIGHT_RENDERER_MODE" \
    python3 - "$DAEMON_SCRIPT" "$DAEMON_LOG" <<'PY'
import os
import subprocess
import sys

script = sys.argv[1]
log_path = sys.argv[2]

with open(log_path, "ab", buffering=0) as log_file:
    proc = subprocess.Popen(
        ["node", script],
        close_fds=True,
        cwd=os.getcwd(),
        env=os.environ.copy(),
        start_new_session=True,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        stdout=log_file,
    )

print(proc.pid)
PY
  )
  echo "$pid" > "$PIDFILE"
  log "Daemon PID: $pid"

  # Wait for HTTP API to become available
  log "Waiting for daemon (up to ${WAIT_TIMEOUT_S}s)…"
  local elapsed=0
  local interval=3
  while [ $elapsed -lt "$WAIT_TIMEOUT_S" ]; do
    if is_daemon_up; then
      log "Daemon ready after ${elapsed}s."
      do_status
      return 0
    fi
    # Bail early if process died
    if ! kill -0 "$pid" 2>/dev/null; then
      log "ERROR: Daemon process exited unexpectedly. Last log:"
      tail -30 "$DAEMON_LOG"
      return 1
    fi
    sleep "$interval"
    elapsed=$((elapsed + interval))
    log "Still waiting… (${elapsed}/${WAIT_TIMEOUT_S}s)"
  done

  log "ERROR: Daemon did not become ready within ${WAIT_TIMEOUT_S}s."
  log "Last 30 lines of log:"
  tail -30 "$DAEMON_LOG"
  return 1
}

do_restart() {
  do_stop
  sleep 1
  do_start
}

# ── Main ──────────────────────────────────────────────────────────────

case "${1:-help}" in
  start)   do_start ;;
  stop)    do_stop ;;
  status)  do_status ;;
  restart) do_restart ;;
  build)   do_build ;;
  *)
    echo "Usage: $0 {start|stop|status|restart|build}"
    echo ""
    echo "  start    — Start daemon (idempotent; rebuilds main if stale)"
    echo "  stop     — Stop daemon and Electron"
    echo "  status   — Check if daemon is running and show current URL"
    echo "  restart  — Force fresh restart"
    echo "  build    — (Re)build main/preload/renderer bundles"
    echo ""
    echo "Env:"
    echo "  DAEMON_PORT=$DAEMON_PORT"
    echo "  PLAYWRIGHT_SPA_PORT=$PLAYWRIGHT_SPA_PORT"
    echo "  PLAYWRIGHT_RENDERER_MODE=$PLAYWRIGHT_RENDERER_MODE   # dev | static"
    echo ""
    echo "HTTP API (localhost:$DAEMON_PORT):"
    echo "  GET  /status        — { running, url, title }"
    echo "  POST /screenshot    — { path } (PNG in /tmp)"
    echo "  POST /snapshot      — { snapshot } (accessibility tree)"
    echo "  POST /eval          — { code } → { result }  (renderer)"
    echo "  POST /eval-main     — { code } → { result }  (main process)"
    echo "  POST /click         — { selector } or { text }"
    echo "  POST /fill          — { selector, value }"
    echo "  POST /type          — { selector, text }"
    echo "  POST /press         — { key }"
    echo "  POST /navigate      — { url }"
    echo "  POST /reload"
    echo "  POST /stop"
    exit 1
    ;;
esac
