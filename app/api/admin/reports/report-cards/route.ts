import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

import { requireAdmin } from "@/lib/admin-auth";

// ======================================================
// HELPERS
// ======================================================

function badRequest(message: string) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 400 }
  );
}

function serverError(message = "Internal server error.") {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 500 }
  );
}

// ======================================================
// GET REPORT CARD DATA
// ======================================================

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const academicYearId =
      searchParams.get("academicYearId")?.trim() || "";

    const termId =
      searchParams.get("termId")?.trim() || "";

    const sequenceId =
      searchParams.get("sequenceId")?.trim() || "";

    const classroomId =
      searchParams.get("classroomId")?.trim() || "";

    // ==================================================
    // VALIDATE PARAMETERS
    // ==================================================

    if (!academicYearId) {
      return badRequest("Academic year is required.");
    }

    if (!termId) {
      return badRequest("Term is required.");
    }

    if (!sequenceId) {
      return badRequest("Sequence is required.");
    }

    if (!classroomId) {
      return badRequest("Classroom is required.");
    }

    // ==================================================
    // VALIDATE ACADEMIC YEAR
    // ==================================================

    const academicYear =
      await prisma.academicYear.findUnique({
        where: {
          id: academicYearId,
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (!academicYear) {
      return badRequest("Academic year not found.");
    }

    // ==================================================
    // VALIDATE TERM
    // ==================================================

    const term = await prisma.term.findUnique({
      where: {
        id: termId,
      },
      select: {
        id: true,
        name: true,
        order: true,
        academicYearId: true,
      },
    });

    if (!term) {
      return badRequest("Term not found.");
    }

    if (term.academicYearId !== academicYearId) {
      return badRequest(
        "The selected term does not belong to the selected academic year."
      );
    }

    // ==================================================
    // VALIDATE SEQUENCE
    // ==================================================

    const sequence = await prisma.sequence.findUnique({
      where: {
        id: sequenceId,
      },
      select: {
        id: true,
        name: true,
        order: true,
        termId: true,
      },
    });

    if (!sequence) {
      return badRequest("Sequence not found.");
    }

    if (sequence.termId !== termId) {
      return badRequest(
        "The selected sequence does not belong to the selected term."
      );
    }

    // ==================================================
    // VALIDATE CLASSROOM
    // ==================================================

    const classroom = await prisma.classroom.findUnique({
      where: {
        id: classroomId,
      },
      select: {
        id: true,
        name: true,
        section: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!classroom) {
      return badRequest("Classroom not found.");
    }

    // ==================================================
    // CHECK PUBLICATION
    // ==================================================

    const publication =
      await prisma.sequencePublication.findUnique({
        where: {
          sequenceId_classroomId: {
            sequenceId,
            classroomId,
          },
        },
        select: {
          status: true,
          publishedAt: true,
          publishedById: true,
          notes: true,
        },
      });

    const isPublished =
      publication?.status === "PUBLISHED";

    // ==================================================
    // LOAD STUDENTS
    // ==================================================

    const students = await prisma.student.findMany({
      where: {
        classroomId,
      },
      orderBy: [
        {
          lastName: "asc",
        },
        {
          firstName: "asc",
        },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    // ==================================================
    // STUDENT IDS
    // ==================================================

    const studentIds = students.map(
      (student) => student.id
    );

    // ==================================================
    // LOAD MARKS
    // ==================================================

    const marks =
      studentIds.length > 0
        ? await prisma.mark.findMany({
            where: {
              studentId: {
                in: studentIds,
              },
              termId,
              sequenceId,
            },
            select: {
              id: true,
              studentId: true,
              subjectId: true,
              score: true,
            },
          })
        : [];

    // ==================================================
    // GROUP MARKS BY STUDENT
    // ==================================================

    const marksByStudent = new Map<
      string,
      number[]
    >();

    for (const mark of marks) {
      const existing =
        marksByStudent.get(mark.studentId) ?? [];

      existing.push(Number(mark.score));

      marksByStudent.set(
        mark.studentId,
        existing
      );
    }

    // ==================================================
    // CALCULATE STUDENT RESULTS
    // ==================================================

    const calculatedStudents = students.map(
      (student) => {
        const studentMarks =
          marksByStudent.get(student.id) ?? [];

        const total = studentMarks.reduce(
          (sum, score) => sum + score,
          0
        );

        const average =
          studentMarks.length > 0
            ? total / studentMarks.length
            : 0;

        return {
          id: student.id,

          // IMPORTANT:
          // The frontend expects "name".
          name: `${student.firstName} ${student.lastName}`.trim(),

          firstName: student.firstName,
          lastName: student.lastName,

          marksRecorded: studentMarks.length,

          total: Number(
            total.toFixed(2)
          ),

          average: Number(
            average.toFixed(2)
          ),
        };
      }
    );

    // ==================================================
    // RANK STUDENTS
    // ==================================================

    const rankedStudents = [
      ...calculatedStudents,
    ].sort(
      (a, b) => b.average - a.average
    );

    let currentRank = 0;
    let previousAverage: number | null = null;

    const studentsWithRank =
      rankedStudents.map(
        (student, index) => {
          if (
            previousAverage === null ||
            student.average !== previousAverage
          ) {
            currentRank = index + 1;
          }

          previousAverage =
            student.average;

          return {
            ...student,

            // Students without marks do not receive
            // a rank.
            position:
              student.marksRecorded > 0
                ? currentRank
                : null,
          };
        }
      );

    // ==================================================
    // CLASS AVERAGE
    // ==================================================

    const studentsWithMarks =
      studentsWithRank.filter(
        (student) =>
          student.marksRecorded > 0
      );

    const classAverage =
      studentsWithMarks.length > 0
        ? studentsWithMarks.reduce(
            (sum, student) =>
              sum + student.average,
            0
          ) / studentsWithMarks.length
        : 0;

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      academicYear: {
        id: academicYear.id,
        name: academicYear.name,
      },

      term: {
        id: term.id,
        name: term.name,
        order: term.order,
      },

      sequence: {
        id: sequence.id,
        name: sequence.name,
        order: sequence.order,
      },

      classroom: {
        id: classroom.id,
        name: classroom.name,
        section: classroom.section,
      },

      // ==================================================
      // PUBLICATION
      // ==================================================

      publication: {
        published: isPublished,

        status:
          publication?.status ??
          "UNPUBLISHED",

        publishedAt:
          publication?.publishedAt ?? null,

        publishedById:
          publication?.publishedById ?? null,

        notes:
          publication?.notes ?? null,
      },

      // ==================================================
      // SUMMARY
      // ==================================================

      summary: {
        // All students enrolled in the selected class
        totalStudents: students.length,

        // Only students who have marks
        studentsWithMarks:
          studentsWithMarks.length,

        classAverage: Number(
          classAverage.toFixed(2)
        ),

        published: isPublished,
      },

      // ==================================================
      // STUDENTS
      // ==================================================

      students: studentsWithRank,
    });
  } catch (error) {
    console.error(
      "================================================"
    );

    console.error(
      "[GET /api/admin/reports/report-cards] ERROR:"
    );

    console.error(error);

    console.error(
      "================================================"
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown server error.";

    return serverError(message);
  }
}
