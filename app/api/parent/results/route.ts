
// app/api/parent/results/route.ts

import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

import { requireParentChild } from "@/lib/parent-child";

import { PASS_MARK, gradeOf, round2 } from "@/lib/grading";

/**
 * GET /api/parent/results?studentId=
 *
 * Parent results:
 * - Only published sequences are returned.
 * - A sequence is visible when:
 *      1. its SequencePublication is PUBLISHED
 *      OR
 *      2. its whole Term ResultPublication is PUBLISHED.
 *
 * - Marks belonging to unpublished sequences are never sent to the parent.
 * - Sequence averages are coefficient-weighted.
 * - Sequence rank is calculated from the published sequence marks.
 *
 * Report cards:
 * - Only report cards belonging to a PUBLISHED term are returned.
 * - The report card is therefore hidden until the admin publishes
 *   the corresponding term/classroom results.
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const studentId = searchParams.get("studentId")?.trim() || "";

    if (!studentId) {
      return NextResponse.json(
        {
          error: "studentId is required.",
        },
        { status: 400 }
      );
    }

    const guard = await requireParentChild(studentId);

    if (!guard.ok) {
      return guard.response;
    }

    const { student } = guard;

    // ---------------------------------------------------------
    // 1. Load the terms belonging to the student's academic year
    // ---------------------------------------------------------

    const terms = await prisma.term.findMany({
      where: {
        academicYearId: student.academicYearId,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        name: true,
        order: true,

        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },

        sequences: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            name: true,
            order: true,
            termId: true,
          },
        },
      },
    });

    // ---------------------------------------------------------
    // 2. Load term-level publications
    // ---------------------------------------------------------

    const termPublications = await prisma.resultPublication.findMany({
      where: {
        classroomId: student.classroomId,
        termId: {
          in: terms.map((term) => term.id),
        },
      },
      select: {
        termId: true,
        status: true,
        publishedAt: true,
      },
    });

    // ---------------------------------------------------------
    // 3. Load sequence-level publications
    // ---------------------------------------------------------

    const sequencePublications =
      await prisma.sequencePublication.findMany({
        where: {
          classroomId: student.classroomId,
          sequence: {
            termId: {
              in: terms.map((term) => term.id),
            },
          },
        },
        select: {
          sequenceId: true,
          classroomId: true,
          status: true,
          publishedAt: true,
        },
      });

    const termPublicationMap = new Map(
      termPublications.map((publication) => [
        publication.termId,
        publication,
      ])
    );

    const sequencePublicationMap = new Map(
      sequencePublications.map((publication) => [
        publication.sequenceId,
        publication,
      ])
    );

    // ---------------------------------------------------------
    // 4. Determine which sequences the parent can see
    // ---------------------------------------------------------

    const publishedSequenceIds = new Set<string>();

    for (const term of terms) {
      const termPublication = termPublicationMap.get(term.id);

      for (const sequence of term.sequences) {
        const sequencePublication =
          sequencePublicationMap.get(sequence.id);

        const wholeTermPublished =
          termPublication?.status === "PUBLISHED";

        const isPublished = sequencePublication
          ? sequencePublication.status === "PUBLISHED"
          : wholeTermPublished;

        if (isPublished) {
          publishedSequenceIds.add(sequence.id);
        }
      }
    }

    // ---------------------------------------------------------
    // 5. Only fetch marks belonging to published sequences
    // ---------------------------------------------------------

    const marks = publishedSequenceIds.size
      ? await prisma.mark.findMany({
          where: {
            studentId,
            sequenceId: {
              in: Array.from(publishedSequenceIds),
            },
          },

          select: {
            id: true,
            score: true,

            subject: {
              select: {
                id: true,
                name: true,
                coefficient: true,
              },
            },

            teacher: {
              select: {
                fullName: true,
              },
            },

            sequence: {
              select: {
                id: true,
                name: true,
                order: true,
                termId: true,
              },
            },
          },

          orderBy: {
            subject: {
              name: "asc",
            },
          },
        })
      : [];

    // ---------------------------------------------------------
    // 6. Load class marks for published sequences
    //    to calculate sequence ranks
    // ---------------------------------------------------------

    const classMarks = publishedSequenceIds.size
      ? await prisma.mark.findMany({
          where: {
            sequenceId: {
              in: Array.from(publishedSequenceIds),
            },

            student: {
              classroomId: student.classroomId,
            },
          },

          select: {
            studentId: true,
            score: true,
            sequenceId: true,

            subject: {
              select: {
                coefficient: true,
              },
            },
          },
        })
      : [];

    // ---------------------------------------------------------
    // 7. Calculate coefficient-weighted averages
    //    for each student in each sequence
    // ---------------------------------------------------------

    const studentSequenceTotals = new Map<
      string,
      {
        weightedTotal: number;
        coefficientTotal: number;
      }
    >();

    for (const mark of classMarks) {
      const key = `${mark.sequenceId}:${mark.studentId}`;

      const current = studentSequenceTotals.get(key) ?? {
        weightedTotal: 0,
        coefficientTotal: 0,
      };

      const coefficient = mark.subject.coefficient ?? 1;

      current.weightedTotal += mark.score * coefficient;
      current.coefficientTotal += coefficient;

      studentSequenceTotals.set(key, current);
    }

    // ---------------------------------------------------------
    // 8. Calculate rank for each published sequence
    // ---------------------------------------------------------

    const sequenceRanks = new Map<string, number>();

    for (const sequenceId of publishedSequenceIds) {
      const sequenceAverages: {
        studentId: string;
        average: number;
      }[] = [];

      for (const [key, value] of studentSequenceTotals.entries()) {
        if (!key.startsWith(`${sequenceId}:`)) {
          continue;
        }

        const currentStudentId = key.substring(
          sequenceId.length + 1
        );

        if (value.coefficientTotal <= 0) {
          continue;
        }

        sequenceAverages.push({
          studentId: currentStudentId,
          average:
            value.weightedTotal / value.coefficientTotal,
        });
      }

      sequenceAverages.sort(
        (a, b) => b.average - a.average
      );

      let currentRank = 0;
      let previousAverage: number | null = null;

      for (
        let index = 0;
        index < sequenceAverages.length;
        index++
      ) {
        const item = sequenceAverages[index];

        if (
          previousAverage === null ||
          round2(item.average) !== round2(previousAverage)
        ) {
          currentRank = index + 1;
        }

        if (item.studentId === studentId) {
          sequenceRanks.set(
            sequenceId,
            currentRank
          );

          break;
        }

        previousAverage = item.average;
      }
    }

    // ---------------------------------------------------------
    // 9. Build terms and published sequences
    // ---------------------------------------------------------

    const termResults = terms
      .map((term) => {
        const termPublication =
          termPublicationMap.get(term.id);

        const termSequences = term.sequences
          .filter((sequence) =>
            publishedSequenceIds.has(sequence.id)
          )
          .map((sequence) => {
            const sequenceMarks = marks.filter(
              (mark) =>
                mark.sequence.id === sequence.id
            );

            let weightedTotal = 0;
            let coefficientTotal = 0;

            for (const mark of sequenceMarks) {
              const coefficient =
                mark.subject.coefficient ?? 1;

              weightedTotal +=
                mark.score * coefficient;

              coefficientTotal += coefficient;
            }

            const average =
              coefficientTotal > 0
                ? round2(
                    weightedTotal /
                      coefficientTotal
                  )
                : null;

            const sequencePublication =
              sequencePublicationMap.get(
                sequence.id
              );

            return {
              id: sequence.id,
              name: sequence.name,
              order: sequence.order,

              publication: {
                status:
                  sequencePublication?.status ===
                  "PUBLISHED"
                    ? "PUBLISHED"
                    : termPublication?.status ===
                        "PUBLISHED"
                      ? "PUBLISHED"
                      : "NOT_PUBLISHED",

                publishedAt:
                  sequencePublication?.status ===
                  "PUBLISHED"
                    ? sequencePublication.publishedAt
                    : termPublication?.status ===
                        "PUBLISHED"
                      ? termPublication.publishedAt
                      : null,
              },

              average,

              rank:
                sequenceRanks.get(sequence.id) ??
                null,

              marks: sequenceMarks.length,

              subjects: sequenceMarks
                .map((mark) => ({
                  id: mark.id,
                  subject: mark.subject.name,

                  coefficient:
                    mark.subject.coefficient ?? 1,

                  teacher: mark.teacher.fullName,

                  score: round2(mark.score),

                  average: round2(mark.score),

                  grade: gradeOf(mark.score),

                  remark: null,

                  passed:
                    mark.score >= PASS_MARK,
                }))
                .sort((a, b) =>
                  a.subject.localeCompare(
                    b.subject
                  )
                ),
            };
          });

        // -------------------------------------------------------
        // No published sequence for this term
        // -------------------------------------------------------

        if (termSequences.length === 0) {
          return {
            id: term.id,
            name: term.name,
            academicYear:
              term.academicYear.name,
            order: term.order,

            sequences: [],

            publishedSequences: 0,

            publication: {
              status:
                termPublication?.status ??
                "NOT_PUBLISHED",

              publishedAt:
                termPublication?.publishedAt ??
                null,
            },
          };
        }

        // -------------------------------------------------------
        // Calculate term average
        // -------------------------------------------------------

        const termMarks = termSequences.flatMap(
          (sequence) => sequence.subjects
        );

        const termAverage =
          termMarks.length > 0
            ? round2(
                termMarks.reduce(
                  (total, mark) =>
                    total +
                    mark.score *
                      mark.coefficient,
                  0
                ) /
                  termMarks.reduce(
                    (total, mark) =>
                      total +
                      mark.coefficient,
                    0
                  )
              )
            : null;

        return {
          id: term.id,
          name: term.name,

          academicYear:
            term.academicYear.name,

          order: term.order,

          sequences: termSequences,

          publishedSequences:
            termSequences.length,

          average: termAverage,

          publication: {
            status:
              termPublication?.status ??
              "NOT_PUBLISHED",

            publishedAt:
              termPublication?.publishedAt ??
              null,
          },
        };
      })
      .filter(
        (term) => term.sequences.length > 0
      );

    // ---------------------------------------------------------
    // 10. Load generated report cards
    // ---------------------------------------------------------

    const reportCards = await prisma.reportCard.findMany({
      where: {
        studentId,

        termId: {
          in: terms.map((term) => term.id),
        },
      },

      include: {
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
    });

    // ---------------------------------------------------------
    // 11. Only expose report cards whose term/classroom
    //     has been officially published
    // ---------------------------------------------------------

    const publishedReportCards = reportCards
      .filter((card) => {
        const publication =
          termPublicationMap.get(card.termId);

        return publication?.status === "PUBLISHED";
      })
      .map((card) => ({
        id: card.id,

        termId: card.termId,

        term: `${card.term.academicYear.name} · ${card.term.name}`,

        average: card.average,

        // The parent page calls this "rank".
        rank: card.position,

        decision: card.decision,

        principalRemark:
          card.principalRemark,

        pdfUrl: `/api/parent/report-cards/pdf?studentId=${encodeURIComponent(card.studentId)}&termId=${encodeURIComponent(card.termId)}`,

        published: true,

        // The parent page calls this "createdAt".
        createdAt: card.generatedAt,
      }));

    // ---------------------------------------------------------
    // 12. Return parent data
    // ---------------------------------------------------------

    return NextResponse.json({
      student: {
        id: student.id,

        name: `${student.firstName} ${student.lastName}`,

        matricule: student.matricule,

        class:
          student.classroom?.name ?? null,

        section:
          student.classroom?.section.name ?? null,
      },

      terms: termResults,

      reportCards: publishedReportCards,

      scale: {
        maxMark: 20,
        passMark: PASS_MARK,
      },
    });
  } catch (error) {
    console.error(
      "PARENT RESULTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
