#!/bin/bash
# Skill Manager - Stop Script

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/.skill-manager.pid"

cd "$SCRIPT_DIR"

if [ ! -f "$PID_FILE" ]; then
  echo "[skill-manager] Not running (no PID file found)"
  exit 0
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
  echo "[skill-manager] Stopping PID $PID..."
  kill "$PID"
  rm -f "$PID_FILE"
  echo "[skill-manager] Stopped."
else
  echo "[skill-manager] Process $PID not running (stale PID file)"
  rm -f "$PID_FILE"
fi
