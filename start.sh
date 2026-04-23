#!/bin/bash
# Skill Manager - Start Script
# Usage: ./start.sh [port]

PORT="${PORT:-10001}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/.skill-manager.pid"

cd "$SCRIPT_DIR"

# --- Python virtual environment ---
if [ ! -d ".venv" ]; then
  echo "[skill-manager] Creating Python virtual environment..."
  python3 -m venv .venv
  echo "[skill-manager] Installing Python dependencies..."
  .venv/bin/pip install -q -r scripts/requirements.txt
fi

# --- Config ---
if [ ! -f "skill-manager.json" ]; then
  echo "[skill-manager] Creating default config from skill-manager.example.json"
  cp skill-manager.example.json skill-manager.json
  echo "[skill-manager] Please edit skill-manager.json to set your API key and model."
  echo ""
fi

# --- Build ---
if [ ! -d ".next" ]; then
  echo "[skill-manager] Building Next.js (first run)..."
  npx next build
fi

# --- Start ---
echo "[skill-manager] Starting on port $PORT"
echo "[skill-manager] Open http://localhost:$PORT in your browser"
echo ""

nohup npx next start -p "$PORT" > /dev/null 2>&1 &
echo $! > "$PID_FILE"
echo "[skill-manager] PID: $(cat "$PID_FILE")"
echo "[skill-manager] Running. Use ./stop.sh to stop."
