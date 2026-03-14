#!/bin/bash
# ============================================
# ObraVision Deploy Script
# Run as obravision user from /home/obravision/app/
# ============================================
# Usage: bash deploy/deploy.sh YOUR_DOMAIN
# Example: bash deploy/deploy.sh obravision.com.br
# ============================================

set -e

DOMAIN=${1:?"Usage: bash deploy/deploy.sh YOUR_DOMAIN"}
APP_DIR="/home/obravision/app"

echo "============================================"
echo " Deploying ObraVision to ${DOMAIN}"
echo "============================================"

# --- 1. Check .env exists ---
if [ ! -f "${APP_DIR}/.env" ]; then
  echo "ERROR: .env file not found at ${APP_DIR}/.env"
  echo "Create it first with your credentials. See deploy/.env.production.example"
  exit 1
fi

# Source .env for build
set -a
source "${APP_DIR}/.env"
set +a

# --- 2. Install dependencies ---
echo "[1/7] Installing dependencies..."
cd "${APP_DIR}"
pnpm install --frozen-lockfile

# --- 3. Generate Prisma client and push schema ---
echo "[2/7] Setting up database..."
cd "${APP_DIR}/packages/db"
npx prisma generate
npx prisma db push --skip-generate
cd "${APP_DIR}"

# --- 4. Build apps ---
echo "[3/7] Building Next.js..."
pnpm --filter web build

echo "[4/7] Building Fastify API..."
pnpm --filter api build

# --- 5. Setup Nginx ---
echo "[5/7] Configuring Nginx..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/obravision
sudo sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" /etc/nginx/sites-available/obravision
sudo ln -sf /etc/nginx/sites-available/obravision /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config before SSL (temporarily disable SSL blocks)
sudo nginx -t || {
  echo "Nginx config test failed. Getting SSL certificate first..."
}

# --- 6. SSL Certificate ---
echo "[6/7] Getting SSL certificate..."
# Temporarily use HTTP-only config for certbot
sudo tee /etc/nginx/sites-available/obravision-temp > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN} api.${DOMAIN};
    location / { proxy_pass http://127.0.0.1:3000; }
}
EOF
sudo ln -sf /etc/nginx/sites-available/obravision-temp /etc/nginx/sites-enabled/obravision
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d "${DOMAIN}" -d "api.${DOMAIN}" --non-interactive --agree-tos --email "admin@${DOMAIN}" || {
  echo "Certbot failed. You may need to run it manually after DNS propagates."
  echo "Command: sudo certbot --nginx -d ${DOMAIN} -d api.${DOMAIN}"
}

# Restore full config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/obravision
sudo sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" /etc/nginx/sites-available/obravision
sudo ln -sf /etc/nginx/sites-available/obravision /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-available/obravision-temp
sudo nginx -t && sudo systemctl reload nginx

# --- 7. Start/Restart PM2 ---
echo "[7/7] Starting application..."
cd "${APP_DIR}"
pm2 delete all 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u obravision --hp /home/obravision 2>/dev/null || true

echo ""
echo "============================================"
echo " Deploy Complete!"
echo "============================================"
echo ""
echo " Web:  https://${DOMAIN}"
echo " API:  https://api.${DOMAIN}/health"
echo ""
echo " PM2:  pm2 status / pm2 logs"
echo " Nginx: sudo systemctl status nginx"
echo "============================================"
