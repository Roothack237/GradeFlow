/*
  Warnings:

  - You are about to drop the column `fullName` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `teacherCode` on the `Teacher` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Teacher_teacherCode_key";

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "fullName",
DROP COLUMN "teacherCode",
ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");
