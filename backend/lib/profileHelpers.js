const prisma = require('./prisma');

const DEFAULT_BOOKS = [
  { name: 'Bhagavad Gita', chapters: 18 },
  { name: 'Srimad Bhagavatam', chapters: 335 },
  { name: 'Chaitanya Charitamrita', chapters: 150 },
  { name: 'Nectar of Devotion', chapters: 51 },
  { name: 'Other Books', chapters: 10 }
];

const profileInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      roleId: true,
      status: true,
      additionalRoles: true,
      createdAt: true,
      updatedAt: true,
      role: { select: { name: true } },
      membershipRequests: {
        where: { status: 'Approved' },
        orderBy: { reviewedAt: 'desc' },
        take: 1,
        select: {
          reviewedAt: true,
          reviewer: { select: { name: true } }
        }
      }
    }
  },
  personalInformation: true,
  communicationInformation: true,
  membershipInformation: true,
  addresses: true,
  familyInformation: true,
  educationRecords: true,
  devotionalInformation: true,
  chantingTimeline: true,
  devotionalCourses: true,
  bookProgress: true,
  bookTestScores: {
    include: {
      bookTest: {
        select: {
          id: true,
          bookName: true,
          totalMarks: true,
          passingMarks: true
        }
      }
    }
  }
};

function formatDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return value;
}

function mapMemberGroups(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return [];
  return arr;
}

function reverseMemberGroups(arr) {
  if (!arr || !Array.isArray(arr)) return [];
  return arr;
}

function mapMemberType(value) {
  if (!value) return 'General';
  const map = {
    General: 'General',
    LifeMember: 'Life Member',
    YouthMember: 'Youth Member',
    Volunteer: 'Volunteer'
  };
  return map[value] || value;
}

function reverseMemberType(value) {
  const map = {
    General: 'General',
    'Life Member': 'LifeMember',
    'Youth Member': 'YouthMember',
    Volunteer: 'Volunteer'
  };
  return map[value] || 'General';
}

function formatProfileForApi(profile) {
  if (!profile) return null;

  const personal = profile.personalInformation || {};
  const communication = profile.communicationInformation || {};
  const membership = profile.membershipInformation || {};
  const approvedRequest = profile.user?.membershipRequests?.[0];
  const devotional = profile.devotionalInformation || {};

  return {
    id: profile.id,
    userId: profile.userId,
    devoteeId: profile.devoteeId,
    photographUrl: profile.photographUrl,
    center: profile.center,
    serviceRoles: profile.serviceRoles || [],
    lockedSections: profile.lockedSections || [],
    dateJoined: formatDate(devotional.dateJoined),
    spiritualName: personal.spiritualName,
    gender: personal.gender,
    dob: formatDate(personal.dob),
    bloodGroup: personal.bloodGroup,
    maritalStatus: personal.maritalStatus,
    harinamInitiated: personal.harinamInitiated ?? false,
    initiatedName: personal.initiatedName,
    spiritualMaster: personal.spiritualMaster,
    initiatedDatePlace: personal.initiatedDatePlace,
    initiationCeremony: personal.initiationCeremony,
    brahminInitiated: personal.brahminInitiated ?? false,
    whatsappNumber: communication.whatsappNumber,
    panNumber: personal.panNumber,
    aadharNumber: personal.aadharNumber,
    memberId: membership.memberId,
    memberType: mapMemberType(membership.memberType),
    memberGroups: mapMemberGroups(membership.memberGroups),
    subMemberGroups: mapMemberGroups(membership.subMemberGroups),
    memberStatus: membership.memberStatus,
    durationType: membership.durationType || 'Permanent',
    memberStartDate: formatDate(membership.memberStartDate),
    memberExpiryDate: formatDate(membership.memberExpiryDate),
    anniversaryInfo: membership.anniversaryInfo,
    approvedByName: approvedRequest?.reviewer?.name || null,
    membershipApprovedAt: formatDate(approvedRequest?.reviewedAt),
    firstLanguage: personal.firstLanguage,
    languagesKnown: personal.languagesKnown,
    citizenOf: personal.citizenOf,
    nativeCountry: personal.nativeCountry,
    nativeState: personal.nativeState,
    nativeCity: personal.nativeCity,
    caste: personal.caste,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    user: profile.user
      ? {
          id: profile.user.id,
          name: profile.user.name,
          email: profile.user.email,
          mobile: profile.user.mobile,
          roleId: profile.user.roleId,
          status: profile.user.status,
          additionalRoles: profile.user.additionalRoles || [],
          createdAt: profile.user.createdAt,
          updatedAt: profile.user.updatedAt,
          role: profile.user.role?.name || profile.user.role
        }
      : undefined,
    addresses: profile.addresses || [],
    family: profile.familyInformation || null,
    educationRecords: profile.educationRecords || [],
    skills: personal.id
      ? {
          id: personal.id,
          profileId: profile.id,
          occupation: personal.occupation,
          companyOrg: personal.companyOrg,
          skills: personal.skills,
          interests: personal.interests,
          hobbies: personal.hobbies,
          createdAt: personal.createdAt,
          updatedAt: personal.updatedAt
        }
      : null,
    devotionalInfo: profile.devotionalInformation || null,
    chantingTimeline: profile.chantingTimeline || [],
    devotionalCourses: profile.devotionalCourses || [],
    bookProgress: (profile.bookProgress || []).map((book) => ({
      ...book,
      lastReadDate: formatDate(book.lastReadDate)
    })),
    bookTestScores: (profile.bookTestScores || []).map((score) => ({
      id: score.id,
      bookTestId: score.bookTestId,
      bookName: score.bookTest?.bookName || null,
      totalMarks: score.bookTest?.totalMarks || null,
      passingMarks: score.bookTest?.passingMarks ?? null,
      marksObtained: score.marksObtained,
      createdAt: score.createdAt,
      updatedAt: score.updatedAt
    }))
  };
}

async function getProfileById(profileId) {
  const profile = await prisma.devoteeProfile.findUnique({
    where: { id: profileId },
    include: profileInclude
  });
  return formatProfileForApi(profile);
}

async function getProfileByUserId(userId) {
  const profile = await prisma.devoteeProfile.findUnique({
    where: { userId },
    include: profileInclude
  });
  return formatProfileForApi(profile);
}

async function createProfileForUser(user) {
  const existing = await prisma.devoteeProfile.findUnique({ where: { userId: user.id } });
  if (existing) return getProfileByUserId(user.id);

  const isAdmin = user.role?.name === 'Admin' || user.role === 'Admin';

  // Generate sequential member ID starting from 1 (use DB transaction to prevent race)
  let nextId = 1;
  if (!isAdmin) {
    const allProfiles = await prisma.devoteeProfile.findMany({
      where: { devoteeId: { startsWith: 'BACE-', not: 'BACE-ADMIN-108' } },
      select: { devoteeId: true },
      orderBy: { createdAt: 'asc' }
    });
    const usedIds = new Set();
    for (const p of allProfiles) {
      const num = parseInt(p.devoteeId.replace('BACE-', ''), 10);
      if (!isNaN(num)) usedIds.add(num);
    }
    while (usedIds.has(nextId)) nextId++;
  }

  try {
    const profile = await prisma.devoteeProfile.create({
      data: {
        userId: user.id,
        devoteeId: isAdmin ? 'BACE-ADMIN-108' : `BACE-${nextId}`,
        center: isAdmin ? 'Mayapur' : null,
        personalInformation: {
          create: {
            occupation: isAdmin ? 'Administrator' : null
          }
        },
        communicationInformation: { create: {} },
        membershipInformation: {
          create: {
            memberId: isAdmin ? '108' : String(nextId),
            memberType: isAdmin ? 'Volunteer' : 'General',
            memberStatus: user.status === 'Approved' ? 'Active' : 'Pending'
          }
        },
        familyInformation: { create: {} },
        devotionalInformation: {
          create: {
            spiritualGuide: isAdmin ? 'Srila Prabhupada' : null
          }
        },
        bookProgress: {
          create: DEFAULT_BOOKS.map((book) => ({
            bookName: book.name,
            totalChapters: book.chapters,
            completedChapters: 0,
            readingPercentage: 0,
            status: 'Unread'
          }))
        }
      }
    });

    return getProfileById(profile.id);
  } catch (err) {
    // Handle unique constraint violation from race condition — retry once
    if (err.code === 'P2002' && !isAdmin) {
      const retryProfiles = await prisma.devoteeProfile.findMany({
        where: { devoteeId: { startsWith: 'BACE-', not: 'BACE-ADMIN-108' } },
        select: { devoteeId: true }
      });
      const retryUsedIds = new Set();
      for (const p of retryProfiles) {
        const num = parseInt(p.devoteeId.replace('BACE-', ''), 10);
        if (!isNaN(num)) retryUsedIds.add(num);
      }
      let retryId = 1;
      while (retryUsedIds.has(retryId)) retryId++;

      const profile = await prisma.devoteeProfile.create({
        data: {
          userId: user.id,
          devoteeId: `BACE-${retryId}`,
          center: null,
          personalInformation: { create: {} },
          communicationInformation: { create: {} },
          membershipInformation: {
            create: {
              memberId: String(retryId),
              memberType: 'General',
              memberStatus: user.status === 'Approved' ? 'Active' : 'Pending'
            }
          },
          familyInformation: { create: {} },
          devotionalInformation: { create: {} },
          bookProgress: {
            create: DEFAULT_BOOKS.map((book) => ({
              bookName: book.name,
              totalChapters: book.chapters,
              completedChapters: 0,
              readingPercentage: 0,
              status: 'Unread'
            }))
          }
        }
      });
      return getProfileById(profile.id);
    }
    throw err;
  }
}

async function repairMissingProfiles() {
  const users = await prisma.user.findMany({ include: { role: true, devoteeProfile: true } });
  let repaired = 0;

  for (const user of users) {
    if (!user.devoteeProfile) {
      await createProfileForUser({ ...user, role: user.role.name });
      repaired += 1;
      console.log(`Repaired missing profile for ${user.email}`);
    }
  }

  if (repaired > 0) {
    console.log(`Repaired ${repaired} missing devotee profile(s).`);
  }
}

function computeBookProgress(completedChapters, totalChapters) {
  const readingPercentage =
    totalChapters > 0 ? parseFloat(((completedChapters / totalChapters) * 100).toFixed(2)) : 0;
  let status = 'Unread';
  if (completedChapters >= totalChapters && totalChapters > 0) status = 'Read';
  else if (completedChapters > 0) status = 'Reading';
  return { readingPercentage, status };
}

module.exports = {
  profileInclude,
  formatProfileForApi,
  getProfileById,
  getProfileByUserId,
  createProfileForUser,
  repairMissingProfiles,
  computeBookProgress,
  reverseMemberType,
  mapMemberType,
  mapMemberGroups,
  reverseMemberGroups
};
