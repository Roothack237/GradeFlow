import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, conflict, notFound, num, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/sequences/[id]
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.sequence.findUnique({ where: { id } });

    if (!existing) return notFound("Sequence not found.");

    const data: Record<string, unknown> = {};

    const name = str(body.name);

    if (name && name !== existing.name) {
      const duplicate = await prisma.sequence.findFirst({
        where: { name, termId: existing.termId, NOT: { id } },
      });

      if (duplicate) return badRequest(`"${name}" already exists in this term.`);

      data.name = name;
    }

    if (body.order !== undefined) {
      data.order = num(body.order, existing.order);
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({
        message: "Nothing to update.",
        sequence: existing,
      });
    }

    const sequence = await prisma.sequence.update({ where: { id }, data });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "SEQUENCE_UPDATED",
      entityType: "Sequence",
      entityId: id,
      description: `Updated sequence ${sequence.name}`,
    });

    return NextResponse.json({
      message: "Sequence updated successfully.",
      sequence,
    });
  } catch (error) {
    return serverError("ADMIN SEQUENCE UPDATE ERROR", error);
  }
}

/**
 * DELETE /api/admin/sequences/[id]
 * Blocked while the sequence still holds marks or attendance.
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const sequence = await prisma.sequence.findUnique({
      where: { id },
      include: {
        term: { select: { name: true } },
        _count: { select: { marks: true, attendances: true } },
      },
    });

    if (!sequence) return notFound("Sequence not found.");

    if (sequence._count.marks > 0 || sequence._count.attendances > 0) {
      return conflict(
        "This sequence cannot be deleted because it already contains marks or attendance records."
      );
    }

    await prisma.sequence.delete({ where: { id } });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "SEQUENCE_UPDATED",
      entityType: "Sequence",
      entityId: id,
      description: `Deleted sequence ${sequence.name} from ${sequence.term.name}`,
    });

    return NextResponse.json({ message: "Sequence deleted successfully." });
  } catch (error) {
    return serverError("ADMIN SEQUENCE DELETE ERROR", error);
  }
}
