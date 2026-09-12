import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Academic year ID is required.",
        },
        { status: 400 }
      );
    }

    // Find the academic year
    const academicYear = await prisma.academicYear.findUnique({
      where: {
        id,
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

    /*
     * Sections (Anglophone / Francophone) are global in GradeFlow and are
     * shared by every academic year, so all sections are returned here.
     */
    const sections = await prisma.section.findMany({
      orderBy: [
        {
          name: "asc",
        },
      ],
    });

    // Separate sections by language
    const anglophone = sections.filter(
      (section) =>
        section.name.toUpperCase() === "ANGLOPHONE"
    );

    const francophone = sections.filter(
      (section) =>
        section.name.toUpperCase() === "FRANCOPHONE"
    );

    return NextResponse.json({
      academicYear,
      sections,

      sectionGroups: [
        {
          name: "ANGLOPHONE",
          sections: anglophone,
        },
        {
          name: "FRANCOPHONE",
          sections: francophone,
        },
      ],
    });
  } catch (error) {
    console.error(
      "GET ACADEMIC YEAR SECTIONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load sections.",
      },
      { status: 500 }
    );
  }
}