/*
  Warnings:

  - You are about to drop the column `isCurrent` on the `AcademicYear` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Classroom` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Classroom` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `AcademicYear` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `AcademicYear` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AcademicYear` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Classroom" DROP CONSTRAINT "Classroom_sectionId_fkey";

-- DropIndex
DROP INDEX "Classroom_name_sectionId_key";

-- AlterTable
ALTER TABLE "AcademicYear" DROP COLUMN "isCurrent",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Classroom" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
