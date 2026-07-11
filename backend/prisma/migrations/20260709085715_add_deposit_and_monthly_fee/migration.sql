-- AlterTable
ALTER TABLE "devotee_profiles" ADD COLUMN     "deposit_amount" DOUBLE PRECISION,
ADD COLUMN     "deposit_paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deposit_paid_at" TIMESTAMP(3),
ADD COLUMN     "deposit_remarks" TEXT,
ADD COLUMN     "monthly_fee" DOUBLE PRECISION;
