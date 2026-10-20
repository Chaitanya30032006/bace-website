#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."

until node -e 'const net = require("net"); const databaseUrl = process.env.DATABASE_URL; let host; let port = Number(process.env.DB_PORT || 5432); if (databaseUrl) { const url = new URL(databaseUrl); host = url.hostname; if (url.port) port = Number(url.port); } else { host = process.env.DB_HOST || "db"; } const socket = net.createConnection({ host, port }); socket.setTimeout(5000); socket.on("connect", () => { socket.end(); process.exit(0); }); socket.on("timeout", () => { socket.destroy(); process.exit(1); }); socket.on("error", () => process.exit(1));'; do
  echo "PostgreSQL is not reachable yet; retrying..."
  sleep 2
done

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
node prisma/seed.js

echo "Starting application..."
exec "$@"