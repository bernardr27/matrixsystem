#!/usr/bin/env bash
# =============================================================================
# Matrix System — AWS EC2 Install Script
# Installs Node.js, clones repo, builds all apps, starts PM2 services
# Usage: sudo bash install_aws_ec2.sh
# =============================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/bernardr27/matrixsystem.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/matrix}"
NODE_MAJOR="${NODE_MAJOR:-22}"
SERVICE_USER="${SERVICE_USER:-ubuntu}"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  echo "User '$SERVICE_USER' not found. Set SERVICE_USER before running."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "=== Installing system dependencies ==="
apt-get update -y
apt-get install -y curl git build-essential ca-certificates nginx

echo "=== Installing Node.js ${NODE_MAJOR} ==="
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
apt-get install -y nodejs
npm install -g pm2

echo "=== Cloning/updating repository ==="
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi

cd "$APP_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

echo "=== Installing npm dependencies ==="
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
  if [[ -d "/home/$SERVICE_USER/.pm2" ]]; then
    chown -R "$SERVICE_USER:$SERVICE_USER" "/home/$SERVICE_USER/.pm2" || true
  fi
  install_deps
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "WARNING: Missing $APP_DIR/.env — copying template. Fill in production values!"
  cp "$APP_DIR/.env.docker" "$APP_DIR/.env" 2>/dev/null || true
fi

echo "=== Building all Next.js apps (standalone output) ==="
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

echo "=== Configuring Nginx reverse proxy ==="
cp "$APP_DIR/infra/aws-ec2/nginx.conf" /etc/nginx/nginx.conf
nginx -t && systemctl enable nginx && systemctl restart nginx

echo "=== Starting PM2 services ==="
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
sudo -u "$SERVICE_USER" pm2 delete all >/dev/null 2>&1 || true
sudo -u "$SERVICE_USER" pm2 start "$APP_DIR/infra/aws-ec2/ecosystem.config.cjs"
sudo -u "$SERVICE_USER" pm2 save

pm2 startup systemd -u "$SERVICE_USER" --hp "/home/$SERVICE_USER" >/tmp/pm2-startup-aws.txt
bash /tmp/pm2-startup-aws.txt || true

echo ""
echo "=== AWS EC2 Install Complete ==="
sudo -u "$SERVICE_USER" pm2 status
echo ""
echo "Matrix apps should be accessible via http://<your-ec2-ip>/"
