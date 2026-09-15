import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, conflict, notFound, num, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };


/**
 * GET /api/admin/terms/[id]
 *
 * The term with its sequences and, for the term's academic year, the two
 * school sections with their class counts. Powers the
 * Academic Year → Term → Section navigation.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const term = await prisma.term.findUnique({
      where: { id },
      include: {
        sequences: { orderBy: { order: "asc" } },
        academicYear: {
          select: {
            id: true,
            name: true,
            isActive: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!term) return notFound("Term not found.");

    const sections = await prisma.section.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        classrooms: {
          where: { academicYearId: term.academicYearId },
          select: {
            id: true,
            name: true,
            _count: { select: { students: true, assignments: true } },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    return NextResponse.json({
      term: {
        id: term.id,
        name: term.name,
        order: term.order,
        isCurrent: term.isCurrent,
        sequences: term.sequences.map((sequence) => ({
          id: sequence.id,
          name: sequence.name,
          order: sequence.order,
          createdAt: sequence.createdAt,
        })),
        academicYear: term.academicYear,
      },
      sections: sections.map((section) => ({
        id: section.id,
        name: section.name,
        classes: section.classrooms.length,
        students: section.classrooms.reduce(
          (total, classroom) => total + classroom._count.students,
          0
        ),
        classrooms: section.classrooms,
      })),
    });
  } catch (error) {
    return serverError("GET TERM ERROR", error);
  }
}

/**
 * PATCH /api/admin/terms/[id]
 * Rename / reorder a term, or make it the current term.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.term.findUnique({ where: { id } });

    if (!existing) return notFound("Term not found.");

    const data: Record<string, unknown> = {};
    const changes: string[] = [];

    const name = str(body.name);

    if (name && name !== existing.name) {
      const duplicate = await prisma.term.findFirst({
        where: { name, academicYearId: existing.academicYearId, NOT: { id } },
      });

      if (duplicate) return badRequest(`"${name}" already exists in this year.`);

      data.name = name;
      changes.push(`renamed to "${name}"`);
    }

    if (body.order !== undefined) {
      const order = num(body.order, existing.order);

      if (order !== existing.order) {
        data.order = order;
        changes.push("changed the order");
      }
    }

    if (typeof body.isCurrent === "boolean") {
      data.isCurrent = body.isCurrent;
      changes.push(
        body.isCurrent ? "set as the current term" : "removed as current term"
      );
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ message: "Nothing to update.", term: existing });
    }

    const term = await prisma.term.update({ where: { id }, data });

    if (term.isCurrent) {
      await prisma.term.updateMany({
        where: { NOT: { id } },
        data: { isCurrent: false },
      });
    }

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "TERM_UPDATED",
      entityType: "Term",
      entityId: id,
      description: `Updated ${term.name} (${changes.join(", ") || "no change"})`,
    });

    return NextResponse.json({ message: "Term updated successfully.", term });
  } catch (error) {
    return serverError("ADMIN TERM UPDATE ERROR", error);
  }
}

/**
 * DELETE /api/admin/terms/[id]
 * Refuses to delete a term that already holds results or report cards.
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const term = await prisma.term.findUnique({
      where: { id },
      include: {
        academicYear: { select: { name: true } },
        _count: {
          select: { reportCards: true, resultPublications: true, timetables: true },
        },
        sequences: {
          select: { _count: { select: { marks: true, attendances: true } } },
        },
      },
    });

    if (!term) return notFound("Term not found.");

    const marks = term.sequences.reduce(
      (total, sequence) => total + sequence._count.marks,
      0
    );
    const attendances = term.sequences.reduce(
      (total, sequence) => total + sequence._count.attendances,
      0
    );

    if (
      marks > 0 ||
      attendances > 0 ||
      term._count.reportCards > 0 ||
      term._count.resultPublications > 0
    ) {
      return conflict(
        "This term cannot be deleted because it already contains results, attendance or report cards."
      );
    }

    await prisma.term.delete({ where: { id } });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "TERM_UPDATED",
      entityType: "Term",
      entityId: id,
      description: `Deleted ${term.name} from ${term.academicYear.name}`,
    });

    return NextResponse.json({ message: "Term deleted successfully." });
  } catch (error) {
    return serverError("ADMIN TERM DELETE ERROR", error);
  }
}
