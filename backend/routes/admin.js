const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, restrictTo } = require('../middleware/auth');

router.use(authenticate, restrictTo('Admin'));

// Middleware to restrict to main admin only
const mainAdminOnly = async (req, res, next) => {
  const profile = await prisma.devoteeProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile || profile.devoteeId !== 'BACE-ADMIN-108') {
    return res.status(403).json({ message: 'Only the main administrator can perform this action' });
  }
  next();
};

router.get('/requests', mainAdminOnly, async (req, res) => {
  try {
    const requests = await prisma.membershipRequest.findMany({
      where: { status: 'Pending', user: { role: { name: 'Devotee' } } },
      include: {
        user: {
          select: { id: true, name: true, email: true, mobile: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const data = requests.map((request) => ({
      id: request.user.id,
      name: request.user.name,
      email: request.user.email,
      mobile: request.user.mobile,
      createdAt: request.user.createdAt,
      requestId: request.id,
      requestStatus: request.status
    }));

    res.status(200).json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving pending requests', error: error.message });
  }
});

router.post('/requests/:id/action', mainAdminOnly, async (req, res) => {
  try {
    const { action, comment } = req.body;

    if (!action || !['Approve', 'Reject'].includes(action)) {
      return res.status(400).json({ message: 'Valid action (Approve or Reject) is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const status = action === 'Approve' ? 'Approved' : 'Rejected';

    const profile = await prisma.devoteeProfile.findUnique({ where: { userId: user.id } });

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { status } });
      await tx.membershipRequest.updateMany({
        where: { userId: user.id, status: 'Pending' },
        data: {
          status,
          comment: comment || null,
          reviewedBy: req.user.id,
          reviewedAt: new Date()
        }
      });

      if (profile) {
        await tx.membershipInformation.update({
          where: { profileId: profile.id },
          data: {
            memberStatus: status === 'Approved' ? 'Active' : 'Rejected',
            memberStartDate: status === 'Approved' ? new Date() : null,
            anniversaryInfo: comment || (status === 'Approved' ? 'WEB-SIGNUP' : 'REJECTED')
          }
        });
      }

      await tx.notification.create({
        data: {
          userId: user.id,
          message: `Your membership request has been ${status.toLowerCase()} by the administrator.${comment ? ` Note: ${comment}` : ''}`,
          type: status === 'Approved' ? 'MEMBERSHIP_APPROVED' : 'MEMBERSHIP_REJECTED'
        }
      });

      await tx.auditLog.create({
        data: {
          adminId: req.user.id,
          action: `${action.toUpperCase()}_USER`,
          details: `Admin approved/rejected user ${user.name} (${user.email}). Status set to ${status}.`
        }
      });
    });

    res.status(200).json({
      status: 'success',
      message: `User registration has been successfully ${status.toLowerCase()}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Action failed', error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: { name: 'Devotee' } } });
    const approvedUsers = await prisma.user.count({ where: { status: 'Approved', role: { name: 'Devotee' } } });
    const pendingUsers = await prisma.user.count({ where: { status: 'Pending', role: { name: 'Devotee' } } });
    const totalAlbums = await prisma.album.count();
    const totalPhotos = await prisma.photo.count({ where: { isApproved: true } });
    const pendingPhotos = await prisma.photo.count({ where: { isApproved: false } });

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        approvedUsers,
        pendingUsers,
        totalAlbums,
        totalPhotos,
        pendingPhotos
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
});

// View all leave requests (all admins)
router.get('/leave-requests', async (req, res) => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      orderBy: { fromDate: 'desc' },
      include: {
        profile: {
          include: {
            user: { select: { name: true, email: true, mobile: true } },
            personalInformation: { select: { spiritualName: true } }
          }
        }
      }
    });

    const data = leaves.map(l => ({
      id: l.id,
      name: l.profile.user.name,
      spiritualName: l.profile.personalInformation?.spiritualName,
      mobile: l.profile.user.mobile,
      fromDate: l.fromDate,
      toDate: l.toDate,
      destination: l.destination,
      reason: l.reason,
      createdAt: l.createdAt
    }));

    res.json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leave requests', error: error.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { name: true, email: true } }
      }
    });

    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve logs', error: error.message });
  }
});

// ── Profile Edit Requests ──

router.get('/edit-requests', mainAdminOnly, async (req, res) => {
  try {
    const requests = await prisma.profileEditRequest.findMany({
      where: { status: 'Pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        profile: {
          include: {
            user: { select: { name: true, email: true } },
            personalInformation: { select: { spiritualName: true } }
          }
        }
      }
    });

    res.json({ status: 'success', data: requests });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve edit requests', error: error.message });
  }
});

router.post('/edit-requests/:id/action', mainAdminOnly, async (req, res) => {
  try {
    const { action } = req.body;
    if (!['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ message: 'Action must be Approved or Rejected' });
    }

    const editRequest = await prisma.profileEditRequest.findUnique({
      where: { id: req.params.id }
    });
    if (!editRequest) return res.status(404).json({ message: 'Edit request not found' });
    if (editRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' });
    }

    await prisma.profileEditRequest.update({
      where: { id: editRequest.id },
      data: {
        status: action,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      }
    });

    // If approved, unlock just that section
    if (action === 'Approved') {
      const profile = await prisma.devoteeProfile.findUnique({
        where: { id: editRequest.profileId }
      });
      const updatedSections = (profile.lockedSections || []).filter(s => s !== editRequest.section);
      await prisma.devoteeProfile.update({
        where: { id: editRequest.profileId },
        data: { lockedSections: updatedSections }
      });
    }

    res.json({ status: 'success', message: `Edit request ${action.toLowerCase()}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process edit request', error: error.message });
  }
});

// ── Promote/Demote User Role ──

router.post('/users/:id/make-admin', async (req, res) => {
  try {
    // Only the main admin can promote users
    const requester = await prisma.devoteeProfile.findUnique({ where: { userId: req.user.id } });
    if (!requester || requester.devoteeId !== 'BACE-ADMIN-108') {
      return res.status(403).json({ message: 'Only the main administrator can grant admin access' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { role: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role.name === 'Admin') {
      return res.status(400).json({ message: 'User is already an Admin' });
    }

    const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: adminRole.id, status: 'Approved' }
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'PROMOTE_TO_ADMIN',
        details: `Promoted user ${user.name} (${user.email}) to Admin role.`
      }
    });

    res.json({ status: 'success', message: `${user.name} is now an Admin` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to promote user', error: error.message });
  }
});

router.post('/users/:id/remove-admin', async (req, res) => {
  try {
    // Only the main admin can demote users
    const requester = await prisma.devoteeProfile.findUnique({ where: { userId: req.user.id } });
    if (!requester || requester.devoteeId !== 'BACE-ADMIN-108') {
      return res.status(403).json({ message: 'Only the main administrator can remove admin access' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { role: true, devoteeProfile: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot remove your own admin access' });
    }

    // Protect the main/super admin (seeded admin with BACE-ADMIN-108)
    if (user.devoteeProfile?.devoteeId === 'BACE-ADMIN-108') {
      return res.status(403).json({ message: 'The main administrator cannot be demoted' });
    }

    if (user.role.name !== 'Admin') {
      return res.status(400).json({ message: 'User is not an Admin' });
    }

    const devoteeRole = await prisma.role.findUnique({ where: { name: 'Devotee' } });
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: devoteeRole.id }
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'DEMOTE_FROM_ADMIN',
        details: `Removed admin access from ${user.name} (${user.email}).`
      }
    });

    res.json({ status: 'success', message: `${user.name} is no longer an Admin` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to demote user', error: error.message });
  }
});

module.exports = router;
