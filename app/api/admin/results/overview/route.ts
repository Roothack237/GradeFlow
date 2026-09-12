import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/results/overview
 * Class and subject performance for a term or a single sequence, plus the
 * "incomplete results" report: students who do not yet have a mark for a
 * subject the class is supposed to be assessed on.
 *
 * Query: ?termId=  &sequenceId=  &classroomId=
 * When no term is given the current term is used.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    let termId = str(searchParams.get("termId"));
    const sequenceId = str(searchParams.get("sequenceId"));
    const classroomId = str(searchParams.get("classroomId"));

    /* ---------- resolve the academic scope ---------- */

    if (!termId && !sequenceId) {
      const current = await prisma.term.findFirst({
        where: { isCurrent: true },
        select: { id: true },
      });

      termId = current?.id ?? "";
    }

    let scopeSequenceIds: string[] = [];

    if (sequenceId) {
      scopeSequenceIds = [sequenceId];
    } else if (termId) {
      const sequences = await prisma.sequence.findMany({
        where: { termId },
        select: { id: true },
        orderBy: { order: "asc" },
      });

      scopeSequenceIds = sequences.map((sequence) => sequence.id);
    }

    if (!scopeSequenceIds.length) {
      return NextResponse.json({
        scope: { termId, sequenceId, sequences: 0 },
        summary: {
          expected: 0,
          covered: 0,
          recorded: 0,
          missing: 0,
          average: null,
          passRate: null,
          completionRate: null,
        },
        classes: [],
        subjects: [],
        incomplete: [],
        message:
          "No sequences found for the selected scope. Choose an academic term or sequence.",
      });
    }

    const roomFilter = classroomId ? { classroomId } : {};

    /* ---------- data needed for the report ---------- */

    const [classrooms, students, assignments, marks] = await Promise.all([
      prisma.classroom.findMany({
        where: classroomId ? { id: classroomId } : {},
        select: {
          id: true,
          name: true,
          section: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),

      prisma.student.findMany({
        where: classroomId ? { classroomId } : {},
        select: { id: true, firstName: true, lastName: true, matricule: true, classroomId: true },
      }),

      prisma.teacherAssignment.findMany({
        where: roomFilter,
        select: { classroomId: true, subjectId: true },
      }),

      prisma.mark.findMany({
        where: { sequenceId: { in: scopeSequenceIds }, student: roomFilter },
        select: {
          studentId: true,
          subjectId: true,
          average: true,
          student: { select: { classroomId: true } },
          subject: { select: { name: true } },
        },
      }),
    ]);

    /* ---------- subject names ---------- */

    const subjectIds = Array.from(new Set(marks.map((mark) => mark.subjectId)));
    const assignedSubjectIds = Array.from(
      new Set(assignments.map((assignment) => assignment.subjectId))
    );

    const allSubjectIds = Array.from(
      new Set([...subjectIds, ...assignedSubjectIds])
    );

    const subjects = allSubjectIds.length
      ? await prisma.subject.findMany({
          where: { id: { in: allSubjectIds } },
          select: { id: true, name: true, code: true, coefficient: true },
        })
      : [];

    const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

    /* ---------- aggregation ---------- */

    const studentsByClass = new Map<string, typeof students>();

    for (const student of students) {
      const list = studentsByClass.get(student.classroomId) ?? [];
      list.push(student);
      studentsByClass.set(student.classroomId, list);
    }

    // classId -> subjectId -> Set(studentId)
    const recordedPairs = new Map<string, Map<string, Set<string>>>();
    // classId -> { total, sum, passed }
    const classStats = new Map<string, { total: number; sum: number; passed: number }>();
    // subjectId -> { total, sum, passed, highest, lowest }
    const subjectStats = new Map<
      string,
      { total: number; sum: number; passed: number; highest: number; lowest: number }
    >();

    let totalSum = 0;
    let totalCount = 0;
    let totalPassed = 0;

    for (const mark of marks) {
      const classId = mark.student.classroomId;

      const perSubject =
        recordedPairs.get(classId) ?? new Map<string, Set<string>>();
      const set = perSubject.get(mark.subjectId) ?? new Set<string>();
      set.add(mark.studentId);
      perSubject.set(mark.subjectId, set);
      recordedPairs.set(classId, perSubject);

      const cls = classStats.get(classId) ?? { total: 0, sum: 0, passed: 0 };
      cls.total += 1;
      cls.sum += mark.average;
      if (mark.average >= 50) cls.passed += 1;
      classStats.set(classId, cls);

      const sub =
        subjectStats.get(mark.subjectId) ??
        { total: 0, sum: 0, passed: 0, highest: mark.average, lowest: mark.average };
      sub.total += 1;
      sub.sum += mark.average;
      if (mark.average >= 50) sub.passed += 1;
      sub.highest = Math.max(sub.highest, mark.average);
      sub.lowest = Math.min(sub.lowest, mark.average);
      subjectStats.set(mark.subjectId, sub);

      totalSum += mark.average;
      totalCount += 1;
      if (mark.average >= 50) totalPassed += 1;
    }

    /* ---------- incomplete detection ---------- */

    const expectedSubjectsByClass = new Map<string, Set<string>>();

    for (const assignment of assignments) {
      const set =
        expectedSubjectsByClass.get(assignment.classroomId) ?? new Set<string>();
      set.add(assignment.subjectId);
      expectedSubjectsByClass.set(assignment.classroomId, set);
    }

    /**
     * A subject that already has marks for the class is expected too, even when
     * the teaching assignment has not been recorded. Without this the
     * completion rate could exceed 100%.
     */
    for (const [classId, perSubject] of recordedPairs) {
      const set = expectedSubjectsByClass.get(classId) ?? new Set<string>();

      for (const subjectId of perSubject.keys()) set.add(subjectId);

      expectedSubjectsByClass.set(classId, set);
    }

    const incomplete: {
      classroomId: string;
      className: string;
      subjectId: string;
      subjectName: string;
      missing: number;
      students: { id: string; name: string; matricule: string }[];
    }[] = [];

    let expectedTotal = 0;
    let missingTotal = 0;

    for (const classroom of classrooms) {
      const classStudents = studentsByClass.get(classroom.id) ?? [];
      const expectedSubjects = expectedSubjectsByClass.get(classroom.id) ?? new Set<string>();

      for (const subjectId of expectedSubjects) {
        expectedTotal += classStudents.length;

        const recorded = recordedPairs.get(classroom.id)?.get(subjectId) ?? new Set<string>();

        const missingStudents = classStudents.filter(
          (student) => !recorded.has(student.id)
        );

        missingTotal += missingStudents.length;

        if (missingStudents.length > 0) {
          incomplete.push({
            classroomId: classroom.id,
            className: classroom.name,
            subjectId,
            subjectName: subjectById.get(subjectId)?.name ?? "Unknown subject",
            missing: missingStudents.length,
            students: missingStudents.slice(0, 20).map((student) => ({
              id: student.id,
              name: `${student.firstName} ${student.lastName}`.trim(),
              matricule: student.matricule,
            })),
          });
        }
      }
    }

    incomplete.sort((a, b) => b.missing - a.missing);

    /* ---------- response ---------- */

    return NextResponse.json({
      scope: {
        termId: termId || null,
        sequenceId: sequenceId || null,
        sequences: scopeSequenceIds.length,
      },

      summary: {
        expected: expectedTotal,
        covered: expectedTotal - missingTotal,
        recorded: totalCount,
        missing: missingTotal,
        average: totalCount ? Math.round((totalSum / totalCount) * 100) / 100 : null,
        passRate: totalCount
          ? Math.round((totalPassed / totalCount) * 1000) / 10
          : null,
        completionRate: expectedTotal
          ? Math.round(((expectedTotal - missingTotal) / expectedTotal) * 1000) / 10
          : null,
      },

      classes: classrooms.map((classroom) => {
        const stats = classStats.get(classroom.id);
        const classStudents = studentsByClass.get(classroom.id) ?? [];

        return {
          id: classroom.id,
          name: classroom.name,
          sectionName: classroom.section?.name ?? null,
          students: classStudents.length,
          recorded: stats?.total ?? 0,
          average: stats?.total
            ? Math.round((stats.sum / stats.total) * 100) / 100
            : null,
          passRate: stats?.total
            ? Math.round((stats.passed / stats.total) * 1000) / 10
            : null,
        };
      }),

      subjects: subjects
        .map((subject) => {
          const stats = subjectStats.get(subject.id);

          return {
            id: subject.id,
            name: subject.name,
            code: subject.code,
            coefficient: subject.coefficient,
            recorded: stats?.total ?? 0,
            average: stats?.total
              ? Math.round((stats.sum / stats.total) * 100) / 100
              : null,
            passRate: stats?.total
              ? Math.round((stats.passed / stats.total) * 1000) / 10
              : null,
            highest: stats?.highest ?? null,
            lowest: stats?.lowest ?? null,
          };
        })
        .sort((a, b) => (b.average ?? 0) - (a.average ?? 0)),

      incomplete: incomplete.slice(0, 40),
      incompleteTotal: incomplete.reduce((sum, entry) => sum + entry.missing, 0),
    });
  } catch (error) {
    return serverError("ADMIN RESULTS OVERVIEW ERROR", error);
  }
}
