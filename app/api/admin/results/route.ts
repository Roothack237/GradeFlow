import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import {
  pagination,
  serverError,
  str,
} from "@/lib/http";

import prisma from "@/lib/prisma";

/**
 * GET /api/admin/results
 *
 * Review marks recorded by teachers.
 *
 * Current Mark model:
 * - score
 * - studentId
 * - subjectId
 * - teacherId
 * - termId
 * - sequenceId
 *
 * Score scale: 0–20
 *
 * Query:
 * ?termId=
 * &sequenceId=
 * &classroomId=
 * &subjectId=
 * &teacherId=
 * &studentId=
 * &search=
 * &publication=
 * &page=
 * &pageSize=
 */

export async function GET(request: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const termId = str(searchParams.get("termId"));
    const sequenceId = str(
      searchParams.get("sequenceId")
    );
    const classroomId = str(
      searchParams.get("classroomId")
    );
    const subjectId = str(
      searchParams.get("subjectId")
    );
    const teacherId = str(
      searchParams.get("teacherId")
    );
    const studentId = str(
      searchParams.get("studentId")
    );
    const search = str(
      searchParams.get("search")
    );
    const publication = str(
      searchParams.get("publication")
    ).toUpperCase();

    // =========================================================
    // BUILD FILTER
    // =========================================================

    const where = {
      ...(sequenceId
        ? {
            sequenceId,
          }
        : {}),

      ...(subjectId
        ? {
            subjectId,
          }
        : {}),

      ...(teacherId
        ? {
            teacherId,
          }
        : {}),

      ...(studentId
        ? {
            studentId,
          }
        : {}),

      ...(termId
        ? {
            termId,
          }
        : {}),

      ...(classroomId || search
        ? {
            student: {
              ...(classroomId
                ? {
                    classroomId,
                  }
                : {}),

              ...(search
                ? {
                    OR: [
                      {
                        firstName: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                      {
                        lastName: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                      {
                        matricule: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    ],
                  }
                : {}),
            },
          }
        : {}),
    };

    // =========================================================
    // PAGINATION
    // =========================================================

    const {
      skip,
      take,
      page,
      pageSize,
    } = pagination(
      searchParams,
      25,
      200
    );

    // =========================================================
    // LOAD MARKS
    // =========================================================

    const marks = await prisma.mark.findMany({
      where,

      orderBy: [
        {
          sequence: {
            term: {
              order: "asc",
            },
          },
        },
        {
          sequence: {
            order: "asc",
          },
        },
        {
          student: {
            lastName: "asc",
          },
        },
        {
          subject: {
            name: "asc",
          },
        },
      ],

      skip,
      take,

      select: {
        id: true,

        score: true,

        updatedAt: true,

        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            classroomId: true,

            classroom: {
              select: {
                id: true,
                name: true,

                section: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },

        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            coefficient: true,
          },
        },

        sequence: {
          select: {
            id: true,
            name: true,
            order: true,

            term: {
              select: {
                id: true,
                name: true,

                academicYear: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },

        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // =========================================================
    // TOTAL + AGGREGATES
    // =========================================================

    const [total, aggregates] =
      await Promise.all([
        prisma.mark.count({
          where,
        }),

        prisma.mark.aggregate({
          where,

          _avg: {
            score: true,
          },

          _max: {
            score: true,
          },

          _min: {
            score: true,
          },

          _count: {
            _all: true,
          },
        }),
      ]);

    // =========================================================
    // PUBLICATION DATA
    // =========================================================

    const classroomIds = Array.from(
      new Set(
        marks
          .map(
            (mark) =>
              mark.student.classroomId
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      )
    );

    const termIds = Array.from(
      new Set(
        marks.map(
          (mark) =>
            mark.sequence.term.id
        )
      )
    );

    const sequenceIds = Array.from(
      new Set(
        marks.map(
          (mark) =>
            mark.sequence.id
        )
      )
    );

    // =========================================================
    // LOAD PUBLICATIONS
    // =========================================================

    const [
      termPublications,
      sequencePublications,
    ] = await Promise.all([
      classroomIds.length &&
      termIds.length
        ? prisma.resultPublication.findMany({
            where: {
              classroomId: {
                in: classroomIds,
              },

              termId: {
                in: termIds,
              },
            },

            select: {
              termId: true,
              classroomId: true,
              status: true,
              publishedAt: true,
            },
          })
        : Promise.resolve([]),

      classroomIds.length &&
      sequenceIds.length
        ? prisma.sequencePublication.findMany({
            where: {
              classroomId: {
                in: classroomIds,
              },

              sequenceId: {
                in: sequenceIds,
              },
            },

            select: {
              sequenceId: true,
              classroomId: true,
              status: true,
              publishedAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // =========================================================
    // PUBLICATION MAPS
    // =========================================================

    const termMap = new Map(
      termPublications.map(
        (row) => [
          `${row.termId}:${row.classroomId}`,
          row,
        ]
      )
    );

    const sequenceMap = new Map(
      sequencePublications.map(
        (row) => [
          `${row.sequenceId}:${row.classroomId}`,
          row,
        ]
      )
    );

    // =========================================================
    // PUBLICATION STATE
    // =========================================================

    function publicationStateFor(
      currentTermId: string,
      currentSequenceId: string,
      classId: string | null
    ) {
      if (!classId) {
        return "NOT_PUBLISHED";
      }

      const sequencePublication =
        sequenceMap.get(
          `${currentSequenceId}:${classId}`
        );

      const termPublication =
        termMap.get(
          `${currentTermId}:${classId}`
        );

      if (
        sequencePublication?.status ===
        "PUBLISHED"
      ) {
        return "SEQUENCE_PUBLISHED";
      }

      if (
        sequencePublication?.status ===
        "UNPUBLISHED"
      ) {
        return "UNPUBLISHED";
      }

      if (
        termPublication?.status ===
        "PUBLISHED"
      ) {
        return "TERM_PUBLISHED";
      }

      if (termPublication?.status === "UNPUBLISHED") {
        return "UNPUBLISHED";
      }

      return "NOT_PUBLISHED";
    }

    // =========================================================
    // FORMAT RESULTS
    // =========================================================

    const results = marks.map(
      (mark) => ({
        id: mark.id,

        // Current Mark model
        score: mark.score,

        updatedAt: mark.updatedAt,

        student: {
          id: mark.student.id,

          name: `${mark.student.firstName} ${mark.student.lastName}`.trim(),

          matricule:
            mark.student.matricule,
        },

        classroom:
          mark.student.classroom,

        subject:
          mark.subject,

        sequence: {
          id: mark.sequence.id,
          name: mark.sequence.name,
          order: mark.sequence.order,
        },

        term:
          mark.sequence.term,

        teacher:
          mark.teacher,

        publicationState:
          publicationStateFor(
            mark.sequence.term.id,
            mark.sequence.id,
            mark.student.classroomId
          ),
      })
    );

    // =========================================================
    // PUBLICATION FILTER
    // =========================================================

    let filtered = results;

    if (publication === "PUBLISHED") {
      filtered = results.filter(
        (row) =>
          row.publicationState ===
            "SEQUENCE_PUBLISHED" ||
          row.publicationState ===
            "TERM_PUBLISHED"
      );
    }

    if (
      publication === "NOT_PUBLISHED"
    ) {
      filtered = results.filter(
        (row) =>
          row.publicationState ===
            "NOT_PUBLISHED" ||
          row.publicationState ===
            "UNPUBLISHED"
      );
    }

    // =========================================================
    // PASSING MARKS
    // =========================================================
    //
    // Current scale:
    // 0–20
    //
    // Passing score:
    // 10/20
    // =========================================================

    const passed =
      aggregates._count._all > 0
        ? await prisma.mark.count({
            where: {
              ...where,

              score: {
                gte: 10,
              },
            },
          })
        : 0;

    // =========================================================
    // RESPONSE
    // =========================================================

    return NextResponse.json({
      results: filtered,

      total,

      page,

      pageSize,

      totalPages: Math.max(
        1,
        Math.ceil(
          total / pageSize
        )
      ),

      summary: {
        marks:
          aggregates._count._all,

        average:
          aggregates._avg.score === null
            ? null
            : Math.round(
                aggregates._avg.score *
                  100
              ) / 100,

        highest:
          aggregates._max.score === null
            ? null
            : Math.round(
                aggregates._max.score *
                  100
              ) / 100,

        lowest:
          aggregates._min.score === null
            ? null
            : Math.round(
                aggregates._min.score *
                  100
              ) / 100,

        passed,

        passRate:
          aggregates._count._all
            ? Math.round(
                (passed /
                  aggregates._count
                    ._all) *
                  1000
              ) / 10
            : null,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN RESULTS LIST ERROR:",
      error
    );

    return serverError(
      "ADMIN RESULTS LIST ERROR",
      error
    );
  }
}