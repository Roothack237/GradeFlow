import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

type SubjectPerformance = {
  subjectId: string;
  subject: string;
  average: number | null;
  students: number;
  marksRecorded: number;
};

type ClassPerformance = {
  classroomId: string;
  class: string;
  section: string;
  students: number;
  average: number | null;
  passRate: number | null;
  attendanceRate: number | null;
  subjects: SubjectPerformance[];
};

type SectionPerformance = {
  section: string;
  students: number;
  average: number | null;
  passRate: number | null;
  attendanceRate: number | null;
  classes: ClassPerformance[];
};

function round(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

function average(values: number[]) {
  if (!values.length) return null;

  return round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  );
}

export async function GET() {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    /*
     * ---------------------------------------------------------
     * 1. GET ACTIVE ACADEMIC YEAR
     * ---------------------------------------------------------
     */

    const academicYear = await prisma.academicYear.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    if (!academicYear) {
      return NextResponse.json(
        {
          success: false,
          error: "No active academic year was found.",
        },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. GET TERMS FOR ACTIVE YEAR
     * ---------------------------------------------------------
     */

    const terms = await prisma.term.findMany({
      where: {
        academicYearId: academicYear.id,
      },
      include: {
        sequences: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const termIds = terms.map((term) => term.id);

    const sequenceIds = terms.flatMap((term) =>
      term.sequences.map((sequence) => sequence.id)
    );

    /*
     * ---------------------------------------------------------
     * 3. GET ACTIVE-YEAR CLASSROOMS
     * ---------------------------------------------------------
     */

    const classrooms = await prisma.classroom.findMany({
      where: {
        academicYearId: academicYear.id,
      },
      include: {
        students: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: [
        {
          name: "asc",
        },
      ],
    });

    const studentIds = classrooms.flatMap((classroom) =>
      classroom.students.map((student) => student.id)
    );

    /*
     * ---------------------------------------------------------
     * 4. GET MARKS
     *
     * IMPORTANT:
     * Mark.score is the actual sequence mark.
     * We calculate averages from score.
     * ---------------------------------------------------------
     */

    const marks =
      sequenceIds.length && studentIds.length
        ? await prisma.mark.findMany({
            where: {
              studentId: {
                in: studentIds,
              },
              sequenceId: {
                in: sequenceIds,
              },
            },
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                },
              },
              sequence: {
                select: {
                  id: true,
                  name: true,
                  termId: true,
                },
              },
            },
          })
        : [];

    /*
     * ---------------------------------------------------------
     * 5. GET ATTENDANCE
     * ---------------------------------------------------------
     */

    const attendance =
      studentIds.length > 0
        ? await prisma.attendance.findMany({
            where: {
              studentId: {
                in: studentIds,
              },
            },
            select: {
              id: true,
              studentId: true,
              status: true,
            },
          })
        : [];

    /*
     * ---------------------------------------------------------
     * 6. BUILD CLASS ANALYTICS
     * ---------------------------------------------------------
     */

    const classPerformances: ClassPerformance[] = [];

    for (const classroom of classrooms) {
      const classStudentIds = classroom.students.map(
        (student) => student.id
      );

      const activeStudents = classroom.students.filter(
        (student) => student.status !== "SUSPENDED"
      );

      const classMarks = marks.filter((mark) =>
        classStudentIds.includes(mark.studentId)
      );

      /*
       * Overall class average
       *
       * First calculate each student's average,
       * then calculate the class average.
       */

      const studentAverages: number[] = [];

      for (const studentId of classStudentIds) {
        const studentMarks = classMarks.filter(
          (mark) => mark.studentId === studentId
        );

        if (!studentMarks.length) continue;

        const avg =
          studentMarks.reduce((sum, mark) => sum + mark.score, 0) /
          studentMarks.length;

        studentAverages.push(avg);
      }

      const classAverage = average(studentAverages);

      /*
       * Pass rate
       */

      let passedStudents = 0;
      let studentsWithMarks = 0;

      for (const studentId of classStudentIds) {
        const studentMarks = classMarks.filter(
          (mark) => mark.studentId === studentId
        );

        if (!studentMarks.length) continue;

        studentsWithMarks++;

        const avg =
          studentMarks.reduce((sum, mark) => sum + mark.score, 0) /
          studentMarks.length;

        if (avg >= 50) {
          passedStudents++;
        }
      }

      const passRate =
        studentsWithMarks > 0
          ? round((passedStudents / studentsWithMarks) * 100)
          : null;

      /*
       * Attendance
       */

      const classAttendance = attendance.filter((record) =>
        classStudentIds.includes(record.studentId)
      );

      const attendanceTotal = classAttendance.length;

      const attendancePresent = classAttendance.filter(
        (record) =>
          record.status === "PRESENT" ||
          record.status === "LATE"
      ).length;

      const attendanceRate =
        attendanceTotal > 0
          ? round((attendancePresent / attendanceTotal) * 100)
          : null;

      /*
       * -------------------------------------------------------
       * SUBJECT PERFORMANCE
       * -------------------------------------------------------
       */

      const subjectMap = new Map<string, SubjectPerformance>();

      for (const mark of classMarks) {
        const existing = subjectMap.get(mark.subject.id);

        if (!existing) {
          subjectMap.set(mark.subject.id, {
            subjectId: mark.subject.id,
            subject: mark.subject.name,
            average: mark.score,
            students: 1,
            marksRecorded: 1,
          });
        } else {
          /*
           * We temporarily store the total in `average`.
           * It is converted to the real average below.
           */
          existing.average =
            (existing.average ?? 0) + mark.score;

          existing.marksRecorded += 1;

          /*
           * Count unique students later.
           */
        }
      }

      /*
       * Recalculate subject averages and student counts.
       */

      const subjects: SubjectPerformance[] = [];

      for (const [subjectId, subjectData] of subjectMap) {
        const subjectMarks = classMarks.filter(
          (mark) => mark.subject.id === subjectId
        );

        const subjectStudentIds = new Set(
          subjectMarks.map((mark) => mark.studentId)
        );

        const subjectAverage =
          subjectMarks.length > 0
            ? subjectMarks.reduce(
                (sum, mark) => sum + mark.score,
                0
              ) / subjectMarks.length
            : null;

        subjects.push({
          subjectId,
          subject: subjectData.subject,
          average: round(subjectAverage),
          students: subjectStudentIds.size,
          marksRecorded: subjectMarks.length,
        });
      }

      subjects.sort((a, b) => {
        return (b.average ?? 0) - (a.average ?? 0);
      });

      classPerformances.push({
        classroomId: classroom.id,
        class: classroom.name,
        section:
          "section" in classroom && classroom.section
            ? String(classroom.section)
            : "General",
        students: activeStudents.length,
        average: classAverage,
        passRate,
        attendanceRate,
        subjects,
      });
    }

    /*
     * ---------------------------------------------------------
     * 7. BUILD SECTION ANALYTICS
     * ---------------------------------------------------------
     */

    const sectionMap = new Map<string, ClassPerformance[]>();

    for (const classroom of classPerformances) {
      const section = classroom.section || "General";

      if (!sectionMap.has(section)) {
        sectionMap.set(section, []);
      }

      sectionMap.get(section)!.push(classroom);
    }

    const sections: SectionPerformance[] = [];

    for (const [section, classes] of sectionMap) {
      const students = classes.reduce(
        (sum, classroom) => sum + classroom.students,
        0
      );

      const classAverages = classes
        .map((classroom) => classroom.average)
        .filter((value): value is number => value !== null);

      const classPassRates = classes
        .map((classroom) => classroom.passRate)
        .filter((value): value is number => value !== null);

      const classAttendanceRates = classes
        .map((classroom) => classroom.attendanceRate)
        .filter((value): value is number => value !== null);

      sections.push({
        section,
        students,
        average: average(classAverages),
        passRate: average(classPassRates),
        attendanceRate: average(classAttendanceRates),
        classes,
      });
    }

    /*
     * ---------------------------------------------------------
     * 8. SCHOOL-WIDE SUBJECT ANALYSIS
     *
     * This is especially useful for the AI prediction system.
     * ---------------------------------------------------------
     */

    const schoolSubjectMap = new Map<
      string,
      {
        subject: string;
        scores: number[];
      }
    >();

    for (const mark of marks) {
      if (!schoolSubjectMap.has(mark.subject.id)) {
        schoolSubjectMap.set(mark.subject.id, {
          subject: mark.subject.name,
          scores: [],
        });
      }

      schoolSubjectMap
        .get(mark.subject.id)!
        .scores.push(mark.score);
    }

    const subjectPerformance = Array.from(
      schoolSubjectMap.entries()
    )
      .map(([subjectId, data]) => ({
        subjectId,
        subject: data.subject,
        average: average(data.scores),
        marksRecorded: data.scores.length,
      }))
      .sort((a, b) => {
        return (b.average ?? 0) - (a.average ?? 0);
      });

    /*
     * ---------------------------------------------------------
     * 9. RESPONSE
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      academicYear: {
        id: academicYear.id,
        name: academicYear.name,
        isActive: academicYear.isActive,
        startDate: academicYear.startDate,
        endDate: academicYear.endDate,
      },

      sections,

      classes: classPerformances,

      subjects: subjectPerformance,

      summary: {
        students: studentIds.length,
        classes: classrooms.length,
        marksRecorded: marks.length,
        attendanceRecords: attendance.length,
        average: average(
          marks.map((mark) => mark.score)
        ),
      },

      /*
       * This object is intentionally structured so that
       * the future Predictions page can consume it.
       */
      aiAnalysisData: {
        strongestSubjects: subjectPerformance
          .filter(
            (subject) =>
              subject.average !== null &&
              subject.average >= 70
          )
          .slice(0, 5),

        weakestSubjects: [...subjectPerformance]
          .filter(
            (subject) =>
              subject.average !== null &&
              subject.average < 50
          )
          .sort(
            (a, b) =>
              (a.average ?? 0) - (b.average ?? 0)
          )
          .slice(0, 5),

        classPerformance: classPerformances.map(
          (classroom) => ({
            classroomId: classroom.classroomId,
            class: classroom.class,
            section: classroom.section,
            average: classroom.average,
            subjects: classroom.subjects,
          })
        ),
      },
    });
  } catch (error) {
    console.error("ADMIN ANALYTICS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load analytics.",
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}