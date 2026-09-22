/*
  Warnings:

  - You are about to drop the column `average` on the `Mark` table. All the data in the column will be lost.
  - You are about to drop the column `ca1` on the `Mark` table. All the data in the column will be lost.
  - You are about to drop the column `ca2` on the `Mark` table. All the data in the column will be lost.
  - You are about to drop the column `exam` on the `Mark` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `Mark` table. All the data in the column will be lost.
  - You are about to drop the column `remark` on the `Mark` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ReportCard` table. All the data in the column will be lost.
  - You are about to drop the column `rank` on the `ReportCard` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[postId,userId]` on the table `ForumReaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,subjectId,termId,sequenceId]` on the table `Mark` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[termId,name]` on the table `Sequence` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[termId,order]` on the table `Sequence` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[academicYearId,order]` on the table `Term` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `score` to the `Mark` table without a default value. This is not possible if the table is not empty.
  - Added the required column `termId` to the `Mark` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYearId` to the `ReportCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classroomId` to the `ReportCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `ReportCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYearId` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Mark" DROP CONSTRAINT "Mark_sequenceId_fkey";

-- DropForeignKey
ALTER TABLE "Mark" DROP CONSTRAINT "Mark_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Sequence" DROP CONSTRAINT "Sequence_termId_fkey";

-- DropIndex
DROP INDEX "ForumReaction_postId_userId_type_key";

-- DropIndex
DROP INDEX "Mark_studentId_subjectId_sequenceId_key";

-- DropIndex
DROP INDEX "ReportCard_termId_idx";

-- AlterTable
ALTER TABLE "ForumReaction" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Mark"
ADD COLUMN     "score" DOUBLE PRECISION,
ADD COLUMN     "termId" TEXT;

-- Preserve the existing average as the new sequence score and derive each
-- mark's term from its existing sequence.
UPDATE "Mark" m
SET "score" = source.average,
    "termId" = source."termId"
FROM (
  SELECT m2.id, m2.average, s."termId"
  FROM "Mark" m2
  JOIN "Sequence" s ON s.id = m2."sequenceId"
) AS source
WHERE m.id = source.id;

ALTER TABLE "Mark"
ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "termId" SET NOT NULL;

ALTER TABLE "Mark"
DROP COLUMN "average",
DROP COLUMN "ca1",
DROP COLUMN "ca2",
DROP COLUMN "exam",
DROP COLUMN "grade",
DROP COLUMN "remark";

-- AlterTable
ALTER TABLE "ReportCard" DROP COLUMN "createdAt",
DROP COLUMN "rank",
ADD COLUMN     "academicYearId" TEXT,
ADD COLUMN     "classroomId" TEXT,
ADD COLUMN     "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "position" INTEGER,
ADD COLUMN     "total" DOUBLE PRECISION;

UPDATE "ReportCard" rc
SET "academicYearId" = term."academicYearId",
    "classroomId" = student."classroomId",
    "total" = rc.average
FROM "Term" term
     , "Student" student
WHERE rc."termId" = term.id
  AND rc."studentId" = student.id;

ALTER TABLE "ReportCard"
ALTER COLUMN "academicYearId" SET NOT NULL,
ALTER COLUMN "classroomId" SET NOT NULL,
ALTER COLUMN "total" SET NOT NULL;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "academicYearId" TEXT;

UPDATE "Student" student
SET "academicYearId" = classroom."academicYearId"
FROM "Classroom" classroom
WHERE student."classroomId" = classroom.id;

ALTER TABLE "Student"
ALTER COLUMN "academicYearId" SET NOT NULL;

-- CreateTable
CREATE TABLE "ReportCardSubject" (
    "id" TEXT NOT NULL,
    "reportCardId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "mark" DOUBLE PRECISION NOT NULL,
    "grade" TEXT,
    "remark" TEXT,

    CONSTRAINT "ReportCardSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomSubject" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassroomSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassroomSubject_classroomId_idx" ON "ClassroomSubject"("classroomId");

-- CreateIndex
CREATE INDEX "ClassroomSubject_subjectId_idx" ON "ClassroomSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassroomSubject_classroomId_subjectId_key" ON "ClassroomSubject"("classroomId", "subjectId");

-- CreateIndex
CREATE INDEX "ForumReaction_userId_idx" ON "ForumReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumReaction_postId_userId_key" ON "ForumReaction"("postId", "userId");

-- CreateIndex
CREATE INDEX "Mark_termId_idx" ON "Mark"("termId");

-- CreateIndex
CREATE UNIQUE INDEX "Mark_studentId_subjectId_termId_sequenceId_key" ON "Mark"("studentId", "subjectId", "termId", "sequenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Sequence_termId_name_key" ON "Sequence"("termId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Sequence_termId_order_key" ON "Sequence"("termId", "order");

-- Preserve duplicate term records while making their order values unique.
WITH duplicate_groups AS (
  SELECT "academicYearId", "order"
  FROM "Term"
  GROUP BY "academicYearId", "order"
  HAVING COUNT(*) > 1
), duplicate_terms AS (
  SELECT t.id, t."academicYearId",
         ROW_NUMBER() OVER (
           PARTITION BY t."academicYearId"
           ORDER BY t."order", t.id
         ) AS duplicate_order
  FROM "Term" t
  JOIN duplicate_groups d
    ON d."academicYearId" = t."academicYearId"
   AND d."order" = t."order"
), maximum_orders AS (
  SELECT "academicYearId", MAX("order") AS maximum_order
  FROM "Term"
  GROUP BY "academicYearId"
)
UPDATE "Term" t
SET "order" = m.maximum_order + d.duplicate_order
FROM duplicate_terms d
JOIN maximum_orders m ON m."academicYearId" = d."academicYearId"
WHERE t.id = d.id;

-- CreateIndex
CREATE INDEX "Student_academicYearId_idx" ON "Student"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Term_academicYearId_order_key" ON "Term"("academicYearId", "order");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sequence" ADD CONSTRAINT "Sequence_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardSubject" ADD CONSTRAINT "ReportCardSubject_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "ReportCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardSubject" ADD CONSTRAINT "ReportCardSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomSubject" ADD CONSTRAINT "ClassroomSubject_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomSubject" ADD CONSTRAINT "ClassroomSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
