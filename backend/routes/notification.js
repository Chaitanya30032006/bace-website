const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.status(200).json({ status: 'success', data: notifications });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve notifications', error: error.message });
  }
});

router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true }
    });

    res.status(200).json({ status: 'success', message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
});

module.exports = router;
