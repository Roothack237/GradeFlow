import { NextResponse } from "next/server";
import { auth } from "@/auth";
import  prisma  from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user || user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Teacher account not found" },
        { status: 403 }
      );
    }

    const terms = await prisma.term.findMany({
      orderBy: {
        order: "asc",
      },
      include: {
        sequences: {
          orderBy: {
            order: "asc",
          },
        },
        academicYear: true,
      },
    });

    return NextResponse.json({
      terms: terms.map((term) => ({
        id: term.id,
        name: term.name,
        order: term.order,

        academicYear: term.academicYear
          ? {
              id: term.academicYear.id,
              name: term.academicYear.name,
            }
          : null,

        sequences: term.sequences.map((sequence) => ({
          id: sequence.id,
          name: sequence.name,
          order: sequence.order,
        })),
      })),
    });
  } catch (error) {
    console.error("GET /api/teacher/terms error:", error);

    return NextResponse.json(
      {
        error: "Failed to load terms",
      },
      { status: 500 }
    );
  }
}