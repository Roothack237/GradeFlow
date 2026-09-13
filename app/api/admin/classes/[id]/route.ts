import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, serverError, str } from "@/lib/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        section: true,
        academicYear: { select: { id: true, name: true, isActive: true } },
        _count: { select: { students: true } },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({ classroom });
  } catch (error) {
    return serverError("GET CLASS ERROR", error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const classroom = await prisma.classroom.findUnique({ where: { id } });

    if (!classroom) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const name = body.name !== undefined ? str(body.name) : classroom.name;
    const sectionId =
      body.sectionId !== undefined ? str(body.sectionId) : classroom.sectionId;

    if (!name) return badRequest("Class name is required.");
    if (!sectionId) return badRequest("Section is required.");

    // A class can never be moved to a different academic year — that would
    // silently mix that year's students/history with another year.
    const duplicate = await prisma.classroom.findFirst({
      where: {
        id: { not: id },
        academicYearId: classroom.academicYearId,
        sectionId,
        name,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: `A class named "${name}" already exists in this section for this year.` },
        { status: 409 }
      );
    }

    const updated = await prisma.classroom.update({
      where: { id },
      data: { name, sectionId },
      include: {
        section: true,
        academicYear: { select: { id: true, name: true, isActive: true } },
      },
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "CLASS_UPDATED",
      entityType: "Classroom",
      entityId: id,
      description: `Updated class "${updated.name}".`,
    });

    return NextResponse.json({
      message: "Class updated successfully.",
      classroom: updated,
    });
  } catch (error) {
    return serverError("UPDATE CLASS ERROR", error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            assignments: true,
            timetable: true,
          },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    if (classroom._count.students > 0) {
      return NextResponse.json(
        {
          error:
            "This class cannot be deleted because it has students.",
        },
        { status: 400 }
      );
    }

    if (
      classroom._count.assignments > 0 ||
      classroom._count.timetable > 0
    ) {
      return NextResponse.json(
        {
          error:
            "This class cannot be deleted because it is being used by assignments or the timetable.",
        },
        { status: 400 }
      );
    }

    await prisma.classroom.delete({
      where: { id },
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "CLASS_DELETED",
      entityType: "Classroom",
      entityId: id,
      description: `Deleted class "${classroom.name}".`,
    });

    return NextResponse.json({
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}