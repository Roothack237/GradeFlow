import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const academicYears = await prisma.academicYear.findMany({
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json({
      academicYears,
    });
  } catch (error) {
    console.error("GET ACADEMIC YEARS ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Failed to load academic years",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Academic year ID is required." },
        { status: 400 }
      );
    }

    const year = await prisma.academicYear.findUnique({ where: { id } });

    if (!year) {
      return NextResponse.json(
        { error: "Academic year not found." },
        { status: 404 }
      );
    }

    if (body.isActive === true) {
      // Exactly one academic year may be active at a time — this is what
      // scopes the whole admin dashboard's "current year" context.
      await prisma.$transaction([
        prisma.academicYear.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        }),
        prisma.academicYear.update({
          where: { id },
          data: { isActive: true },
        }),
      ]);
    }

    const updated = await prisma.academicYear.findUnique({ where: { id } });

    return NextResponse.json({
      message: "Academic year updated successfully.",
      academicYear: updated,
    });
  } catch (error) {
    console.error("UPDATE ACADEMIC YEAR ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update academic year." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const startDate = String(body.startDate ?? "").trim();
    const endDate = String(body.endDate ?? "").trim();

    console.log("CREATE ACADEMIC YEAR:", {
      name,
      startDate,
      endDate,
    });

    if (!name) {
      return NextResponse.json(
        {
          error: "Academic year name is required.",
        },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        {
          error: "Start date is required.",
        },
        { status: 400 }
      );
    }

    if (!endDate) {
      return NextResponse.json(
        {
          error: "End date is required.",
        },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid start date.",
        },
        { status: 400 }
      );
    }

    if (isNaN(end.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid end date.",
        },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        {
          error: "End date must be after start date.",
        },
        { status: 400 }
      );
    }

    // Check if the academic year already exists
    const existingYear =
      await prisma.academicYear.findUnique({
        where: {
          name,
        },
      });

    if (existingYear) {
      return NextResponse.json(
        {
          error: `Academic year ${name} already exists.`,
        },
        { status: 409 }
      );
    }

    // Create the academic year
    const academicYear =
      await prisma.academicYear.create({
        data: {
          name,
          startDate: start,
          endDate: end,
        },
      });

    return NextResponse.json(
      {
        message: "Academic year created successfully.",
        academicYear,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE ACADEMIC YEAR ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create academic year.",
      },
      { status: 500 }
    );
  }
}