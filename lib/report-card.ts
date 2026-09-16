import prisma from "@/lib/prisma";
import { gradeOf, remarkOf, decisionOf, round2 } from "@/lib/grading";
import { enrolledOnly, isInactive, statusLabel } from "@/lib/student-status";

/**
 * Term report card data — built from the marks, attendance, subjects and
 * teacher assignments stored in PostgreSQL.
 *
 * This is the single place where a report card is computed, so the admin
 * generation endpoint, the PDF renderer and the admin UI all agree on the
 * numbers. The aggregation follows the logic that already existed in
 * POST /api/admin/reports/report-cards:
 *
 *   subject average = mean of the sequence averages recorded in the term
 *   term average    = Σ(subject average × coefficient) / Σ(coefficients)
 *   rank            = position of the term average inside the class,
 *                     students with the same average share the same rank
 *   decision        = PROMOTED when the average reaches the pass mark
 *
 * Nothing here invents academic values: every figure traces back to a row in
 * the database. Values that the school must configure itself (school name,
 * address, principal) live in SCHOOL_PROFILE below and are read from the
 * environment.
 */

/* =========================================================
   SCHOOL PROFILE
========================================================= */

/**
 * Identity printed on the report card header.
 *
 * GradeFlow does not store the school's letterhead in the database yet, so it
 * is read from the environment instead of being invented. Set these variables
 * (or edit the defaults) to match the school's official report card.
 */
export const SCHOOL_PROFILE = {
  name: process.env.SCHOOL_NAME ?? "GradeFlow Secondary School",
  motto: process.env.SCHOOL_MOTTO ?? "",
  address: process.env.SCHOOL_ADDRESS ?? "",
  phone: process.env.SCHOOL_PHONE ?? "",
  email: process.env.SCHOOL_EMAIL ?? "",
  ministry: process.env.SCHOOL_MINISTRY ?? "",
  principalName: process.env.SCHOOL_PRINCIPAL_NAME ?? "",
  academicMasterName: process.env.SCHOOL_ACADEMIC_MASTER_NAME ?? "",
  /** The logo printed in the report card header is public/images/logo.png. */
  logoPath: "public/images/logo.png",
};

/* =========================================================
   TYPES
========================================================= */

export type SequenceMark = {
  sequenceId: string;
  sequenceName: string;
  order: number;
  ca1: number | null;
  ca2: number | null;
  exam: number | null;
  average: number | null;
  grade: string | null;
  remark: string | null;
};

export type SubjectLine = {
  subjectId: string;
  subject: string;
  code: string;
  coefficient: number;
  teacher: string | null;
  sequences: SequenceMark[];
  average: number | null;
  points: number | null;
  grade: string | null;
  remark: string | null;
};

export type AttendanceSummary = {
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  EXCUSED: number;
  total: number;
  rate: number | null;
  absentHours: number;
  lateHours: number;
};

export type ReportCardData = {
  student: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    status: string;
    statusLabel: string;
    enrolled: boolean;
    parentName: string | null;
    parentPhone: string | null;
  };
  classroom: {
    id: string;
    name: string;
    sectionName: string | null;
    academicYearId: string;
    academicYearName: string;
  };
  term: { id: string; name: string; order: number };
  sequences: { id: string; name: string; order: number }[];
  subjects: SubjectLine[];
  totals: {
    coefficients: number;
    points: number;
    average: number | null;
    grade: string | null;
  };
  class: {
    size: number;
    ranked: number;
    average: number | null;
    highest: number | null;
    lowest: number | null;
    position: number | null;
  };
  attendance: AttendanceSummary;
  marks: {
    expected: number;
    recorded: number;
    missing: number;
    complete: boolean;
  };
  decision: string | null;
  principalRemark: string | null;
  classTeacherRemark: string | null;
  reportCardId: string | null;
  pdfUrl: string | null;
  publication: {
    termStatus: string | null;
    published: boolean;
  };
  generatedAt: string;
};

export type BuildReportCardsOptions = {
  termId: string;
  classroomId?: string | null;
  /** Include suspended / dismissed students (history). Defaults to false. */
  includeInactive?: boolean;
};

/* =========================================================
   REMARKS
========================================================= */

/* remarkOf() and decisionOf() live in lib/grading.ts so the seed scripts and
   the report card generator always use the same scale. Re-exported here for
   the callers that already import them from this module. */
export { remarkOf, decisionOf };

/* =========================================================
   BUILD
========================================================= */

export async function buildTermReportCards(
  options: BuildReportCardsOptions
): Promise<{ cards: ReportCardData[]; term: { id: string; name: string } | null }> {
  const { termId, classroomId, includeInactive = false } = options;

  const term = await prisma.term.findUnique({
    where: { id: termId },
    select: {
      id: true,
      name: true,
      order: true,
      academicYear: { select: { id: true, name: true } },
      sequences: {
        orderBy: { order: "asc" },
        select: { id: true, name: true, order: true },
      },
    },
  });

  if (!term) return { cards: [], term: null };

  const sequenceIds = term.sequences.map((sequence) => sequence.id);

  const classrooms = await prisma.classroom.findMany({
    where: classroomId ? { id: classroomId } : {},
    select: {
      id: true,
      name: true,
      academicYearId: true,
      section: { select: { name: true } },
      students: {
        where: includeInactive ? {} : enrolledOnly(),
        select: {
          id: true,
          matricule: true,
          firstName: true,
          lastName: true,
          gender: true,
          dateOfBirth: true,
          status: true,
          createdAt: true,
          parent: { select: { fullName: true, phone: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
      assignments: {
        select: {
          subjectId: true,
          teacher: { select: { fullName: true } },
          subject: {
            select: { id: true, name: true, code: true, coefficient: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  if (!classrooms.length) return { cards: [], term };

  const classroomIds = classrooms.map((classroom) => classroom.id);
  const studentIds = classrooms.flatMap((classroom) =>
    classroom.students.map((student) => student.id)
  );

  if (!studentIds.length) return { cards: [], term };

  const [marks, subjects, attendanceGroups, existingCards, termPublications] =
    await Promise.all([
      prisma.mark.findMany({
        where: { sequenceId: { in: sequenceIds }, studentId: { in: studentIds } },
        select: {
          id: true,
          studentId: true,
          subjectId: true,
          sequenceId: true,
          ca1: true,
          ca2: true,
          exam: true,
          average: true,
          grade: true,
          remark: true,
          teacher: { select: { fullName: true } },
        },
      }),

      prisma.subject.findMany({
        select: { id: true, name: true, code: true, coefficient: true },
        orderBy: { name: "asc" },
      }),

      prisma.attendance.groupBy({
        by: ["studentId", "status"],
        where: { sequenceId: { in: sequenceIds }, studentId: { in: studentIds } },
        _count: { _all: true },
      }),

      prisma.reportCard.findMany({
        where: { termId, studentId: { in: studentIds } },
        select: {
          id: true,
          studentId: true,
          average: true,
          rank: true,
          decision: true,
          principalRemark: true,
          pdfUrl: true,
        },
      }),

      prisma.resultPublication.findMany({
        where: { termId, classroomId: { in: classroomIds } },
        select: { classroomId: true, status: true },
      }),
    ]);

  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const cardByStudent = new Map(existingCards.map((card) => [card.studentId, card]));
  const publicationByClass = new Map(
    termPublications.map((row) => [row.classroomId, row.status])
  );

  /* ---- marks indexed by student → subject → sequence ---- */

  type MarkRow = (typeof marks)[number];

  const marksByStudent = new Map<
    string,
    Map<string, Map<string, MarkRow>>
  >();

  for (const mark of marks) {
    const perSubject =
      marksByStudent.get(mark.studentId) ?? new Map<string, Map<string, MarkRow>>();

    const perSequence =
      perSubject.get(mark.subjectId) ?? new Map<string, MarkRow>();

    perSequence.set(mark.sequenceId, mark);
    perSubject.set(mark.subjectId, perSequence);
    marksByStudent.set(mark.studentId, perSubject);
  }

  const attendanceByStudent = new Map<string, AttendanceSummary>();

  for (const row of attendanceGroups) {
    const entry =
      attendanceByStudent.get(row.studentId) ?? emptyAttendance();

    entry[row.status as keyof AttendanceSummary] += row._count._all;

    attendanceByStudent.set(row.studentId, entry);
  }

  /* ---- one card per student, ranked inside the class ---- */

  const cards: ReportCardData[] = [];

  for (const classroom of classrooms) {
    const assignmentSubjects = new Map<
      string,
      { subject: (typeof subjects)[number]; teacher: string | null }
    >();

    for (const assignment of classroom.assignments) {
      if (!assignmentSubjects.has(assignment.subjectId)) {
        assignmentSubjects.set(assignment.subjectId, {
          subject:
            subjectById.get(assignment.subjectId) ?? assignment.subject,
          teacher: assignment.teacher?.fullName ?? null,
        });
      }
    }

    const ranked: { studentId: string; average: number }[] = [];
    const built: ReportCardData[] = [];

    for (const student of classroom.students) {
      const perSubject =
        marksByStudent.get(student.id) ?? new Map<string, Map<string, MarkRow>>();

      /* subjects of the class, plus any subject the student has marks for */
      const subjectIds = new Set<string>([
        ...assignmentSubjects.keys(),
        ...perSubject.keys(),
      ]);

      const lines: SubjectLine[] = [];

      for (const subjectId of subjectIds) {
        const info =
          assignmentSubjects.get(subjectId) ??
          (() => {
            const subject = subjectById.get(subjectId);
            return subject ? { subject, teacher: null as string | null } : null;
          })();

        if (!info) continue;

        const perSequence = perSubject.get(subjectId) ?? new Map<string, MarkRow>();

        const sequenceMarks: SequenceMark[] = term.sequences.map((sequence) => {
          const mark = perSequence.get(sequence.id);

          return {
            sequenceId: sequence.id,
            sequenceName: sequence.name,
            order: sequence.order,
            ca1: mark?.ca1 ?? null,
            ca2: mark?.ca2 ?? null,
            exam: mark?.exam ?? null,
            average: mark?.average ?? null,
            grade: mark?.grade ?? (mark ? gradeOf(mark.average) : null),
            remark: mark?.remark ?? null,
          };
        });

        const recorded = sequenceMarks.filter(
          (entry) => entry.average !== null
        );

        const average = recorded.length
          ? round2(
              recorded.reduce((sum, entry) => sum + (entry.average ?? 0), 0) /
                recorded.length
            )
          : null;

        const teacherName =
          info.teacher ??
          Array.from(perSequence.values()).find((entry) => entry.teacher)?.teacher
            ?.fullName ??
          null;

        lines.push({
          subjectId,
          subject: info.subject.name,
          code: info.subject.code,
          coefficient: info.subject.coefficient,
          teacher: teacherName,
          sequences: sequenceMarks,
          average,
          points: average === null ? null : round2(average * info.subject.coefficient),
          grade: average === null ? null : gradeOf(average),
          remark: remarkOf(average),
        });
      }

      lines.sort((a, b) => a.subject.localeCompare(b.subject));

      const scored = lines.filter((line) => line.average !== null);

      const coefficients = scored.reduce((sum, line) => sum + line.coefficient, 0);
      const points = round2(scored.reduce((sum, line) => sum + (line.points ?? 0), 0));

      const termAverage = coefficients ? round2(points / coefficients) : null;

      const expected = subjectIds.size * term.sequences.length;
      const recordedMarks = marks.filter((mark) => mark.studentId === student.id)
        .length;

      const attendance = finaliseAttendance(
        attendanceByStudent.get(student.id) ?? emptyAttendance()
      );

      const storedCard = cardByStudent.get(student.id) ?? null;

      const card: ReportCardData = {
        student: {
          id: student.id,
          matricule: student.matricule,
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: `${student.firstName} ${student.lastName}`.trim(),
          gender: student.gender,
          dateOfBirth: student.dateOfBirth.toISOString(),
          status: student.status,
          statusLabel: statusLabel(student.status),
          enrolled: student.status === "ACTIVE",
          parentName: student.parent?.fullName ?? null,
          parentPhone: student.parent?.phone ?? null,
        },
        classroom: {
          id: classroom.id,
          name: classroom.name,
          sectionName: classroom.section?.name ?? null,
          academicYearId: classroom.academicYearId,
          academicYearName: term.academicYear.name,
        },
        term: { id: term.id, name: term.name, order: term.order },
        sequences: term.sequences,
        subjects: lines,
        totals: {
          coefficients,
          points,
          average: termAverage,
          grade: termAverage === null ? null : gradeOf(termAverage),
        },
        class: {
          size: classroom.students.length,
          ranked: 0,
          average: null,
          highest: null,
          lowest: null,
          position: null,
        },
        attendance,
        marks: {
          expected,
          recorded: recordedMarks,
          missing: Math.max(0, expected - recordedMarks),
          complete: recordedMarks >= expected && expected > 0,
        },
        decision: storedCard?.decision ?? decisionOf(termAverage),
        principalRemark: storedCard?.principalRemark ?? null,
        classTeacherRemark: remarkOf(termAverage),
        reportCardId: storedCard?.id ?? null,
        pdfUrl: storedCard?.pdfUrl ?? null,
        publication: {
          termStatus: publicationByClass.get(classroom.id) ?? null,
          published: publicationByClass.get(classroom.id) === "PUBLISHED",
        },
        generatedAt: new Date().toISOString(),
      };

      if (termAverage !== null) {
        ranked.push({ studentId: student.id, average: termAverage });
      }

      built.push(card);
    }

    /* class ranking — equal averages share the same rank */

    ranked.sort((a, b) => b.average - a.average);

    const averages = ranked.map((entry) => entry.average);

    const classAverage = averages.length
      ? round2(averages.reduce((sum, value) => sum + value, 0) / averages.length)
      : null;

    for (const card of built) {
      const position =
        card.totals.average === null
          ? null
          : ranked.filter((entry) => entry.average > (card.totals.average ?? 0))
              .length + 1;

      card.class = {
        size: classroom.students.length,
        ranked: ranked.length,
        average: classAverage,
        highest: averages.length ? Math.max(...averages) : null,
        lowest: averages.length ? Math.min(...averages) : null,
        position,
      };

      cards.push(card);
    }
  }

  return { cards, term: { id: term.id, name: term.name } };
}

function emptyAttendance(): AttendanceSummary {
  return {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
    total: 0,
    rate: null,
    absentHours: 0,
    lateHours: 0,
  };
}

/** Fills the derived attendance fields after the raw counts are known. */
export function finaliseAttendance(summary: AttendanceSummary): AttendanceSummary {
  const total =
    summary.PRESENT + summary.ABSENT + summary.LATE + summary.EXCUSED;

  return {
    ...summary,
    total,
    rate: total
      ? round2(((summary.PRESENT + summary.LATE) / total) * 100)
      : null,
    absentHours: summary.ABSENT,
    lateHours: summary.LATE,
  };
}

export { isInactive };
