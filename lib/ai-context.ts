import prisma from "@/lib/prisma";
import { PASS_MARK } from "@/lib/grading";
import { buildTeacherAnalytics } from "@/lib/teacher-analytics";

/**
 * Builds the school context that is sent to the AI provider.
 *
 * The full database is never sent: only aggregate figures and short lists are
 * produced on the server, so an administrator cannot leak row level data by
 * prompting the assistant.
 */
export async function buildSchoolContext() {
  const [year, term] = await Promise.all([
    prisma.academicYear.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, startDate: true, endDate: true },
    }),
    prisma.term.findFirst({
      where: { isCurrent: true },
      select: {
        id: true,
        name: true,
        academicYear: { select: { name: true } },
        sequences: { select: { name: true, order: true } },
      },
    }),
  ]);

  const [
    students,
    teachers,
    parents,
    classes,
    subjects,
    marks,
    attendance,
    publications,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.parent.count(),
    prisma.classroom.findMany({
      select: {
        name: true,
        section: { select: { name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({
      select: { name: true, coefficient: true },
      orderBy: { name: "asc" },
    }),
    term
      ? prisma.mark.findMany({
          where: { sequence: { termId: term.id } },
          select: {
            average: true,
            subject: { select: { name: true, coefficient: true } },
            student: { select: { classroomId: true } },
          },
        })
      : Promise.resolve([]),
    term
      ? prisma.attendance.groupBy({
          by: ["status"],
          where: { sequence: { termId: term.id } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    prisma.resultPublication.count({ where: { status: "PUBLISHED" } }),
  ]);

  /* ---- performance aggregates ---- */

  const subjectStats = new Map<string, { total: number; count: number }>();
  const classStats = new Map<string, { total: number; count: number }>();
  let markTotal = 0;
  let markCount = 0;
  let passed = 0;

  for (const mark of marks) {
    const subject = subjectStats.get(mark.subject.name) ?? {
      total: 0,
      count: 0,
    };

    subject.total += mark.average;
    subject.count += 1;

    subjectStats.set(mark.subject.name, subject);

    const classId = mark.student.classroomId;

    if (classId) {
      const entry = classStats.get(classId) ?? { total: 0, count: 0 };

      entry.total += mark.average;
      entry.count += 1;

      classStats.set(classId, entry);
    }

    markTotal += mark.average;
    markCount += 1;
    if (mark.average >= PASS_MARK) passed += 1;
  }

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

  const round = (value: number) => Math.round(value * 100) / 100;

  return {
    generatedAt: new Date().toISOString(),

    school: {
      academicYear: year?.name ?? null,
      term: term ? `${term.name} (${term.academicYear.name})` : null,
      sequences: term?.sequences.map((sequence) => sequence.name) ?? [],
      counts: {
        students,
        teachers,
        parents,
        classes: classes.length,
        subjects: subjects.length,
      },
      publishedResultSets: publications,
    },

    classes: classes.map((classroom) => ({
      name: classroom.name,
      section: classroom.section?.name ?? null,
      students: classroom._count.students,
    })),

    subjects: subjects.map((subject) => ({
      name: subject.name,
      coefficient: subject.coefficient,
      average:
        subjectStats.get(subject.name)?.count
          ? round(
              (subjectStats.get(subject.name)!.total /
                subjectStats.get(subject.name)!.count) *
                1
            )
          : null,
      marks: subjectStats.get(subject.name)?.count ?? 0,
    })),

    performance: {
      marksRecorded: markCount,
      average: markCount ? round(markTotal / markCount) : null,
      passRate: markCount ? round((passed / markCount) * 100) : null,
    },

    attendance: {
      records: attendanceTotal,
      ...attendanceCounts,
      rate: attendanceTotal
        ? round(
            ((attendanceCounts.PRESENT + attendanceCounts.LATE) /
              attendanceTotal) *
              100
          )
        : null,
    },
  };
}

export type SchoolContext = Awaited<ReturnType<typeof buildSchoolContext>>;

/** Renders the context as compact text for the model prompt. */
export function renderSchoolContext(context: SchoolContext): string {
  return renderContext(context);
}

/** Renders any context object as compact JSON for the model prompt. */
export function renderContext(context: unknown): string {
  return JSON.stringify(context, null, 2);
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Parses "HH:MM" into minutes since midnight. */
function toMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Duration in hours between two "HH:MM" strings (minimum 1 hour). */
function lessonHours(start: string, end: string): number {
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (a === null || b === null || b <= a) return 1;
  return Math.max(1, (b - a) / 60);
}

/* =========================================================
   TEACHER AI CONTEXT
========================================================= */

/**
 * Everything the teacher AI assistant is allowed to see: the teacher's
 * assignments and, for each assigned class, real marks, attendance and
 * performance trends aggregated from the database.
 */
export async function buildTeacherAiContext(teacherId: string) {
  const analytics = await buildTeacherAnalytics(teacherId);

  if (!analytics) return { error: "Teacher not found." };

  return {
    generatedAt: analytics.generatedAt,
    teacher: { name: analytics.teacher.name },
    academicYear: analytics.academicYear?.name ?? null,
    assignedSubjects: Array.from(
      new Set(analytics.assignments.map((assignment) => assignment.subject))
    ).map((subject) => ({
      name: subject,
      coefficient:
        analytics.assignments.find((assignment) => assignment.subject === subject)
          ?.coefficient ?? null,
    })),
    classes: analytics.classes.map((klass) => {
      const subjects = analytics.subjectAverages.filter(
        (subject) => subject.class === klass.name
      );

      return {
        name: klass.name,
        section: klass.section,
        students: klass.students,
        classAverage: klass.average,
        passRate: klass.passRate,
        subjectAverages: subjects.map((subject) => ({
          subject: subject.subject,
          average: subject.average,
          marks: subject.marks,
        })),
        performanceBySequence: subjects.length
          ? subjects[0].bySequence
          : [],
        attendance: {
          records: analytics.overview.attendance.records,
          present: analytics.overview.attendance.present,
          absent: analytics.overview.attendance.absent,
          late: analytics.overview.attendance.late,
          excused: analytics.overview.attendance.excused,
          rate: analytics.overview.attendance.rate,
        },
      };
    }),
    bestStudents: analytics.bestStudents,
    weakStudents: analytics.atRiskStudents
      .filter((student) => student.average !== null)
      .slice(0, 5),
    attendanceProblems: analytics.atRiskStudents
      .filter((student) => student.hoursAbsent + student.hoursLate >= 3)
      .slice(0, 8)
      .map((student) => ({
        name: student.name,
        class: student.class,
        hoursAbsent: student.hoursAbsent,
        hoursLate: student.hoursLate,
      })),
    markTrends: analytics.trends.marks,
    attendanceTrends: analytics.trends.attendance,
    note: "Each attendance record represents one lesson hour. The pass mark is 10/20 (marks are recorded on the 20-point scale). Subject scope of this teacher is limited to the assignments listed above; class figures cover every subject of the class.",
  };
}

export type TeacherAiContext = Awaited<ReturnType<typeof buildTeacherAiContext>>;

/* =========================================================
   PARENT AI CONTEXT
========================================================= */

/**
 * Everything the parent AI assistant is allowed to see: only the children
 * linked to this parent, with their real marks, attendance and report cards.
 */
export async function buildParentAiContext(parentId: string) {
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    select: {
      fullName: true,
      children: {
        where: { status: { not: "SUSPENDED" } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricule: true,
          classroom: {
            select: { name: true, section: { select: { name: true } } },
          },
          marks: {
            select: {
              ca1: true,
              ca2: true,
              exam: true,
              average: true,
              grade: true,
              remark: true,
              subject: { select: { name: true, coefficient: true } },
              sequence: {
                select: {
                  name: true,
                  order: true,
                  term: { select: { name: true, academicYear: { select: { name: true } } } },
                },
              },
            },
          },
          attendances: {
            select: {
              status: true,
              date: true,
              subject: { select: { name: true } },
            },
            orderBy: { date: "desc" },
          },
          reportCards: {
            select: {
              average: true,
              rank: true,
              decision: true,
              principalRemark: true,
              term: {
                select: { name: true, academicYear: { select: { name: true } } },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { lastName: "asc" },
      },
    },
  });

  if (!parent) return { error: "Parent not found." };

  const children = parent.children.map((child) => {
    /* marks grouped by subject then by sequence */
    const bySubject = new Map<
      string,
      {
        coefficient: number;
        sequences: { sequence: string; average: number }[];
        total: number;
        count: number;
      }
    >();

    const bySequence = new Map<string, { total: number; count: number }>();

    for (const mark of child.marks) {
      const entry = bySubject.get(mark.subject.name) ?? {
        coefficient: mark.subject.coefficient,
        sequences: [],
        total: 0,
        count: 0,
      };

      entry.sequences.push({
        sequence: `${mark.sequence.term.name} · ${mark.sequence.name}`,
        average: mark.average,
      });
      entry.total += mark.average;
      entry.count += 1;
      bySubject.set(mark.subject.name, entry);

      const sequenceKey = `${mark.sequence.term.name} · ${mark.sequence.name}`;
      const sequence = bySequence.get(sequenceKey) ?? { total: 0, count: 0 };
      sequence.total += mark.average;
      sequence.count += 1;
      bySequence.set(sequenceKey, sequence);
    }

    const attendanceCounts = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    for (const record of child.attendances) attendanceCounts[record.status] += 1;

    const attendanceTotal = Object.values(attendanceCounts).reduce(
      (sum, value) => sum + value,
      0
    );

    const overall =
      child.marks.length > 0
        ? round2(
            child.marks.reduce((total, mark) => total + mark.average, 0) / child.marks.length
          )
        : null;

    return {
      name: `${child.firstName} ${child.lastName}`,
      matricule: child.matricule,
      class: child.classroom?.name ?? null,
      section: child.classroom?.section.name ?? null,
      overallAverage: overall,
      subjects: Array.from(bySubject.entries())
        .map(([subject, value]) => ({
          subject,
          coefficient: value.coefficient,
          average: round2(value.total / value.count),
          bySequence: value.sequences,
        }))
        .sort((a, b) => a.subject.localeCompare(b.subject)),
      performanceBySequence: Array.from(bySequence.entries())
        .map(([sequence, value]) => ({
          sequence,
          average: round2(value.total / value.count),
        }))
        .sort((a, b) => a.sequence.localeCompare(b.sequence)),
      reportCards: child.reportCards.map((card) => ({
        term: `${card.term.academicYear.name} · ${card.term.name}`,
        average: card.average,
        rank: card.rank,
        decision: card.decision,
        principalRemark: card.principalRemark,
      })),
      attendance: {
        hoursPresent: attendanceCounts.PRESENT,
        hoursAbsent: attendanceCounts.ABSENT,
        hoursLate: attendanceCounts.LATE,
        hoursExcused: attendanceCounts.EXCUSED,
        rate: attendanceTotal
          ? round2(
              ((attendanceCounts.PRESENT + attendanceCounts.LATE) / attendanceTotal) * 100
            )
          : null,
        recentIssues: child.attendances
          .filter((record) => record.status === "ABSENT" || record.status === "LATE")
          .slice(0, 8)
          .map((record) => ({
            date: record.date.toISOString().slice(0, 10),
            status: record.status,
            subject: record.subject.name,
          })),
      },
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    parent: { name: parent.fullName },
    children,
    note: "Each attendance record represents one lesson hour. The pass mark is 10/20 (marks are recorded on the 20-point scale). Averages are computed over recorded marks only.",
  };
}

export type ParentAiContext = Awaited<ReturnType<typeof buildParentAiContext>>;

/* =========================================================
   ADMIN AI CONTEXT (extended school context)
========================================================= */

/**
 * School-wide context for the admin AI assistant: the aggregate school
 * figures plus class/section/year comparisons, attendance issues and
 * teacher workload — all computed from the database.
 */
export async function buildAdminAiContext() {
  const base = await buildSchoolContext();

  const [
    classrooms,
    marks,
    attendances,
    teachers,
    absenceByStudent,
  ] = await Promise.all([
    prisma.classroom.findMany({
      select: {
        id: true,
        name: true,
        section: { select: { name: true } },
        academicYear: { select: { name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.mark.findMany({
      select: {
        average: true,
        student: { select: { classroomId: true } },
        sequence: {
          select: {
            name: true,
            term: { select: { name: true, academicYear: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.attendance.findMany({
      select: {
        status: true,
        student: { select: { classroomId: true } },
      },
    }),
    prisma.teacher.findMany({
      select: {
        id: true,
        fullName: true,
        _count: { select: { assignments: true, attendances: true, marks: true } },
        assignments: {
          select: {
            classroom: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
        timetable: { select: { startTime: true, endTime: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.attendance.groupBy({
      by: ["studentId"],
      where: { status: "ABSENT" },
      _count: { _all: true },
      orderBy: { _count: { studentId: "asc" } },
    }),
  ]);

  /* ---- class comparisons ---- */

  const classStats = new Map<
    string,
    {
      name: string;
      section: string;
      year: string;
      students: number;
      markTotal: number;
      markCount: number;
      passed: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
    }
  >();

  for (const classroom of classrooms) {
    classStats.set(classroom.id, {
      name: classroom.name,
      section: classroom.section.name,
      year: classroom.academicYear.name,
      students: classroom._count.students,
      markTotal: 0,
      markCount: 0,
      passed: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    });
  }

  for (const mark of marks) {
    const bucket = mark.student.classroomId ? classStats.get(mark.student.classroomId) : null;
    if (!bucket) continue;
    bucket.markTotal += mark.average;
    bucket.markCount += 1;
    if (mark.average >= PASS_MARK) bucket.passed += 1;
  }

  for (const record of attendances) {
    const bucket = record.student.classroomId ? classStats.get(record.student.classroomId) : null;
    if (!bucket) continue;
    if (record.status === "PRESENT") bucket.present += 1;
    else if (record.status === "ABSENT") bucket.absent += 1;
    else if (record.status === "LATE") bucket.late += 1;
    else bucket.excused += 1;
  }

  const classComparisons = Array.from(classStats.values())
    .map((bucket) => {
      const attendanceTotal =
        bucket.present + bucket.absent + bucket.late + bucket.excused;

      return {
        class: bucket.name,
        section: bucket.section,
        academicYear: bucket.year,
        students: bucket.students,
        average: bucket.markCount ? round2(bucket.markTotal / bucket.markCount) : null,
        passRate: bucket.markCount
          ? round2((bucket.passed / bucket.markCount) * 100)
          : null,
        attendanceRate: attendanceTotal
          ? round2(((bucket.present + bucket.late) / attendanceTotal) * 100)
          : null,
      };
    })
    .filter((entry) => entry.students > 0 || entry.average !== null);

  /* ---- section comparisons ---- */

  const sectionMap = new Map<
    string,
    { classes: number; students: number; total: number; count: number; passed: number }
  >();

  for (const entry of classComparisons) {
    if (!sectionMap.has(entry.section)) {
      sectionMap.set(entry.section, {
        classes: 0,
        students: 0,
        total: 0,
        count: 0,
        passed: 0,
      });
    }

    const section = sectionMap.get(entry.section)!;
    section.classes += 1;
    section.students += entry.students;
    if (entry.average !== null) {
      section.total += entry.average;
      section.count += 1;
    }
  }

  const sectionComparisons = Array.from(sectionMap.entries()).map(([section, value]) => ({
    section,
    classes: value.classes,
    students: value.students,
    averageClassPerformance: value.count ? round2(value.total / value.count) : null,
  }));

  /* ---- academic year comparisons ---- */

  const yearMap = new Map<string, { total: number; count: number }>();

  for (const mark of marks) {
    const yearName = mark.sequence.term.academicYear.name;
    const bucket = yearMap.get(yearName) ?? { total: 0, count: 0 };
    bucket.total += mark.average;
    bucket.count += 1;
    yearMap.set(yearName, bucket);
  }

  const yearComparisons = Array.from(yearMap.entries()).map(([year, value]) => ({
    academicYear: year,
    average: round2(value.total / value.count),
    marks: value.count,
  }));

  /* ---- teacher workload ---- */

  const teacherWorkload = teachers
    .map((teacher) => {
      const classSet = new Set(teacher.assignments.map((a) => a.classroom.name));
      const subjectSet = new Set(teacher.assignments.map((a) => a.subject.name));
      const weeklyHours = teacher.timetable.reduce(
        (total, entry) => total + lessonHours(entry.startTime, entry.endTime),
        0
      );

      return {
        teacher: teacher.fullName,
        assignments: teacher._count.assignments,
        classes: classSet.size,
        subjects: subjectSet.size,
        timetableHoursPerWeek: round2(weeklyHours),
        marksRecorded: teacher._count.marks,
        attendanceRecords: teacher._count.attendances,
      };
    })
    .sort((a, b) => b.assignments - a.assignments)
    .slice(0, 40);

  /* ---- attendance issues: most absent students ---- */

  const absentStudentIds = absenceByStudent
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 10)
    .map((row) => row.studentId);

  const absentStudents = absentStudentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: absentStudentIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          classroom: { select: { name: true } },
        },
      })
    : [];

  const absenceCountById = new Map(
    absenceByStudent.map((row) => [row.studentId, row._count._all])
  );

  const attendanceIssues = absentStudents
    .map((student) => ({
      student: `${student.firstName} ${student.lastName}`,
      class: student.classroom?.name ?? null,
      hoursAbsent: absenceCountById.get(student.id) ?? 0,
    }))
    .sort((a, b) => b.hoursAbsent - a.hoursAbsent);

  return {
    ...base,
    classComparisons,
    sectionComparisons,
    yearComparisons,
    teacherWorkload,
    attendanceIssues,
    note: "Each attendance record represents one lesson hour. The pass mark is 10/20 (marks are recorded on the 20-point scale). Teacher workload combines assignments with published timetable hours per week.",
  };
}

export type AdminAiContext = Awaited<ReturnType<typeof buildAdminAiContext>>;
