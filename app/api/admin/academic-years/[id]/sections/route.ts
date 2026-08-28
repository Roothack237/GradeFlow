import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
     * Get the sections for this academic year.
     *
     * This assumes your Section model has academicYearId.
     */
    const sections = await prisma.section.findMany({
      where: {
        academicYearId: id,
      },
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