-- CreateTable
CREATE TABLE "monthly_payments" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Unpaid',
    "amount" DOUBLE PRECISION,
    "remarks" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_payments_profile_id_idx" ON "monthly_payments"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_payments_profile_id_year_month_key" ON "monthly_payments"("profile_id", "year", "month");

-- AddForeignKey
ALTER TABLE "monthly_payments" ADD CONSTRAINT "monthly_payments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
