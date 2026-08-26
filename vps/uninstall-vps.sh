#!/bin/sh
set -eu

APP_DIR="${APP_DIR:-/var/www/donate_zks95}"
SERVICE_NAME="${SERVICE_NAME:-donate-zks95}"
DOMAIN="${1:-${DOMAIN:-}}"
SITE_URL=""

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo sh uninstall-vps.sh example.com"
  exit 1
fi

if [ -f "$APP_DIR/.env.local" ]; then
  SITE_URL="$(sed -n 's|^SITE_URL=||p' "$APP_DIR/.env.local" | head -n 1)"
fi

if [ -z "$DOMAIN" ] && [ -n "$SITE_URL" ]; then
  case "$SITE_URL" in
    https://*)
      DOMAIN="${SITE_URL#https://}"
      ;;
    http://*)
      DOMAIN="${SITE_URL#http://}"
      ;;
  esac
fi

if [ -n "$DOMAIN" ]; then
  DOMAIN="${DOMAIN#http://}"
  DOMAIN="${DOMAIN#https://}"
fi

confirm=""
if [ -r /dev/tty ]; then
  printf 'This will remove %s. Continue? [y/N]: ' "$APP_DIR" > /dev/tty
  IFS= read -r confirm </dev/tty || true
else
  printf 'This will remove %s. Continue? [y/N]: ' "$APP_DIR" >&2
  IFS= read -r confirm || true
fi
case "$confirm" in
  y|Y|yes|YES) ;;
  *) echo "Aborted."; exit 0 ;;
esac

systemctl stop "$SERVICE_NAME" 2>/dev/null || true
systemctl disable "$SERVICE_NAME" 2>/dev/null || true
rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
rm -f "/etc/nginx/sites-enabled/${SERVICE_NAME}.conf"
rm -f "/etc/nginx/sites-available/${SERVICE_NAME}.conf"

if [ -n "$SITE_URL" ] && [ "${SITE_URL#https://}" != "$SITE_URL" ]; then
  certbot delete --cert-name "$DOMAIN" --non-interactive --quiet 2>/dev/null || true
fi

rm -rf "$APP_DIR"
systemctl daemon-reload
nginx -t >/dev/null 2>&1 && systemctl reload nginx || true

echo "Removed."
