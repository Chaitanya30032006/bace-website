const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const prisma = require('./lib/prisma');
const { repairMissingProfiles } = require('./lib/profileHelpers');
const { apiLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth');
const devoteeRoutes = require('./routes/devotee');
const adminRoutes = require('./routes/admin');
const galleryRoutes = require('./routes/gallery');
const notificationRoutes = require('./routes/notification');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy so Express reads real client IPs from X-Forwarded-For
// (required behind Nginx, Render, or any reverse proxy — without this,
//  rate limiters treat ALL users as a single IP and block everyone)
app.set('trust proxy', 1);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. PostgreSQL must be configured — SQLite is not supported.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_me_in_production')) {
  console.error('FATAL: JWT_SECRET must be set to a strong secret in production.');
  process.exit(1);
}

// Security headers
app.use(helmet());

// Gzip compression for all responses
app.use(compression());

// CORS: restrict to known frontend origins
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files — allow token via query param for <img> tags
const { authenticate } = require('./middleware/auth');
app.use('/uploads', (req, res, next) => {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}, authenticate, express.static(path.join(__dirname, 'uploads')));

// Global rate limit
app.use('/api', apiLimiter);

// Cache public stats for 5 minutes (most-hit unauthenticated endpoint)
app.use('/api/auth/public-stats', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/devotees', devoteeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/export', exportRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'healthy', database: 'postgresql', timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy' });
  }
});

// Global error handler — never leak internal details in production
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    message: isProd ? 'Internal server error' : err.message
  });
});

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connection established successfully.');

    await repairMissingProfiles();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to PostgreSQL or start the server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
