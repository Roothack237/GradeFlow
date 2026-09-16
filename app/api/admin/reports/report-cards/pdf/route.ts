import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { badRequest, serverError, str } from "@/lib/http";
import { buildTermReportCards } from "@/lib/report-card";
import {
  classReportCardFileName,
  renderReportCardPdf,
  renderReportCardsPdf,
  studentReportCardFileName,
} from "@/lib/report-card-pdf";

/**
 * GET /api/admin/reports/report-cards/pdf
 *
 * Streams the report cards of a class as one PDF document:
 *
 *   ?termId=&classroomId=            → one page per student (class set)
 *   ?termId=&classroomId=&studentId= → the single report card of a student
 *   &includeInactive=true            → also include suspended/dismissed
 *                                      students (their history)
 *   &inline=1                        → display in the browser instead of
 *                                      downloading (used by the preview)
 *
 * The document is rendered from the marks, attendance and results stored in
 * PostgreSQL — nothing is hardcoded.
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const termId = str(searchParams.get("termId"));
    const classroomId = str(searchParams.get("classroomId"));
    const studentId = str(searchParams.get("studentId"));
    const inline = searchParams.get("inline") === "1";
    const includeInactive =
      searchParams.get("includeInactive") === "true" ||
      searchParams.get("includeInactive") === "1";

    if (!termId || !classroomId) {
      return badRequest("A term and a class are required.");
    }

    const { cards, term } = await buildTermReportCards({
      termId,
      classroomId,
      includeInactive,
    });

    if (!term) return badRequest("Term not found.");

    const withMarks = cards.filter((card) => card.marks.recorded > 0);

    if (!withMarks.length) {
      return NextResponse.json(
        {
          error:
            "No marks are recorded for this class and term yet, so there is nothing to print.",
        },
        { status: 404 }
      );
    }

    if (studentId) {
      const card = withMarks.find((entry) => entry.student.id === studentId);

      if (!card) {
        return NextResponse.json(
          {
            error:
              "This student has no mark recorded for the selected term, so no report card can be generated.",
          },
          { status: 404 }
        );
      }

      const pdf = await renderReportCardPdf(card);

      return pdfResponse(pdf, studentReportCardFileName(card), inline);
    }

    const pdf = await renderReportCardsPdf(withMarks);

    const classroomName = withMarks[0].classroom.name;
    const academicYear = withMarks[0].classroom.academicYearName;

    return pdfResponse(
      pdf,
      classReportCardFileName(classroomName, academicYear),
      inline
    );
  } catch (error) {
    return serverError("ADMIN REPORT CARD PDF ERROR", error);
  }
}

function pdfResponse(pdf: Uint8Array, fileName: string, inline: boolean) {
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
