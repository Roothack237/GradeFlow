/*
  Warnings:

  - A unique constraint covering the columns `[loginCode]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firstName` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loginCode` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "loginCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_loginCode_key" ON "Teacher"("loginCode");
