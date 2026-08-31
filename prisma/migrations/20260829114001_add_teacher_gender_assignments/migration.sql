/*
  Warnings:

  - A unique constraint covering the columns `[teacherId,sectionId,classroomId,subjectId]` on the table `TeacherAssignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sectionId` to the `TeacherAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TeacherAssignment" DROP CONSTRAINT "TeacherAssignment_classroomId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherAssignment" DROP CONSTRAINT "TeacherAssignment_subjectId_fkey";

-- DropIndex
DROP INDEX "TeacherAssignment_teacherId_subjectId_classroomId_key";

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "gender" TEXT;

-- AlterTable
ALTER TABLE "TeacherAssignment" ADD COLUMN     "sectionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAssignment_teacherId_sectionId_classroomId_subjectId_key" ON "TeacherAssignment"("teacherId", "sectionId", "classroomId", "subjectId");

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
