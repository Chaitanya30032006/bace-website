#!/bin/sh
# Render build script
npm install
npx prisma generate
npx prisma migrate deploy
