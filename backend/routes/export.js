const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const prisma = require('../lib/prisma');
const { authenticate, restrictTo } = require('../middleware/auth');
const { formatProfileForApi, profileInclude } = require('../lib/profileHelpers');

router.get('/devotees/export', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const profiles = await prisma.devoteeProfile.findMany({
      include: profileInclude
    });

    const rows = profiles.map((p) => {
      const formatted = formatProfileForApi(p);
      return {
        devoteeId: formatted.devoteeId || '',
        name: formatted.name || '',
        email: formatted.email || '',
        mobile: formatted.mobile || '',
        center: formatted.center || '',
        spiritualName: formatted.spiritualName || '',
        gender: formatted.gender || '',
        dob: formatted.dob || '',
        bloodGroup: formatted.bloodGroup || '',
        occupation: formatted.occupation || '',
        memberType: formatted.memberType || '',
        memberStatus: formatted.memberStatus || '',
        whatsappNumber: formatted.whatsappNumber || '',
        city: formatted.addresses?.[0]?.cityDistrict || '',
        state: formatted.addresses?.[0]?.stateProvince || '',
        country: formatted.addresses?.[0]?.country || '',
        harinamInitiated: formatted.harinamInitiated ? 'Yes' : 'No',
        spiritualMaster: formatted.spiritualMaster || '',
        dateJoined: formatted.dateJoined || '',
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : ''
      };
    });

    const fields = [
      'devoteeId', 'name', 'email', 'mobile', 'center', 'spiritualName',
      'gender', 'dob', 'bloodGroup', 'occupation', 'memberType', 'memberStatus',
      'whatsappNumber', 'city', 'state', 'country', 'harinamInitiated',
      'spiritualMaster', 'dateJoined', 'createdAt'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    const filename = `bace-devotees-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
});

module.exports = router;
