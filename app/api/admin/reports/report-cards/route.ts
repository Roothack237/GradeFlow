import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, serverError, str } from "@/lib/http";
import { createManyNotifications } from "@/lib/notifications";
import prisma from "@/lib/prisma";
import {
  buildTermReportCards,
  type ReportCardData,
} from "@/lib/report-card";
import { renderReportCardPdf } from "@/lib/report-card-pdf";
import { enrolledOnly, statusLabel } from "@/lib/student-status";

/**
 * Report cards of one class for one term.
 *
 *   GET  /api/admin/reports/report-cards?termId=&classroomId=[&includeInactive=]
 *        → the students of the class with the marks recorded for the term,
 *          their computed average, rank and stored report card. Used by the
 *          Reports page to list the students before generating.
 *
 *   POST /api/admin/reports/report-cards  { termId, classroomId, includeInactive? }
 *        → computes the report cards from the marks stored in PostgreSQL,
 *          stores them (ReportCard), renders one A4 portrait PDF per student
 *          into public/report-cards/... and records the PDF on the card.
 *
 * Students without a single mark for the term are skipped: an empty report
 * card is never produced.
 */

type RouteBody = {
  termId?: unknown;
  classroomId?: unknown;
  includeInactive?: unknown;
};

function bool(value: unknown) {
  return value === true || value === "true";
}

/* =========================================================
   GET — class report card list
========================================================= */

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const termId = str(searchParams.get("termId"));
    const classroomId = str(searchParams.get("classroomId"));
    const includeInactive = bool(searchParams.get("includeInactive"));

    if (!termId || !classroomId) {
      return badRequest("A term and a class are required.");
    }

    const { cards, term } = await buildTermReportCards({
      termId,
      classroomId,
      includeInactive,
    });

    if (!term) return badRequest("Term not found.");

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        name: true,
        section: { select: { name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });

    if (!classroom) return badRequest("Class not found.");

    const publication = await prisma.resultPublication.findUnique({
      where: { termId_classroomId: { termId, classroomId } },
      select: { status: true, publishedAt: true },
    });

    const withMarks = cards.filter((card) => card.marks.recorded > 0);

    const averages = withMarks
      .map((card) => card.totals.average)
      .filter((value): value is number => value !== null);

    return NextResponse.json({
      term: {
        id: term.id,
        name: term.name,
        academicYear: classroom.academicYear.name,
        academicYearId: classroom.academicYear.id,
      },
      classroom: {
        id: classroom.id,
        name: classroom.name,
        sectionName: classroom.section?.name ?? null,
      },
      includeInactive,
      publication: {
        status: publication?.status ?? null,
        published: publication?.status === "PUBLISHED",
      },
      summary: {
        students: cards.length,
        assessed: withMarks.length,
        withoutMarks: cards.length - withMarks.length,
        incomplete: withMarks.filter((card) => !card.marks.complete).length,
        average: averages.length
          ? Math.round(
              (averages.reduce((sum, value) => sum + value, 0) / averages.length) *
                100
            ) / 100
          : null,
        markCoverage: withMarks.length
          ? Math.round(
              (withMarks.reduce(
                (sum, card) => sum + card.marks.recorded,
                0
              ) /
                Math.max(
                  1,
                  withMarks.reduce((sum, card) => sum + card.marks.expected, 0)
                )) *
                1000
            ) / 10
          : null,
      },
      students: cards.map((card) => ({
        id: card.student.id,
        name: card.student.fullName,
        matricule: card.student.matricule,
        status: card.student.status,
        statusLabel: statusLabel(card.student.status),
        enrolled: card.student.enrolled,
        parentName: card.student.parentName,
        subjects: card.subjects.length,
        marks: card.marks,
        average: card.totals.average,
        grade: card.totals.grade,
        rank: card.class.position,
        ranked: card.class.ranked,
        decision: card.decision,
        attendanceRate: card.attendance.rate,
        reportCardId: card.reportCardId,
        pdfUrl: card.pdfUrl,
      })),
    });
  } catch (error) {
    return serverError("ADMIN REPORT CARD LIST ERROR", error);
  }
}

/* =========================================================
   POST — generate the report cards of the class
========================================================= */

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = (await request.json().catch(() => ({}))) as RouteBody;

    const termId = str(body.termId);
    const classroomId = str(body.classroomId);
    const includeInactive = bool(body.includeInactive);

    if (!termId) return badRequest("A term is required.");
    if (!classroomId) return badRequest("A class is required.");

    const term = await prisma.term.findUnique({
      where: { id: termId },
      select: {
        id: true,
        name: true,
        academicYear: { select: { id: true, name: true } },
      },
    });

    if (!term) return badRequest("Term not found.");

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        name: true,
        students: {
          where: includeInactive ? {} : enrolledOnly(),
          select: { id: true, parent: { select: { userId: true } } },
        },
      },
    });

    if (!classroom) return badRequest("Class not found.");

    const { cards } = await buildTermReportCards({
      termId,
      classroomId,
      includeInactive,
    });

    /* students without a single mark are skipped: no empty report card */

    const withMarks = cards.filter((card) => card.marks.recorded > 0);
    const skipped = cards.length - withMarks.length;

    /* ---- store the PDF of every student ---- */

    const directory = path.join(
      process.cwd(),
      "public",
      "report-cards",
      term.academicYear.name.replace(/\//g, "-"),
      classroom.name.replace(/[^A-Za-z0-9]+/g, "-")
    );

    await mkdir(directory, { recursive: true });

    const now = new Date();

    const generated = await Promise.all(
      withMarks.map(async (card) => {
        const pdf = await renderReportCardPdf(card);

        const fileName = `${card.student.matricule.replace(
          /[^A-Za-z0-9-]+/g,
          "-"
        )}-${term.name.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase()}.pdf`;

        const absolutePath = path.join(directory, fileName);

        await writeFile(absolutePath, pdf);

        const pdfUrl = path
          .join(
            "/report-cards",
            term.academicYear.name.replace(/\//g, "-"),
            classroom.name.replace(/[^A-Za-z0-9]+/g, "-"),
            fileName
          )
          .split(path.sep)
          .join("/");

        const stored = await prisma.reportCard.upsert({
          where: {
            studentId_termId: { studentId: card.student.id, termId },
          },
          update: {
            average: card.totals.average ?? 0,
            rank: card.class.position,
            decision: card.decision,
            principalRemark: principalRemark(card),
            pdfUrl,
          },
          create: {
            studentId: card.student.id,
            termId,
            average: card.totals.average ?? 0,
            rank: card.class.position,
            decision: card.decision,
            principalRemark: principalRemark(card),
            pdfUrl,
          },
          select: { id: true },
        });

        return {
          id: card.student.id,
          name: card.student.fullName,
          matricule: card.student.matricule,
          status: card.student.status,
          statusLabel: statusLabel(card.student.status),
          average: card.totals.average,
          grade: card.totals.grade,
          rank: card.class.position,
          decision: card.decision,
          marks: card.marks,
          reportCardId: stored.id,
          pdfUrl,
        };
      })
    );

    /* ---- notify the parents of the actively enrolled students ---- */

    const recipientIds = Array.from(
      new Set(
        classroom.students
          .map((student) => student.parent?.userId)
          .filter((id): id is string => Boolean(id))
      )
    );

    let notified = 0;

    if (recipientIds.length && generated.length) {
      await createManyNotifications(recipientIds, {
        title: "Report cards available",
        message: `The ${term.name} report cards for ${classroom.name} are now available.`,
        type: "REPORT_AVAILABLE",
        senderId: guard.user.id,
        audience: "CLASS",
        actionUrl: "/parent/report-cards",
        relatedType: "ReportCard",
        relatedId: termId,
      });

      notified = recipientIds.length;
    }

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "REPORT_GENERATED",
      entityType: "ReportCard",
      entityId: termId,
      description: `Generated ${generated.length} report card(s) for ${classroom.name} — ${term.name} (${term.academicYear.name})`,
      metadata: {
        termId,
        classroomId,
        academicYear: term.academicYear.name,
        includeInactive,
        generated: generated.length,
        skipped,
        notified,
        students: generated.map((student) => student.matricule),
      },
    });

    return NextResponse.json({
      message: `${generated.length} report card(s) generated for ${classroom.name}${
        skipped ? `, ${skipped} student(s) had no mark yet` : ""
      }.${notified ? ` ${notified} parent notification(s) sent.` : ""}`,
      classroom: { id: classroom.id, name: classroom.name },
      term: {
        id: term.id,
        name: term.name,
        academicYear: term.academicYear.name,
      },
      generated: generated.length,
      skipped,
      notified,
      students: generated,
    });
  } catch (error) {
    return serverError("ADMIN REPORT CARD GENERATION ERROR", error);
  }
}

/** Principal's remark stored on the report card. */
function principalRemark(card: ReportCardData) {
  const decision = card.decision === "REPEAT" ? "repeat" : "continue";

  return `Term average ${card.totals.average?.toFixed(2) ?? "—"}/20 — ${decision}. Generated from the marks recorded up to ${new Date().toLocaleDateString(
    "en-GB"
  )}.`;
}
