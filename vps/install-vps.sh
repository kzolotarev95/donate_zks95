#!/bin/sh
set -eu

APP_DIR="${APP_DIR:-/var/www/donate_zks95}"
REPO_URL="${REPO_URL:-https://github.com/kzolotarev95/donate_zks95.git}"
SERVICE_NAME="${SERVICE_NAME:-donate-zks95}"
TARGET="${1:-${TARGET:-}}"
TARGET_TYPE="${TARGET_TYPE:-}"
DOMAIN="${DOMAIN:-}"
HOST="${HOST:-}"
EMAIL="${EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
ADMIN_SESSION_SECRET="${ADMIN_SESSION_SECRET:-}"
PORT="${PORT:-3000}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo sh install-vps.sh example.com"
  exit 1
fi

prompt_value() {
  prompt="$1"
  target="$2"
  reply=""

  if [ -r /dev/tty ]; then
    printf '%s' "$prompt" > /dev/tty
    if ! IFS= read -r reply </dev/tty; then
      return 1
    fi
  else
    printf '%s' "$prompt" >&2
    if ! IFS= read -r reply; then
      return 1
    fi
  fi

  eval "$target=\$reply"
}

is_ipv4() {
  case "$1" in
    ""|*[!0-9.]*)
      return 1
      ;;
  esac

  old_ifs=$IFS
  IFS=.
  set -- $1
  IFS=$old_ifs

  [ "$#" -eq 4 ] || return 1

  for octet in "$@"; do
    case "$octet" in
      ""|*[!0-9]*)
        return 1
        ;;
    esac
    [ "$octet" -ge 0 ] 2>/dev/null || return 1
    [ "$octet" -le 255 ] 2>/dev/null || return 1
  done

  return 0
}

if [ -n "$TARGET" ] && [ -z "$TARGET_TYPE" ]; then
  if is_ipv4 "$TARGET"; then
    TARGET_TYPE="ip"
    HOST="$TARGET"
  else
    TARGET_TYPE="domain"
    DOMAIN="$TARGET"
  fi
fi

if [ -z "$TARGET_TYPE" ]; then
  echo "Choose deployment target:"
  echo "1) Domain + HTTPS"
  echo "2) IP address + HTTP"
  prompt_value 'Select 1 or 2: ' TARGET_TYPE || true
fi

case "$TARGET_TYPE" in
  1|domain|DOMAIN|Domain|d|D)
    TARGET_TYPE="domain"
    ;;
  2|ip|IP|Ip|i|I)
    TARGET_TYPE="ip"
    ;;
  *)
    echo "Invalid target type. Choose domain or ip."
    exit 1
    ;;
esac

if [ "$TARGET_TYPE" = "domain" ] && [ -z "$DOMAIN" ]; then
  prompt_value 'Domain: ' DOMAIN || true
fi

if [ "$TARGET_TYPE" = "ip" ] && [ -z "$HOST" ]; then
  prompt_value 'IP address: ' HOST || true
fi

if [ "$TARGET_TYPE" = "domain" ] && [ -z "$DOMAIN" ]; then
  echo "Domain is required."
  exit 1
fi

if [ "$TARGET_TYPE" = "ip" ] && [ -z "$HOST" ]; then
  echo "IP address is required."
  exit 1
fi

if [ "$TARGET_TYPE" = "domain" ]; then
  SITE_URL="https://$DOMAIN"
  SERVER_NAME="$DOMAIN"
else
  SITE_URL="http://$HOST"
  SERVER_NAME="$HOST"
fi

NGINX_WAS_ACTIVE=0
CERTBOT_TIMER_WAS_ACTIVE=0
if systemctl is-active --quiet nginx 2>/dev/null; then
  NGINX_WAS_ACTIVE=1
  systemctl stop nginx
fi

if systemctl is-active --quiet certbot.timer 2>/dev/null; then
  CERTBOT_TIMER_WAS_ACTIVE=1
  systemctl stop certbot.timer
fi

restore_services() {
  if [ "$NGINX_WAS_ACTIVE" -eq 1 ]; then
    systemctl start nginx >/dev/null 2>&1 || true
  fi
  if [ "$CERTBOT_TIMER_WAS_ACTIVE" -eq 1 ]; then
    systemctl start certbot.timer >/dev/null 2>&1 || true
  fi
}

trap restore_services EXIT INT TERM

rand_string() {
  LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32
  printf '\n'
}

if [ "$TARGET_TYPE" = "domain" ] && [ -z "$EMAIL" ]; then
  prompt_value 'Email for certbot (optional): ' EMAIL || true
fi

apt-get update
apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  git -c safe.directory="$APP_DIR" -C "$APP_DIR" pull --ff-only
else
  git clone --depth 1 --branch main "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f .env.local ]; then
  : > .env.local
fi

get_kv() {
  key="$1"
  file="$2"
  sed -n "s/^${key}=//p" "$file" | head -n 1
}

if [ -z "$ADMIN_PASSWORD" ]; then
  ADMIN_PASSWORD="$(get_kv ADMIN_PASSWORD .env.local)"
fi

if [ -z "$ADMIN_PASSWORD" ]; then
  ADMIN_PASSWORD="$(rand_string)"
fi

if [ -z "$ADMIN_SESSION_SECRET" ]; then
  ADMIN_SESSION_SECRET="$(get_kv ADMIN_SESSION_SECRET .env.local)"
fi

if [ -z "$ADMIN_SESSION_SECRET" ]; then
  ADMIN_SESSION_SECRET="$(rand_string)$(rand_string)"
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

set_kv "SITE_URL" "$SITE_URL" .env.local
set_kv "ADMIN_PASSWORD" "$ADMIN_PASSWORD" .env.local
set_kv "ADMIN_SESSION_SECRET" "$ADMIN_SESSION_SECRET" .env.local

if [ -n "${YOOKASSA_SHOP_ID:-}" ]; then set_kv "YOOKASSA_SHOP_ID" "$YOOKASSA_SHOP_ID" .env.local; fi
if [ -n "${YOOKASSA_SECRET_KEY:-}" ]; then set_kv "YOOKASSA_SECRET_KEY" "$YOOKASSA_SECRET_KEY" .env.local; fi
if [ -n "${YOOKASSA_WEBHOOK_SECRET:-}" ]; then set_kv "YOOKASSA_WEBHOOK_SECRET" "$YOOKASSA_WEBHOOK_SECRET" .env.local; fi

npm ci
npm run build
chown -R www-data:www-data "$APP_DIR"

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
  listen 80 default_server;
  server_name _ $SERVER_NAME;

  location ^~ /_next/ {
    alias $APP_DIR/.next/;
    access_log off;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

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
systemctl start nginx

if [ "$TARGET_TYPE" = "domain" ]; then
  if [ -n "$EMAIL" ]; then
    certbot --nginx --non-interactive --agree-tos -m "$EMAIL" -d "$DOMAIN"
  else
    certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email -d "$DOMAIN"
  fi
fi

systemctl restart nginx || systemctl reload nginx || true

echo "Installed."
echo "Site: $SITE_URL"
echo "Admin password: $ADMIN_PASSWORD"
