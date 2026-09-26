#!/bin/sh
# init-letsencrypt.sh — First-time certificate generation for Let's Encrypt
# Usage: DOMAIN=yourdomain.com EMAIL=you@example.com ./scripts/init-letsencrypt.sh
#
# Run this ONCE before starting the full stack with SSL enabled.
# After this, the certbot container handles automatic renewal.

set -e

DOMAIN="${DOMAIN:?Set DOMAIN env var (e.g. bace.example.com)}"
EMAIL="${EMAIL:?Set EMAIL env var for Let's Encrypt notifications}"
STAGING="${STAGING:-0}"  # Set to 1 for testing (avoids rate limits)

DATA_PATH="./certbot"

if [ -d "$DATA_PATH/conf/live/$DOMAIN" ]; then
  echo "Certificates already exist for $DOMAIN. Delete $DATA_PATH to re-generate."
  exit 0
fi

echo "### Creating required directories..."
mkdir -p "$DATA_PATH/conf" "$DATA_PATH/www"

echo "### Downloading recommended TLS parameters..."
mkdir -p "$DATA_PATH/conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
  > "$DATA_PATH/conf/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
  > "$DATA_PATH/conf/ssl-dhparams.pem"

echo "### Creating dummy certificate for $DOMAIN..."
mkdir -p "$DATA_PATH/conf/live/$DOMAIN"
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout '/etc/letsencrypt/live/$DOMAIN/privkey.pem' \
    -out '/etc/letsencrypt/live/$DOMAIN/fullchain.pem' \
    -subj '/CN=localhost'" certbot

echo "### Starting nginx with dummy certificate..."
docker compose up -d frontend

echo "### Removing dummy certificate..."
docker compose run --rm --entrypoint "\
  rm -rf /etc/letsencrypt/live/$DOMAIN && \
  rm -rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

echo "### Requesting real certificate from Let's Encrypt..."
STAGING_ARG=""
if [ "$STAGING" = "1" ]; then
  STAGING_ARG="--staging"
fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    --domain $DOMAIN \
    --rsa-key-size 4096 \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

echo "### Reloading nginx with real certificate..."
docker compose exec frontend nginx -s reload

echo ""
echo "### Done! SSL certificate installed for $DOMAIN"
echo "### The certbot container will auto-renew every 12 hours."
