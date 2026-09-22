import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { badRequest, str } from "@/lib/http";
import { buildTermReportCards } from "@/lib/report-card";

import {
  classReportCardFileName,
  renderReportCardPdf,
  renderReportCardsPdf,
  studentReportCardFileName,
} from "@/lib/report-card-pdf";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const academicYearId = str(searchParams.get("academicYearId"));
    const termId = str(searchParams.get("termId"));
    const sequenceId = str(searchParams.get("sequenceId"));
    const classroomId = str(searchParams.get("classroomId"));
    const studentId = str(searchParams.get("studentId"));

    const inline =
      searchParams.get("inline") === "1" ||
      searchParams.get("inline") === "true";

    const includeInactive =
      searchParams.get("includeInactive") === "true" ||
      searchParams.get("includeInactive") === "1";

    if (!academicYearId || !termId || !sequenceId || !classroomId) {
      return badRequest(
        "An academic year, term, sequence and class are required."
      );
    }

    console.log("=== REPORT CARD PDF DEBUG ===");
    console.log("termId:", termId);
    console.log("sequenceId:", sequenceId);
    console.log("classroomId:", classroomId);
    console.log("studentId:", studentId);
    console.log("includeInactive:", includeInactive);

    const { cards, term } = await buildTermReportCards({
      termId,
      classroomId,
      includeInactive,
    });

    const selectedSequence = cards[0]?.sequences.find(
      (sequence) => sequence.id === sequenceId
    );

    if (!selectedSequence) {
      return badRequest(
        "The selected sequence does not belong to the selected term."
      );
    }

    console.log("Report cards generated:", cards.length);
    console.log("Term:", term);

    if (!term) {
      return badRequest("Term not found.");
    }

    if (cards[0]?.classroom.academicYearId !== academicYearId) {
      return badRequest(
        "The selected term does not belong to the selected academic year."
      );
    }

    const withMarks = cards.filter(
      (card) => card.marks.recorded > 0
    );

    console.log("Cards with marks:", withMarks.length);

    if (!withMarks.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No marks are recorded for this class and term yet, so there is nothing to print.",
        },
        { status: 404 }
      );
    }

    if (studentId) {
      const card = withMarks.find(
        (entry) => entry.student.id === studentId
      );

      if (!card) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This student has no mark recorded for the selected term, so no report card can be generated.",
          },
          { status: 404 }
        );
      }

      console.log("Rendering student PDF:", card.student.fullName);

      const pdf = await renderReportCardPdf(card);

      console.log("Student PDF generated successfully.");

      return pdfResponse(
        pdf,
        studentReportCardFileName(card),
        inline
      );
    }

    console.log("Rendering class PDF...");

    const pdf = await renderReportCardsPdf(withMarks);

    const classroomName = withMarks[0].classroom.name;
    const academicYear =
      withMarks[0].classroom.academicYearName;

    console.log("Class PDF generated successfully.");

    return pdfResponse(
      pdf,
      classReportCardFileName(
        classroomName,
        academicYear
      ),
      inline
    );
  } catch (error) {
    console.error(
      "========================================"
    );
    console.error(
      "ADMIN REPORT CARD PDF ERROR"
    );
    console.error(
      "========================================"
    );
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
        stack:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : null
            : undefined,
      },
      { status: 500 }
    );
  }
}

function pdfResponse(
  pdf: Uint8Array,
  fileName: string,
  inline: boolean
) {
  return new NextResponse(
    new Uint8Array(pdf),
    {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${
          inline ? "inline" : "attachment"
        }; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    }
  );
}