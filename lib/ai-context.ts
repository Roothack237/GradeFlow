import prisma from "@/lib/prisma";

import { PASS_MARK } from "@/lib/grading";

import { buildTeacherAnalytics } from "@/lib/teacher-analytics";

/**
 * Builds the school context that is sent to the AI provider.
 *
 * The full database is never sent: only aggregate figures and short lists are
 * produced on the server.
 */

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Parses "HH:MM" into minutes since midnight.
 */
function toMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());

  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Duration in hours between two "HH:MM" strings.
 */
function lessonHours(start: string, end: string): number {
  const a = toMinutes(start);
  const b = toMinutes(end);

  if (a === null || b === null || b <= a) return 1;

  return Math.max(1, (b - a) / 60);
}

/* =========================================================
   SCHOOL CONTEXT
========================================================= */

export async function buildSchoolContext() {
  const [year, term] = await Promise.all([
    prisma.academicYear.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    }),

    prisma.term.findFirst({
      where: { isCurrent: true },
      select: {
        id: true,
        name: true,
        academicYear: {
          select: {
            name: true,
          },
        },
        sequences: {
          select: {
            name: true,
            order: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    }),
  ]);

  const [
    students,
    teachers,
    parents,
    classrooms,
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
        section: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.subject.findMany({
      select: {
        name: true,
        coefficient: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    term
      ? prisma.mark.findMany({
          where: {
            sequence: {
              termId: term.id,
            },
          },
          select: {
            score: true,
            subject: {
              select: {
                name: true,
                coefficient: true,
              },
            },
            student: {
              select: {
                classroomId: true,
              },
            },
          },
        })
      : Promise.resolve([]),

    term
      ? prisma.attendance.groupBy({
          by: ["status"],
          where: {
            sequence: {
              termId: term.id,
            },
          },
          _count: {
            _all: true,
          },
        })
      : Promise.resolve([]),

    prisma.resultPublication.count({
      where: {
        status: "PUBLISHED",
      },
    }),
  ]);

  /* ---------------------------------------------------------
     PERFORMANCE AGGREGATES
  --------------------------------------------------------- */

  const subjectStats = new Map<
    string,
    {
      total: number;
      count: number;
    }
  >();

  let markTotal = 0;
  let markCount = 0;
  let passed = 0;

  for (const mark of marks) {
    const score = Number(mark.score);

    if (!Number.isFinite(score)) continue;

    const subject = subjectStats.get(mark.subject.name) ?? {
      total: 0,
      count: 0,
    };

    subject.total += score;
    subject.count += 1;

    subjectStats.set(mark.subject.name, subject);

    markTotal += score;
    markCount += 1;

    if (score >= PASS_MARK) {
      passed += 1;
    }
  }

  /* ---------------------------------------------------------
     ATTENDANCE
  --------------------------------------------------------- */

  const attendanceCounts: Record<string, number> = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
  };

  for (const row of attendance) {
    attendanceCounts[row.status] =
      (attendanceCounts[row.status] ?? 0) + row._count._all;
  }

  const attendanceTotal = Object.values(attendanceCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  return {
    generatedAt: new Date().toISOString(),

    school: {
      academicYear: year?.name ?? null,

      term: term
        ? `${term.name} (${term.academicYear.name})`
        : null,

      sequences:
        term?.sequences.map((sequence) => sequence.name) ?? [],

      counts: {
        students,
        teachers,
        parents,
        classes: classrooms.length,
        subjects: subjects.length,
      },

      publishedResultSets: publications,
    },

    classes: classrooms.map((classroom) => ({
      name: classroom.name,
      section: classroom.section?.name ?? null,
      students: classroom._count.students,
    })),

    subjects: subjects.map((subject) => {
      const stats = subjectStats.get(subject.name);

      return {
        name: subject.name,
        coefficient: subject.coefficient,

        average:
          stats && stats.count > 0
            ? round2(stats.total / stats.count)
            : null,

        marks: stats?.count ?? 0,
      };
    }),

    performance: {
      marksRecorded: markCount,

      average:
        markCount > 0
          ? round2(markTotal / markCount)
          : null,

      passRate:
        markCount > 0
          ? round2((passed / markCount) * 100)
          : null,
    },

    attendance: {
      records: attendanceTotal,

      present: attendanceCounts.PRESENT ?? 0,
      absent: attendanceCounts.ABSENT ?? 0,
      late: attendanceCounts.LATE ?? 0,
      excused: attendanceCounts.EXCUSED ?? 0,

      rate:
        attendanceTotal > 0
          ? round2(
              (((attendanceCounts.PRESENT ?? 0) +
                (attendanceCounts.LATE ?? 0)) /
                attendanceTotal) *
                100
            )
          : null,
    },
  };
}

export type SchoolContext = Awaited<
  ReturnType<typeof buildSchoolContext>
>;

/**
 * Renders school context as compact text for the AI model.
 */
export function renderSchoolContext(context: SchoolContext): string {
  return renderContext(context);
}

/**
 * Renders any context object as compact JSON.
 */
export function renderContext(context: unknown): string {
  return JSON.stringify(context, null, 2);
}

/* =========================================================
   TEACHER AI CONTEXT
========================================================= */

export async function buildTeacherAiContext(teacherId: string) {
  const analytics = await buildTeacherAnalytics(teacherId);

  if (!analytics) {
    return {
      error: "Teacher not found.",
    };
  }

  return {
    generatedAt: analytics.generatedAt,

    teacher: {
      name: analytics.teacher.name,
    },

    academicYear: analytics.academicYear?.name ?? null,

    assignedSubjects: Array.from(
      new Set(
        analytics.assignments.map(
          (assignment) => assignment.subject
        )
      )
    ).map((subject) => ({
      name: subject,

      coefficient:
        analytics.assignments.find(
          (assignment) => assignment.subject === subject
        )?.coefficient ?? null,
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
      .filter(
        (student) =>
          student.hoursAbsent + student.hoursLate >= 3
      )
      .slice(0, 8)
      .map((student) => ({
        name: student.name,
        class: student.class,
        hoursAbsent: student.hoursAbsent,
        hoursLate: student.hoursLate,
      })),

    markTrends: analytics.trends.marks,

    attendanceTrends: analytics.trends.attendance,

    note:
      "Each attendance record represents one lesson hour. " +
      "The pass mark is 10/20. Marks are recorded on the 20-point scale. " +
      "Teacher scope is limited to assigned classes and subjects.",
  };
}

export type TeacherAiContext = Awaited<
  ReturnType<typeof buildTeacherAiContext>
>;

/* =========================================================
   PARENT AI CONTEXT
========================================================= */

export async function buildParentAiContext(parentId: string) {
  const parent = await prisma.parent.findUnique({
    where: {
      id: parentId,
    },

    select: {
      fullName: true,

      children: {
        where: {
          status: {
            not: "SUSPENDED",
          },
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricule: true,

          classroom: {
            select: {
              name: true,

              section: {
                select: {
                  name: true,
                },
              },
            },
          },

          marks: {
            select: {
              score: true,

              subject: {
                select: {
                  name: true,
                  coefficient: true,
                },
              },

              sequence: {
                select: {
                  name: true,
                  order: true,

                  term: {
                    select: {
                      name: true,

                      academicYear: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },

          attendances: {
            select: {
              status: true,
              date: true,

              subject: {
                select: {
                  name: true,
                },
              },
            },

            orderBy: {
              date: "desc",
            },
          },

          reportCards: {
            select: {
              average: true,
              position: true,
              decision: true,
              principalRemark: true,
              generatedAt: true,

              term: {
                select: {
                  name: true,

                  academicYear: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },

            orderBy: {
              generatedAt: "desc",
            },
          },
        },

        orderBy: {
          lastName: "asc",
        },
      },
    },
  });

  if (!parent) {
    return {
      error: "Parent not found.",
    };
  }

  const children = parent.children.map((child) => {
    const bySubject = new Map<
      string,
      {
        coefficient: number;
        sequences: {
          sequence: string;
          score: number;
        }[];
        total: number;
        count: number;
      }
    >();

    const bySequence = new Map<
      string,
      {
        total: number;
        count: number;
      }
    >();

    for (const mark of child.marks) {
      const score = Number(mark.score);

      if (!Number.isFinite(score)) continue;

      const entry = bySubject.get(mark.subject.name) ?? {
        coefficient: mark.subject.coefficient,
        sequences: [],
        total: 0,
        count: 0,
      };

      entry.sequences.push({
        sequence: `${mark.sequence.term.name} · ${mark.sequence.name}`,
        score,
      });

      entry.total += score;
      entry.count += 1;

      bySubject.set(mark.subject.name, entry);

      const sequenceKey =
        `${mark.sequence.term.name} · ${mark.sequence.name}`;

      const sequence = bySequence.get(sequenceKey) ?? {
        total: 0,
        count: 0,
      };

      sequence.total += score;
      sequence.count += 1;

      bySequence.set(sequenceKey, sequence);
    }

    const attendanceCounts = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };

    for (const record of child.attendances) {
      attendanceCounts[record.status] =
        (attendanceCounts[record.status] ?? 0) + 1;
    }

    const attendanceTotal = Object.values(
      attendanceCounts
    ).reduce((sum, value) => sum + value, 0);

    const overall =
      child.marks.length > 0
        ? round2(
            child.marks.reduce(
              (total, mark) => total + Number(mark.score),
              0
            ) / child.marks.length
          )
        : null;

    return {
      name: `${child.firstName} ${child.lastName}`,

      matricule: child.matricule,

      class: child.classroom?.name ?? null,

      section: child.classroom?.section?.name ?? null,

      overallAverage: overall,

      subjects: Array.from(bySubject.entries())
        .map(([subject, value]) => ({
          subject,
          coefficient: value.coefficient,

          average:
            value.count > 0
              ? round2(value.total / value.count)
              : null,

          bySequence: value.sequences,
        }))
        .sort((a, b) =>
          a.subject.localeCompare(b.subject)
        ),

      performanceBySequence: Array.from(
        bySequence.entries()
      )
        .map(([sequence, value]) => ({
          sequence,

          average:
            value.count > 0
              ? round2(value.total / value.count)
              : null,
        }))
        .sort((a, b) =>
          a.sequence.localeCompare(b.sequence)
        ),

      reportCards: child.reportCards.map((card) => ({
        term:
          `${card.term.academicYear.name} · ${card.term.name}`,

        average: card.average,

        position: card.position,

        decision: card.decision,

        principalRemark: card.principalRemark,
      })),

      attendance: {
        hoursPresent: attendanceCounts.PRESENT,
        hoursAbsent: attendanceCounts.ABSENT,
        hoursLate: attendanceCounts.LATE,
        hoursExcused: attendanceCounts.EXCUSED,

        rate:
          attendanceTotal > 0
            ? round2(
                ((attendanceCounts.PRESENT +
                  attendanceCounts.LATE) /
                  attendanceTotal) *
                  100
              )
            : null,

        recentIssues: child.attendances
          .filter(
            (record) =>
              record.status === "ABSENT" ||
              record.status === "LATE"
          )
          .slice(0, 8)
          .map((record) => ({
            date: record.date
              .toISOString()
              .slice(0, 10),

            status: record.status,

            subject: record.subject.name,
          })),
      },
    };
  });

  return {
    generatedAt: new Date().toISOString(),

    parent: {
      name: parent.fullName,
    },

    children,

    note:
      "Each attendance record represents one lesson hour. " +
      "The pass mark is 10/20. Marks are recorded on the 20-point scale. " +
      "Averages are computed over recorded sequence marks only.",
  };
}

export type ParentAiContext = Awaited<
  ReturnType<typeof buildParentAiContext>
>;

/* =========================================================
   ADMIN AI CONTEXT
========================================================= */

/**
 * School-wide context for the admin AI assistant.
 *
 * Uses the current GradeFlow Mark model:
 *
 * Mark {
 *   studentId
 *   subjectId
 *   teacherId
 *   termId
 *   sequenceId
 *   score
 * }
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

        section: {
          select: {
            name: true,
          },
        },

        academicYear: {
          select: {
            name: true,
          },
        },

        _count: {
          select: {
            students: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    }),

    prisma.mark.findMany({
      select: {
        score: true,

        student: {
          select: {
            classroomId: true,
          },
        },

        sequence: {
          select: {
            name: true,

            term: {
              select: {
                name: true,

                academicYear: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),

    prisma.attendance.findMany({
      select: {
        status: true,

        student: {
          select: {
            classroomId: true,
          },
        },
      },
    }),

    prisma.teacher.findMany({
      select: {
        id: true,
        fullName: true,

        _count: {
          select: {
            assignments: true,
            attendances: true,
            marks: true,
          },
        },

        assignments: {
          select: {
            classroom: {
              select: {
                name: true,
              },
            },

            subject: {
              select: {
                name: true,
              },
            },
          },
        },

        timetable: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },

      orderBy: {
        fullName: "asc",
      },
    }),

    prisma.attendance.groupBy({
      by: ["studentId"],

      where: {
        status: "ABSENT",
      },

      _count: {
        _all: true,
      },

      orderBy: {
        _count: {
          studentId: "desc",
        },
      },

      take: 10,
    }),
  ]);

  /* ---------------------------------------------------------
     CLASS COMPARISONS
  --------------------------------------------------------- */

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
      section: classroom.section?.name ?? "Unknown",
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
    const classroomId = mark.student.classroomId;

    if (!classroomId) continue;

    const bucket = classStats.get(classroomId);

    if (!bucket) continue;

    const score = Number(mark.score);

    if (!Number.isFinite(score)) continue;

    bucket.markTotal += score;
    bucket.markCount += 1;

    if (score >= PASS_MARK) {
      bucket.passed += 1;
    }
  }

  for (const record of attendances) {
    const classroomId = record.student.classroomId;

    if (!classroomId) continue;

    const bucket = classStats.get(classroomId);

    if (!bucket) continue;

    if (record.status === "PRESENT") {
      bucket.present += 1;
    } else if (record.status === "ABSENT") {
      bucket.absent += 1;
    } else if (record.status === "LATE") {
      bucket.late += 1;
    } else if (record.status === "EXCUSED") {
      bucket.excused += 1;
    }
  }

  const classComparisons = Array.from(
    classStats.values()
  )
    .map((bucket) => {
      const attendanceTotal =
        bucket.present +
        bucket.absent +
        bucket.late +
        bucket.excused;

      return {
        class: bucket.name,

        section: bucket.section,

        academicYear: bucket.year,

        students: bucket.students,

        average:
          bucket.markCount > 0
            ? round2(
                bucket.markTotal /
                  bucket.markCount
              )
            : null,

        passRate:
          bucket.markCount > 0
            ? round2(
                (bucket.passed /
                  bucket.markCount) *
                  100
              )
            : null,

        attendanceRate:
          attendanceTotal > 0
            ? round2(
                ((bucket.present +
                  bucket.late) /
                  attendanceTotal) *
                  100
              )
            : null,
      };
    })
    .filter(
      (entry) =>
        entry.students > 0 ||
        entry.average !== null
    );

  /* ---------------------------------------------------------
     SECTION COMPARISONS
  --------------------------------------------------------- */

  const sectionMap = new Map<
    string,
    {
      classes: number;
      students: number;
      total: number;
      count: number;
    }
  >();

  for (const entry of classComparisons) {
    const section =
      sectionMap.get(entry.section) ?? {
        classes: 0,
        students: 0,
        total: 0,
        count: 0,
      };

    section.classes += 1;
    section.students += entry.students;

    if (entry.average !== null) {
      section.total += entry.average;
      section.count += 1;
    }

    sectionMap.set(entry.section, section);
  }

  const sectionComparisons = Array.from(
    sectionMap.entries()
  ).map(([section, value]) => ({
    section,

    classes: value.classes,

    students: value.students,

    averageClassPerformance:
      value.count > 0
        ? round2(
            value.total /
              value.count
          )
        : null,
  }));

  /* ---------------------------------------------------------
     ACADEMIC YEAR COMPARISONS
  --------------------------------------------------------- */

  const yearMap = new Map<
    string,
    {
      total: number;
      count: number;
    }
  >();

  for (const mark of marks) {
    const yearName =
      mark.sequence.term.academicYear.name;

    const score = Number(mark.score);

    if (!Number.isFinite(score)) continue;

    const bucket =
      yearMap.get(yearName) ?? {
        total: 0,
        count: 0,
      };

    bucket.total += score;
    bucket.count += 1;

    yearMap.set(yearName, bucket);
  }

  const yearComparisons = Array.from(
    yearMap.entries()
  ).map(([academicYear, value]) => ({
    academicYear,

    average:
      value.count > 0
        ? round2(
            value.total /
              value.count
          )
        : 0,

    marks: value.count,
  }));

  /* ---------------------------------------------------------
     TEACHER WORKLOAD
  --------------------------------------------------------- */

  const teacherWorkload = teachers
    .map((teacher) => {
      const classSet = new Set(
        teacher.assignments.map(
          (assignment) =>
            assignment.classroom.name
        )
      );

      const subjectSet = new Set(
        teacher.assignments.map(
          (assignment) =>
            assignment.subject.name
        )
      );

      const weeklyHours =
        teacher.timetable.reduce(
          (total, entry) =>
            total +
            lessonHours(
              entry.startTime,
              entry.endTime
            ),
          0
        );

      return {
        teacher: teacher.fullName,

        assignments:
          teacher._count.assignments,

        classes: classSet.size,

        subjects: subjectSet.size,

        timetableHoursPerWeek:
          round2(weeklyHours),

        marksRecorded:
          teacher._count.marks,

        attendanceRecords:
          teacher._count.attendances,
      };
    })
    .sort(
      (a, b) =>
        b.assignments -
        a.assignments
    )
    .slice(0, 40);

  /* ---------------------------------------------------------
     ATTENDANCE ISSUES
  --------------------------------------------------------- */

  const absentStudentIds =
    absenceByStudent.map(
      (row) => row.studentId
    );

  const absentStudents =
    absentStudentIds.length
      ? await prisma.student.findMany({
          where: {
            id: {
              in: absentStudentIds,
            },
          },

          select: {
            id: true,
            firstName: true,
            lastName: true,

            classroom: {
              select: {
                name: true,
              },
            },
          },
        })
      : [];

  const absenceCountById =
    new Map(
      absenceByStudent.map(
        (row) => [
          row.studentId,
          row._count._all,
        ]
      )
    );

  const attendanceIssues =
    absentStudents
      .map((student) => ({
        student:
          `${student.firstName} ${student.lastName}`,

        class:
          student.classroom?.name ??
          null,

        hoursAbsent:
          absenceCountById.get(
            student.id
          ) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.hoursAbsent -
          a.hoursAbsent
      );

  return {
    ...base,

    classComparisons,

    sectionComparisons,

    yearComparisons,

    teacherWorkload,

    attendanceIssues,

    note:
      "Each attendance record represents one lesson hour. " +
      "The pass mark is 10/20. Marks are recorded on the 20-point scale. " +
      "Teacher workload combines assignments with timetable hours per week.",
  };
}

export type AdminAiContext = Awaited<
  ReturnType<typeof buildAdminAiContext>
>;