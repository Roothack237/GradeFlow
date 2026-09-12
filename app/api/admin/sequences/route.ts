import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, num, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/sequences
 *   ?termId=  sequences of one term
 *   (no filter) every sequence with its term and academic year
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const termId = str(searchParams.get("termId"));
    const academicYearId = str(searchParams.get("academicYearId"));

    const sequences = await prisma.sequence.findMany({
      where: {
        ...(termId ? { termId } : {}),
        ...(academicYearId ? { term: { academicYearId } } : {}),
      },
      include: {
        term: {
          select: {
            id: true,
            name: true,
            order: true,
            isCurrent: true,
            academicYear: { select: { id: true, name: true } },
          },
        },
        _count: { select: { marks: true, attendances: true } },
      },
      orderBy: [{ term: { order: "asc" } }, { order: "asc" }],
    });

    return NextResponse.json({ sequences });
  } catch (error) {
    return serverError("ADMIN SEQUENCES LIST ERROR", error);
  }
}

/**
 * POST /api/admin/sequences
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();

    const name = str(body.name);
    const termId = str(body.termId);
    const order = num(body.order, 0);

    if (!name || !termId) {
      return badRequest("A sequence name and term are required.");
    }

    const term = await prisma.term.findUnique({
      where: { id: termId },
      include: { academicYear: { select: { name: true } } },
    });

    if (!term) return badRequest("Term not found.");

    const duplicate = await prisma.sequence.findFirst({
      where: { name, termId },
    });

    if (duplicate) {
      return badRequest(`"${name}" already exists in ${term.name}.`);
    }

    const sequence = await prisma.sequence.create({
      data: {
        name,
        order: order || (await prisma.sequence.count({ where: { termId } })) + 1,
        termId,
      },
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "SEQUENCE_CREATED",
      entityType: "Sequence",
      entityId: sequence.id,
      description: `Created ${sequence.name} in ${term.name} (${term.academicYear.name})`,
    });

    return NextResponse.json(
      { message: "Sequence created successfully.", sequence },
      { status: 201 }
    );
  } catch (error) {
    return serverError("ADMIN SEQUENCE CREATE ERROR", error);
  }
}
