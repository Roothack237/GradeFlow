import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";

import { serverError, str } from "@/lib/http";

import prisma from "@/lib/prisma";

import { MAX_MARK, PASS_MARK } from "@/lib/grading";

/**
 * GET /api/admin/predictions
 *
 * Optional query parameters:
 *
 * ?termId=
 * ?classroomId=
 *
 * Predictions are calculated from the marks and attendance
 * already stored in GradeFlow.
 *
 * Current Mark model:
 *
 * id
 * studentId
 * subjectId
 * teacherId
 * termId
 * sequenceId
 * score
 */

export async function GET(request: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const termId = str(searchParams.get("termId"));
    const classroomId = str(searchParams.get("classroomId"));

    // ---------------------------------------------------------
    // FIND TERM
    // ---------------------------------------------------------

    const term = termId
      ? await prisma.term.findUnique({
          where: {
            id: termId,
          },

          select: {
            id: true,
            name: true,
            isCurrent: true,

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
              },
            },
          },
        })
      : await prisma.term.findFirst({
          where: {
            isCurrent: true,
          },

          select: {
            id: true,
            name: true,
            isCurrent: true,

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
              },
            },
          },
        });

    // ---------------------------------------------------------
    // NO TERM
    // ---------------------------------------------------------

    if (!term) {
      return NextResponse.json({
        term: null,

        summary: {
          students: 0,
          analysed: 0,
          atRisk: 0,
          highRisk: 0,
          predictedPassRate: null,
          average: null,
          improving: 0,
          declining: 0,
        },

        students: [],
        subjects: [],
        classes: [],

        message:
          "No term is available yet. Create a term to run predictions.",
      });
    }

    // ---------------------------------------------------------
    // LOAD STUDENTS
    // ---------------------------------------------------------

    const students = await prisma.student.findMany({
      where: {
        ...(classroomId
          ? {
              classroomId,
            }
          : {}),

        status: "ACTIVE",
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        matricule: true,

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

        /*
         * IMPORTANT:
         *
         * Your current Mark model has `score`,
         * not `average`.
         */
        marks: {
          where: {
            sequence: {
              termId: term.id,
            },
          },

          select: {
            score: true,

            subject: {
              select: {
                id: true,
                name: true,
                coefficient: true,
              },
            },

            sequence: {
              select: {
                id: true,
                order: true,
              },
            },
          },
        },

        attendances: {
          where: {
            sequence: {
              termId: term.id,
            },
          },

          select: {
            status: true,
          },
        },
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

    // ---------------------------------------------------------
    // PREDICTION MODEL
    // ---------------------------------------------------------

    const MODEL = {
      name: "GradeFlow weighted trend model",

      description:
        "The next sequence performance is projected from recorded scores and the student's attendance rate.",

      scale: "20-point scale",

      projectedAverage:
        "projected = currentAverage + 0.5 × (lastSequenceAverage − previousSequenceAverage), adjusted for attendance and clamped to the grading scale.",

      passProbability:
        "Probability is calculated using a logistic function around the configured pass mark.",

      riskLevels: {
        HIGH:
          "Projected average is significantly below the pass mark or attendance is below 60%.",

        MEDIUM:
          "Projected average is near the pass mark, attendance is below 75%, or the student's trend is declining.",

        LOW:
          "No high or medium risk condition is detected.",

        UNKNOWN:
          "There are not enough marks to calculate a prediction.",
      },
    };

    // ---------------------------------------------------------
    // GENERATE STUDENT PREDICTIONS
    // ---------------------------------------------------------

    const predictions = students.map((student) => {
      /*
       * Subject calculations
       */

      const perSubject = new Map<
        string,
        {
          name: string;
          total: number;
          count: number;
        }
      >();

      /*
       * Sequence calculations
       */

      const perSequence = new Map<
        number,
        {
          total: number;
          count: number;
        }
      >();

      // -------------------------------------------------------
      // PROCESS MARKS
      // -------------------------------------------------------

      for (const mark of student.marks) {
        const score = Number(mark.score);

        if (!Number.isFinite(score)) {
          continue;
        }

        /*
         * Subject average
         */

        const subject =
          perSubject.get(mark.subject.id) ?? {
            name: mark.subject.name,
            total: 0,
            count: 0,
          };

        subject.total += score;
        subject.count += 1;

        perSubject.set(mark.subject.id, subject);

        /*
         * Sequence average
         */

        const sequence =
          perSequence.get(mark.sequence.order) ?? {
            total: 0,
            count: 0,
          };

        sequence.total += score;
        sequence.count += 1;

        perSequence.set(
          mark.sequence.order,
          sequence
        );
      }

      // -------------------------------------------------------
      // CURRENT AVERAGE
      // -------------------------------------------------------

      let totalScore = 0;
      let scoreCount = 0;

      for (const mark of student.marks) {
        const score = Number(mark.score);

        if (!Number.isFinite(score)) {
          continue;
        }

        totalScore += score;
        scoreCount += 1;
      }

      const currentAverage =
        scoreCount > 0
          ? totalScore / scoreCount
          : null;

      // -------------------------------------------------------
      // SEQUENCE TREND
      // -------------------------------------------------------

      const sequenceOrders = Array.from(
        perSequence.keys()
      ).sort((a, b) => a - b);

      const lastSequence =
        sequenceOrders.length > 0
          ? perSequence.get(
              sequenceOrders[
                sequenceOrders.length - 1
              ]
            )
          : undefined;

      const previousSequence =
        sequenceOrders.length > 1
          ? perSequence.get(
              sequenceOrders[
                sequenceOrders.length - 2
              ]
            )
          : undefined;

      const lastSequenceAverage =
        lastSequence &&
        lastSequence.count > 0
          ? lastSequence.total /
            lastSequence.count
          : null;

      const previousSequenceAverage =
        previousSequence &&
        previousSequence.count > 0
          ? previousSequence.total /
            previousSequence.count
          : null;

      const trend =
        lastSequenceAverage !== null &&
        previousSequenceAverage !== null
          ? lastSequenceAverage -
            previousSequenceAverage
          : null;

      // -------------------------------------------------------
      // ATTENDANCE
      // -------------------------------------------------------

      const attendanceTotal =
        student.attendances.length;

      const attended =
        student.attendances.filter(
          (record) =>
            record.status === "PRESENT" ||
            record.status === "LATE"
        ).length;

      const attendanceRate =
        attendanceTotal > 0
          ? (attended / attendanceTotal) * 100
          : null;

      // -------------------------------------------------------
      // PROJECTED AVERAGE
      // -------------------------------------------------------

      let projected =
        currentAverage === null
          ? null
          : currentAverage +
            (trend === null
              ? 0
              : 0.5 * trend);

      if (projected !== null) {
        /*
         * Attendance adjustment.
         *
         * We keep this modest because attendance
         * should influence the prediction but not
         * completely replace academic performance.
         */

        if (
          attendanceRate !== null &&
          attendanceRate < 60
        ) {
          projected -= 2;
        } else if (
          attendanceRate !== null &&
          attendanceRate < 75
        ) {
          projected -= 1;
        }

        /*
         * Keep score inside the 20-point scale.
         */

        projected = Math.min(
          MAX_MARK,
          Math.max(0, projected)
        );
      }

      // -------------------------------------------------------
      // PASS PROBABILITY
      // -------------------------------------------------------

      let probability: number | null = null;

      if (projected !== null) {
        /*
         * Logistic probability centered around
         * the configured pass mark.
         *
         * PASS_MARK is normally 10 on a 20-point scale.
         */

        probability =
          (1 /
            (1 +
              Math.exp(
                -(projected - PASS_MARK) / 2
              ))) *
          100;

        probability = Math.min(
          100,
          Math.max(0, probability)
        );
      }

      // -------------------------------------------------------
      // RISK FACTORS
      // -------------------------------------------------------

      const factors: string[] = [];

      if (
        currentAverage !== null &&
        currentAverage < PASS_MARK
      ) {
        factors.push(
          "Current average is below the pass mark"
        );
      }

      if (
        trend !== null &&
        trend < -3
      ) {
        factors.push(
          "Average is declining between sequences"
        );
      } else if (
        trend !== null &&
        trend > 3
      ) {
        factors.push(
          "Average is improving between sequences"
        );
      }

      if (
        attendanceRate !== null &&
        attendanceRate < 75
      ) {
        factors.push(
          `Attendance is ${Math.round(
            attendanceRate
          )}% — below the 75% threshold`
        );
      }

      if (scoreCount === 0) {
        factors.push(
          "No mark has been recorded for this term yet"
        );
      }

      // -------------------------------------------------------
      // RISK LEVEL
      // -------------------------------------------------------

      let riskLevel:
        | "HIGH"
        | "MEDIUM"
        | "LOW"
        | "UNKNOWN";

      if (projected === null) {
        riskLevel = "UNKNOWN";
      } else if (
        projected < 9 ||
        (attendanceRate !== null &&
          attendanceRate < 60)
      ) {
        riskLevel = "HIGH";
      } else if (
        projected < 11 ||
        (attendanceRate !== null &&
          attendanceRate < 75) ||
        (trend !== null && trend < -3)
      ) {
        riskLevel = "MEDIUM";
      } else {
        riskLevel = "LOW";
      }

      // -------------------------------------------------------
      // SUBJECT AVERAGES
      // -------------------------------------------------------

      const subjectAverages =
        Array.from(
          perSubject.values()
        ).map((subject) => ({
          name: subject.name,

          average:
            subject.count > 0
              ? Math.round(
                  (subject.total /
                    subject.count) *
                    100
                ) / 100
              : 0,
        }));

      // -------------------------------------------------------
      // STRONGEST / WEAKEST SUBJECT
      // -------------------------------------------------------

      const weakestSubject =
        subjectAverages.length > 0
          ? subjectAverages.reduce(
              (worst, subject) =>
                subject.average <
                worst.average
                  ? subject
                  : worst
            ).name
          : null;

      const strongestSubject =
        subjectAverages.length > 0
          ? subjectAverages.reduce(
              (best, subject) =>
                subject.average >
                best.average
                  ? subject
                  : best
            ).name
          : null;

      // -------------------------------------------------------
      // RETURN PREDICTION
      // -------------------------------------------------------

      return {
        id: student.id,

        name:
          `${student.firstName} ${student.lastName}`.trim(),

        matricule: student.matricule,

        classroomId:
          student.classroom?.id ?? null,

        className:
          student.classroom?.name ?? null,

        sectionName:
          student.classroom?.section?.name ??
          null,

        marks: scoreCount,

        currentAverage:
          currentAverage === null
            ? null
            : Math.round(
                currentAverage * 100
              ) / 100,

        lastSequenceAverage:
          lastSequenceAverage === null
            ? null
            : Math.round(
                lastSequenceAverage * 100
              ) / 100,

        trend:
          trend === null
            ? null
            : Math.round(trend * 100) / 100,

        attendanceRate:
          attendanceRate === null
            ? null
            : Math.round(
                attendanceRate * 10
              ) / 10,

        projectedAverage:
          projected === null
            ? null
            : Math.round(
                projected * 100
              ) / 100,

        passProbability:
          probability === null
            ? null
            : Math.round(
                probability * 10
              ) / 10,

        riskLevel,

        factors,

        weakestSubject,

        strongestSubject,
      };
    });

    // ---------------------------------------------------------
    // SUBJECT ANALYSIS
    // ---------------------------------------------------------

    const subjectMap = new Map<
      string,
      {
        id: string;
        name: string;
        total: number;
        count: number;
        atRisk: number;
      }
    >();

    for (const student of students) {
      for (const mark of student.marks) {
        const score = Number(mark.score);

        if (!Number.isFinite(score)) {
          continue;
        }

        const entry =
          subjectMap.get(
            mark.subject.id
          ) ?? {
            id: mark.subject.id,
            name: mark.subject.name,
            total: 0,
            count: 0,
            atRisk: 0,
          };

        entry.total += score;
        entry.count += 1;

        if (score < PASS_MARK) {
          entry.atRisk += 1;
        }

        subjectMap.set(
          mark.subject.id,
          entry
        );
      }
    }

    const subjects = Array.from(
      subjectMap.values()
    )
      .filter(
        (entry) => entry.count > 0
      )
      .map((entry) => ({
        id: entry.id,

        name: entry.name,

        marks: entry.count,

        average:
          Math.round(
            (entry.total /
              entry.count) *
              100
          ) / 100,

        atRisk: entry.atRisk,

        atRiskRate:
          Math.round(
            (entry.atRisk /
              entry.count) *
              1000
          ) / 10,
      }))
      .sort(
        (a, b) =>
          b.atRiskRate -
          a.atRiskRate
      );

    // ---------------------------------------------------------
    // CLASSROOM ANALYSIS
    // ---------------------------------------------------------

    const classroomMap = new Map<
      string,
      {
        id: string;
        name: string;
        students: number;
        atRisk: number;
        totalProbability: number;
        analysed: number;
      }
    >();

    for (const prediction of predictions) {
      if (!prediction.classroomId) {
        continue;
      }

      const entry =
        classroomMap.get(
          prediction.classroomId
        ) ?? {
          id: prediction.classroomId,

          name:
            prediction.className ??
            "Unknown class",

          students: 0,

          atRisk: 0,

          totalProbability: 0,

          analysed: 0,
        };

      entry.students += 1;

      if (
        prediction.riskLevel === "HIGH" ||
        prediction.riskLevel === "MEDIUM"
      ) {
        entry.atRisk += 1;
      }

      if (
        prediction.passProbability !== null
      ) {
        entry.totalProbability +=
          prediction.passProbability;

        entry.analysed += 1;
      }

      classroomMap.set(
        prediction.classroomId,
        entry
      );
    }

    const classes = Array.from(
      classroomMap.values()
    )
      .map((entry) => ({
        id: entry.id,

        name: entry.name,

        students: entry.students,

        atRisk: entry.atRisk,

        predictedPassRate:
          entry.analysed > 0
            ? Math.round(
                (entry.totalProbability /
                  entry.analysed) *
                  10
              ) / 10
            : null,
      }))
      .sort(
        (a, b) =>
          (a.predictedPassRate ?? 0) -
          (b.predictedPassRate ?? 0)
      );

    // ---------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------

    const analysed =
      predictions.filter(
        (prediction) =>
          prediction.passProbability !==
          null
      );

    const summary = {
      students: predictions.length,

      analysed: analysed.length,

      atRisk: predictions.filter(
        (prediction) =>
          prediction.riskLevel ===
            "HIGH" ||
          prediction.riskLevel ===
            "MEDIUM"
      ).length,

      highRisk: predictions.filter(
        (prediction) =>
          prediction.riskLevel ===
          "HIGH"
      ).length,

      predictedPassRate:
        analysed.length > 0
          ? Math.round(
              (analysed.reduce(
                (sum, prediction) =>
                  sum +
                  (prediction.passProbability ??
                    0),
                0
              ) /
                analysed.length) *
                10
            ) / 10
          : null,

      average:
        analysed.length > 0
          ? Math.round(
              (analysed.reduce(
                (sum, prediction) =>
                  sum +
                  (prediction.currentAverage ??
                    0),
                0
              ) /
                analysed.length) *
                100
            ) / 100
          : null,

      improving: predictions.filter(
        (prediction) =>
          (prediction.trend ?? 0) > 3
      ).length,

      declining: predictions.filter(
        (prediction) =>
          (prediction.trend ?? 0) < -3
      ).length,
    };

    // ---------------------------------------------------------
    // RESPONSE
    // ---------------------------------------------------------

    return NextResponse.json({
      term,

      generatedAt:
        new Date().toISOString(),

      methodology: MODEL,

      summary,

      students: predictions,

      subjects,

      classes,
    });
  } catch (error) {
    console.error(
      "ADMIN PREDICTIONS ERROR:",
      error
    );

    return serverError(
      "ADMIN PREDICTIONS ERROR",
      error
    );
  }
}