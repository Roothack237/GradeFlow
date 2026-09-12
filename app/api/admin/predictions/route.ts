import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/predictions
 * Performance and risk predictions computed from the marks and attendance that
 * are already stored in the database. There is no random or hard-coded data:
 * every number below is derived from the school records with the transparent
 * formula documented in `methodology`.
 *
 * Query: ?termId= &classroomId=
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const termId = str(searchParams.get("termId"));
    const classroomId = str(searchParams.get("classroomId"));

    const term = termId
      ? await prisma.term.findUnique({
          where: { id: termId },
          select: {
            id: true,
            name: true,
            isCurrent: true,
            academicYear: { select: { id: true, name: true } },
            sequences: {
              orderBy: { order: "asc" },
              select: { id: true, name: true, order: true },
            },
          },
        })
      : await prisma.term.findFirst({
          where: { isCurrent: true },
          select: {
            id: true,
            name: true,
            isCurrent: true,
            academicYear: { select: { id: true, name: true } },
            sequences: {
              orderBy: { order: "asc" },
              select: { id: true, name: true, order: true },
            },
          },
        });

    if (!term) {
      return NextResponse.json({
        term: null,
        summary: { students: 0, atRisk: 0, predictedPassRate: null },
        students: [],
        subjects: [],
        classes: [],
        message: "No term is available yet. Create a term to run predictions.",
      });
    }

    const students = await prisma.student.findMany({
      where: {
        ...(classroomId ? { classroomId } : {}),
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
            section: { select: { name: true } },
          },
        },
        marks: {
          where: { sequence: { termId: term.id } },
          select: {
            average: true,
            subject: { select: { id: true, name: true, coefficient: true } },
            sequence: { select: { id: true, order: true } },
          },
        },
        attendances: {
          where: { sequence: { termId: term.id } },
          select: { status: true },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    /* ---------- the transparent prediction model ---------- */

    const MODEL = {
      name: "GradeFlow weighted trend model",
      description:
        "The next sequence average is projected from the marks already recorded, then blended with the attendance rate. The pass probability is the logistic of the projected average around the 50/100 pass mark.",
      projectedAverage:
        "projected = currentAverage + 0.5 × (lastSequenceAverage − previousSequenceAverage), clamped to 0…100. With a single sequence the current average is used.",
      passProbability:
        "probability = 1 / (1 + e^(−(projected − 50) / 8)), expressed as a percentage. Attendance below 75% applies a −5 point penalty, below 60% a −10 point penalty.",
      riskLevels: {
        HIGH: "projected average below 45, or attendance below 60%",
        MEDIUM:
          "projected average below 55, attendance below 75%, or a declining trend",
        LOW: "none of the risk conditions above",
      },
    };

    const predictions = students.map((student) => {
      const perSubject = new Map<
        string,
        { name: string; total: number; count: number }
      >();

      const perSequence = new Map<number, { total: number; count: number }>();

      for (const mark of student.marks) {
        const subject = perSubject.get(mark.subject.id) ?? {
          name: mark.subject.name,
          total: 0,
          count: 0,
        };

        subject.total += mark.average;
        subject.count += 1;

        perSubject.set(mark.subject.id, subject);

        const sequence = perSequence.get(mark.sequence.order) ?? {
          total: 0,
          count: 0,
        };

        sequence.total += mark.average;
        sequence.count += 1;

        perSequence.set(mark.sequence.order, sequence);
      }

      const marksCount = student.marks.length;

      const currentAverage = marksCount
        ? student.marks.reduce((sum, mark) => sum + mark.average, 0) / marksCount
        : null;

      const sequenceOrders = Array.from(perSequence.keys()).sort((a, b) => a - b);

      const lastSequence = sequenceOrders.length
        ? perSequence.get(sequenceOrders[sequenceOrders.length - 1])
        : undefined;

      const previousSequence =
        sequenceOrders.length > 1
          ? perSequence.get(sequenceOrders[sequenceOrders.length - 2])
          : undefined;

      const lastSequenceAverage = lastSequence
        ? lastSequence.total / lastSequence.count
        : null;

      const previousSequenceAverage = previousSequence
        ? previousSequence.total / previousSequence.count
        : null;

      const trend =
        lastSequenceAverage !== null && previousSequenceAverage !== null
          ? lastSequenceAverage - previousSequenceAverage
          : null;

      const attendanceTotal = student.attendances.length;
      const attended = student.attendances.filter(
        (record) => record.status === "PRESENT" || record.status === "LATE"
      ).length;

      const attendanceRate = attendanceTotal
        ? (attended / attendanceTotal) * 100
        : null;

      let projected =
        currentAverage === null
          ? null
          : currentAverage + (trend === null ? 0 : 0.5 * trend);

      if (projected !== null) {
        if (attendanceRate !== null && attendanceRate < 60) projected -= 10;
        else if (attendanceRate !== null && attendanceRate < 75) projected -= 5;

        projected = Math.min(100, Math.max(0, projected));
      }

      const probability =
        projected === null
          ? null
          : (1 / (1 + Math.exp(-(projected - 50) / 8))) * 100;

      const factors: string[] = [];

      if (currentAverage !== null && currentAverage < 50) {
        factors.push("Current average is below the pass mark");
      }

      if (trend !== null && trend < -3) {
        factors.push("Average is declining between sequences");
      } else if (trend !== null && trend > 3) {
        factors.push("Average is improving between sequences");
      }

      if (attendanceRate !== null && attendanceRate < 75) {
        factors.push(
          `Attendance is ${Math.round(attendanceRate)}% — below the 75% threshold`
        );
      }

      if (marksCount === 0) {
        factors.push("No mark has been recorded for this term yet");
      }

      const riskLevel =
        projected === null
          ? "UNKNOWN"
          : projected < 45 || (attendanceRate !== null && attendanceRate < 60)
            ? "HIGH"
            : projected < 55 ||
                (attendanceRate !== null && attendanceRate < 75) ||
                (trend !== null && trend < -3)
              ? "MEDIUM"
              : "LOW";

      const subjectAverages = Array.from(perSubject.values()).map((subject) => ({
        name: subject.name,
        average: Math.round((subject.total / subject.count) * 100) / 100,
      }));

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        matricule: student.matricule,
        classroomId: student.classroom?.id ?? null,
        className: student.classroom?.name ?? null,
        sectionName: student.classroom?.section?.name ?? null,
        marks: marksCount,
        currentAverage:
          currentAverage === null
            ? null
            : Math.round(currentAverage * 100) / 100,
        lastSequenceAverage:
          lastSequenceAverage === null
            ? null
            : Math.round(lastSequenceAverage * 100) / 100,
        trend: trend === null ? null : Math.round(trend * 100) / 100,
        attendanceRate:
          attendanceRate === null ? null : Math.round(attendanceRate * 10) / 10,
        projectedAverage:
          projected === null ? null : Math.round(projected * 100) / 100,
        passProbability:
          probability === null ? null : Math.round(probability * 10) / 10,
        riskLevel,
        factors,
        weakestSubject:
          subjectAverages.length > 0
            ? subjectAverages.reduce((worst, subject) =>
                subject.average < worst.average ? subject : worst
              ).name
            : null,
        strongestSubject:
          subjectAverages.length > 0
            ? subjectAverages.reduce((best, subject) =>
                subject.average > best.average ? subject : best
              ).name
            : null,
      };
    });

    /* ---------- subjects at risk ---------- */

    const subjectMap = new Map<
      string,
      { id: string; name: string; total: number; count: number; atRisk: number }
    >();

    for (const student of students) {
      for (const mark of student.marks) {
        const entry = subjectMap.get(mark.subject.id) ?? {
          id: mark.subject.id,
          name: mark.subject.name,
          total: 0,
          count: 0,
          atRisk: 0,
        };

        entry.total += mark.average;
        entry.count += 1;
        if (mark.average < 50) entry.atRisk += 1;

        subjectMap.set(mark.subject.id, entry);
      }
    }

    const classroomMap = new Map<
      string,
      { id: string; name: string; students: number; atRisk: number; total: number }
    >();

    for (const prediction of predictions) {
      if (!prediction.classroomId) continue;

      const entry = classroomMap.get(prediction.classroomId) ?? {
        id: prediction.classroomId,
        name: prediction.className ?? "Unknown class",
        students: 0,
        atRisk: 0,
        total: 0,
      };

      entry.students += 1;

      if (prediction.riskLevel === "HIGH" || prediction.riskLevel === "MEDIUM") {
        entry.atRisk += 1;
      }

      entry.total += prediction.passProbability ?? 0;

      classroomMap.set(prediction.classroomId, entry);
    }

    const analysed = predictions.filter(
      (prediction) => prediction.passProbability !== null
    );

    return NextResponse.json({
      term,
      generatedAt: new Date().toISOString(),
      methodology: MODEL,

      summary: {
        students: predictions.length,
        analysed: analysed.length,
        atRisk: predictions.filter(
          (prediction) =>
            prediction.riskLevel === "HIGH" || prediction.riskLevel === "MEDIUM"
        ).length,
        highRisk: predictions.filter(
          (prediction) => prediction.riskLevel === "HIGH"
        ).length,
        predictedPassRate: analysed.length
          ? Math.round(
              (analysed.reduce(
                (sum, prediction) => sum + (prediction.passProbability ?? 0),
                0
              ) /
                analysed.length) *
                10
            ) / 10
          : null,
        average:
          analysed.length
            ? Math.round(
                (analysed.reduce(
                  (sum, prediction) => sum + (prediction.currentAverage ?? 0),
                  0
                ) /
                  analysed.length) *
                  100
              ) / 100
            : null,
        improving: predictions.filter(
          (prediction) => (prediction.trend ?? 0) > 3
        ).length,
        declining: predictions.filter(
          (prediction) => (prediction.trend ?? 0) < -3
        ).length,
      },

      students: predictions,

      subjects: Array.from(subjectMap.values())
        .map((entry) => ({
          id: entry.id,
          name: entry.name,
          marks: entry.count,
          average: Math.round((entry.total / entry.count) * 100) / 100,
          atRisk: entry.atRisk,
          atRiskRate: Math.round((entry.atRisk / entry.count) * 1000) / 10,
        }))
        .sort((a, b) => b.atRiskRate - a.atRiskRate),

      classes: Array.from(classroomMap.values())
        .map((entry) => ({
          id: entry.id,
          name: entry.name,
          students: entry.students,
          atRisk: entry.atRisk,
          predictedPassRate: Math.round((entry.total / entry.students) * 10) / 10,
        }))
        .sort((a, b) => a.predictedPassRate - b.predictedPassRate),
    });
  } catch (error) {
    return serverError("ADMIN PREDICTIONS ERROR", error);
  }
}
