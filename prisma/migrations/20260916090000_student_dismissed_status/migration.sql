-- Student lifecycle: ACTIVE / SUSPENDED / DISMISSED (PENDING stays for accounts).
--
-- Additive only: one enum value is added, no column, row or relation is
-- touched. Students are never deleted when they are suspended or dismissed —
-- their marks, attendance, report cards, parent link and history stay intact.
-- The reason, date and administrator of every status change are recorded in
-- the existing "AuditLog" table (action STUDENT_STATUS_CHANGED).

ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'DISMISSED' BEFORE 'PENDING';
