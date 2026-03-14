#!/bin/bash
# ============================================
# ObraVision VPS Setup Script
# Ubuntu 22.04/24.04 - Contabo 4GB RAM
# ============================================
# Run as root: bash setup-vps.sh
# ============================================

set -e

echo "============================================"
echo " ObraVision VPS Setup"
echo "============================================"

# --- 1. System update ---
echo "[1/8] Updating system..."
apt update && apt upgrade -y

# --- 2. Install Node.js 20 LTS ---
echo "[2/8] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pnpm@10 pm2

echo "Node: $(node -v) | pnpm: $(pnpm -v) | PM2: $(pm2 -v)"

# --- 3. Install PostgreSQL 16 ---
echo "[3/8] Installing PostgreSQL 16..."
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
apt update
apt install -y postgresql-16

# Create database and user
DB_PASSWORD=$(openssl rand -base64 24)
sudo -u postgres psql <<SQL
CREATE USER obravision WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE obravision OWNER obravision;
GRANT ALL PRIVILEGES ON DATABASE obravision TO obravision;
SQL

echo "PostgreSQL user created. Password: ${DB_PASSWORD}"
echo "DATABASE_URL=postgresql://obravision:${DB_PASSWORD}@localhost:5432/obravision" > /tmp/obravision-db-url.txt

# --- 4. Install Redis ---
echo "[4/8] Installing Redis..."
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Verify Redis
redis-cli ping

# --- 5. Install Nginx ---
echo "[5/8] Installing Nginx..."
apt install -y nginx
systemctl enable nginx

# --- 6. Install Certbot (Let's Encrypt SSL) ---
echo "[6/8] Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# --- 7. Create app user ---
echo "[7/8] Creating app user..."
useradd -m -s /bin/bash obravision || echo "User already exists"
mkdir -p /home/obravision/app
chown -R obravision:obravision /home/obravision

# --- 8. Firewall ---
echo "[8/8] Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

echo ""
echo "============================================"
echo " Setup Complete!"
echo "============================================"
echo ""
echo "Save these credentials:"
echo ""
cat /tmp/obravision-db-url.txt
echo "REDIS_URL=redis://localhost:6379"
echo ""
echo "Next steps:"
echo "1. Configure your domain DNS (A record -> $(curl -s ifconfig.me))"
echo "2. Copy your code to /home/obravision/app/"
echo "3. Run: bash deploy/deploy.sh"
echo "============================================"
