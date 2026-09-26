const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock Prisma client
jest.mock('../lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  devoteeProfile: { findUnique: jest.fn() },
  bookTest: { findUnique: jest.fn() },
  bookTestScore: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() }
}));

const prisma = require('../lib/prisma');
const { authenticate, restrictTo } = require('../middleware/auth');

// Setup minimal Express app with the devotee routes
const devoteeRoutes = require('../routes/devotee');
const app = express();
app.use(express.json());
app.use('/api/devotees', devoteeRoutes);

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

const ADMIN_USER_ID = '11111111-1111-1111-1111-111111111111';
const DEVOTEE_USER_ID = '22222222-2222-2222-2222-222222222222';
const PROFILE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const BOOK_TEST_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const SCORE_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

function makeToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = makeToken(ADMIN_USER_ID);
const devoteeToken = makeToken(DEVOTEE_USER_ID);

beforeEach(() => {
  jest.clearAllMocks();

  // Default: admin user lookup
  prisma.user.findUnique.mockImplementation(({ where }) => {
    if (where.id === ADMIN_USER_ID) {
      return Promise.resolve({ id: ADMIN_USER_ID, status: 'Approved', role: { name: 'Admin' } });
    }
    if (where.id === DEVOTEE_USER_ID) {
      return Promise.resolve({ id: DEVOTEE_USER_ID, status: 'Approved', role: { name: 'Devotee' } });
    }
    return Promise.resolve(null);
  });
});


describe('Book Test Score Validation', () => {
  describe('7.1 - marksObtained > totalMarks is rejected', () => {
    it('POST rejects score when marksObtained exceeds totalMarks', async () => {
      prisma.devoteeProfile.findUnique.mockResolvedValue({ id: PROFILE_ID, userId: ADMIN_USER_ID });
      prisma.bookTest.findUnique.mockResolvedValue({ id: BOOK_TEST_ID, totalMarks: 50 });

      const res = await request(app)
        .post(`/api/devotees/${PROFILE_ID}/book-test-scores`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bookTestId: BOOK_TEST_ID, marksObtained: 60 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot exceed total marks/i);
    });

    it('PUT rejects update when marksObtained exceeds totalMarks', async () => {
      prisma.bookTestScore.findFirst.mockResolvedValue({
        id: SCORE_ID,
        profileId: PROFILE_ID,
        bookTestId: BOOK_TEST_ID,
        bookTest: { totalMarks: 50 }
      });

      const res = await request(app)
        .put(`/api/devotees/${PROFILE_ID}/book-test-scores/${SCORE_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ marksObtained: 75 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot exceed total marks/i);
    });
  });

  describe('7.2 - duplicate profileId + bookTestId is rejected', () => {
    it('POST returns 409 when score already exists for devotee + book test', async () => {
      prisma.devoteeProfile.findUnique.mockResolvedValue({ id: PROFILE_ID, userId: ADMIN_USER_ID });
      prisma.bookTest.findUnique.mockResolvedValue({ id: BOOK_TEST_ID, totalMarks: 50 });
      prisma.bookTestScore.findUnique.mockResolvedValue({
        id: SCORE_ID,
        profileId: PROFILE_ID,
        bookTestId: BOOK_TEST_ID,
        marksObtained: 40
      });

      const res = await request(app)
        .post(`/api/devotees/${PROFILE_ID}/book-test-scores`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bookTestId: BOOK_TEST_ID, marksObtained: 30 });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('7.3 - non-admin users cannot create/edit/delete scores', () => {
    it('POST returns 403 for non-admin user', async () => {
      const res = await request(app)
        .post(`/api/devotees/${PROFILE_ID}/book-test-scores`)
        .set('Authorization', `Bearer ${devoteeToken}`)
        .send({ bookTestId: BOOK_TEST_ID, marksObtained: 30 });

      expect(res.status).toBe(403);
    });

    it('PUT returns 403 for non-admin user', async () => {
      const res = await request(app)
        .put(`/api/devotees/${PROFILE_ID}/book-test-scores/${SCORE_ID}`)
        .set('Authorization', `Bearer ${devoteeToken}`)
        .send({ marksObtained: 30 });

      expect(res.status).toBe(403);
    });

    it('DELETE returns 403 for non-admin user', async () => {
      const res = await request(app)
        .delete(`/api/devotees/${PROFILE_ID}/book-test-scores/${SCORE_ID}`)
        .set('Authorization', `Bearer ${devoteeToken}`);

      expect(res.status).toBe(403);
    });
  });
});
