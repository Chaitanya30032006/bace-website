const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isCloudinaryConfigured, cloudinary } = require('../config/cloudinary');
const prisma = require('../lib/prisma');
const {
  getProfileById,
  formatProfileForApi,
  profileInclude,
  computeBookProgress,
  reverseMemberType
} = require('../lib/profileHelpers');
const { authenticate, restrictTo } = require('../middleware/auth');
const { validate, profileUpdateSchema, chantingSchema, courseSchema, educationSchema, bookProgressSchema } = require('../middleware/validate');
const { validateImageMagicBytes } = require('../middleware/fileValidation');

const profileUploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

const profilePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const profilePhotoUpload = multer({
  storage: profilePhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/i;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed'));
  }
});

const checkAccess = (req, profileUserId) => req.user.role === 'Admin' || req.user.id === profileUserId;

router.get('/', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const { name, spiritualName, devoteeId, center, memberType, city, occupation } = req.query;

    const profiles = await prisma.devoteeProfile.findMany({
      where: {
        ...(devoteeId ? { devoteeId: { contains: devoteeId, mode: 'insensitive' } } : {}),
        ...(center ? { center: { contains: center, mode: 'insensitive' } } : {}),
        ...(spiritualName
          ? { personalInformation: { spiritualName: { contains: spiritualName, mode: 'insensitive' } } }
          : {}),
        ...(memberType
          ? { membershipInformation: { memberType: reverseMemberType(memberType) } }
          : {}),
        ...(occupation
          ? { personalInformation: { occupation: { contains: occupation, mode: 'insensitive' } } }
          : {}),
        ...(city
          ? { addresses: { some: { cityDistrict: { contains: city, mode: 'insensitive' } } } }
          : {}),
        ...(name ? { user: { name: { contains: name, mode: 'insensitive' } } } : {})
      },
      include: profileInclude
    });

    const devotees = profiles.map(formatProfileForApi);
    res.status(200).json({ status: 'success', results: devotees.length, data: devotees });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching devotee list', error: error.message });
  }
});

router.post('/:id/photo', authenticate, profilePhotoUpload.single('photo'), validateImageMagicBytes, async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (!checkAccess(req, profile.userId)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Access denied. You can only edit your own profile.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image file to upload' });
    }

    let photographUrl;
    if (isCloudinaryConfigured()) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'bace/profiles',
        width: 400,
        height: 400,
        crop: 'fill',
        quality: 'auto'
      });
      photographUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    } else {
      photographUrl = `/uploads/profiles/${req.file.filename}`;
    }

    if (profile.photographUrl && profile.photographUrl.startsWith('/uploads/profiles/')) {
      const oldPath = path.join(__dirname, '..', profile.photographUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await prisma.devoteeProfile.update({
      where: { id: profile.id },
      data: { photographUrl }
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile photo uploaded successfully',
      data: { photographUrl }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Profile photo upload failed', error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const profile = await getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (!checkAccess(req, profile.userId)) {
      return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
    }

    res.status(200).json({ status: 'success', data: profile });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
});

router.put('/:id', authenticate, validate(profileUpdateSchema), async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({
      where: { id: req.params.id },
      include: { user: true, personalInformation: true, communicationInformation: true, membershipInformation: true }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (!checkAccess(req, profile.userId)) {
      return res.status(403).json({ message: 'Access denied. You can only edit your own profile.' });
    }

    // If profile is locked and user is not Admin, block the edit
    if (profile.profileLocked && req.user.role !== 'Admin') {
      return res.status(403).json({
        message: 'Your profile is locked. Please request edit permission from the admin.',
        profileLocked: true
      });
    }

    const { basicInfo, personalInfo, addressInfo, familyInfo, educationInfo, devotionalInfo, communicationInfo, membershipInfo } = req.body;

    // Per-section lock check for non-admin users
    if (req.user.role !== 'Admin') {
      const locked = profile.lockedSections || [];
      const sectionsBeingEdited = [];
      if (basicInfo) sectionsBeingEdited.push('basicInfo');
      if (personalInfo) sectionsBeingEdited.push('personalInfo');
      if (communicationInfo) sectionsBeingEdited.push('communicationInfo');
      if (addressInfo && addressInfo.length > 0) sectionsBeingEdited.push('addressInfo');
      if (familyInfo) sectionsBeingEdited.push('familyInfo');
      if (educationInfo) sectionsBeingEdited.push('educationInfo');
      if (devotionalInfo) sectionsBeingEdited.push('devotionalInfo');
      if (membershipInfo) sectionsBeingEdited.push('membershipInfo');

      const blockedSections = sectionsBeingEdited.filter(s => locked.includes(s));
      if (blockedSections.length > 0) {
        return res.status(403).json({
          message: `The following sections are locked: ${blockedSections.join(', ')}. Please request edit permission from admin.`,
          lockedSections: blockedSections
        });
      }
    }

    if (basicInfo) {
      if (basicInfo.name || basicInfo.mobile) {
        await prisma.user.update({
          where: { id: profile.userId },
          data: {
            ...(basicInfo.name ? { name: basicInfo.name } : {}),
            ...(basicInfo.mobile ? { mobile: basicInfo.mobile } : {})
          }
        });
      }

      await prisma.devoteeProfile.update({
        where: { id: profile.id },
        data: {
          center: basicInfo.center,
          photographUrl: basicInfo.photographUrl
        }
      });

      await prisma.personalInformation.upsert({
        where: { profileId: profile.id },
        update: {
          spiritualName: basicInfo.spiritualName,
          gender: basicInfo.gender,
          dob: basicInfo.dob ? new Date(basicInfo.dob) : null,
          bloodGroup: basicInfo.bloodGroup,
          harinamInitiated: basicInfo.harinamInitiated,
          initiatedName: basicInfo.initiatedName,
          spiritualMaster: basicInfo.spiritualMaster,
          initiatedDatePlace: basicInfo.initiatedDatePlace,
          initiationCeremony: basicInfo.initiationCeremony,
          brahminInitiated: basicInfo.brahminInitiated,
          panNumber: basicInfo.panNumber,
          aadharNumber: basicInfo.aadharNumber,
          previousReligion: basicInfo.previousReligion,
          firstLanguage: basicInfo.firstLanguage,
          languagesKnown: basicInfo.languagesKnown,
          citizenOf: basicInfo.citizenOf,
          caste: basicInfo.caste
        },
        create: {
          profileId: profile.id,
          spiritualName: basicInfo.spiritualName,
          gender: basicInfo.gender,
          dob: basicInfo.dob ? new Date(basicInfo.dob) : null,
          bloodGroup: basicInfo.bloodGroup,
          harinamInitiated: basicInfo.harinamInitiated ?? false,
          initiatedName: basicInfo.initiatedName,
          spiritualMaster: basicInfo.spiritualMaster,
          initiatedDatePlace: basicInfo.initiatedDatePlace,
          initiationCeremony: basicInfo.initiationCeremony,
          brahminInitiated: basicInfo.brahminInitiated ?? false,
          panNumber: basicInfo.panNumber,
          aadharNumber: basicInfo.aadharNumber,
          previousReligion: basicInfo.previousReligion,
          firstLanguage: basicInfo.firstLanguage,
          languagesKnown: basicInfo.languagesKnown,
          citizenOf: basicInfo.citizenOf,
          caste: basicInfo.caste
        }
      });

      if (basicInfo.whatsappNumber !== undefined) {
        await prisma.communicationInformation.upsert({
          where: { profileId: profile.id },
          update: { whatsappNumber: basicInfo.whatsappNumber },
          create: { profileId: profile.id, whatsappNumber: basicInfo.whatsappNumber }
        });
      }

      if (req.user.role === 'Admin') {
        await prisma.membershipInformation.upsert({
          where: { profileId: profile.id },
          update: {
            memberType: basicInfo.memberType ? reverseMemberType(basicInfo.memberType) : undefined,
            memberStatus: basicInfo.memberStatus,
            memberStartDate: basicInfo.memberStartDate ? new Date(basicInfo.memberStartDate) : null,
            memberExpiryDate: basicInfo.memberExpiryDate ? new Date(basicInfo.memberExpiryDate) : null
          },
          create: {
            profileId: profile.id,
            memberType: basicInfo.memberType ? reverseMemberType(basicInfo.memberType) : 'General',
            memberStatus: basicInfo.memberStatus || 'Active',
            memberStartDate: basicInfo.memberStartDate ? new Date(basicInfo.memberStartDate) : null,
            memberExpiryDate: basicInfo.memberExpiryDate ? new Date(basicInfo.memberExpiryDate) : null
          }
        });
      }
    }

    if (personalInfo) {
      await prisma.personalInformation.upsert({
        where: { profileId: profile.id },
        update: {
          occupation: personalInfo.occupation,
          companyOrg: personalInfo.companyOrg,
          skills: personalInfo.skills,
          interests: personalInfo.interests,
          hobbies: personalInfo.hobbies
        },
        create: {
          profileId: profile.id,
          occupation: personalInfo.occupation,
          companyOrg: personalInfo.companyOrg,
          skills: personalInfo.skills,
          interests: personalInfo.interests,
          hobbies: personalInfo.hobbies
        }
      });
    }

    if (communicationInfo) {
      if (communicationInfo.mobile) {
        await prisma.user.update({
          where: { id: profile.userId },
          data: { mobile: communicationInfo.mobile }
        });
      }
      await prisma.communicationInformation.upsert({
        where: { profileId: profile.id },
        update: { whatsappNumber: communicationInfo.whatsappNumber || null },
        create: { profileId: profile.id, whatsappNumber: communicationInfo.whatsappNumber || null }
      });
    }

    if (familyInfo) {
      await prisma.familyInformation.upsert({
        where: { profileId: profile.id },
        update: {
          fatherName: familyInfo.fatherName,
          motherName: familyInfo.motherName,
          fatherContact: familyInfo.fatherContact,
          motherContact: familyInfo.motherContact,
          emergencyContact: familyInfo.emergencyContact
        },
        create: {
          profileId: profile.id,
          fatherName: familyInfo.fatherName,
          motherName: familyInfo.motherName,
          fatherContact: familyInfo.fatherContact,
          motherContact: familyInfo.motherContact,
          emergencyContact: familyInfo.emergencyContact
        }
      });
    }

    if (devotionalInfo) {
      await prisma.devotionalInformation.upsert({
        where: { profileId: profile.id },
        update: {
          dateJoined: devotionalInfo.dateJoined ? new Date(devotionalInfo.dateJoined) : null,
          introducedBy: devotionalInfo.introducedBy,
          introducedWhen: devotionalInfo.introducedWhen,
          firstConnectedCenter: devotionalInfo.firstConnectedCenter,
          spiritualGuide: devotionalInfo.spiritualGuide,
          programDetails: devotionalInfo.programDetails
        },
        create: {
          profileId: profile.id,
          dateJoined: devotionalInfo.dateJoined ? new Date(devotionalInfo.dateJoined) : null,
          introducedBy: devotionalInfo.introducedBy,
          introducedWhen: devotionalInfo.introducedWhen,
          firstConnectedCenter: devotionalInfo.firstConnectedCenter,
          spiritualGuide: devotionalInfo.spiritualGuide,
          programDetails: devotionalInfo.programDetails
        }
      });
    }

    if (addressInfo && Array.isArray(addressInfo)) {
      for (const addr of addressInfo) {
        if (!addr.type || !addr.houseStreetPO) continue;

        const payload = {
          type: addr.type,
          houseStreetPO: addr.houseStreetPO,
          country: addr.country || 'India',
          stateProvince: addr.stateProvince,
          cityDistrict: addr.cityDistrict,
          pinZip: addr.pinZip || null
        };

        if (addr.id) {
          await prisma.addressInformation.updateMany({
            where: { id: addr.id, profileId: profile.id },
            data: payload
          });
        } else {
          const existing = await prisma.addressInformation.findFirst({
            where: { profileId: profile.id, type: addr.type }
          });
          if (existing) {
            await prisma.addressInformation.update({ where: { id: existing.id }, data: payload });
          } else {
            await prisma.addressInformation.create({ data: { ...payload, profileId: profile.id } });
          }
        }
      }
    }

    if (educationInfo) {
      // Reserved for bulk education updates from clients
    }

    // Lock edited sections after a non-admin user saves
    if (req.user.role !== 'Admin') {
      const currentLocked = profile.lockedSections || [];
      const newlyLocked = [];
      if (basicInfo && !currentLocked.includes('basicInfo')) newlyLocked.push('basicInfo');
      if (personalInfo && !currentLocked.includes('personalInfo')) newlyLocked.push('personalInfo');
      if (communicationInfo && !currentLocked.includes('communicationInfo')) newlyLocked.push('communicationInfo');
      if (addressInfo && addressInfo.length > 0 && !currentLocked.includes('addressInfo')) newlyLocked.push('addressInfo');
      if (familyInfo && !currentLocked.includes('familyInfo')) newlyLocked.push('familyInfo');
      if (educationInfo && !currentLocked.includes('educationInfo')) newlyLocked.push('educationInfo');
      if (devotionalInfo && !currentLocked.includes('devotionalInfo')) newlyLocked.push('devotionalInfo');
      if (membershipInfo && !currentLocked.includes('membershipInfo')) newlyLocked.push('membershipInfo');

      if (newlyLocked.length > 0) {
        await prisma.devoteeProfile.update({
          where: { id: profile.id },
          data: { lockedSections: [...currentLocked, ...newlyLocked] }
        });
      }
    }

    res.status(200).json({ status: 'success', message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
});

router.delete('/:id', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await prisma.user.delete({ where: { id: profile.userId } });
    res.status(200).json({ status: 'success', message: 'Devotee profile and user account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete devotee profile', error: error.message });
  }
});

router.put('/:id/books/:bookId', authenticate, validate(bookProgressSchema), async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (!checkAccess(req, profile.userId)) return res.status(403).json({ message: 'Access denied' });

    const { completedChapters, lastReadDate, notes, remarks } = req.validatedBody;
    const book = await prisma.bookReadingProgress.findFirst({
      where: { id: req.params.bookId, profileId: profile.id }
    });

    if (!book) return res.status(404).json({ message: 'Book progress entry not found' });
    if (completedChapters > book.totalChapters) {
      return res.status(400).json({ message: `Completed chapters cannot exceed total chapters (${book.totalChapters})` });
    }

    const progress = computeBookProgress(completedChapters, book.totalChapters);
    const updated = await prisma.bookReadingProgress.update({
      where: { id: book.id },
      data: {
        completedChapters,
        lastReadDate: lastReadDate ? new Date(lastReadDate) : new Date(),
        notes,
        remarks,
        readingPercentage: progress.readingPercentage,
        status: progress.status
      }
    });

    res.status(200).json({ status: 'success', message: 'Book progress updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update book progress', error: error.message });
  }
});

router.post('/:id/chanting', authenticate, validate(chantingSchema), async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (!checkAccess(req, profile.userId)) return res.status(403).json({ message: 'Access denied' });

    const { rounds, startDate } = req.validatedBody;

    const chanting = await prisma.chantingTimeline.create({
      data: {
        profileId: profile.id,
        rounds,
        startDate: new Date(startDate)
      }
    });

    res.status(201).json({ status: 'success', data: chanting });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add chanting record', error: error.message });
  }
});

router.post('/:id/education', authenticate, validate(educationSchema), async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (!checkAccess(req, profile.userId)) return res.status(403).json({ message: 'Access denied' });

    const { qualification, school, college, degree, specialization, passingYear } = req.validatedBody;
    const edu = await prisma.educationInformation.create({
      data: {
        profileId: profile.id,
        qualification,
        school,
        college,
        degree,
        specialization,
        passingYear
      }
    });

    res.status(201).json({ status: 'success', data: edu });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add academic record', error: error.message });
  }
});

router.post('/:id/courses', authenticate, validate(courseSchema), async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (!checkAccess(req, profile.userId)) return res.status(403).json({ message: 'Access denied' });

    const { courseName, completionYear, docUrl, status } = req.validatedBody;
    const course = await prisma.devotionalCourse.create({
      data: {
        profileId: profile.id,
        courseName,
        completionYear,
        docUrl,
        status
      }
    });

    res.status(201).json({ status: 'success', data: course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add course record', error: error.message });
  }
});

router.delete('/:id/education/:eduId', authenticate, async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (!checkAccess(req, profile.userId)) return res.status(403).json({ message: 'Access denied' });

    await prisma.educationInformation.deleteMany({
      where: { id: req.params.eduId, profileId: profile.id }
    });

    res.status(200).json({ status: 'success', message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete record', error: error.message });
  }
});

// ── Monthly Payments Endpoints ──

// Get payment history for a devotee
router.get('/:id/payments', authenticate, async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (!checkAccess(req, profile.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payments = await prisma.monthlyPayment.findMany({
      where: { profileId: profile.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    const totalPaid = payments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Calculate months from first payment or current year start
    const monthlyFee = profile.monthlyFee || 0;
    const totalExpected = payments.length > 0
      ? payments.filter(p => p.year < currentYear || (p.year === currentYear && p.month <= currentMonth)).length * monthlyFee
      : 0;
    const totalRemaining = Math.max(0, totalExpected - totalPaid);

    res.json({
      status: 'success',
      data: {
        payments,
        summary: {
          monthlyFee,
          totalPaid,
          totalExpected,
          totalRemaining,
          depositPaid: profile.depositPaid,
          depositAmount: profile.depositAmount,
          depositPaidAt: profile.depositPaidAt,
          depositRemarks: profile.depositRemarks
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve payments', error: error.message });
  }
});

// Admin marks a month as paid/unpaid
router.post('/:id/payments', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const { year, month, status, amount, remarks } = req.body;
    if (!year || !month || !status) {
      return res.status(400).json({ message: 'year, month, and status are required' });
    }
    if (!['Paid', 'Unpaid'].includes(status)) {
      return res.status(400).json({ message: 'status must be Paid or Unpaid' });
    }

    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const payment = await prisma.monthlyPayment.upsert({
      where: {
        profileId_year_month: { profileId: profile.id, year: parseInt(year), month: parseInt(month) }
      },
      update: {
        status,
        amount: amount ? parseFloat(amount) : null,
        remarks: remarks || null,
        paidAt: status === 'Paid' ? new Date() : null
      },
      create: {
        profileId: profile.id,
        year: parseInt(year),
        month: parseInt(month),
        status,
        amount: amount ? parseFloat(amount) : null,
        remarks: remarks || null,
        paidAt: status === 'Paid' ? new Date() : null
      }
    });

    res.json({ status: 'success', data: payment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payment', error: error.message });
  }
});

// Admin sets monthly fee for a devotee
router.put('/:id/monthly-fee', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const { monthlyFee } = req.body;
    if (monthlyFee === undefined || monthlyFee === null) {
      return res.status(400).json({ message: 'monthlyFee is required' });
    }

    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    await prisma.devoteeProfile.update({
      where: { id: profile.id },
      data: { monthlyFee: parseFloat(monthlyFee) }
    });

    res.json({ status: 'success', message: 'Monthly fee updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update monthly fee', error: error.message });
  }
});

// Admin marks deposit as paid/unpaid
router.put('/:id/deposit', authenticate, restrictTo('Admin'), async (req, res) => {
  try {
    const { depositPaid, depositAmount, remarks } = req.body;
    if (depositPaid === undefined) {
      return res.status(400).json({ message: 'depositPaid is required' });
    }

    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    await prisma.devoteeProfile.update({
      where: { id: profile.id },
      data: {
        depositPaid: Boolean(depositPaid),
        depositAmount: depositAmount ? parseFloat(depositAmount) : profile.depositAmount,
        depositPaidAt: depositPaid ? new Date() : null,
        depositRemarks: remarks || profile.depositRemarks
      }
    });

    res.json({ status: 'success', message: `Deposit marked as ${depositPaid ? 'paid' : 'unpaid'}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update deposit', error: error.message });
  }
});

// ── Profile Edit Request Endpoints ──

// Devotee requests edit permission for a specific section
router.post('/:id/request-edit', authenticate, async (req, res) => {
  try {
    const { section } = req.body;
    const validSections = ['basicInfo', 'personalInfo', 'communicationInfo', 'addressInfo', 'familyInfo', 'educationInfo', 'devotionalInfo', 'membershipInfo'];
    if (!section || !validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section. Must be one of: ' + validSections.join(', ') });
    }

    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only request edit for your own profile.' });
    }

    const locked = profile.lockedSections || [];
    if (!locked.includes(section)) {
      return res.status(400).json({ message: `Section "${section}" is not locked. You can edit freely.` });
    }

    // Check for existing pending request for this section
    const existing = await prisma.profileEditRequest.findFirst({
      where: { profileId: profile.id, section, status: 'Pending' }
    });
    if (existing) {
      return res.status(400).json({ message: `You already have a pending edit request for "${section}".` });
    }

    const request = await prisma.profileEditRequest.create({
      data: {
        profileId: profile.id,
        section,
        reason: req.body.reason || null
      }
    });

    res.status(201).json({ status: 'success', message: 'Edit request submitted', editRequest: request });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit edit request', error: error.message });
  }
});

// Devotee checks their edit request status (all sections)
router.get('/:id/edit-request-status', authenticate, async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.userId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const pendingRequests = await prisma.profileEditRequest.findMany({
      where: { profileId: profile.id, status: 'Pending' },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      lockedSections: profile.lockedSections || [],
      pendingRequests
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check edit request status', error: error.message });
  }
});

// ── Leave / Going Home Requests ──

// Devotee submits a leave form
router.post('/:id/leave', authenticate, async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (!checkAccess(req, profile.userId)) return res.status(403).json({ message: 'Access denied' });

    const { fromDate, toDate, destination, reason } = req.body;
    if (!fromDate || !toDate || !destination) {
      return res.status(400).json({ message: 'fromDate, toDate, and destination are required' });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        profileId: profile.id,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        destination,
        reason: reason || null
      }
    });

    res.status(201).json({ status: 'success', message: 'Leave request submitted', data: leave });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit leave request', error: error.message });
  }
});

// Get leave history for a devotee
router.get('/:id/leave', authenticate, async (req, res) => {
  try {
    const profile = await prisma.devoteeProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (!checkAccess(req, profile.userId)) return res.status(403).json({ message: 'Access denied' });

    const leaves = await prisma.leaveRequest.findMany({
      where: { profileId: profile.id },
      orderBy: { fromDate: 'desc' }
    });

    res.json({ status: 'success', data: leaves });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leave history', error: error.message });
  }
});

module.exports = router;
