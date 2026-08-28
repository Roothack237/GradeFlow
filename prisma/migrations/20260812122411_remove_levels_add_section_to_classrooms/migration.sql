/*
  Warnings:

  - A unique constraint covering the columns `[name,sectionId]` on the table `Classroom` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Classroom_name_sectionId_key" ON "Classroom"("name", "sectionId");
