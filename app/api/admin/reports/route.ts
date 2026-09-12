import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { badRequest, dateFrom, endOfDay, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/reports
 * Real report data built from the database. Four report families are
 * supported, selected with ?type=:
 *
 *   STUDENT      ?studentId= &termId=
 *   CLASS        ?classroomId= &termId=
 *   ATTENDANCE   ?termId= &classroomId= &from= &to=
 *   PERFORMANCE  ?termId= &academicYearId=
 *
 * Every report is returned as structured data so the admin UI can render it,
 * print it and export it to CSV.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const type = (str(searchParams.get("type")) || "PERFORMANCE").toUpperCase();

    const termId = str(searchParams.get("termId"));
    const classroomId = str(searchParams.get("classroomId"));
    const studentId = str(searchParams.get("studentId"));

    switch (type) {
      case "STUDENT":
        return await studentReport({ studentId, termId });

      case "CLASS":
        return await classReport({ classroomId, termId });

      case "ATTENDANCE":
        return await attendanceReport({
          termId,
          classroomId,
          from: dateFrom(searchParams.get("from")),
          to: endOfDay(searchParams.get("to")),
        });

      case "PERFORMANCE":
        return await performanceReport({ termId });

      default:
        return badRequest(
          "Report type must be STUDENT, CLASS, ATTENDANCE or PERFORMANCE."
        );
    }
  } catch (error) {
    return serverError("ADMIN REPORT ERROR", error);
  }
}

/* =========================================================
   HELPERS
========================================================= */

/** Resolves the requested term, falling back to the current one. */
async function resolveTerm(termId?: string | null) {
  if (termId) {
    return prisma.term.findUnique({
      where: { id: termId },
      select: {
        id: true,
        name: true,
        order: true,
        academicYear: { select: { id: true, name: true } },
      },
    });
  }

  return prisma.term.findFirst({
    where: { isCurrent: true },
    select: {
      id: true,
      name: true,
      order: true,
      academicYear: { select: { id: true, name: true } },
    },
  });
}

function round(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;

  const factor = 10 ** digits;

  return Math.round(value * factor) / factor;
}

function gradeOf(average: number): string {
  if (average >= 80) return "A";
  if (average >= 70) return "B";
  if (average >= 60) return "C";
  if (average >= 50) return "D";
  if (average >= 40) return "E";
  return "F";
}

/* =========================================================
   STUDENT REPORT
========================================================= */

async function studentReport(options: {
  studentId: string;
  termId?: string | null;
}) {
  const { studentId } = options;

  if (!studentId) return badRequest("A student is required for this report.");

  const term = await resolveTerm(options.termId);

  if (!term) return badRequest("No term available for this report.");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      matricule: true,
      gender: true,
      status: true,
      dateOfBirth: true,
      classroom: {
        select: {
          id: true,
          name: true,
          section: { select: { name: true } },
        },
      },
      parent: { select: { fullName: true, email: true, phone: true } },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const [marks, attendance, reportCard] = await Promise.all([
    prisma.mark.findMany({
      where: { studentId, sequence: { termId: term.id } },
      select: {
        ca1: true,
        ca2: true,
        exam: true,
        average: true,
        grade: true,
        remark: true,
        subject: {
          select: { id: true, name: true, code: true, coefficient: true },
        },
        sequence: { select: { id: true, name: true, order: true } },
        teacher: { select: { fullName: true } },
      },
      orderBy: [{ subject: { name: "asc" } }, { sequence: { order: "asc" } }],
    }),

    prisma.attendance.groupBy({
      by: ["status"],
      where: { studentId, sequence: { termId: term.id } },
      _count: { _all: true },
    }),

    prisma.reportCard.findUnique({
      where: { studentId_termId: { studentId, termId: term.id } },
      select: {
        average: true,
        rank: true,
        decision: true,
        principalRemark: true,
        createdAt: true,
      },
    }),
  ]);

  /* ---- per subject aggregation ---- */

  const subjectMap = new Map<
    string,
    {
      id: string;
      name: string;
      coefficient: number;
      sequences: {
        sequenceId: string;
        sequenceName: string;
        ca1: number;
        ca2: number;
        exam: number;
        average: number;
        grade: string | null;
      }[];
      total: number;
      count: number;
      teacher: string;
    }
  >();

  for (const mark of marks) {
    const entry = subjectMap.get(mark.subject.id) ?? {
      id: mark.subject.id,
      name: mark.subject.name,
      coefficient: mark.subject.coefficient,
      sequences: [],
      total: 0,
      count: 0,
      teacher: mark.teacher.fullName,
    };

    entry.sequences.push({
      sequenceId: mark.sequence.id,
      sequenceName: mark.sequence.name,
      ca1: mark.ca1,
      ca2: mark.ca2,
      exam: mark.exam,
      average: mark.average,
      grade: mark.grade,
    });

    entry.total += mark.average;
    entry.count += 1;

    subjectMap.set(mark.subject.id, entry);
  }

  const subjects = Array.from(subjectMap.values()).map((subject) => ({
    id: subject.id,
    name: subject.name,
    coefficient: subject.coefficient,
    teacher: subject.teacher,
    sequences: subject.sequences,
    average: round(subject.total / subject.count),
    grade: gradeOf(subject.total / subject.count),
  }));

  const weightedTotal = subjects.reduce(
    (sum, subject) => sum + (subject.average ?? 0) * subject.coefficient,
    0
  );

  const coefficientTotal = subjects.reduce(
    (sum, subject) => sum + subject.coefficient,
    0
  );

  const attendanceCounts: Record<string, number> = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
  };

  for (const row of attendance) attendanceCounts[row.status] = row._count._all;

  const attendanceTotal = Object.values(attendanceCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  return NextResponse.json({
    type: "STUDENT",
    term,
    generatedAt: new Date().toISOString(),
    student,
    subjects,
    summary: {
      average: coefficientTotal ? round(weightedTotal / coefficientTotal) : null,
      grade: coefficientTotal
        ? gradeOf(weightedTotal / coefficientTotal)
        : null,
      subjects: subjects.length,
      marks: marks.length,
      bestSubject:
        subjects.length > 0
          ? subjects.reduce((best, subject) =>
              (subject.average ?? 0) > (best.average ?? 0) ? subject : best
            ).name
          : null,
      weakestSubject:
        subjects.length > 0
          ? subjects.reduce((worst, subject) =>
              (subject.average ?? 0) < (worst.average ?? 0) ? subject : worst
            ).name
          : null,
    },
    attendance: {
      counts: attendanceCounts,
      total: attendanceTotal,
      rate: attendanceTotal
        ? round(
            ((attendanceCounts.PRESENT + attendanceCounts.LATE) /
              attendanceTotal) *
              100,
            1
          )
        : null,
    },
    reportCard,
  });
}

/* =========================================================
   CLASS REPORT
========================================================= */

async function classReport(options: {
  classroomId: string;
  termId?: string | null;
}) {
  if (!options.classroomId) {
    return badRequest("A class is required for this report.");
  }

  const term = await resolveTerm(options.termId);

  if (!term) return badRequest("No term available for this report.");

  const classroom = await prisma.classroom.findUnique({
    where: { id: options.classroomId },
    select: {
      id: true,
      name: true,
      section: { select: { name: true } },
      students: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricule: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
    },
  });

  if (!classroom) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  const [marks, attendance, reportCards] = await Promise.all([
    prisma.mark.findMany({
      where: {
        student: { classroomId: classroom.id },
        sequence: { termId: term.id },
      },
      select: {
        studentId: true,
        average: true,
        subject: { select: { id: true, name: true, coefficient: true } },
      },
    }),

    prisma.attendance.groupBy({
      by: ["studentId", "status"],
      where: {
        sequence: { termId: term.id },
        student: { classroomId: classroom.id },
      },
      _count: { _all: true },
    }),

    prisma.reportCard.findMany({
      where: { termId: term.id, student: { classroomId: classroom.id } },
      select: { studentId: true, average: true, rank: true, decision: true },
    }),
  ]);

  /* ---- per student ---- */

  const studentStats = new Map<
    string,
    { total: number; count: number; passed: number }
  >();

  for (const mark of marks) {
    const entry = studentStats.get(mark.studentId) ?? {
      total: 0,
      count: 0,
      passed: 0,
    };

    entry.total += mark.average;
    entry.count += 1;
    if (mark.average >= 50) entry.passed += 1;

    studentStats.set(mark.studentId, entry);
  }

  const attendanceByStudent = new Map<
    string,
    { PRESENT: number; ABSENT: number; LATE: number; EXCUSED: number }
  >();

  for (const row of attendance) {
    const entry = attendanceByStudent.get(row.studentId) ?? {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };

    entry[row.status as "PRESENT"] = row._count._all;

    attendanceByStudent.set(row.studentId, entry);
  }

  const reportCardByStudent = new Map(
    reportCards.map((card) => [card.studentId, card])
  );

  const students = classroom.students
    .map((student) => {
      const stats = studentStats.get(student.id);
      const attendanceEntry = attendanceByStudent.get(student.id);
      const attendanceTotal = attendanceEntry
        ? attendanceEntry.PRESENT +
          attendanceEntry.ABSENT +
          attendanceEntry.LATE +
          attendanceEntry.EXCUSED
        : 0;

      const average = stats && stats.count ? stats.total / stats.count : null;

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        matricule: student.matricule,
        marks: stats?.count ?? 0,
        average: round(average),
        grade: average === null ? null : gradeOf(average),
        passRate:
          stats && stats.count
            ? round((stats.passed / stats.count) * 100, 1)
            : null,
        attendanceRate: attendanceEntry
          ? round(
              ((attendanceEntry.PRESENT + attendanceEntry.LATE) /
                (attendanceTotal || 1)) *
                100,
              1
            )
          : null,
        rank: reportCardByStudent.get(student.id)?.rank ?? null,
        decision: reportCardByStudent.get(student.id)?.decision ?? null,
      };
    })
    .sort((a, b) => (b.average ?? -1) - (a.average ?? -1));

  /* ---- per subject ---- */

  const subjectStats = new Map<
    string,
    { name: string; coefficient: number; total: number; count: number; passed: number }
  >();

  for (const mark of marks) {
    const entry = subjectStats.get(mark.subject.id) ?? {
      name: mark.subject.name,
      coefficient: mark.subject.coefficient,
      total: 0,
      count: 0,
      passed: 0,
    };

    entry.total += mark.average;
    entry.count += 1;
    if (mark.average >= 50) entry.passed += 1;

    subjectStats.set(mark.subject.id, entry);
  }

  const subjects = Array.from(subjectStats.entries())
    .map(([id, entry]) => ({
      id,
      name: entry.name,
      coefficient: entry.coefficient,
      recorded: entry.count,
      average: round(entry.total / entry.count),
      passRate: round((entry.passed / entry.count) * 100, 1),
    }))
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0));

  const classAverage =
    students.filter((student) => student.average !== null).length > 0
      ? round(
          students.reduce((sum, student) => sum + (student.average ?? 0), 0) /
            students.filter((student) => student.average !== null).length
        )
      : null;

  return NextResponse.json({
    type: "CLASS",
    term,
    generatedAt: new Date().toISOString(),
    classroom: {
      id: classroom.id,
      name: classroom.name,
      sectionName: classroom.section?.name ?? null,
      students: classroom.students.length,
    },
    students,
    subjects,
    summary: {
      average: classAverage,
      marks: marks.length,
      passRate:
        students.filter((student) => student.average !== null).length > 0
          ? round(
              (students.filter((student) => (student.average ?? 0) >= 50).length /
                students.filter((student) => student.average !== null).length) *
                100,
              1
            )
          : null,
      published: await prisma.resultPublication.count({
        where: {
          classroomId: classroom.id,
          termId: term.id,
          status: "PUBLISHED",
        },
      }),
    },
  });
}

/* =========================================================
   ATTENDANCE REPORT
========================================================= */

async function attendanceReport(options: {
  termId?: string | null;
  classroomId?: string | null;
  from?: Date | null;
  to?: Date | null;
}) {
  const term = await resolveTerm(options.termId);

  if (!term) return badRequest("No term available for this report.");

  const where = {
    sequence: { termId: term.id },
    ...(options.classroomId
      ? { student: { classroomId: options.classroomId } }
      : {}),
    ...(options.from || options.to
      ? {
          date: {
            ...(options.from ? { gte: options.from } : {}),
            ...(options.to ? { lte: options.to } : {}),
          },
        }
      : {}),
  };

  const [statusGroups, byClass, byDay, students] = await Promise.all([
    prisma.attendance.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),

    prisma.attendance.findMany({
      where,
      select: {
        status: true,
        student: {
          select: {
            classroomId: true,
            classroom: {
              select: { id: true, name: true, section: { select: { name: true } } },
            },
          },
        },
      },
    }),

    prisma.attendance.groupBy({
      by: ["date", "status"],
      where,
      _count: { _all: true },
      orderBy: { date: "asc" },
    }),

    prisma.attendance.groupBy({
      by: ["studentId", "status"],
      where,
      _count: { _all: true },
    }),
  ]);

  const counts: Record<string, number> = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
  };

  for (const row of statusGroups) counts[row.status] = row._count._all;

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  /* ---- per class ---- */

  const classMap = new Map<
    string,
    {
      id: string;
      name: string;
      sectionName: string | null;
      counts: Record<string, number>;
    }
  >();

  for (const record of byClass) {
    const classroom = record.student.classroom;

    if (!classroom) continue;

    const entry = classMap.get(classroom.id) ?? {
      id: classroom.id,
      name: classroom.name,
      sectionName: classroom.section?.name ?? null,
      counts: { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 },
    };

    entry.counts[record.status] = (entry.counts[record.status] ?? 0) + 1;

    classMap.set(classroom.id, entry);
  }

  const classes = Array.from(classMap.values())
    .map((entry) => {
      const entryTotal = Object.values(entry.counts).reduce(
        (sum, value) => sum + value,
        0
      );

      return {
        ...entry,
        total: entryTotal,
        rate: entryTotal
          ? round(
              ((entry.counts.PRESENT + entry.counts.LATE) / entryTotal) * 100,
              1
            )
          : null,
      };
    })
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));

  /* ---- per student ---- */

  const studentMap = new Map<
    string,
    { counts: Record<string, number> }
  >();

  for (const row of students) {
    const entry = studentMap.get(row.studentId) ?? {
      counts: { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 },
    };

    entry.counts[row.status] = row._count._all;

    studentMap.set(row.studentId, entry);
  }

  const studentIds = Array.from(studentMap.keys());

  const studentInfo = studentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricule: true,
          classroom: { select: { name: true } },
        },
      })
    : [];

  const studentsReport = studentInfo
    .map((student) => {
      const entry = studentMap.get(student.id);

      const entryTotal = entry
        ? Object.values(entry.counts).reduce((sum, value) => sum + value, 0)
        : 0;

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        matricule: student.matricule,
        className: student.classroom?.name ?? null,
        counts: entry?.counts ?? { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 },
        total: entryTotal,
        rate:
          entry && entryTotal
            ? round(
                ((entry.counts.PRESENT + entry.counts.LATE) / entryTotal) * 100,
                1
              )
            : null,
      };
    })
    .sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101));

  /* ---- daily trend ---- */

  const dayMap = new Map<string, Record<string, number>>();

  for (const row of byDay) {
    const key = row.date.toISOString().slice(0, 10);

    const entry = dayMap.get(key) ?? {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };

    entry[row.status] = row._count._all;

    dayMap.set(key, entry);
  }

  return NextResponse.json({
    type: "ATTENDANCE",
    term,
    generatedAt: new Date().toISOString(),
    range: {
      from: options.from ? options.from.toISOString().slice(0, 10) : null,
      to: options.to ? options.to.toISOString().slice(0, 10) : null,
      classroomId: options.classroomId ?? null,
    },
    summary: {
      counts,
      total,
      rate: total
        ? round(((counts.PRESENT + counts.LATE) / total) * 100, 1)
        : null,
      chronicAbsence: studentsReport.filter(
        (student) => (student.rate ?? 100) < 75
      ).length,
    },
    classes,
    students: studentsReport,
    days: Array.from(dayMap.entries())
      .map(([date, countsForDay]) => ({
        date,
        ...countsForDay,
        total: Object.values(countsForDay).reduce(
          (sum, value) => sum + value,
          0
        ),
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  });
}

/* =========================================================
   PERFORMANCE REPORT
========================================================= */

async function performanceReport(options: { termId?: string | null }) {
  const term = await resolveTerm(options.termId);

  if (!term) return badRequest("No term available for this report.");

  const [classrooms, marks, attendanceGroups] = await Promise.all([
    prisma.classroom.findMany({
      select: {
        id: true,
        name: true,
        section: { select: { name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    }),

    prisma.mark.findMany({
      where: { sequence: { termId: term.id } },
      select: {
        average: true,
        studentId: true,
        student: { select: { classroomId: true } },
        subject: { select: { id: true, name: true, coefficient: true } },
      },
    }),

    prisma.attendance.groupBy({
      by: ["studentId", "status"],
      where: { sequence: { termId: term.id } },
      _count: { _all: true },
    }),
  ]);

  /* ---- classes ---- */

  const classStats = new Map<
    string,
    { total: number; count: number; passed: number; students: Set<string> }
  >();

  for (const mark of marks) {
    const classId = mark.student.classroomId;

    const entry = classStats.get(classId) ?? {
      total: 0,
      count: 0,
      passed: 0,
      students: new Set<string>(),
    };

    entry.total += mark.average;
    entry.count += 1;
    if (mark.average >= 50) entry.passed += 1;
    entry.students.add(mark.studentId);

    classStats.set(classId, entry);
  }

  const classes = classrooms
    .map((classroom) => {
      const entry = classStats.get(classroom.id);

      return {
        id: classroom.id,
        name: classroom.name,
        sectionName: classroom.section?.name ?? null,
        students: classroom._count.students,
        assessed: entry?.students.size ?? 0,
        marks: entry?.count ?? 0,
        average: entry && entry.count ? round(entry.total / entry.count) : null,
        passRate:
          entry && entry.count
            ? round((entry.passed / entry.count) * 100, 1)
            : null,
      };
    })
    .sort((a, b) => (b.average ?? -1) - (a.average ?? -1));

  /* ---- subjects ---- */

  const subjectStats = new Map<
    string,
    {
      name: string;
      coefficient: number;
      total: number;
      count: number;
      passed: number;
      highest: number;
      lowest: number;
    }
  >();

  for (const mark of marks) {
    const entry = subjectStats.get(mark.subject.id) ?? {
      name: mark.subject.name,
      coefficient: mark.subject.coefficient,
      total: 0,
      count: 0,
      passed: 0,
      highest: mark.average,
      lowest: mark.average,
    };

    entry.total += mark.average;
    entry.count += 1;
    if (mark.average >= 50) entry.passed += 1;
    entry.highest = Math.max(entry.highest, mark.average);
    entry.lowest = Math.min(entry.lowest, mark.average);

    subjectStats.set(mark.subject.id, entry);
  }

  const subjects = Array.from(subjectStats.entries())
    .map(([id, entry]) => ({
      id,
      name: entry.name,
      coefficient: entry.coefficient,
      recorded: entry.count,
      average: round(entry.total / entry.count),
      passRate: round((entry.passed / entry.count) * 100, 1),
      highest: round(entry.highest),
      lowest: round(entry.lowest),
    }))
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0));

  /* ---- students ranking ---- */

  const studentStats = new Map<string, { total: number; count: number }>();

  for (const mark of marks) {
    const entry = studentStats.get(mark.studentId) ?? { total: 0, count: 0 };

    entry.total += mark.average;
    entry.count += 1;

    studentStats.set(mark.studentId, entry);
  }

  const studentIds = Array.from(studentStats.keys());

  const studentInfo = studentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricule: true,
          classroom: { select: { id: true, name: true } },
        },
      })
    : [];

  const attendanceMap = new Map<string, { total: number; attended: number }>();

  for (const row of attendanceGroups) {
    const entry = attendanceMap.get(row.studentId) ?? {
      total: 0,
      attended: 0,
    };

    entry.total += row._count._all;

    if (row.status === "PRESENT" || row.status === "LATE") {
      entry.attended += row._count._all;
    }

    attendanceMap.set(row.studentId, entry);
  }

  const topStudents = studentInfo
    .map((student) => {
      const stats = studentStats.get(student.id);
      const attendanceEntry = attendanceMap.get(student.id);
      const average = stats && stats.count ? stats.total / stats.count : null;

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        matricule: student.matricule,
        className: student.classroom?.name ?? null,
        average: round(average),
        grade: average === null ? null : gradeOf(average),
        attendanceRate: attendanceEntry
          ? round((attendanceEntry.attended / attendanceEntry.total) * 100, 1)
          : null,
      };
    })
    .sort((a, b) => (b.average ?? -1) - (a.average ?? -1));

  const allAverages = topStudents
    .map((student) => student.average)
    .filter((value): value is number => value !== null);

  const globalAverage = allAverages.length
    ? round(allAverages.reduce((sum, value) => sum + value, 0) / allAverages.length)
    : null;

  return NextResponse.json({
    type: "PERFORMANCE",
    term,
    generatedAt: new Date().toISOString(),
    summary: {
      classes: classes.length,
      subjects: subjects.length,
      marks: marks.length,
      students: topStudents.length,
      average: globalAverage,
      passRate: allAverages.length
        ? round(
            (allAverages.filter((value) => value >= 50).length /
              allAverages.length) *
              100,
            1
          )
        : null,
      strongestSubject: subjects.length ? subjects[0].name : null,
      weakestSubject: subjects.length ? subjects[subjects.length - 1].name : null,
    },
    classes,
    subjects,
    topStudents: topStudents.slice(0, 20),
    bottomStudents: topStudents.slice(-10).reverse(),
  });
}
