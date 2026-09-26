const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { createProfileForUser, getProfileByUserId } = require('../lib/profileHelpers');
const { authenticate } = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validate');
const { authLimiter, registerLimiter } = require('../middleware/rateLimit');

const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

router.post('/register', registerLimiter, validate(registerSchema), async (req, res) => {
  try {
    const { name, email, mobile, password } = req.validatedBody;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const devoteeRole = await prisma.role.findUnique({ where: { name: 'Devotee' } });
    if (!devoteeRole) {
      return res.status(500).json({ message: 'Devotee role is not configured. Run database seed.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        password: hashedPassword,
        roleId: devoteeRole.id,
        status: 'Pending',
        membershipRequests: {
          create: { status: 'Pending' }
        }
      },
      include: { role: true }
    });

    const profile = await createProfileForUser({ ...user, role: user.role.name });

    res.status(201).json({
      status: 'success',
      message: 'Registration successful! Waiting for administrator approval.',
      data: {
        userId: user.id,
        devoteeId: profile.devoteeId
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role.name !== 'Admin') {
      if (user.status === 'Pending') {
        return res.status(403).json({ message: 'Your account registration is pending approval by the administrator.' });
      }
      if (user.status === 'Rejected') {
        return res.status(403).json({ message: 'Your account registration has been rejected.' });
      }
    }

    const token = signToken(user.id);

    // Include devoteeId for main admin identification on frontend
    const profile = await getProfileByUserId(user.id);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          additionalRoles: user.additionalRoles || [],
          status: user.status,
          devoteeId: profile?.devoteeId || null
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    let profile = await getProfileByUserId(req.user.id);

    if (!profile) {
      await createProfileForUser(req.user);
      profile = await getProfileByUserId(req.user.id);
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          mobile: req.user.mobile,
          role: req.user.role,
          additionalRoles: req.user.additionalRoles || [],
          status: req.user.status
        },
        profile
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving profile details', error: error.message });
  }
});

// ── Forgot Password ──

router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({ status: 'success', message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate a random token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete old tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt }
    });

    // Send reset email
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      const { sendPasswordResetEmail } = require('../utils/email');
      await sendPasswordResetEmail(user.email, token, user.name);
    }

    res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process forgot password', error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } })
    ]);

    res.status(200).json({ status: 'success', message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
});

router.get('/public-stats', async (req, res) => {
  try {
    const totalDevotees = await prisma.user.count({
      where: { status: 'Approved', role: { name: 'Devotee' } }
    });
    const totalMemories = await prisma.photo.count({ where: { isApproved: true } });
    const activeMembers = await prisma.membershipInformation.count({ where: { memberStatus: 'Active' } });

    res.status(200).json({
      status: 'success',
      data: { totalDevotees, totalMemories, activeMembers }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Unable to fetch public stats right now.'
    });
  }
});

module.exports = router;
