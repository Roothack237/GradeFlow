
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { badRequest, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/reports/report-cards
 *
 * Query:
 * ?academicYearId=
 * &termId=
 * &sequenceId=
 * &classroomId=
 *
 * Generates the report-card summary for the
 * selected class, term and sequence.
 *
 * IMPORTANT:
 * Report cards are term-level documents.
 * The selected sequence is used for the preview
 * and student ranking shown on this page.
 *
 * Publication status comes from ResultPublication
 * for the selected term + classroom.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { searchParams } =
      new URL(request.url);

    const academicYearId = str(
      searchParams.get(
        "academicYearId"
      )
    );

    const termId = str(
      searchParams.get("termId")
    );

    const sequenceId = str(
      searchParams.get("sequenceId")
    );

    const classroomId = str(
      searchParams.get(
        "classroomId"
      )
    );

    /*
     * Validate required parameters.
     */
    if (
      !academicYearId ||
      !termId ||
      !sequenceId ||
      !classroomId
    ) {
      return badRequest(
        "Academic year, term, sequence and class are required."
      );
    }

    /*
     * Load all required information.
     */
    const [
      academicYear,
      term,
      sequence,
      classroom,
      publication,
    ] = await Promise.all([
      prisma.academicYear.findUnique({
        where: {
          id: academicYearId,
        },

        select: {
          id: true,
          name: true,
        },
      }),

      prisma.term.findUnique({
        where: {
          id: termId,
        },

        select: {
          id: true,
          name: true,
          order: true,
          academicYearId: true,

          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.sequence.findUnique({
        where: {
          id: sequenceId,
        },

        select: {
          id: true,
          name: true,
          order: true,
          termId: true,
        },
      }),

      prisma.classroom.findUnique({
        where: {
          id: classroomId,
        },

        select: {
          id: true,
          name: true,
        },
      }),

      /*
       * REAL publication status.
       */
      prisma.resultPublication.findUnique({
        where: {
          termId_classroomId: {
            termId,
            classroomId,
          },
        },

        select: {
          status: true,
          publishedAt: true,
          publishedById: true,
          notes: true,
        },
      }),
    ]);

    /*
     * Validate academic year.
     */
    if (!academicYear) {
      return NextResponse.json(
        {
          error:
            "Academic year not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Validate term.
     */
    if (!term) {
      return NextResponse.json(
        {
          error: "Term not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Make sure term belongs to selected
     * academic year.
     */
    if (
      term.academicYearId !==
      academicYearId
    ) {
      return badRequest(
        "The selected term does not belong to the selected academic year."
      );
    }

    /*
     * Validate sequence.
     */
    if (!sequence) {
      return NextResponse.json(
        {
          error:
            "Sequence not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Make sure sequence belongs to term.
     */
    if (
      sequence.termId !== termId
    ) {
      return badRequest(
        "The selected sequence does not belong to the selected term."
      );
    }

    /*
     * Validate classroom.
     */
    if (!classroom) {
      return NextResponse.json(
        {
          error:
            "Class not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Publication status.
     */
    const isPublished =
      publication?.status ===
      "PUBLISHED";

    /*
     * Get active students in the class.
     *
     * If your Student model uses a different
     * status field, this intentionally avoids
     * assuming one.
     */
    const students =
      await prisma.student.findMany({
        where: {
          classroomId,
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
        },

        orderBy: [
          {
            lastName: "asc",
          },
          {
            firstName: "asc",
          },
        ],
      });

    /*
     * Get marks for the selected sequence.
     *
     * We use the Mark schema currently used
     * by GradeFlow:
     *
     * studentId
     * subjectId
     * teacherId
     * termId
     * sequenceId
     * score
     */
    const marks =
      await prisma.mark.findMany({
        where: {
          termId,
          sequenceId,

          student: {
            classroomId,
          },
        },

        select: {
          studentId: true,
          subjectId: true,
          score: true,
        },
      });

    /*
     * Group marks by student.
     */
    const marksByStudent =
      new Map<
        string,
        number[]
      >();

    for (const mark of marks) {
      const existing =
        marksByStudent.get(
          mark.studentId
        ) ?? [];

      existing.push(
        Number(mark.score)
      );

      marksByStudent.set(
        mark.studentId,
        existing
      );
    }

    /*
     * Calculate student averages.
     */
    const rankedStudents =
      students
        .map((student) => {
          const scores =
            marksByStudent.get(
              student.id
            ) ?? [];

          const average =
            scores.length > 0
              ? scores.reduce(
                  (sum, score) =>
                    sum + score,
                  0
                ) / scores.length
              : 0;

          return {
            id: student.id,

            name:
              `${student.firstName} ${student.lastName}`.trim(),

            average: Number(
              average.toFixed(2)
            ),

            rank: 0,

            marksCount:
              scores.length,
          };
        })
        /*
         * Students with marks first.
         * Then sort by average descending.
         */
        .sort(
          (a, b) =>
            b.average - a.average
        );

    /*
     * Assign ranks.
     *
     * Students with equal averages receive
     * the same rank.
     */
    let currentRank = 0;
    let previousAverage:
      | number
      | null = null;

    rankedStudents.forEach(
      (student, index) => {
        if (
          previousAverage === null ||
          student.average !==
            previousAverage
        ) {
          currentRank = index + 1;
        }

        student.rank =
          currentRank;

        previousAverage =
          student.average;
      }
    );

    /*
     * Calculate class average using students
     * who have at least one mark.
     */
    const studentsWithMarks =
      rankedStudents.filter(
        (student) =>
          student.marksCount > 0
      );

    const classAverage =
      studentsWithMarks.length > 0
        ? studentsWithMarks.reduce(
            (sum, student) =>
              sum + student.average,
            0
          ) /
          studentsWithMarks.length
        : 0;

    /*
     * Return only the fields the admin page
     * needs.
     */
    const responseStudents =
      rankedStudents.map(
        ({
          id,
          name,
          average,
          rank,
        }) => ({
          id,
          name,
          average,
          rank,
        })
      );

    return NextResponse.json({
      classroom: {
        id: classroom.id,
        name: classroom.name,
      },

      term: {
        id: term.id,
        name: term.name,
      },

      sequence: {
        id: sequence.id,
        name: sequence.name,
      },

      /*
       * REAL publication state.
       */
      publication: {
        published: isPublished,

        status:
          publication?.status ??
          "UNPUBLISHED",

        publishedAt:
          publication?.publishedAt ??
          null,

        publishedById:
          publication?.publishedById ??
          null,

        notes:
          publication?.notes ??
          null,
      },

      summary: {
        totalStudents:
          responseStudents.length,

        classAverage: Number(
          classAverage.toFixed(2)
        ),

        published: isPublished,
      },

      students:
        responseStudents,
    });
  } catch (error) {
    return serverError(
      "ADMIN REPORT CARD GENERATION ERROR",
      error
    );
  }
}
