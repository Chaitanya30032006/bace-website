-- CreateTable
CREATE TABLE "book_tests" (
    "id" UUID NOT NULL,
    "book_name" TEXT NOT NULL,
    "total_marks" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_test_scores" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "book_test_id" UUID NOT NULL,
    "marks_obtained" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_test_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_test_scores_profile_id_idx" ON "book_test_scores"("profile_id");

-- CreateIndex
CREATE INDEX "book_test_scores_book_test_id_idx" ON "book_test_scores"("book_test_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_test_scores_profile_id_book_test_id_key" ON "book_test_scores"("profile_id", "book_test_id");

-- AddForeignKey
ALTER TABLE "book_test_scores" ADD CONSTRAINT "book_test_scores_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "devotee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_test_scores" ADD CONSTRAINT "book_test_scores_book_test_id_fkey" FOREIGN KEY ("book_test_id") REFERENCES "book_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
