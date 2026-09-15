import prisma from "@/lib/prisma";
import { PASS_MARK, gradeOf, isPass, round2 } from "@/lib/grading";

/**
 * Real analytics for a teacher, computed with Prisma from the teacher's
 * assignments: class averages, subject averages, pass rates, best and
 * at-risk students, attendance and mark trends.
 *
 * Shared by /api/teacher/analytics and the teacher AI context so the
 * dashboards and the AI assistant always agree on the numbers.
 */

export type TeacherAnalytics = Awaited<ReturnType<typeof buildTeacherAnalytics>>;

export async function buildTeacherAnalytics(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      fullName: true,
      assignments: {
        select: {
          classroomId: true,
          subjectId: true,
          classroom: {
            select: {
              id: true,
              name: true,
              section: { select: { name: true } },
              academicYear: { select: { id: true, name: true } },
              _count: { select: { students: true } },
            },
          },
          subject: { select: { name: true, coefficient: true } },
        },
      },
    },
  });

  if (!teacher) return null;

  const classroomIds = Array.from(
    new Set(teacher.assignments.map((assignment) => assignment.classroomId))
  );

  const [activeYear, students, marks, attendances] = await Promise.all([
    prisma.academicYear.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
    classroomIds.length
      ? prisma.student.findMany({
          where: { classroomId: { in: classroomIds }, status: "ACTIVE" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            classroomId: true,
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        })
      : Promise.resolve([]),
    classroomIds.length
      ? prisma.mark.findMany({
          where: { student: { classroomId: { in: classroomIds } } },
          select: {
            average: true,
            studentId: true,
            subjectId: true,
            subject: { select: { name: true } },
            sequence: {
              select: {
                id: true,
                name: true,
                order: true,
                term: { select: { name: true, order: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    classroomIds.length
      ? prisma.attendance.findMany({
          where: { student: { classroomId: { in: classroomIds } } },
          select: {
            status: true,
            studentId: true,
            sequenceId: true,
            sequence: {
              select: { name: true, order: true, term: { select: { name: true, order: true } } },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const studentById = new Map(students.map((student) => [student.id, student]));
  const classroomById = new Map(
    teacher.assignments.map((assignment) => [assignment.classroom.id, assignment.classroom])
  );

  /* ---------- per (class, subject) statistics ---------- */

  type SubjectStat = {
    classroomId: string;
    classroom: string;
    section: string;
    subjectId: string;
    subject: string;
    coefficient: number;
    total: number;
    count: number;
    passed: number;
    highest: number;
    lowest: number;
    byStudent: Map<string, { total: number; count: number }>;
    bySequence: Map<string, { total: number; count: number; order: number }>;
  };

  const subjectStats = new Map<string, SubjectStat>();

  for (const assignment of teacher.assignments) {
    const key = `${assignment.classroomId}:${assignment.subjectId}`;
    subjectStats.set(key, {
      classroomId: assignment.classroomId,
      classroom: assignment.classroom.name,
      section: assignment.classroom.section.name,
      subjectId: assignment.subjectId,
      subject: assignment.subject.name,
      coefficient: assignment.subject.coefficient,
      total: 0,
      count: 0,
      passed: 0,
      highest: -Infinity,
      lowest: Infinity,
      byStudent: new Map(),
      bySequence: new Map(),
    });
  }

  /* Sort marks by sequence so per-student trends can compare the two last sequences. */
  const marksSorted = [...marks].sort(
    (a, b) =>
      a.sequence.term.order - b.sequence.term.order ||
      a.sequence.order - b.sequence.order
  );

  for (const mark of marksSorted) {
    const stat = subjectStats.get(`${studentById.get(mark.studentId)?.classroomId ?? ""}:${mark.subjectId}`);
    if (!stat) continue;

    stat.total += mark.average;
    stat.count += 1;
    if (isPass(mark.average)) stat.passed += 1;
    stat.highest = Math.max(stat.highest, mark.average);
    stat.lowest = Math.min(stat.lowest, mark.average);

    const sequenceKey = `${mark.sequence.term.name} · ${mark.sequence.name}`;
    const sequence = stat.bySequence.get(sequenceKey) ?? {
      total: 0,
      count: 0,
      order: mark.sequence.term.order * 10 + mark.sequence.order,
    };
    sequence.total += mark.average;
    sequence.count += 1;
    stat.bySequence.set(sequenceKey, sequence);

    const student =
      stat.byStudent.get(mark.studentId) ?? {
        total: 0,
        count: 0,
      };
    student.total += mark.average;
    student.count += 1;
    stat.byStudent.set(mark.studentId, student);
  }

  /* ---------- per-student sequence averages (for mark trends) ---------- */

  const studentSequenceTotals = new Map<
    string,
    Map<string, { order: number; total: number; count: number }>
  >();

  for (const mark of marksSorted) {
    const sequences = studentSequenceTotals.get(mark.studentId) ?? new Map();
    const key = `${mark.sequence.term.name} · ${mark.sequence.name}`;
    const entry = sequences.get(key) ?? {
      order: mark.sequence.term.order * 10 + mark.sequence.order,
      total: 0,
      count: 0,
    };
    entry.total += mark.average;
    entry.count += 1;
    sequences.set(key, entry);
    studentSequenceTotals.set(mark.studentId, sequences);
  }

  function studentTrend(studentId: string): { average: number | null; trend: number | null } {
    const sequences = studentSequenceTotals.get(studentId);
    if (!sequences?.size) return { average: null, trend: null };

    const ordered = Array.from(sequences.entries()).sort((a, b) => a[1].order - b[1].order);
    const averages = ordered.map(([, value]) => value.total / value.count);
    const average = averages.reduce((sum, value) => sum + value, 0) / averages.length;

    return {
      average: round2(average),
      trend:
        averages.length >= 2
          ? round2(averages[averages.length - 1] - averages[averages.length - 2])
          : null,
    };
  }

  /* ---------- attendance per student ---------- */

  const attendanceByStudent = new Map<
    string,
    { PRESENT: number; ABSENT: number; LATE: number; EXCUSED: number }
  >();

  const attendanceBySequence = new Map<
    string,
    {
      order: number;
      label: string;
      present: number;
      absent: number;
      late: number;
      excused: number;
    }
  >();

  for (const record of attendances) {
    const bucket =
      attendanceByStudent.get(record.studentId) ??
      { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    bucket[record.status] += 1;
    attendanceByStudent.set(record.studentId, bucket);

    const sequenceKey = `${record.sequence.term.name} · ${record.sequence.name}`;
    const sequence =
      attendanceBySequence.get(sequenceKey) ??
      {
        order: record.sequence.term.order * 10 + record.sequence.order,
        label: sequenceKey,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };
    if (record.status === "PRESENT") sequence.present += 1;
    else if (record.status === "ABSENT") sequence.absent += 1;
    else if (record.status === "LATE") sequence.late += 1;
    else sequence.excused += 1;
    attendanceBySequence.set(sequenceKey, sequence);
  }

  /* ---------- student performance ---------- */

  const studentPerformance = students
    .map((student) => {
      const { average, trend } = studentTrend(student.id);

      const attendance = attendanceByStudent.get(student.id) ?? {
        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        EXCUSED: 0,
      };

      const attendanceTotal =
        attendance.PRESENT + attendance.ABSENT + attendance.LATE + attendance.EXCUSED;

      const status =
        average === null
          ? "No marks"
          : average >= 16
            ? "Excellent"
            : average >= 14
              ? "Good"
              : average >= 12
                ? "Average"
                : average >= PASS_MARK
                  ? "Below average"
                  : "Needs attention";

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        matricule: student.matricule,
        class: classroomById.get(student.classroomId)?.name ?? null,
        average,
        grade: average === null ? null : gradeOf(average),
        trend,
        status,
        hoursAbsent: attendance.ABSENT,
        hoursLate: attendance.LATE,
        attendanceRate: attendanceTotal
          ? round2(((attendance.PRESENT + attendance.LATE) / attendanceTotal) * 100)
          : null,
      };
    })
    .filter((student) => student.average !== null || student.hoursAbsent > 0 || student.hoursLate > 0);

  const graded = studentPerformance.filter((student) => student.average !== null);

  const bestStudents = [...graded]
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
    .slice(0, 5)
    .map((student) => ({
      name: student.name,
      class: student.class,
      average: student.average,
      grade: student.grade,
    }));

  const atRiskStudents = studentPerformance
    .filter(
      (student) =>
        (student.average !== null && student.average < PASS_MARK) ||
        student.hoursAbsent + student.hoursLate >= 5
    )
    .map((student) => ({
      name: student.name,
      class: student.class,
      average: student.average,
      grade: student.grade,
      hoursAbsent: student.hoursAbsent,
      hoursLate: student.hoursLate,
      attendanceRate: student.attendanceRate,
      reasons: [
        ...(student.average !== null && student.average < PASS_MARK
          ? ["Average below the pass mark"]
          : []),
        ...(student.hoursAbsent >= 5 ? [`${student.hoursAbsent} hours absent`] : []),
        ...(student.hoursLate >= 5 ? [`${student.hoursLate} hours late`] : []),
      ],
    }));

  /* ---------- class + subject rollups ---------- */

  const classRollup = new Map<
    string,
    {
      name: string;
      section: string;
      students: number;
      total: number;
      count: number;
      passed: number;
      subjects: string[];
    }
  >();

  for (const stat of subjectStats.values()) {
    const bucket =
      classRollup.get(stat.classroomId) ??
      {
        name: stat.classroom,
        section: stat.section,
        students: classroomById.get(stat.classroomId)?._count.students ?? 0,
        total: 0,
        count: 0,
        passed: 0,
        subjects: [],
      };

    bucket.total += stat.total;
    bucket.count += stat.count;
    bucket.passed += stat.passed;
    bucket.subjects.push(stat.subject);
    classRollup.set(stat.classroomId, bucket);
  }

  const overallTotal = marksSorted.length
    ? marksSorted.reduce((total, mark) => total + mark.average, 0)
    : 0;

  const overallAttendance = attendances.reduce(
    (totals, record) => {
      totals[record.status] += 1;
      return totals;
    },
    { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 } as Record<string, number>
  );

  const attendanceTotal = Object.values(overallAttendance).reduce(
    (sum, value) => sum + value,
    0
  );

  return {
    generatedAt: new Date().toISOString(),
    teacher: { id: teacher.id, name: teacher.fullName },
    academicYear: activeYear,
    assignments: teacher.assignments.map((assignment) => ({
      classroomId: assignment.classroomId,
      classroom: assignment.classroom.name,
      section: assignment.classroom.section.name,
      subjectId: assignment.subjectId,
      subject: assignment.subject.name,
      coefficient: assignment.subject.coefficient,
    })),
    overview: {
      classes: classroomIds.length,
      subjects: new Set(teacher.assignments.map((a) => a.subject.name)).size,
      students: students.length,
      marksRecorded: marksSorted.length,
      average: marksSorted.length ? round2(overallTotal / marksSorted.length) : null,
      passRate: marksSorted.length
        ? round2(
            (marksSorted.filter((mark) => isPass(mark.average)).length / marksSorted.length) * 100
          )
        : null,
      attendance: {
        records: attendanceTotal,
        present: overallAttendance.PRESENT,
        absent: overallAttendance.ABSENT,
        late: overallAttendance.LATE,
        excused: overallAttendance.EXCUSED,
        rate: attendanceTotal
          ? round2(
              ((overallAttendance.PRESENT + overallAttendance.LATE) / attendanceTotal) * 100
            )
          : null,
      },
    },
    classes: Array.from(classRollup.entries()).map(([id, bucket]) => ({
      id,
      name: bucket.name,
      section: bucket.section,
      students: bucket.students,
      subjects: bucket.subjects.sort((a, b) => a.localeCompare(b)),
      average: bucket.count ? round2(bucket.total / bucket.count) : null,
      passRate: bucket.count ? round2((bucket.passed / bucket.count) * 100) : null,
      marks: bucket.count,
    })),
    subjectAverages: Array.from(subjectStats.values())
      .filter((stat) => stat.count > 0)
      .map((stat) => ({
        subject: stat.subject,
        class: stat.classroom,
        section: stat.section,
        coefficient: stat.coefficient,
        average: round2(stat.total / stat.count),
        passRate: round2((stat.passed / stat.count) * 100),
        highest: stat.highest === -Infinity ? null : stat.highest,
        lowest: stat.lowest === Infinity ? null : stat.lowest,
        marks: stat.count,
        bySequence: Array.from(stat.bySequence.entries())
          .map(([sequence, value]) => ({
            sequence,
            average: round2(value.total / value.count),
            marks: value.count,
          }))
          .sort((a, b) => a.sequence.localeCompare(b.sequence)),
      }))
      .sort((a, b) => a.class.localeCompare(b.class) || a.subject.localeCompare(b.subject)),
    students: studentPerformance,
    bestStudents,
    atRiskStudents,
    trends: {
      marks: Array.from(
        marksSorted
          .reduce(
            (map, mark) => {
              const key = `${mark.sequence.term.name} · ${mark.sequence.name}`;
              const entry = map.get(key) ?? {
                order: mark.sequence.term.order * 10 + mark.sequence.order,
                total: 0,
                count: 0,
              };
              entry.total += mark.average;
              entry.count += 1;
              map.set(key, entry);
              return map;
            },
            new Map<string, { order: number; total: number; count: number }>()
          )
          .entries()
      )
        .map(([sequence, value]) => ({
          sequence,
          average: round2(value.total / value.count),
          marks: value.count,
        }))
        .sort((a, b) => a.sequence.localeCompare(b.sequence)),
      attendance: Array.from(attendanceBySequence.values())
        .map((sequence) => {
          const total =
            sequence.present + sequence.absent + sequence.late + sequence.excused;
          return {
            sequence: sequence.label,
            present: sequence.present,
            absent: sequence.absent,
            late: sequence.late,
            excused: sequence.excused,
            rate: total
              ? round2(((sequence.present + sequence.late) / total) * 100)
              : null,
          };
        })
        .sort((a, b) => a.sequence.localeCompare(b.sequence)),
    },
    scale: { maxMark: 20, passMark: PASS_MARK },
  };
}
