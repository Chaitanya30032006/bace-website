const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Keep Neon connection warm — ping every 4 minutes to prevent cold starts
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    try { await prisma.$queryRaw`SELECT 1`; } catch {}
  }, 4 * 60 * 1000);
}

module.exports = prisma;
