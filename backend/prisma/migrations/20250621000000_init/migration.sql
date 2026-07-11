-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('General', 'LifeMember', 'YouthMember', 'Volunteer');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'Pending',
    "comment" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devotee_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "devotee_id" TEXT NOT NULL,
    "photograph_url" TEXT,
    "center" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devotee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_information" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "spiritual_name" TEXT,
    "gender" TEXT,
    "dob" DATE,
    "blood_group" TEXT,
    "marital_status" TEXT,
    "harinam_initiated" BOOLEAN NOT NULL DEFAULT false,
    "initiated_name" TEXT,
    "spiritual_master" TEXT,
    "initiated_date_place" TEXT,
    "initiation_ceremony" TEXT,
    "brahmin_initiated" BOOLEAN NOT NULL DEFAULT false,
    "previous_religion" TEXT,
    "first_language" TEXT,
    "languages_known" TEXT,
    "citizen_of" TEXT,
    "native_country" TEXT,
    "native_state" TEXT,
    "native_city" TEXT,
    "caste" TEXT,
    "pan_number" TEXT,
    "aadhar_number" TEXT,
    "occupation" TEXT,
    "company_org" TEXT,
    "skills" TEXT,
    "interests" TEXT,
    "hobbies" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_information" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "whatsapp_number" TEXT,
    "alternate_email" TEXT,
    "alternate_mobile" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_information" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "member_id" TEXT,
    "member_type" "MemberType" NOT NULL DEFAULT 'General',
    "member_status" TEXT NOT NULL DEFAULT 'Active',
    "member_start_date" DATE,
    "member_expiry_date" DATE,
    "anniversary_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_information" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "house_street_po" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "state_province" TEXT NOT NULL,
    "city_district" TEXT NOT NULL,
    "pin_zip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "address_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_information" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "father_name" TEXT,
    "mother_name" TEXT,
    "father_contact" TEXT,
    "mother_contact" TEXT,
    "spouse_name" TEXT,
    "children_details" TEXT,
    "emergency_contact" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_information" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "qualification" TEXT,
    "school" TEXT,
    "college" TEXT,
    "degree" TEXT,
    "specialization" TEXT,
    "passing_year" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devotional_information" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "date_joined" DATE,
    "introduced_by" TEXT,
    "introduced_when" TEXT,
    "first_connected_center" TEXT,
    "spiritual_guide" TEXT,
    "program_details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devotional_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chanting_timeline" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "rounds" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chanting_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devotional_courses" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "course_name" TEXT NOT NULL,
    "completion_year" INTEGER,
    "doc_url" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devotional_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_reading_progress" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "book_name" TEXT NOT NULL,
    "total_chapters" INTEGER NOT NULL DEFAULT 0,
    "completed_chapters" INTEGER NOT NULL DEFAULT 0,
    "reading_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_read_date" DATE,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Unread',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_reading_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_date" DATE NOT NULL,
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" UUID NOT NULL,
    "album_id" UUID NOT NULL,
    "photo_url" TEXT NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "membership_requests_user_id_idx" ON "membership_requests"("user_id");

-- CreateIndex
CREATE INDEX "membership_requests_status_idx" ON "membership_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "devotee_profiles_user_id_key" ON "devotee_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "devotee_profiles_devotee_id_key" ON "devotee_profiles"("devotee_id");

-- CreateIndex
CREATE INDEX "devotee_profiles_devotee_id_idx" ON "devotee_profiles"("devotee_id");

-- CreateIndex
CREATE INDEX "devotee_profiles_center_idx" ON "devotee_profiles"("center");

-- CreateIndex
CREATE UNIQUE INDEX "personal_information_profile_id_key" ON "personal_information"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "communication_information_profile_id_key" ON "communication_information"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_information_profile_id_key" ON "membership_information"("profile_id");

-- CreateIndex
CREATE INDEX "membership_information_member_type_idx" ON "membership_information"("member_type");

-- CreateIndex
CREATE INDEX "membership_information_member_status_idx" ON "membership_information"("member_status");

-- CreateIndex
CREATE INDEX "address_information_profile_id_idx" ON "address_information"("profile_id");

-- CreateIndex
CREATE INDEX "address_information_type_idx" ON "address_information"("type");

-- CreateIndex
CREATE UNIQUE INDEX "family_information_profile_id_key" ON "family_information"("profile_id");

-- CreateIndex
CREATE INDEX "education_information_profile_id_idx" ON "education_information"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "devotional_information_profile_id_key" ON "devotional_information"("profile_id");

-- CreateIndex
CREATE INDEX "chanting_timeline_profile_id_idx" ON "chanting_timeline"("profile_id");

-- CreateIndex
CREATE INDEX "devotional_courses_profile_id_idx" ON "devotional_courses"("profile_id");

-- CreateIndex
CREATE INDEX "book_reading_progress_profile_id_idx" ON "book_reading_progress"("profile_id");

-- CreateIndex
CREATE INDEX "book_reading_progress_book_name_idx" ON "book_reading_progress"("book_name");

-- CreateIndex
CREATE INDEX "albums_year_idx" ON "albums"("year");

-- CreateIndex
CREATE INDEX "photos_album_id_idx" ON "photos"("album_id");

-- CreateIndex
CREATE INDEX "photos_is_approved_idx" ON "photos"("is_approved");

-- CreateIndex
CREATE INDEX "photos_uploaded_by_idx" ON "photos"("uploaded_by");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devotee_profiles" ADD CONSTRAINT "devotee_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_information" ADD CONSTRAINT "personal_information_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_information" ADD CONSTRAINT "communication_information_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_information" ADD CONSTRAINT "membership_information_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address_information" ADD CONSTRAINT "address_information_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_information" ADD CONSTRAINT "family_information_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_information" ADD CONSTRAINT "education_information_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devotional_information" ADD CONSTRAINT "devotional_information_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chanting_timeline" ADD CONSTRAINT "chanting_timeline_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devotional_courses" ADD CONSTRAINT "devotional_courses_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_reading_progress" ADD CONSTRAINT "book_reading_progress_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

