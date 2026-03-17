#!/usr/bin/env bash
# =============================================================================
# Matrix System — AWS EC2 Repair Script
# Cleans and reinstalls everything, then restarts all services
# Usage: sudo bash repair_aws_ec2.sh
# =============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/matrix}"
SERVICE_USER="${SERVICE_USER:-ubuntu}"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "Missing APP_DIR: $APP_DIR"
  exit 1
fi

echo "=== Repairing ownership and npm cache ==="
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
mkdir -p "/home/$SERVICE_USER/.npm" "/home/$SERVICE_USER/.pm2"
chown -R "$SERVICE_USER:$SERVICE_USER" "/home/$SERVICE_USER/.npm" "/home/$SERVICE_USER/.pm2"

echo "=== Clearing node_modules for clean reinstall ==="
rm -rf "$APP_DIR/node_modules"

echo "=== Clearing .next build caches ==="
for app in citadel reflect nexus rocket-command ghost-command; do
  rm -rf "$APP_DIR/apps/$app/.next" 2>/dev/null || true
done

echo "=== Installing dependencies as $SERVICE_USER ==="
cd "$APP_DIR"
if [[ -f "$APP_DIR/package-lock.json" ]]; then
  sudo -u "$SERVICE_USER" npm ci --prefix "$APP_DIR" --no-audit --no-fund
else
  sudo -u "$SERVICE_USER" npm install --prefix "$APP_DIR" --no-audit --no-fund
fi

echo "=== Rebuilding all Next.js apps ==="
sudo -u "$SERVICE_USER" npx turbo run build --no-daemon 2>&1 || {
  echo "Turbo build failed. Attempting individual builds..."
  for app in citadel reflect nexus rocket-command ghost-command; do
    echo "  Building $app..."
    sudo -u "$SERVICE_USER" npm run build --workspace "$app" 2>&1 || echo "  WARNING: $app build failed"
  done
}

echo "=== Copying static assets for standalone ==="
for app in citadel reflect nexus rocket-command ghost-command; do
  STANDALONE_DIR="$APP_DIR/apps/$app/.next/standalone/apps/$app"
  if [[ -d "$STANDALONE_DIR" ]]; then
    cp -r "$APP_DIR/apps/$app/public" "$STANDALONE_DIR/public" 2>/dev/null || true
    cp -r "$APP_DIR/apps/$app/.next/static" "$STANDALONE_DIR/.next/static" 2>/dev/null || true
  fi
done

echo "=== Repairing Nginx config ==="
cp "$APP_DIR/infra/aws-ec2/nginx.conf" /etc/nginx/nginx.conf
nginx -t && systemctl restart nginx

echo "=== Reloading PM2 services ==="
sudo -u "$SERVICE_USER" pm2 reload "$APP_DIR/infra/aws-ec2/ecosystem.config.cjs" --update-env || \
  sudo -u "$SERVICE_USER" pm2 start "$APP_DIR/infra/aws-ec2/ecosystem.config.cjs"
sudo -u "$SERVICE_USER" pm2 save
sudo -u "$SERVICE_USER" pm2 status

echo ""
echo "aws_ec2_repair_complete"
