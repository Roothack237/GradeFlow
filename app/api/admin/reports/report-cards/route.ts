import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, serverError, str } from "@/lib/http";
import { createManyNotifications } from "@/lib/notifications";
import prisma from "@/lib/prisma";
import { PASS_MARK } from "@/lib/grading";

/**
 * POST /api/admin/reports/report-cards
 * Computes and stores the term report cards from the recorded marks:
 * weighted average, class rank and promotion decision. Parents of the class
 * are then notified once that the report cards are available.
 *
 * Body: { termId, classroomId? }  — omit the class to process the whole term.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => ({}));

    const termId = str(body.termId);
    const classroomId = str(body.classroomId);

    if (!termId) return badRequest("A term is required.");

    const term = await prisma.term.findUnique({
      where: { id: termId },
      select: { id: true, name: true, academicYear: { select: { name: true } } },
    });

    if (!term) return badRequest("Term not found.");

    const classrooms = await prisma.classroom.findMany({
      where: classroomId ? { id: classroomId } : {},
      select: {
        id: true,
        name: true,
        students: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!classrooms.length) {
      return badRequest("No class found for this term.");
    }

    /* ---- marks of the term, grouped per student ---- */

    const marks = await prisma.mark.findMany({
      where: {
        sequence: { termId },
        student: { classroomId: { in: classrooms.map((room) => room.id) } },
      },
      select: {
        studentId: true,
        average: true,
        subject: { select: { id: true, coefficient: true } },
      },
    });

    const perStudent = new Map<
      string,
      Map<string, { total: number; count: number; coefficient: number }>
    >();

    for (const mark of marks) {
      const subjects =
        perStudent.get(mark.studentId) ??
        new Map<string, { total: number; count: number; coefficient: number }>();

      const entry = subjects.get(mark.subject.id) ?? {
        total: 0,
        count: 0,
        coefficient: mark.subject.coefficient,
      };

      entry.total += mark.average;
      entry.count += 1;

      subjects.set(mark.subject.id, entry);
      perStudent.set(mark.studentId, subjects);
    }

    /* ---- weighted average per student ---- */

    const computed = new Map<string, number>();

    for (const [studentId, subjects] of perStudent) {
      let weighted = 0;
      let coefficients = 0;

      for (const entry of subjects.values()) {
        const subjectAverage = entry.total / entry.count;

        weighted += subjectAverage * entry.coefficient;
        coefficients += entry.coefficient;
      }

      if (coefficients > 0) {
        computed.set(studentId, Math.round((weighted / coefficients) * 100) / 100);
      }
    }

    /* ---- ranking inside each class + storage ---- */

    const now = new Date();
    let generated = 0;
    let skipped = 0;

    const notifiedClasses: { id: string; name: string; count: number }[] = [];

    for (const classroom of classrooms) {
      const ranked = classroom.students
        .map((student) => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`.trim(),
          average: computed.get(student.id) ?? null,
        }))
        .filter((student) => student.average !== null)
        .sort((a, b) => (b.average ?? 0) - (a.average ?? 0));

      skipped += classroom.students.length - ranked.length;

      let previousAverage: number | null = null;
      let previousRank = 0;

      for (let index = 0; index < ranked.length; index += 1) {
        const student = ranked[index];
        const average = student.average as number;

        /* students with the same average share the same rank */
        const rank =
          previousAverage !== null && average === previousAverage
            ? previousRank
            : index + 1;

        previousAverage = average;
        previousRank = rank;

        await prisma.reportCard.upsert({
          where: {
            studentId_termId: { studentId: student.id, termId },
          },
          update: {
            average,
            rank,
            decision: average >= PASS_MARK ? "PROMOTED" : "REPEAT",
            principalRemark: `Term results generated from recorded marks on ${now.toLocaleDateString(
              "en-GB"
            )}.`,
          },
          create: {
            studentId: student.id,
            termId,
            average,
            rank,
            decision: average >= PASS_MARK ? "PROMOTED" : "REPEAT",
            principalRemark: `Term results generated from recorded marks on ${now.toLocaleDateString(
              "en-GB"
            )}.`,
          },
        });

        generated += 1;
      }

      if (ranked.length) {
        notifiedClasses.push({
          id: classroom.id,
          name: classroom.name,
          count: ranked.length,
        });
      }
    }

    /* ---- notify the parents once per class ---- */

    let notified = 0;

    for (const classroom of notifiedClasses) {
      const parents = await prisma.student.findMany({
        where: { classroomId: classroom.id, parentId: { not: null } },
        select: { parent: { select: { userId: true } } },
      });

      const recipientIds = parents
        .map((student) => student.parent?.userId)
        .filter((id): id is string => Boolean(id));

      if (!recipientIds.length) continue;

      await createManyNotifications(recipientIds, {
        title: "Report cards available",
        message: `The ${term.name} report cards for ${classroom.name} are now available.`,
        type: "REPORT_AVAILABLE",
        senderId: guard.user.id,
        audience: "CLASS",
        actionUrl: "/parent/children",
        relatedType: "Classroom",
        relatedId: classroom.id,
      });

      notified += recipientIds.length;
    }

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "REPORT_GENERATED",
      entityType: "ReportCard",
      entityId: termId,
      description: `Generated ${generated} report card(s) for ${term.name} (${term.academicYear.name})`,
      metadata: {
        termId,
        classroomId: classroomId || null,
        generated,
        skipped,
        notified,
      },
    });

    return NextResponse.json({
      message: `${generated} report card(s) generated${
        skipped ? `, ${skipped} student(s) had no mark yet` : ""
      }.${notified ? ` ${notified} parent notification(s) sent.` : ""}`,
      generated,
      skipped,
      notified,
    });
  } catch (error) {
    return serverError("ADMIN REPORT CARD GENERATION ERROR", error);
  }
}
