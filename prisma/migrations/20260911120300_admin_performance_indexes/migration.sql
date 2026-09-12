-- Indexes used by the admin dashboards, reports and analytics queries.
-- All statements are additive; no existing data or column is changed.

-- Sequence: creation timestamp for chronological analytics.
ALTER TABLE "Sequence"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Sequence_termId_idx" ON "Sequence"("termId");

-- User
CREATE INDEX "User_role_idx"   ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");

-- Teacher / Parent lookup by name and email.
CREATE INDEX "Teacher_fullName_idx" ON "Teacher"("fullName");
CREATE INDEX "Teacher_email_idx"    ON "Teacher"("email");
CREATE INDEX "Parent_fullName_idx"  ON "Parent"("fullName");
CREATE INDEX "Parent_email_idx"     ON "Parent"("email");

-- Student filtering.
CREATE INDEX "Student_classroomId_idx"      ON "Student"("classroomId");
CREATE INDEX "Student_parentId_idx"         ON "Student"("parentId");
CREATE INDEX "Student_status_idx"           ON "Student"("status");
CREATE INDEX "Student_lastName_firstName_idx" ON "Student"("lastName", "firstName");

-- Subject lookup.
CREATE INDEX "Subject_name_idx" ON "Subject"("name");

-- Teacher assignments.
CREATE INDEX "TeacherAssignment_classroomId_idx" ON "TeacherAssignment"("classroomId");
CREATE INDEX "TeacherAssignment_teacherId_idx"   ON "TeacherAssignment"("teacherId");
CREATE INDEX "TeacherAssignment_subjectId_idx"   ON "TeacherAssignment"("subjectId");

-- Terms.
CREATE INDEX "Term_academicYearId_idx" ON "Term"("academicYearId");

-- Attendance analytics.
CREATE INDEX "Attendance_studentId_idx"  ON "Attendance"("studentId");
CREATE INDEX "Attendance_sequenceId_idx" ON "Attendance"("sequenceId");
CREATE INDEX "Attendance_teacherId_idx"  ON "Attendance"("teacherId");
CREATE INDEX "Attendance_date_idx"       ON "Attendance"("date");
CREATE INDEX "Attendance_status_idx"     ON "Attendance"("status");

-- Marks / results analytics.
CREATE INDEX "Mark_studentId_idx"  ON "Mark"("studentId");
CREATE INDEX "Mark_sequenceId_idx" ON "Mark"("sequenceId");
CREATE INDEX "Mark_subjectId_idx"  ON "Mark"("subjectId");
CREATE INDEX "Mark_teacherId_idx"  ON "Mark"("teacherId");

-- Report cards.
CREATE INDEX "ReportCard_termId_idx" ON "ReportCard"("termId");

-- Legacy forum messages.
CREATE INDEX "ForumMessage_forumId_idx" ON "ForumMessage"("forumId");

-- Timetable lookups.
CREATE INDEX "Timetable_classroomId_day_idx" ON "Timetable"("classroomId", "day");
CREATE INDEX "Timetable_teacherId_day_idx"   ON "Timetable"("teacherId", "day");
CREATE INDEX "Timetable_termId_idx"          ON "Timetable"("termId");

-- Classrooms.
CREATE INDEX "Classroom_sectionId_idx" ON "Classroom"("sectionId");
CREATE INDEX "Classroom_name_idx"      ON "Classroom"("name");
