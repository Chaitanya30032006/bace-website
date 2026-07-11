/**
 * Migrate local uploads to Cloudinary.
 * Run: node scripts/migrate-to-cloudinary.js
 * 
 * Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET in .env
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const prisma = new PrismaClient();

async function migrate() {
  if (!isCloudinaryConfigured()) {
    console.error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET in .env');
    process.exit(1);
  }

  console.log('Migrating gallery photos...');
  const photos = await prisma.photo.findMany({ where: { photoUrl: { startsWith: '/uploads/' } } });
  let migrated = 0;

  for (const photo of photos) {
    const localPath = path.join(__dirname, '..', photo.photoUrl);
    if (!fs.existsSync(localPath)) {
      console.log(`  SKIP (file missing): ${photo.photoUrl}`);
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(localPath, {
        folder: 'bace/gallery',
        quality: 'auto',
        fetch_format: 'auto'
      });

      await prisma.photo.update({
        where: { id: photo.id },
        data: { photoUrl: result.secure_url }
      });

      console.log(`  OK: ${photo.photoUrl} → ${result.secure_url}`);
      migrated++;
    } catch (err) {
      console.error(`  FAIL: ${photo.photoUrl} — ${err.message}`);
    }
  }

  console.log(`\nMigrating profile photos...`);
  const profiles = await prisma.devoteeProfile.findMany({
    where: { photographUrl: { startsWith: '/uploads/' } }
  });

  for (const profile of profiles) {
    const localPath = path.join(__dirname, '..', profile.photographUrl);
    if (!fs.existsSync(localPath)) {
      console.log(`  SKIP (file missing): ${profile.photographUrl}`);
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(localPath, {
        folder: 'bace/profiles',
        width: 400,
        height: 400,
        crop: 'fill',
        quality: 'auto'
      });

      await prisma.devoteeProfile.update({
        where: { id: profile.id },
        data: { photographUrl: result.secure_url }
      });

      console.log(`  OK: ${profile.photographUrl} → ${result.secure_url}`);
      migrated++;
    } catch (err) {
      console.error(`  FAIL: ${profile.photographUrl} — ${err.message}`);
    }
  }

  console.log(`\nDone! Migrated ${migrated} files to Cloudinary.`);
  await prisma.$disconnect();
}

migrate().catch(console.error);
