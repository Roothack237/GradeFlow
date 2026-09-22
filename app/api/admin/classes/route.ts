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
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      classes,
    });
  } catch (error) {
    console.error("LOAD CLASSES ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load classes",
      },
      {
        status: 500,
      }
    );
  }
}