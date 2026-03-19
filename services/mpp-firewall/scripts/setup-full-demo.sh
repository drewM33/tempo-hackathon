#!/bin/bash
set -e

echo ""
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║       MPP FIREWALL — DEMO SETUP                 ║"
echo "  ╚══════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICE_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$(dirname "$SERVICE_DIR")")"

cd "$REPO_ROOT"

echo "  [1/4] Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo "  [2/4] Starting MPP Firewall on :3010..."
cd services/mpp-firewall
pnpm dev &
FIREWALL_PID=$!
cd "$REPO_ROOT"
sleep 3

echo "  [3/4] Seeding demo agents..."
cd services/mpp-firewall
pnpm seed
cd "$REPO_ROOT"

echo ""
echo "  [4/4] Ready!"
echo ""
echo "  ┌──────────────────────────────────────────────────┐"
echo "  │ MPP Firewall:  http://localhost:3010             │"
echo "  │ Health:        http://localhost:3010/health       │"
echo "  │ Status:        http://localhost:3010/status       │"
echo "  │ Agents:        http://localhost:3010/dashboard/agents │"
echo "  │ WebSocket:     ws://localhost:3010/ws/events      │"
echo "  │ Dashboard:     http://localhost:3000/mpp-firewall │"
echo "  └──────────────────────────────────────────────────┘"
echo ""
echo "  Run the demo: cd services/mpp-firewall && pnpm demo"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

cleanup() {
  echo ""
  echo "  Stopping services..."
  kill $FIREWALL_PID 2>/dev/null || true
  echo "  Done."
}

trap cleanup EXIT

wait
