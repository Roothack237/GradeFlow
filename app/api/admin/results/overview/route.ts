import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/results/overview
 * Class and subject performance for a term or a single sequence, plus the
 * incomplete results report: the (student, subject) pairs that are expected
 * for the scope but have no mark yet.
 *
 * Query: ?termId= &sequenceId= &classroomId=
 * When neither a term nor a sequence is given, the current term is used.
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
          recorded: 0,
          missing: 0,
          completionRate: null,
          average: null,
          passRate: null,
          students: 0,
          classes: 0,
          subjects: 0,
        },
        classes: [],
        subjects: [],
        incomplete: [],
        message:
          "No sequence found for this scope. Choose an academic term or sequence.",
      });
    }

    const roomFilter = classroomId ? { id: classroomId } : {};

    /* ---------- data needed for the report ---------- */

    const [classrooms, students, assignments, marks] = await Promise.all([
      prisma.classroom.findMany({
        where: roomFilter,
        select: {
          id: true,
          name: true,
          section: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),

      prisma.student.findMany({
        where: classroomId ? { classroomId } : {},
        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricule: true,
          classroomId: true,
        },
      }),

      prisma.teacherAssignment.findMany({
        where: classroomId ? { classroomId } : {},
        select: { classroomId: true, subjectId: true },
      }),

      prisma.mark.findMany({
        where: {
          sequenceId: { in: scopeSequenceIds },
          ...(classroomId ? { student: { classroomId } } : {}),
        },
        select: {
          studentId: true,
          subjectId: true,
          average: true,
        },
      }),
    ]);

    const subjectIdsInScope = Array.from(
      new Set([
        ...marks.map((mark) => mark.subjectId),
        ...assignments.map((assignment) => assignment.subjectId),
      ])
    );

    const subjects = subjectIdsInScope.length
      ? await prisma.subject.findMany({
          where: { id: { in: subjectIdsInScope } },
          select: { id: true, name: true, code: true, coefficient: true },
          orderBy: { name: "asc" },
        })
      : [];

    const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

    /* ---------- aggregations ---------- */

    const studentsByClass = new Map<string, typeof students>();

    for (const student of students) {
      const list = studentsByClass.get(student.classroomId) ?? [];

      list.push(student);
      studentsByClass.set(student.classroomId, list);
    }

    /* classId -> subjectId -> { total, count, passed, students:Set } */
    const classSubjectStats = new Map<
      string,
      Map<
        string,
        { total: number; count: number; passed: number; students: Set<string> }
      >
    >();

    const subjectStats = new Map<
      string,
      {
        total: number;
        count: number;
        passed: number;
        highest: number;
        lowest: number;
      }
    >();

    let globalTotal = 0;
    let globalSum = 0;
    let globalPassed = 0;

    for (const mark of marks) {
      const student = students.find((entry) => entry.id === mark.studentId);
      const classId = student?.classroomId;
      const average = mark.average;

      globalTotal += 1;
      globalSum += average;
      if (average >= 50) globalPassed += 1;

      if (classId) {
        const perSubject =
          classSubjectStats.get(classId) ??
          new Map<
            string,
            {
              total: number;
              count: number;
              passed: number;
              students: Set<string>;
            }
          >();

        const entry = perSubject.get(mark.subjectId) ?? {
          total: 0,
          count: 0,
          passed: 0,
          students: new Set<string>(),
        };

        entry.total += average;
        entry.count += 1;
        if (average >= 50) entry.passed += 1;
        entry.students.add(mark.studentId);

        perSubject.set(mark.subjectId, entry);
        classSubjectStats.set(classId, perSubject);
      }

      const subjectEntry = subjectStats.get(mark.subjectId) ?? {
        total: 0,
        count: 0,
        passed: 0,
        highest: average,
        lowest: average,
      };

      subjectEntry.total += average;
      subjectEntry.count += 1;
      if (average >= 50) subjectEntry.passed += 1;
      subjectEntry.highest = Math.max(subjectEntry.highest, average);
      subjectEntry.lowest = Math.min(subjectEntry.lowest, average);

      subjectStats.set(mark.subjectId, subjectEntry);
    }

    /* ---------- expected vs recorded (student, subject) pairs ---------- */

    const expectedSubjectsByClass = new Map<string, Set<string>>();

    for (const assignment of assignments) {
      const set =
        expectedSubjectsByClass.get(assignment.classroomId) ?? new Set<string>();

      set.add(assignment.subjectId);
      expectedSubjectsByClass.set(assignment.classroomId, set);
    }

    /* a subject that already carries marks for the class is expected too */
    for (const [classId, perSubject] of classSubjectStats) {
      const set = expectedSubjectsByClass.get(classId) ?? new Set<string>();

      for (const subjectId of perSubject.keys()) set.add(subjectId);

      expectedSubjectsByClass.set(classId, set);
    }

    const incomplete: {
      classroomId: string;
      className: string;
      subjectId: string;
      subjectName: string;
      expected: number;
      recorded: number;
      missing: number;
      students: { id: string; name: string; matricule: string }[];
    }[] = [];

    let expectedPairs = 0;
    let missingPairs = 0;

    for (const classroom of classrooms) {
      const classStudents = studentsByClass.get(classroom.id) ?? [];
      const expectedSubjects =
        expectedSubjectsByClass.get(classroom.id) ?? new Set<string>();

      for (const subjectId of expectedSubjects) {
        expectedPairs += classStudents.length;

        const recorded =
          classSubjectStats.get(classroom.id)?.get(subjectId)?.students ??
          new Set<string>();

        const missingStudents = classStudents.filter(
          (student) => !recorded.has(student.id)
        );

        missingPairs += missingStudents.length;

        if (missingStudents.length > 0) {
          incomplete.push({
            classroomId: classroom.id,
            className: classroom.name,
            subjectId,
            subjectName: subjectById.get(subjectId)?.name ?? "Unknown subject",
            expected: classStudents.length,
            recorded: recorded.size,
            missing: missingStudents.length,
            students: missingStudents.slice(0, 10).map((student) => ({
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

    const classes = classrooms.map((classroom) => {
      const classStudents = studentsByClass.get(classroom.id) ?? [];
      const perSubject = classSubjectStats.get(classroom.id);
      const expectedSubjects =
        expectedSubjectsByClass.get(classroom.id) ?? new Set<string>();

      let total = 0;
      let sum = 0;
      let passed = 0;

      if (perSubject) {
        for (const entry of perSubject.values()) {
          total += entry.count;
          sum += entry.total;
          passed += entry.passed;
        }
      }

      const expected = classStudents.length * expectedSubjects.size;
      const recordedPairs = perSubject
        ? Array.from(perSubject.values()).reduce(
            (count, entry) => count + entry.students.size,
            0
          )
        : 0;

      return {
        id: classroom.id,
        name: classroom.name,
        sectionName: classroom.section?.name ?? null,
        students: classStudents.length,
        subjects: expectedSubjects.size,
        expected,
        recorded: total,
        covered: recordedPairs,
        missing: Math.max(0, expected - recordedPairs),
        average: total ? Math.round((sum / total) * 100) / 100 : null,
        passRate: total ? Math.round((passed / total) * 1000) / 10 : null,
        completion: expected
          ? Math.round((recordedPairs / expected) * 1000) / 10
          : null,
      };
    });

    return NextResponse.json({
      scope: {
        termId: termId || null,
        sequenceId: sequenceId || null,
        sequences: scopeSequenceIds.length,
      },

      summary: {
        expected: expectedPairs,
        covered: expectedPairs - missingPairs,
        recorded: globalTotal,
        missing: missingPairs,
        completionRate: expectedPairs
          ? Math.round(((expectedPairs - missingPairs) / expectedPairs) * 1000) /
            10
          : null,
        average: globalTotal
          ? Math.round((globalSum / globalTotal) * 100) / 100
          : null,
        passRate: globalTotal
          ? Math.round((globalPassed / globalTotal) * 1000) / 10
          : null,
        students: students.length,
        classes: classrooms.length,
        subjects: subjects.length,
      },

      classes,

      subjects: subjects.map((subject) => {
        const entry = subjectStats.get(subject.id);

        const expected = classrooms.reduce((count, classroom) => {
          const expectedSubjects =
            expectedSubjectsByClass.get(classroom.id) ?? new Set<string>();

          return expectedSubjects.has(subject.id)
            ? count + (studentsByClass.get(classroom.id)?.length ?? 0)
            : count;
        }, 0);

        const covered = Array.from(classSubjectStats.values()).reduce(
          (count, perSubject) =>
            count + (perSubject.get(subject.id)?.students.size ?? 0),
          0
        );

        return {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          coefficient: subject.coefficient,
          recorded: entry?.count ?? 0,
          expected,
          covered,
          missing: Math.max(0, expected - covered),
          average: entry?.count
            ? Math.round((entry.total / entry.count) * 100) / 100
            : null,
          passRate: entry?.count
            ? Math.round((entry.passed / entry.count) * 1000) / 10
            : null,
          highest: entry?.highest ?? null,
          lowest: entry?.lowest ?? null,
        };
      }),

      incomplete,
      incompleteTotal: missingPairs,
    });
  } catch (error) {
    return serverError("ADMIN RESULTS OVERVIEW ERROR", error);
  }
}
