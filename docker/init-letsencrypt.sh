#!/usr/bin/env bash
set -euo pipefail
DOMAIN=${1:-}
EMAIL=${2:-}
if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Usage: ./docker/init-letsencrypt.sh <domain> <email>"
  exit 1
fi

mkdir -p ./nginx/certbot/www ./nginx/certbot/conf

docker compose run --rm certbot certonly --webroot \
  --webroot-path /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos --no-eff-email \
  -d "$DOMAIN"

echo "Certificate request completed. Update nginx/default.conf domain path and reload compose."
