-- CreateTable
CREATE TABLE "leave_requests" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,
    "destination" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leave_requests_profile_id_idx" ON "leave_requests"("profile_id");

-- CreateIndex
CREATE INDEX "leave_requests_from_date_idx" ON "leave_requests"("from_date");

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
