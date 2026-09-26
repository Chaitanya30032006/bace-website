const { PrismaClient } = require('@prisma/client');

// Append connection_limit to DATABASE_URL for Neon/serverless Postgres compatibility
const dbUrl = process.env.DATABASE_URL || '';
const separator = dbUrl.includes('?') ? '&' : '?';
const pooledUrl = dbUrl.includes('connection_limit')
  ? dbUrl
  : `${dbUrl}${separator}connection_limit=10`;

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: pooledUrl
    }
  }
});

// Keep Neon connection warm — ping every 2 minutes to prevent cold starts
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    try { await prisma.$queryRaw`SELECT 1`; } catch {}
  }, 2 * 60 * 1000);
}

module.exports = prisma;
