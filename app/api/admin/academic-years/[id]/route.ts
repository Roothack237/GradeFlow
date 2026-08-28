import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    // Get academic year
    // ---------------------------------------------------------

    const academicYear =
      await prisma.academicYear.findUnique({
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

    // ---------------------------------------------------------
    // Get the two school sections
    // ---------------------------------------------------------

    const sections =
      await prisma.section.findMany({
        orderBy: {
          name: "asc",
        },
      });

    // ---------------------------------------------------------
    // Return data
    // ---------------------------------------------------------

    return NextResponse.json({
      academicYear,
      sections,
    });
  } catch (error) {
    console.error(
      "GET ACADEMIC YEAR ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load academic year.",
      },
      { status: 500 }
    );
  }
}