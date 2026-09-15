import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    console.log("GET ACADEMIC YEAR ID:", id);

    if (!id) {
      return NextResponse.json(
        {
          error: "Academic year ID is required.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Get academic year (with its terms and their sequences)
    // ---------------------------------------------------------

    const academicYear =
      await prisma.academicYear.findUnique({
        where: {
          id,
        },
        include: {
          terms: {
            orderBy: {
              order: "asc",
            },
            include: {
              _count: {
                select: {
                  sequences: true,
                  reportCards: true,
                  timetables: true,
                },
              },
            },
          },
          _count: {
            select: {
              classrooms: true,
            },
          },
        },
      });

    if (!academicYear) {
      return NextResponse.json(
        {
          error: "Academic year not found.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // Get the two school sections with their class counts
    // for THIS academic year
    // ---------------------------------------------------------

    const sections =
      await prisma.section.findMany({
        orderBy: {
          name: "asc",
        },
        include: {
          classrooms: {
            where: {
              academicYearId: id,
            },
            select: {
              id: true,
              _count: {
                select: {
                  students: true,
                },
              },
            },
          },
        },
      });

    // ---------------------------------------------------------
    // Return data
    // ---------------------------------------------------------

    return NextResponse.json({
      academicYear: {
        ...academicYear,
        terms: academicYear.terms.map((term) => ({
          id: term.id,
          name: term.name,
          order: term.order,
          isCurrent: term.isCurrent,
          sequences: term._count.sequences,
          reportCards: term._count.reportCards,
          timetables: term._count.timetables,
        })),
        classes: academicYear._count.classrooms,
      },
      sections: sections.map((section) => ({
        id: section.id,
        name: section.name,
        classes: section.classrooms.length,
        students: section.classrooms.reduce(
          (total, classroom) => total + classroom._count.students,
          0
        ),
      })),
    });
  } catch (error) {
    console.error(
      "GET ACADEMIC YEAR ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load academic year.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/academic-years/:id
 *
 * Academic years hold real school history (classes, students, marks,
 * report cards). To respect the "never delete existing academic data"
 * rule, a year can only be removed while it is still empty: no classes,
 * no students enrolled, and it must not be the currently active year.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Academic year ID is required." },
        { status: 400 }
      );
    }

    const academicYear = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classrooms: true,
            terms: true,
          },
        },
      },
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: "Academic year not found." },
        { status: 404 }
      );
    }

    if (academicYear.isActive) {
      return NextResponse.json(
        {
          error:
            "This academic year is currently active and cannot be deleted. Activate a different year first.",
        },
        { status: 400 }
      );
    }

    const studentCount = await prisma.student.count({
      where: { classroom: { academicYearId: id } },
    });

    if (academicYear._count.classrooms > 0 || studentCount > 0) {
      return NextResponse.json(
        {
          error:
            "This academic year has classes or students and cannot be deleted, to protect existing academic data.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Sequences cascade via Term -> Sequence relation manually since the
      // schema doesn't declare onDelete for Term/Sequence.
      const terms = await tx.term.findMany({
        where: { academicYearId: id },
        select: { id: true },
      });

      const termIds = terms.map((term) => term.id);

      if (termIds.length > 0) {
        await tx.sequence.deleteMany({ where: { termId: { in: termIds } } });
        await tx.term.deleteMany({ where: { id: { in: termIds } } });
      }

      await tx.academicYear.delete({ where: { id } });
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "ACADEMIC_YEAR_UPDATED",
      entityType: "AcademicYear",
      entityId: id,
      description: `Deleted empty academic year "${academicYear.name}".`,
    });

    return NextResponse.json({
      message: "Academic year deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE ACADEMIC YEAR ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete academic year." },
      { status: 500 }
    );
  }
}