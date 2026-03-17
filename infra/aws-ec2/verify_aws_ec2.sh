#!/usr/bin/env bash
# =============================================================================
# Matrix System — AWS EC2 Verify Script
# Checks all PM2 processes, Nginx, and app health
# Usage: bash verify_aws_ec2.sh
# =============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/matrix}"
SERVICE_USER="${SERVICE_USER:-ubuntu}"

cd "$APP_DIR"

echo "== PM2 Process Status =="
sudo -u "$SERVICE_USER" pm2 status

echo ""
echo "== Nginx Status =="
systemctl is-active nginx && echo "Nginx: RUNNING" || echo "Nginx: STOPPED"

echo ""
echo "== App Health Checks =="
APPS=("citadel:3005" "reflect:3000" "nexus:3001" "rocket:4000" "ghost:5173")
for entry in "${APPS[@]}"; do
  name="${entry%%:*}"
  port="${entry##*:}"
  if curl -sf --max-time 5 "http://localhost:${port}/" > /dev/null 2>&1; then
    echo "  ${name} (port ${port}): HEALTHY"
  else
    echo "  ${name} (port ${port}): UNREACHABLE"
  fi
done

echo ""
echo "== Nginx Reverse Proxy Health =="
if curl -sf --max-time 5 "http://localhost/health" > /dev/null 2>&1; then
  echo "  Nginx proxy: HEALTHY"
else
  echo "  Nginx proxy: UNREACHABLE"
fi

echo ""
echo "== Standalone Build Verification =="
for app in citadel reflect nexus rocket-command ghost-command; do
  if [[ -f "$APP_DIR/apps/$app/.next/standalone/apps/$app/server.js" ]]; then
    echo "  $app: standalone OK"
  else
    echo "  $app: standalone MISSING"
  fi
done

echo ""
echo "== Diagnostics =="
npm run diag:heartbeat -- --limit=8 2>/dev/null || echo "  heartbeat diag unavailable"

echo ""
echo "aws_ec2_verify_complete"
