/*
  Warnings:

  - Added the required column `fullName` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Teacher` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Teacher_email_key";

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "fullName" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL;
