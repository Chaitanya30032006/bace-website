const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const roles = ['Admin', 'Devotee'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bace.org';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin108';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: {
        name: 'BACE Admin',
        email: adminEmail,
        mobile: '+919999999999',
        password: hashedPassword,
        roleId: adminRole.id,
        status: 'Approved',
        devoteeProfile: {
          create: {
            devoteeId: 'BACE-ADMIN-108',
            center: 'Mayapur',
            personalInformation: { create: { occupation: 'Administrator' } },
            communicationInformation: { create: {} },
            membershipInformation: {
              create: {
                memberId: '108',
                memberType: 'Volunteer',
                memberStatus: 'Active'
              }
            },
            familyInformation: { create: {} },
            devotionalInformation: { create: { spiritualGuide: 'Srila Prabhupada' } },
            bookProgress: {
              create: [
                { bookName: 'Bhagavad Gita', totalChapters: 18, completedChapters: 0, readingPercentage: 0, status: 'Unread' },
                { bookName: 'Srimad Bhagavatam', totalChapters: 335, completedChapters: 0, readingPercentage: 0, status: 'Unread' },
                { bookName: 'Chaitanya Charitamrita', totalChapters: 150, completedChapters: 0, readingPercentage: 0, status: 'Unread' },
                { bookName: 'Nectar of Devotion', totalChapters: 51, completedChapters: 0, readingPercentage: 0, status: 'Unread' },
                { bookName: 'Other Books', totalChapters: 10, completedChapters: 0, readingPercentage: 0, status: 'Unread' }
              ]
            }
          }
        }
      }
    });

    console.log(`Admin user created: ${admin.email}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
