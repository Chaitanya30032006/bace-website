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
        await tx.memberStatusHistory.create({
          data: { profileId: profile.id, status: status === 'Approved' ? 'Active' : 'Rejected', changedBy: req.user.id }
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

// ─── Manage Additional Roles (e.g. Accountant) ─────────────────────

router.post('/users/:id/additional-roles', async (req, res) => {
  try {
    const requester = await prisma.devoteeProfile.findUnique({ where: { userId: req.user.id } });
    if (!requester || requester.devoteeId !== 'BACE-ADMIN-108') {
      return res.status(403).json({ message: 'Only the main administrator can manage additional roles' });
    }

    const { roles } = req.body; // array of role names e.g. ["Accountant"]
    if (!Array.isArray(roles)) {
      return res.status(400).json({ message: 'roles must be an array of role names' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Accountant can only be assigned to one person at a time
    if (roles.includes('Accountant')) {
      const existingAccountant = await prisma.user.findFirst({
        where: { additionalRoles: { has: 'Accountant' }, id: { not: user.id } }
      });
      if (existingAccountant) {
        return res.status(400).json({
          message: `Accountant role is already assigned to ${existingAccountant.name} (${existingAccountant.email}). Remove it from them first.`
        });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { additionalRoles: roles }
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'UPDATE_ADDITIONAL_ROLES',
        details: `Updated additional roles for ${user.name} (${user.email}) to: ${roles.join(', ') || 'none'}.`
      }
    });

    res.json({ status: 'success', message: `Additional roles updated for ${user.name}`, data: { additionalRoles: roles } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update additional roles', error: error.message });
  }
});

// ─── Manage Member Status (Active/Inactive) by Admin ─────────────────

router.post('/users/:id/member-status', async (req, res) => {
  try {
    const { memberStatus } = req.body;
    if (!memberStatus || !['Active', 'Inactive'].includes(memberStatus)) {
      return res.status(400).json({ message: 'memberStatus must be Active or Inactive' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { devoteeProfile: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.devoteeProfile) return res.status(404).json({ message: 'Profile not found' });

    const current = await prisma.membershipInformation.findUnique({ where: { profileId: user.devoteeProfile.id } });

    await prisma.membershipInformation.upsert({
      where: { profileId: user.devoteeProfile.id },
      update: { memberStatus },
      create: { profileId: user.devoteeProfile.id, memberStatus }
    });

    // Record the change so past months use the status that applied at the time
    if (current?.memberStatus !== memberStatus) {
      await prisma.memberStatusHistory.create({
        data: { profileId: user.devoteeProfile.id, status: memberStatus, changedBy: req.user.id }
      });
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'UPDATE_MEMBER_STATUS',
        details: `Set member status of ${user.name} (${user.email}) to ${memberStatus}.`
      }
    });

    res.json({ status: 'success', message: `Member status set to ${memberStatus}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update member status', error: error.message });
  }
});

// ─── Manage Duration Type (Temporary / Permanent) ────────────────────

router.post('/users/:id/duration-type', async (req, res) => {
  try {
    const { durationType } = req.body;
    if (!durationType || !['Temporary', 'Permanent'].includes(durationType)) {
      return res.status(400).json({ message: 'durationType must be Temporary or Permanent' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { devoteeProfile: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.devoteeProfile) return res.status(404).json({ message: 'Profile not found' });

    await prisma.membershipInformation.upsert({
      where: { profileId: user.devoteeProfile.id },
      update: { durationType },
      create: { profileId: user.devoteeProfile.id, durationType }
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'UPDATE_DURATION_TYPE',
        details: `Set duration type of ${user.name} (${user.email}) to ${durationType}.`
      }
    });

    res.json({ status: 'success', message: `Duration type set to ${durationType}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update duration type', error: error.message });
  }
});

// ─── Manage Member Group (Gauranga/Nityananda/BACE/Prasadam) ─────────

router.post('/users/:id/member-group', async (req, res) => {
  try {
    const { memberGroups } = req.body;
    
    if (!Array.isArray(memberGroups)) {
      return res.status(400).json({ message: 'memberGroups must be an array' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { devoteeProfile: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.devoteeProfile) return res.status(404).json({ message: 'Profile not found' });

    await prisma.membershipInformation.upsert({
      where: { profileId: user.devoteeProfile.id },
      update: { memberGroups },
      create: { profileId: user.devoteeProfile.id, memberGroups }
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'UPDATE_MEMBER_GROUPS',
        details: `Set member groups of ${user.name} (${user.email}) to: ${memberGroups.join(', ') || 'none'}.`
      }
    });

    res.json({ status: 'success', message: `Member groups updated`, data: { memberGroups } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update member groups', error: error.message });
  }
});

// ─── Manage Sub Member Group ──────────────────────────────────────

router.post('/users/:id/sub-member-group', async (req, res) => {
  try {
    const { subMemberGroups } = req.body;

    if (!Array.isArray(subMemberGroups)) {
      return res.status(400).json({ message: 'subMemberGroups must be an array' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { devoteeProfile: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.devoteeProfile) return res.status(404).json({ message: 'Profile not found' });

    await prisma.membershipInformation.upsert({
      where: { profileId: user.devoteeProfile.id },
      update: { subMemberGroups },
      create: { profileId: user.devoteeProfile.id, subMemberGroups }
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'UPDATE_SUB_MEMBER_GROUPS',
        details: `Set sub member groups of ${user.name} (${user.email}) to: ${subMemberGroups.join(', ') || 'none'}.`
      }
    });

    res.json({ status: 'success', message: `Sub member groups updated`, data: { subMemberGroups } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update sub member groups', error: error.message });
  }
});

// ─── Member Group Options Management ────────────────────────────────

// Get all member group options
router.get('/member-groups', async (req, res) => {
  try {
    const groups = await prisma.memberGroupOption.findMany({ orderBy: { name: 'asc' } });
    res.json({ status: 'success', data: groups });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch member groups', error: error.message });
  }
});

// Create a new member group option
router.post('/member-groups', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    const existing = await prisma.memberGroupOption.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ message: 'This group already exists' });
    }
    const group = await prisma.memberGroupOption.create({ data: { name: name.trim() } });
    res.status(201).json({ status: 'success', data: group });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create member group', error: error.message });
  }
});

// Delete a member group option
router.delete('/member-groups/:id', async (req, res) => {
  try {
    const group = await prisma.memberGroupOption.findUnique({ where: { id: req.params.id } });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Remove this group from any assigned profiles
    const profilesWithGroup = await prisma.membershipInformation.findMany({
      where: { memberGroups: { has: group.name } }
    });
    for (const m of profilesWithGroup) {
      await prisma.membershipInformation.update({
        where: { id: m.id },
        data: { memberGroups: m.memberGroups.filter(g => g !== group.name) }
      });
    }

    await prisma.memberGroupOption.delete({ where: { id: req.params.id } });
    res.json({ status: 'success', message: `Group "${group.name}" deleted` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete member group', error: error.message });
  }
});

// ─── Sub Member Group Options Management ────────────────────────────

// Get all sub member group options
router.get('/sub-member-groups', async (req, res) => {
  try {
    const groups = await prisma.subMemberGroupOption.findMany({ orderBy: { name: 'asc' } });
    res.json({ status: 'success', data: groups });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sub member groups', error: error.message });
  }
});

// Create a new sub member group option
router.post('/sub-member-groups', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Sub group name is required' });
    }
    const existing = await prisma.subMemberGroupOption.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ message: 'This sub group already exists' });
    }
    const group = await prisma.subMemberGroupOption.create({ data: { name: name.trim() } });
    res.status(201).json({ status: 'success', data: group });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create sub member group', error: error.message });
  }
});

// Delete a sub member group option
router.delete('/sub-member-groups/:id', async (req, res) => {
  try {
    const group = await prisma.subMemberGroupOption.findUnique({ where: { id: req.params.id } });
    if (!group) return res.status(404).json({ message: 'Sub group not found' });

    // Remove this sub group from any assigned profiles
    const profilesWithGroup = await prisma.membershipInformation.findMany({
      where: { subMemberGroups: { has: group.name } }
    });
    for (const m of profilesWithGroup) {
      await prisma.membershipInformation.update({
        where: { id: m.id },
        data: { subMemberGroups: m.subMemberGroups.filter(g => g !== group.name) }
      });
    }

    await prisma.subMemberGroupOption.delete({ where: { id: req.params.id } });
    res.json({ status: 'success', message: `Sub group "${group.name}" deleted` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete sub member group', error: error.message });
  }
});

// ─── Service Roles Management ───────────────────────────────────────

// Get all available service roles
router.get('/service-roles', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const roles = await prisma.serviceRole.findMany({ orderBy: { name: 'asc' } });
    res.json({ status: 'success', data: roles });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch service roles', error: error.message });
  }
});

// Create a new service role
router.post('/service-roles', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    const existing = await prisma.serviceRole.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ message: 'This role already exists' });
    }
    const role = await prisma.serviceRole.create({ data: { name: name.trim() } });
    res.status(201).json({ status: 'success', data: role });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create service role', error: error.message });
  }
});

// Delete a service role
router.delete('/service-roles/:id', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const role = await prisma.serviceRole.findUnique({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ message: 'Role not found' });

    // Remove this role from any assigned profiles that have it
    const profilesWithRole = await prisma.devoteeProfile.findMany({
      where: { serviceRoles: { has: role.name } }
    });
    for (const p of profilesWithRole) {
      await prisma.devoteeProfile.update({
        where: { id: p.id },
        data: { serviceRoles: p.serviceRoles.filter(r => r !== role.name) }
      });
    }

    await prisma.serviceRole.delete({ where: { id: req.params.id } });
    res.json({ status: 'success', message: `Role "${role.name}" deleted` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete service role', error: error.message });
  }
});

// Assign a service role to a devotee
router.post('/service-roles/assign', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const { profileId, roleNames } = req.body;
    if (!profileId) return res.status(400).json({ message: 'profileId is required' });

    if (!Array.isArray(roleNames)) {
      return res.status(400).json({ message: 'roleNames must be an array' });
    }

    await prisma.devoteeProfile.update({
      where: { id: profileId },
      data: { serviceRoles: roleNames }
    });

    res.json({ status: 'success', message: `Service roles updated`, data: { serviceRoles: roleNames } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign roles', error: error.message });
  }
});

// ─── Book Tests Management ──────────────────────────────────────────

// Get all book tests
router.get('/book-tests', async (req, res) => {
  try {
    const bookTests = await prisma.bookTest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { scores: true } } }
    });
    const data = bookTests.map(({ _count, ...bt }) => ({ ...bt, scoresCount: _count.scores }));
    res.json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch book tests', error: error.message });
  }
});

// Create a new book test
router.post('/book-tests', async (req, res) => {
  try {
    const { bookName, totalMarks, passingMarks } = req.body;
    if (!bookName || !bookName.trim()) {
      return res.status(400).json({ message: 'Book name is required' });
    }
    if (!totalMarks || totalMarks <= 0) {
      return res.status(400).json({ message: 'Total marks must be greater than 0' });
    }
    const pm = passingMarks !== undefined ? parseInt(passingMarks, 10) : Math.ceil(parseInt(totalMarks, 10) * 0.5);
    if (pm < 0 || pm > parseInt(totalMarks, 10)) {
      return res.status(400).json({ message: 'Passing marks must be between 0 and total marks' });
    }
    const bookTest = await prisma.bookTest.create({
      data: { bookName: bookName.trim(), totalMarks: parseInt(totalMarks, 10), passingMarks: pm }
    });
    res.status(201).json({ status: 'success', data: bookTest });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create book test', error: error.message });
  }
});

// Update a book test
router.put('/book-tests/:id', async (req, res) => {
  try {
    const { bookName, totalMarks, passingMarks } = req.body;
    const existing = await prisma.bookTest.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Book test not found' });

    const data = {};
    if (bookName && bookName.trim()) data.bookName = bookName.trim();
    const tm = totalMarks !== undefined ? parseInt(totalMarks, 10) : existing.totalMarks;
    if (totalMarks !== undefined) {
      if (tm <= 0) return res.status(400).json({ message: 'Total marks must be greater than 0' });
      data.totalMarks = tm;
    }
    if (passingMarks !== undefined) {
      const pm = parseInt(passingMarks, 10);
      if (pm < 0 || pm > tm) return res.status(400).json({ message: 'Passing marks must be between 0 and total marks' });
      data.passingMarks = pm;
    }

    const updated = await prisma.bookTest.update({ where: { id: req.params.id }, data });

    // Warn if the new total marks now invalidates previously recorded scores
    let warning = null;
    if (totalMarks !== undefined && tm < existing.totalMarks) {
      const outOfRangeCount = await prisma.bookTestScore.count({
        where: { bookTestId: req.params.id, marksObtained: { gt: tm } }
      });
      if (outOfRangeCount > 0) {
        warning = `${outOfRangeCount} recorded score(s) now exceed the new total marks of ${tm}. Please review and correct them.`;
      }
    }

    res.json({ status: 'success', data: updated, warning });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update book test', error: error.message });
  }
});

// Delete a book test (cascade deletes all related scores via Prisma schema)
router.delete('/book-tests/:id', async (req, res) => {
  try {
    const existing = await prisma.bookTest.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Book test not found' });

    const scoresCount = await prisma.bookTestScore.count({ where: { bookTestId: req.params.id } });
    if (scoresCount > 0 && req.query.force !== 'true') {
      return res.status(409).json({
        message: `This book test has ${scoresCount} recorded score(s). Deleting it will permanently remove all of them.`,
        scoresCount
      });
    }

    await prisma.bookTest.delete({ where: { id: req.params.id } });
    res.json({ status: 'success', message: `Book test "${existing.bookName}" deleted` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete book test', error: error.message });
  }
});

// Bulk marks entry: get every devotee + their score (if any) for one book test
router.get('/book-tests/:id/scores', async (req, res) => {
  try {
    const bookTest = await prisma.bookTest.findUnique({ where: { id: req.params.id } });
    if (!bookTest) return res.status(404).json({ message: 'Book test not found' });

    const profiles = await prisma.devoteeProfile.findMany({
      include: {
        user: { select: { name: true } },
        bookTestScores: { where: { bookTestId: req.params.id } }
      }
    });
    profiles.sort((a, b) => (parseInt((a.devoteeId || '').replace(/\D/g, ''), 10) || 0) - (parseInt((b.devoteeId || '').replace(/\D/g, ''), 10) || 0));

    const data = profiles.map(p => ({
      profileId: p.id,
      devoteeId: p.devoteeId,
      name: p.user?.name || null,
      photographUrl: p.photographUrl,
      scoreId: p.bookTestScores[0]?.id || null,
      marksObtained: p.bookTestScores[0]?.marksObtained ?? null
    }));

    res.json({ status: 'success', data: { bookTest, devotees: data } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bulk scores', error: error.message });
  }
});

// Bulk marks entry: upsert marks for many devotees at once for one book test
router.post('/book-tests/:id/scores/bulk', async (req, res) => {
  try {
    const bookTest = await prisma.bookTest.findUnique({ where: { id: req.params.id } });
    if (!bookTest) return res.status(404).json({ message: 'Book test not found' });

    const { entries } = req.body; // [{ profileId, marksObtained }]
    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: 'entries must be an array of { profileId, marksObtained }' });
    }

    const results = [];
    for (const entry of entries) {
      const marks = parseInt(entry.marksObtained, 10);
      if (!entry.profileId || Number.isNaN(marks)) continue;
      if (marks < 0 || marks > bookTest.totalMarks) {
        results.push({ profileId: entry.profileId, error: `Marks must be between 0 and ${bookTest.totalMarks}` });
        continue;
      }
      const score = await prisma.bookTestScore.upsert({
        where: { profileId_bookTestId: { profileId: entry.profileId, bookTestId: req.params.id } },
        update: { marksObtained: marks },
        create: { profileId: entry.profileId, bookTestId: req.params.id, marksObtained: marks }
      });
      results.push({ profileId: entry.profileId, score });
    }

    res.json({ status: 'success', data: results });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save bulk scores', error: error.message });
  }
});

module.exports = router;
