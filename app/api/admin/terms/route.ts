import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, num, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/terms
 * Every term with its academic year, sequences and result counts.
 *   ?academicYearId=  filter to one academic year
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = str(searchParams.get("academicYearId"));

    const terms = await prisma.term.findMany({
      where: academicYearId ? { academicYearId } : {},
      include: {
        academicYear: { select: { id: true, name: true } },
        sequences: {
          orderBy: { order: "asc" },
          include: { _count: { select: { marks: true, attendances: true } } },
        },
        _count: { select: { reportCards: true, resultPublications: true } },
      },
      orderBy: [{ academicYear: { startDate: "desc" } }, { order: "asc" }],
    });

    return NextResponse.json({ terms });
  } catch (error) {
    return serverError("ADMIN TERMS LIST ERROR", error);
  }
}

/**
 * POST /api/admin/terms
 * Creates a term inside an academic year.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();

    const name = str(body.name);
    const academicYearId = str(body.academicYearId);
    const order = num(body.order, 0);
    const isCurrent = body.isCurrent === true;

    if (!name || !academicYearId) {
      return badRequest("A term name and academic year are required.");
    }

    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear) return badRequest("Academic year not found.");

    const duplicate = await prisma.term.findFirst({
      where: { name, academicYearId },
    });

    if (duplicate) {
      return badRequest(`"${name}" already exists in ${academicYear.name}.`);
    }

    const term = await prisma.term.create({
      data: {
        name,
        order:
          order ||
          (await prisma.term.count({ where: { academicYearId } })) + 1,
        academicYearId,
        isCurrent,
      },
    });

    if (isCurrent) {
      await prisma.term.updateMany({
        where: { NOT: { id: term.id } },
        data: { isCurrent: false },
      });
    }

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "TERM_CREATED",
      entityType: "Term",
      entityId: term.id,
      description: `Created ${term.name} in ${academicYear.name}`,
    });

    return NextResponse.json(
      { message: "Term created successfully.", term },
      { status: 201 }
    );
  } catch (error) {
    return serverError("ADMIN TERM CREATE ERROR", error);
  }
}
