#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/bernardr27/matrixsystem.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/matrix}"
NODE_MAJOR="${NODE_MAJOR:-22}"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

apt-get update -y
apt-get install -y curl git build-essential

curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
apt-get install -y nodejs

npm install -g pm2

if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi

cd "$APP_DIR"
npm install --no-audit --no-fund

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "Missing $APP_DIR/.env. Copy production secrets before starting services."
  exit 1
fi

pm2 delete matrix-sentinel matrix-ghost-runner >/dev/null 2>&1 || true
pm2 start "$APP_DIR/infra/oracle-free/ecosystem.config.cjs"
pm2 save

# Register PM2 startup for reboot persistence.
pm2 startup systemd -u root --hp /root >/tmp/pm2-startup.txt
bash /tmp/pm2-startup.txt || true

echo "oracle_free_install_complete"
pm2 status
