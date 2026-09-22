import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const academicYear =
      req.nextUrl.searchParams.get("academicYear") || "2026/2027";

    const classes = await prisma.classroom.findMany({
      where: {
        academicYear: {
          name: academicYear,
        },
      },
      include: {
        section: true,
        academicYear: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: [
        {
          section: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      classes,
    });
  } catch (error) {
    console.error("LOAD ATTENDANCE CLASSES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load attendance classes",
        message:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}