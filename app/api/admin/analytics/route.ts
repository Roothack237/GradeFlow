import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const requestedAcademicYearId =
      searchParams.get("academicYearId");

    const requestedTermId = searchParams.get("termId");

    const requestedClassroomId =
      searchParams.get("classroomId");

    /*
     * ---------------------------------------------------------
     * 1. GET ALL ACADEMIC YEARS
     * ---------------------------------------------------------
     *
     * This allows the Analytics page to display an
     * Academic Year selector.
     */
    const academicYears = await prisma.academicYear.findMany({
      orderBy: {
        startDate: "desc",
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!academicYears.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No academic year was found.",
        },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. SELECT ACADEMIC YEAR
     * ---------------------------------------------------------
     *
     * If the frontend sends academicYearId, use it.
     *
     * Otherwise use the active academic year.
     */
    let academicYear;

    if (requestedAcademicYearId) {
      academicYear = await prisma.academicYear.findUnique({
        where: {
          id: requestedAcademicYearId,
        },
        select: {
          id: true,
          name: true,
          isActive: true,
          startDate: true,
          endDate: true,
        },
      });
    } else {
      academicYear =
        academicYears.find((year) => year.isActive) ??
        academicYears[0];
    }

    if (!academicYear) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected academic year was not found.",
        },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 3. GET TERMS FOR SELECTED ACADEMIC YEAR
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

    /*
     * If a term was selected, use only that term.
     *
     * If no term was selected, use all terms.
     */
    let selectedTerms = terms;

    if (requestedTermId) {
      selectedTerms = terms.filter(
        (term) => term.id === requestedTermId
      );

      if (!selectedTerms.length) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The selected term does not belong to the selected academic year.",
          },
          { status: 400 }
        );
      }
    }

    const termIds = selectedTerms.map(
      (term) => term.id
    );

    const sequenceIds = selectedTerms.flatMap(
      (term) =>
        term.sequences.map(
          (sequence) => sequence.id
        )
    );

    /*
     * ---------------------------------------------------------
     * 4. GET CLASSROOMS FOR SELECTED ACADEMIC YEAR
     * ---------------------------------------------------------
     */
    const classrooms = await prisma.classroom.findMany({
      where: {
        academicYearId: academicYear.id,

        ...(requestedClassroomId
          ? {
              id: requestedClassroomId,
            }
          : {}),
      },

      include: {
        students: {
          select: {
            id: true,
            status: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    if (
      requestedClassroomId &&
      classrooms.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected class does not belong to the selected academic year.",
        },
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. GET STUDENTS
     * ---------------------------------------------------------
     */
    const studentIds = classrooms.flatMap(
      (classroom) =>
        classroom.students.map(
          (student) => student.id
        )
    );

    /*
     * ---------------------------------------------------------
     * 6. GET MARKS
     * ---------------------------------------------------------
     *
     * Marks are filtered by the selected term/sequences.
     *
     * Therefore:
     *
     * Academic Year
     *       ↓
     * Term
     *       ↓
     * Sequences
     *       ↓
     * Marks
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
     * 7. GET ATTENDANCE
     * ---------------------------------------------------------
     *
     * Attendance is currently linked to students.
     *
     * We therefore restrict it to the students belonging
     * to the selected classroom(s).
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
     * 8. BUILD CLASS ANALYTICS
     * ---------------------------------------------------------
     */
    const classPerformances: ClassPerformance[] = [];

    for (const classroom of classrooms) {
      const classStudentIds =
        classroom.students.map(
          (student) => student.id
        );

      const activeStudents =
        classroom.students.filter(
          (student) =>
            student.status !== "SUSPENDED"
        );

      const classMarks = marks.filter((mark) =>
        classStudentIds.includes(mark.studentId)
      );

      /*
       * -------------------------------------------------------
       * CLASS AVERAGE
       * -------------------------------------------------------
       *
       * First calculate each student's average.
       * Then calculate the class average.
       */
      const studentAverages: number[] = [];

      for (const studentId of classStudentIds) {
        const studentMarks =
          classMarks.filter(
            (mark) =>
              mark.studentId === studentId
          );

        if (!studentMarks.length) continue;

        const studentAverage =
          studentMarks.reduce(
            (sum, mark) =>
              sum + mark.score,
            0
          ) / studentMarks.length;

        studentAverages.push(
          studentAverage
        );
      }

      const classAverage =
        average(studentAverages);

      /*
       * -------------------------------------------------------
       * PASS RATE
       * -------------------------------------------------------
       */
      let passedStudents = 0;

      let studentsWithMarks = 0;

      for (const studentId of classStudentIds) {
        const studentMarks =
          classMarks.filter(
            (mark) =>
              mark.studentId === studentId
          );

        if (!studentMarks.length) continue;

        studentsWithMarks++;

        const studentAverage =
          studentMarks.reduce(
            (sum, mark) =>
              sum + mark.score,
            0
          ) / studentMarks.length;

        if (studentAverage >= 50) {
          passedStudents++;
        }
      }

      const passRate =
        studentsWithMarks > 0
          ? round(
              (passedStudents /
                studentsWithMarks) *
                100
            )
          : null;

      /*
       * -------------------------------------------------------
       * ATTENDANCE
       * -------------------------------------------------------
       */
      const classAttendance =
        attendance.filter((record) =>
          classStudentIds.includes(
            record.studentId
          )
        );

      const attendanceTotal =
        classAttendance.length;

      const attendancePresent =
        classAttendance.filter(
          (record) =>
            record.status === "PRESENT"
        ).length;

      const attendanceRate =
        attendanceTotal > 0
          ? round(
              (attendancePresent /
                attendanceTotal) *
                100
            )
          : null;

      /*
       * -------------------------------------------------------
       * SUBJECT PERFORMANCE
       * -------------------------------------------------------
       */
      const subjectMap = new Map<
        string,
        {
          subject: string;
          scores: number[];
          studentIds: Set<string>;
        }
      >();

      for (const mark of classMarks) {
        if (!subjectMap.has(mark.subject.id)) {
          subjectMap.set(mark.subject.id, {
            subject: mark.subject.name,
            scores: [],
            studentIds: new Set<string>(),
          });
        }

        const subjectData =
          subjectMap.get(mark.subject.id)!;

        subjectData.scores.push(mark.score);

        subjectData.studentIds.add(
          mark.studentId
        );
      }

      const subjects: SubjectPerformance[] =
        Array.from(
          subjectMap.entries()
        ).map(
          ([subjectId, subjectData]) => ({
            subjectId,

            subject:
              subjectData.subject,

            average:
              average(
                subjectData.scores
              ),

            students:
              subjectData.studentIds
                .size,

            marksRecorded:
              subjectData.scores
                .length,
          })
        );

      subjects.sort(
        (a, b) =>
          (b.average ?? 0) -
          (a.average ?? 0)
      );

      classPerformances.push({
        classroomId:
          classroom.id,

        class:
          classroom.name,

        section:
          "section" in classroom &&
          classroom.section
            ? String(
                classroom.section
              )
            : "General",

        students:
          activeStudents.length,

        average:
          classAverage,

        passRate,

        attendanceRate,

        subjects,
      });
    }

    /*
     * ---------------------------------------------------------
     * 9. BUILD SECTION ANALYTICS
     * ---------------------------------------------------------
     */
    const sectionMap = new Map<
      string,
      ClassPerformance[]
    >();

    for (const classroom of classPerformances) {
      const section =
        classroom.section ||
        "General";

      if (!sectionMap.has(section)) {
        sectionMap.set(
          section,
          []
        );
      }

      sectionMap
        .get(section)!
        .push(classroom);
    }

    const sections: SectionPerformance[] =
      [];

    for (const [
      section,
      classes,
    ] of sectionMap) {
      const students =
        classes.reduce(
          (sum, classroom) =>
            sum +
            classroom.students,
          0
        );

      const classAverages =
        classes
          .map(
            (classroom) =>
              classroom.average
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          );

      const classPassRates =
        classes
          .map(
            (classroom) =>
              classroom.passRate
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          );

      const classAttendanceRates =
        classes
          .map(
            (classroom) =>
              classroom.attendanceRate
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          );

      sections.push({
        section,

        students,

        average:
          average(
            classAverages
          ),

        passRate:
          average(
            classPassRates
          ),

        attendanceRate:
          average(
            classAttendanceRates
          ),

        classes,
      });
    }

    /*
     * ---------------------------------------------------------
     * 10. SCHOOL / SELECTED-SCOPE SUBJECT ANALYSIS
     * ---------------------------------------------------------
     */
    const schoolSubjectMap =
      new Map<
        string,
        {
          subject: string;
          scores: number[];
          studentIds: Set<string>;
        }
      >();

    for (const mark of marks) {
      if (
        !schoolSubjectMap.has(
          mark.subject.id
        )
      ) {
        schoolSubjectMap.set(
          mark.subject.id,
          {
            subject:
              mark.subject.name,
            scores: [],
            studentIds:
              new Set<string>(),
          }
        );
      }

      const subjectData =
        schoolSubjectMap.get(
          mark.subject.id
        )!;

      subjectData.scores.push(
        mark.score
      );

      subjectData.studentIds.add(
        mark.studentId
      );
    }

    const subjectPerformance =
      Array.from(
        schoolSubjectMap.entries()
      )
        .map(
          ([
            subjectId,
            data,
          ]) => ({
            subjectId,

            subject:
              data.subject,

            average:
              average(
                data.scores
              ),

            students:
              data.studentIds
                .size,

            marksRecorded:
              data.scores.length,
          })
        )
        .sort(
          (a, b) =>
            (b.average ?? 0) -
            (a.average ?? 0)
        );

    /*
     * ---------------------------------------------------------
     * 11. PERFORMANCE DISTRIBUTION
     * ---------------------------------------------------------
     *
     * This will be used by the frontend chart.
     *
     * 80 - 100 : Excellent
     * 70 - 79  : Very Good
     * 60 - 69  : Good
     * 50 - 59  : Pass
     * 0  - 49  : Fail
     */
    let excellent = 0;
    let veryGood = 0;
    let good = 0;
    let pass = 0;
    let fail = 0;

    for (const mark of marks) {
      if (mark.score >= 80) {
        excellent++;
      } else if (mark.score >= 70) {
        veryGood++;
      } else if (mark.score >= 60) {
        good++;
      } else if (mark.score >= 50) {
        pass++;
      } else {
        fail++;
      }
    }

    const performanceDistribution = {
      excellent,
      veryGood,
      good,
      pass,
      fail,
      total: marks.length,
    };

    /*
     * ---------------------------------------------------------
     * 12. AI ANALYSIS DATA
     * ---------------------------------------------------------
     *
     * This prepares structured performance information
     * for the AI assistant.
     *
     * It does NOT pretend that these values are generated
     * by Gemini. They are calculated statistics that the
     * AI can interpret.
     */
    const strongestSubjects =
      subjectPerformance
        .filter(
          (subject) =>
            subject.average !== null
        )
        .slice(0, 5);

    const weakestSubjects =
      [...subjectPerformance]
        .filter(
          (subject) =>
            subject.average !== null
        )
        .sort(
          (a, b) =>
            (a.average ?? 0) -
            (b.average ?? 0)
        )
        .slice(0, 5);

    /*
     * ---------------------------------------------------------
     * 13. RESPONSE
     * ---------------------------------------------------------
     */
    return NextResponse.json({
      success: true,

      /*
       * Selected academic year
       */
      academicYear: {
        id: academicYear.id,
        name: academicYear.name,
        isActive:
          academicYear.isActive,
        startDate:
          academicYear.startDate,
        endDate:
          academicYear.endDate,
      },

      /*
       * All academic years for the selector
       */
      academicYears,

      /*
       * Terms belonging to the selected academic year
       */
      terms: terms.map((term) => ({
        id: term.id,
        name: term.name,
        academicYearId:
          term.academicYearId,
        sequences:
          term.sequences.map(
            (sequence) => ({
              id: sequence.id,
              name: sequence.name,
              termId:
                sequence.termId,
            })
          ),
      })),

      /*
       * Available classes for the selected
       * academic year.
       */
      classrooms: classrooms.map(
        (classroom) => ({
          id: classroom.id,
          name: classroom.name,
          section:
            "section" in classroom &&
            classroom.section
              ? String(
                  classroom.section
                )
              : "General",
        })
      ),

      /*
       * Selected filters
       */
      filters: {
        academicYearId:
          academicYear.id,

        termId:
          requestedTermId ??
          null,

        classroomId:
          requestedClassroomId ??
          null,
      },

      sections,

      classes:
        classPerformances,

      subjects:
        subjectPerformance,

      /*
       * Chart data
       */
      performanceDistribution,

      summary: {
        students:
          classrooms.reduce(
            (sum, classroom) =>
              sum +
              classroom.students.filter(
                (student) =>
                  student.status !==
                  "SUSPENDED"
              ).length,
            0
          ),

        classes:
          classrooms.length,

        marksRecorded:
          marks.length,

        attendanceRecords:
          attendance.length,

        average:
          average(
            marks.map(
              (mark) =>
                mark.score
            )
          ),
      },

      /*
       * Structured data for AI performance analysis
       */
      aiAnalysisData: {
        strongestSubjects,

        weakestSubjects,

        classPerformance:
          classPerformances.map(
            (classroom) => ({
              classroomId:
                classroom.classroomId,

              class:
                classroom.class,

              section:
                classroom.section,

              average:
                classroom.average,

              passRate:
                classroom.passRate,

              attendanceRate:
                classroom.attendanceRate,

              subjects:
                classroom.subjects,
            })
          ),

        performanceDistribution,

        summary: {
          average:
            average(
              marks.map(
                (mark) =>
                  mark.score
              )
            ),

          totalMarks:
            marks.length,

          totalStudents:
            studentIds.length,
        },
      },
    });
  } catch (error) {
    console.error(
      "ADMIN ANALYTICS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to load analytics.",

        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}