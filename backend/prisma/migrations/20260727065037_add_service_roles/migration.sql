-- AlterTable
ALTER TABLE "devotee_profiles" ADD COLUMN     "service_role" TEXT;

-- CreateTable
CREATE TABLE "service_roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_roles_name_key" ON "service_roles"("name");
