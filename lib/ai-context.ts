import prisma from "@/lib/prisma";

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
    if (mark.average >= 50) passed += 1;
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
  return JSON.stringify(context, null, 2);
}
