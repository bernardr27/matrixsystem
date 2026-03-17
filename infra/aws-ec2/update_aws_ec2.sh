#!/usr/bin/env bash
# =============================================================================
# Matrix System — AWS EC2 Update Script
# Pulls latest code, rebuilds all apps, reloads PM2
# Usage: sudo bash update_aws_ec2.sh
# =============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/matrix}"
BRANCH="${BRANCH:-main}"
SERVICE_USER="${SERVICE_USER:-ubuntu}"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

echo "=== Pulling latest code ==="
cd "$APP_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

echo "=== Installing dependencies ==="
install_deps() {
  if [[ -f "$APP_DIR/package-lock.json" ]]; then
    sudo -u "$SERVICE_USER" npm ci --no-audit --no-fund && return 0
  fi
  sudo -u "$SERVICE_USER" npm install --no-audit --no-fund
}

if ! install_deps; then
  echo "npm install failed, attempting dependency recovery..."
  rm -rf "$APP_DIR/node_modules" || true
  if [[ -d "/home/$SERVICE_USER/.npm" ]]; then
    chown -R "$SERVICE_USER:$SERVICE_USER" "/home/$SERVICE_USER/.npm" || true
  fi
  install_deps
fi

echo "=== Building all Next.js apps ==="
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

echo "=== Updating Nginx config ==="
cp "$APP_DIR/infra/aws-ec2/nginx.conf" /etc/nginx/nginx.conf
nginx -t && systemctl reload nginx

echo "=== Reloading PM2 services ==="
sudo -u "$SERVICE_USER" pm2 reload "$APP_DIR/infra/aws-ec2/ecosystem.config.cjs" --update-env
sudo -u "$SERVICE_USER" pm2 save

echo ""
echo "=== AWS EC2 Update Complete ==="
sudo -u "$SERVICE_USER" pm2 status
