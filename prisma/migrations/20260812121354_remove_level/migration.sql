/*
  Warnings:

  - You are about to drop the column `levelId` on the `Classroom` table. All the data in the column will be lost.
  - You are about to drop the `Level` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sectionId` to the `Classroom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Classroom` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Classroom" DROP CONSTRAINT "Classroom_levelId_fkey";

-- DropForeignKey
ALTER TABLE "Level" DROP CONSTRAINT "Level_sectionId_fkey";

-- AlterTable
ALTER TABLE "Classroom" DROP COLUMN "levelId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sectionId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Level";

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
