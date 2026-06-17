#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/launchly}"
NODE_MAJOR="${NODE_MAJOR:-20}"

echo "==> Installing system packages"
sudo apt-get update
sudo apt-get install -y curl git ca-certificates

if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node.js ${NODE_MAJOR}"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v caddy >/dev/null 2>&1; then
  echo "==> Installing Caddy"
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt-get update
  sudo apt-get install -y caddy
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing PM2"
  sudo npm install -g pm2
fi

if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> Clone your repo into $APP_DIR before running setup"
  exit 1
fi

cd "$APP_DIR"

echo "==> Installing dependencies"
npm ci

if [ ! -f ".env.local" ]; then
  echo "==> Creating .env.local from .env.example"
  cp .env.example .env.local
  echo "Fill .env.local with production values, then rerun this script."
  exit 1
fi

echo "==> Validating environment"
npm run check:env

echo "==> Running database migrations"
npm run db:migrate

echo "==> Building app"
npm run build

echo "==> Starting PM2 processes"
pm2 start deploy/ecosystem.config.cjs
pm2 save

echo "==> Done"
echo "Next steps:"
echo "1. Point your domain A record to this server IP"
echo "2. Add wildcard DNS: *.yourdomain.com -> same IP"
echo "3. Copy deploy/Caddyfile.example to /etc/caddy/Caddyfile and replace the domain"
echo "4. sudo systemctl reload caddy"
echo "5. Verify https://yourdomain.com/api/health"
