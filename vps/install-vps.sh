#!/bin/sh
set -eu

APP_DIR="${APP_DIR:-/var/www/donate_zks95}"
REPO_URL="${REPO_URL:-https://github.com/kzolotarev95/donate_zks95.git}"
SERVICE_NAME="${SERVICE_NAME:-donate-zks95}"
DOMAIN="${1:-${DOMAIN:-}}"
EMAIL="${EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
ADMIN_SESSION_SECRET="${ADMIN_SESSION_SECRET:-}"
PORT="${PORT:-3000}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo sh install-vps.sh example.com"
  exit 1
fi

if [ -z "$DOMAIN" ]; then
  printf 'Domain: '
  read -r DOMAIN
fi

if [ -z "$DOMAIN" ]; then
  echo "Domain is required."
  exit 1
fi

rand_string() {
  LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32
  printf '\n'
}

if [ -z "$ADMIN_PASSWORD" ]; then
  ADMIN_PASSWORD="$(rand_string)"
fi

if [ -z "$ADMIN_SESSION_SECRET" ]; then
  ADMIN_SESSION_SECRET="$(rand_string)$(rand_string)"
fi

if [ -z "$EMAIL" ]; then
  printf 'Email for certbot (optional): '
  read -r EMAIL || true
fi

apt-get update
apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone --depth 1 --branch main "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f .env.local ]; then
  cp .env.example .env.local
fi

set_kv() {
  key="$1"
  value="$2"
  file="$3"
  tmp="$(mktemp)"
  if grep -q "^${key}=" "$file"; then
    awk -v key="$key" -v value="$value" '
      BEGIN { FS = "="; OFS = "=" }
      $1 == key { $0 = key OFS value }
      { print }
    ' "$file" > "$tmp"
  else
    cat "$file" > "$tmp"
    printf '%s=%s\n' "$key" "$value" >> "$tmp"
  fi
  mv "$tmp" "$file"
}

set_kv "SITE_URL" "https://$DOMAIN" .env.local
set_kv "ADMIN_PASSWORD" "$ADMIN_PASSWORD" .env.local
set_kv "ADMIN_SESSION_SECRET" "$ADMIN_SESSION_SECRET" .env.local

if [ -n "${YOOKASSA_SHOP_ID:-}" ]; then set_kv "YOOKASSA_SHOP_ID" "$YOOKASSA_SHOP_ID" .env.local; fi
if [ -n "${YOOKASSA_SECRET_KEY:-}" ]; then set_kv "YOOKASSA_SECRET_KEY" "$YOOKASSA_SECRET_KEY" .env.local; fi
if [ -n "${YOOKASSA_WEBHOOK_SECRET:-}" ]; then set_kv "YOOKASSA_WEBHOOK_SECRET" "$YOOKASSA_WEBHOOK_SECRET" .env.local; fi

npm ci
npm run build

cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=donate_zks95 Next.js app
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env.local
ExecStart=/usr/bin/npm run start -- --port $PORT
Restart=always
RestartSec=5
User=www-data

[Install]
WantedBy=multi-user.target
EOF

cat > "/etc/nginx/sites-available/${SERVICE_NAME}.conf" <<EOF
server {
  listen 80;
  server_name $DOMAIN;

  location / {
    proxy_pass http://127.0.0.1:$PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
EOF

ln -sf "/etc/nginx/sites-available/${SERVICE_NAME}.conf" "/etc/nginx/sites-enabled/${SERVICE_NAME}.conf"
rm -f /etc/nginx/sites-enabled/default

systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"
nginx -t
systemctl reload nginx

if [ -n "$EMAIL" ]; then
  certbot --nginx --non-interactive --agree-tos -m "$EMAIL" -d "$DOMAIN"
else
  certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email -d "$DOMAIN"
fi

systemctl reload nginx || true

echo "Installed."
echo "Site: https://$DOMAIN"
echo "Admin password: $ADMIN_PASSWORD"
