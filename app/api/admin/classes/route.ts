import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, optionalStr, serverError, str } from "@/lib/http";

/**
 * Resolves the academic year a request should be scoped to. Defaults to the
 * active academic year when none is explicitly requested, so every existing
 * caller of this API keeps working without changes, while callers that
 * need a specific year (e.g. the year-context switcher) can pass one.
 */
async function resolveAcademicYearId(requested?: string | null) {
  if (requested) return requested;

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  return activeYear?.id ?? null;
}

// =========================================================
// GET CLASSES
// =========================================================
// ?sectionId=&academicYearId= — both optional. academicYearId defaults to
// the currently active academic year so classes are never mixed across
// years unless explicitly requested.

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const sectionId = optionalStr(searchParams.get("sectionId"));
    const requestedYearId = optionalStr(searchParams.get("academicYearId"));
    const allYears = searchParams.get("allYears") === "true";

    const academicYearId = allYears
      ? undefined
      : await resolveAcademicYearId(requestedYearId);

    if (!allYears && !academicYearId) {
      // No active year configured yet — return an empty list rather than
      // erroring, so pages that just list classes still render cleanly.
      return NextResponse.json({ classes: [] });
    }

    const classes = await prisma.classroom.findMany({
      where: {
        ...(sectionId ? { sectionId } : {}),
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: {
        section: true,
        academicYear: {
          select: { id: true, name: true, isActive: true },
        },

        _count: {
          select: {
            students: true,
          },
        },

        assignments: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                coefficient: true,
              },
            },

            teacher: {
              select: {
                id: true,
                teacherId: true,
                firstName: true,
                lastName: true,
                fullName: true,
              },
            },
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      classes,
    });
  } catch (error: unknown) {
    return serverError("GET CLASSES ERROR", error);
  }
}

// =========================================================
// CREATE CLASS
// =========================================================
// Body: { name, sectionId, academicYearId? } — academicYearId defaults to
// the active academic year when omitted.

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();

    const name = str(body.name);
    const sectionId = str(body.sectionId);
    const requestedYearId = optionalStr(body.academicYearId);

    if (!name) return badRequest("Class name is required.");
    if (!sectionId) return badRequest("Section is required.");

    const academicYearId = await resolveAcademicYearId(requestedYearId);

    if (!academicYearId) {
      return badRequest(
        "No academic year is available. Create and activate an academic year first."
      );
    }

    const [academicYear, section] = await Promise.all([
      prisma.academicYear.findUnique({ where: { id: academicYearId } }),
      prisma.section.findUnique({ where: { id: sectionId } }),
    ]);

    if (!academicYear) return badRequest("Academic year not found.");
    if (!section) return badRequest("Section not found.");

    const existing = await prisma.classroom.findFirst({
      where: { academicYearId, sectionId, name },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `A class named "${name}" already exists in ${section.name} for ${academicYear.name}.`,
        },
        { status: 409 }
      );
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        sectionId,
        academicYearId,
      },
      include: {
        section: true,
        academicYear: { select: { id: true, name: true, isActive: true } },
      },
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "CLASS_CREATED",
      entityType: "Classroom",
      entityId: classroom.id,
      description: `Created class "${classroom.name}" in ${section.name} section for ${academicYear.name}.`,
      metadata: { sectionId, academicYearId },
    });

    return NextResponse.json(
      {
        message: "Class created successfully.",
        classroom,
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError("CREATE CLASS ERROR", error);
  }
}
