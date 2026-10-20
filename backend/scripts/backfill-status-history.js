// One-time backfill: rebuild member status history from existing audit log entries.
// Usage: node scripts/backfill-status-history.js          (dry run)
//        node scripts/backfill-status-history.js --apply  (write rows)
require('dotenv').config({ quiet: true });
const prisma = require('../lib/prisma');

const apply = process.argv.includes('--apply');

(async () => {
  const logs = await prisma.auditLog.findMany({
    where: { action: 'UPDATE_MEMBER_STATUS' },
    orderBy: { createdAt: 'asc' },
    select: { adminId: true, details: true, createdAt: true }
  });

  const rows = [];
  const unmatched = [];
  for (const log of logs) {
    // Format: "Set member status of <name> (<email>) to <Status>."
    const match = log.details.match(/\(([^)]+)\) to (Active|Inactive)\.?$/);
    if (!match) { unmatched.push(log.details); continue; }
    const [, email, status] = match;
    const user = await prisma.user.findUnique({ where: { email }, include: { devoteeProfile: true } });
    if (!user?.devoteeProfile) { unmatched.push(log.details); continue; }
    rows.push({
      profileId: user.devoteeProfile.id,
      devoteeId: user.devoteeProfile.devoteeId,
      status,
      changedAt: log.createdAt,
      changedBy: log.adminId
    });
  }

  // Skip profiles that already have history, so the script is safe to re-run
  const existing = new Set(
    (await prisma.memberStatusHistory.findMany({ select: { profileId: true } })).map(r => r.profileId)
  );
  const toInsert = rows.filter(r => !existing.has(r.profileId));

  toInsert.forEach(r => console.log(r.changedAt.toISOString().slice(0, 10), r.devoteeId, '->', r.status));
  console.log(`\n${toInsert.length} row(s) to insert, ${rows.length - toInsert.length} skipped (already have history), ${unmatched.length} unmatched`);
  unmatched.forEach(u => console.log('  unmatched:', u));

  if (apply && toInsert.length > 0) {
    await prisma.memberStatusHistory.createMany({
      data: toInsert.map(({ devoteeId, ...r }) => r)
    });
    console.log('Inserted.');
  } else if (!apply) {
    console.log('Dry run only. Re-run with --apply to write.');
  }

  await prisma.$disconnect();
})();
