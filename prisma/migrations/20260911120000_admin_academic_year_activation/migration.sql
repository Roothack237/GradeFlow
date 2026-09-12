-- Academic year activation flag + current term flag
-- Lets the Admin mark exactly one active academic year and one current term.

ALTER TABLE "AcademicYear"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "AcademicYear_isActive_idx" ON "AcademicYear"("isActive");

ALTER TABLE "Term"
  ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Term_isCurrent_idx" ON "Term"("isCurrent");
