-- AlterTable: replace profileLocked with lockedSections
ALTER TABLE "devotee_profiles" DROP COLUMN IF EXISTS "profile_locked";
ALTER TABLE "devotee_profiles" ADD COLUMN IF NOT EXISTS "locked_sections" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: add section to profile_edit_requests
ALTER TABLE "profile_edit_requests" ADD COLUMN IF NOT EXISTS "section" TEXT NOT NULL DEFAULT 'basicInfo';
ALTER TABLE "profile_edit_requests" ALTER COLUMN "section" DROP DEFAULT;
