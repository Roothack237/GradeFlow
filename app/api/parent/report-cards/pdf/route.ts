import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireParentChild } from "@/lib/parent-child";
import { buildTermReportCards } from "@/lib/report-card";
import {
  renderReportCardPdf,
  studentReportCardFileName,
} from "@/lib/report-card-pdf";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId")?.trim() ?? "";
  const termId = searchParams.get("termId")?.trim() ?? "";

  if (!studentId || !termId) {
    return NextResponse.json(
      { error: "studentId and termId are required." },
      { status: 400 }
    );
  }

  const access = await requireParentChild(studentId);
  if (!access.ok) return access.response;

  try {
    const { student } = access;
    const publication = await prisma.resultPublication.findUnique({
      where: {
        termId_classroomId: {
          termId,
          classroomId: student.classroomId,
        },
      },
      select: { status: true },
    });

    if (publication?.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This report card has not been published." },
        { status: 404 }
      );
    }

    const { cards } = await buildTermReportCards({
      termId,
      classroomId: student.classroomId,
    });
    const card = cards.find((item) => item.student.id === student.id);

    if (!card || card.marks.recorded === 0) {
      return NextResponse.json(
        { error: "No report card is available for this child." },
        { status: 404 }
      );
    }

    const pdf = await renderReportCardPdf(card);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${studentReportCardFileName(card)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PARENT REPORT CARD PDF ERROR:", error);
    return NextResponse.json(
      { error: "Unable to generate this report card." },
      { status: 500 }
    );
  }
}