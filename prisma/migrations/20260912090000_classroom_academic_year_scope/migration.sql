-- Scope every Classroom to a specific AcademicYear so classes never mix
-- data across school years (see project rule: no cross-year mixing)

-- Step 1: add the column as nullable first so existing rows can be backfilled
ALTER TABLE "Classroom" ADD COLUMN "academicYearId" TEXT;

-- Step 2: backfill existing classrooms onto the active academic year, or
-- (if none is marked active) the earliest known academic year
UPDATE "Classroom"
SET "academicYearId" = (
  SELECT "id" FROM "AcademicYear" WHERE "isActive" = true ORDER BY "startDate" ASC LIMIT 1
)
WHERE "academicYearId" IS NULL;

UPDATE "Classroom"
SET "academicYearId" = (
  SELECT "id" FROM "AcademicYear" ORDER BY "startDate" ASC LIMIT 1
)
WHERE "academicYearId" IS NULL;

-- Step 3: enforce NOT NULL now that every row has a value
ALTER TABLE "Classroom" ALTER COLUMN "academicYearId" SET NOT NULL;

-- Step 4: add the foreign key relationship
ALTER TABLE "Classroom"
  ADD CONSTRAINT "Classroom_academicYearId_fkey"
  FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: index + uniqueness (a class name is unique within a year and section)
CREATE INDEX "Classroom_academicYearId_idx" ON "Classroom"("academicYearId");

CREATE UNIQUE INDEX "Classroom_academicYearId_sectionId_name_key" ON "Classroom"("academicYearId", "sectionId", "name");
