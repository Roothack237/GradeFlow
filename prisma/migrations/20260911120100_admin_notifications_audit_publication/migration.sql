-- Admin notification centre, audit trail and result publication state.

-- 1. Extend notification types used by the admin notification centre.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RESULT_PUBLISHED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ATTENDANCE_ALERT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MARK_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ANNOUNCEMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REPORT_AVAILABLE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SYSTEM';

ALTER TABLE "Notification"
  ALTER COLUMN "type" SET DEFAULT 'INFO';

-- 2. Notification metadata: sender, targeting, action link, archive state.
ALTER TABLE "Notification" ADD COLUMN "senderId"    TEXT;
ALTER TABLE "Notification" ADD COLUMN "audience"    TEXT;
ALTER TABLE "Notification" ADD COLUMN "actionUrl"   TEXT;
ALTER TABLE "Notification" ADD COLUMN "relatedType" TEXT;
ALTER TABLE "Notification" ADD COLUMN "relatedId"   TEXT;
ALTER TABLE "Notification" ADD COLUMN "archivedAt"  TIMESTAMP(3);

CREATE INDEX "Notification_userId_isRead_idx"    ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_createdAt_idx"        ON "Notification"("createdAt");
CREATE INDEX "Notification_type_idx"             ON "Notification"("type");

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Result publication workflow (Admin reviews then publishes per class + term).
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');

CREATE TABLE "ResultPublication" (
  "id"            TEXT NOT NULL,
  "termId"        TEXT NOT NULL,
  "classroomId"   TEXT NOT NULL,
  "status"        "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedById" TEXT,
  "publishedAt"   TIMESTAMP(3),
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ResultPublication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResultPublication_termId_classroomId_key"
  ON "ResultPublication"("termId", "classroomId");
CREATE INDEX "ResultPublication_termId_idx"      ON "ResultPublication"("termId");
CREATE INDEX "ResultPublication_classroomId_idx" ON "ResultPublication"("classroomId");
CREATE INDEX "ResultPublication_status_idx"      ON "ResultPublication"("status");

ALTER TABLE "ResultPublication"
  ADD CONSTRAINT "ResultPublication_termId_fkey"
  FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResultPublication"
  ADD CONSTRAINT "ResultPublication_classroomId_fkey"
  FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResultPublication"
  ADD CONSTRAINT "ResultPublication_publishedById_fkey"
  FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Admin activity / audit trail. Never stores credentials.
CREATE TABLE "AuditLog" (
  "id"          TEXT NOT NULL,
  "actorId"     TEXT,
  "actorName"   TEXT,
  "action"      TEXT NOT NULL,
  "entityType"  TEXT NOT NULL,
  "entityId"    TEXT,
  "description" TEXT NOT NULL,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_createdAt_idx"  ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX "AuditLog_actorId_idx"    ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_action_idx"     ON "AuditLog"("action");

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
