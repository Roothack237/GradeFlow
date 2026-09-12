-- Per-sequence result publication.
--
-- ResultPublication covers a whole term for a class; SequencePublication adds
-- the finer grained level so an administrator can publish one sequence at a
-- time (and see exactly which sequence has been released).

CREATE TABLE "SequencePublication" (
  "id"            TEXT NOT NULL,
  "sequenceId"    TEXT NOT NULL,
  "classroomId"   TEXT NOT NULL,
  "status"        "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedById" TEXT,
  "publishedAt"   TIMESTAMP(3),
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SequencePublication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SequencePublication_sequenceId_classroomId_key"
  ON "SequencePublication"("sequenceId", "classroomId");
CREATE INDEX "SequencePublication_sequenceId_idx"  ON "SequencePublication"("sequenceId");
CREATE INDEX "SequencePublication_classroomId_idx" ON "SequencePublication"("classroomId");
CREATE INDEX "SequencePublication_status_idx"      ON "SequencePublication"("status");

ALTER TABLE "SequencePublication"
  ADD CONSTRAINT "SequencePublication_sequenceId_fkey"
  FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SequencePublication"
  ADD CONSTRAINT "SequencePublication_classroomId_fkey"
  FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SequencePublication"
  ADD CONSTRAINT "SequencePublication_publishedById_fkey"
  FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
