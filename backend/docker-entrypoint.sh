#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until node -e "const net=require('net');const s=net.createConnection({host:process.env.DB_HOST||'db',port:process.env.DB_PORT||5432});s.on('connect',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1));"; do
  sleep 2
done

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
node prisma/seed.js

exec "$@"
