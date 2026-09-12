import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const classrooms = await prisma.classroom.findMany({
      where: activeYear ? { academicYearId: activeYear.id } : undefined,
      select: {
        id: true,
        name: true,
        sectionId: true,
        section: { select: { id: true, name: true } },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      classrooms,
      academicYear: activeYear,
    });
  } catch (error) {
    console.error("FORM DATA ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load classrooms.",
      },
      { status: 500 }
    );
  }
}