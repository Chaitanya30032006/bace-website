-- AlterTable
ALTER TABLE "devotee_profiles" ADD COLUMN     "profile_locked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "profile_edit_requests" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'Pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_edit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_edit_requests_profile_id_idx" ON "profile_edit_requests"("profile_id");

-- CreateIndex
CREATE INDEX "profile_edit_requests_status_idx" ON "profile_edit_requests"("status");

-- AddForeignKey
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_edit_requests" ADD CONSTRAINT "profile_edit_requests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
