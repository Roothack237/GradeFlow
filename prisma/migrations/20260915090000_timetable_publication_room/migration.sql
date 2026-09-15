-- Timetable system: room label + publication workflow (Phase 10).
-- All statements are additive; no existing data or column is changed.

-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN "room" TEXT;

-- CreateTable
CREATE TABLE "TimetablePublication" (
    "id" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetablePublication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimetablePublication_termId_classroomId_key" ON "TimetablePublication"("termId", "classroomId");
CREATE INDEX "TimetablePublication_termId_idx" ON "TimetablePublication"("termId");
CREATE INDEX "TimetablePublication_classroomId_idx" ON "TimetablePublication"("classroomId");
CREATE INDEX "TimetablePublication_status_idx" ON "TimetablePublication"("status");

-- AddForeignKey
ALTER TABLE "TimetablePublication" ADD CONSTRAINT "TimetablePublication_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetablePublication" ADD CONSTRAINT "TimetablePublication_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetablePublication" ADD CONSTRAINT "TimetablePublication_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
