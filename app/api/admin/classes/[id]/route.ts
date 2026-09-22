import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Classroom ID is required",
        },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.findUnique({
      where: {
        id,
      },
      include: {
        section: true,
        academicYear: true,
        students: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json(
        {
          success: false,
          error: "Classroom not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      classroom,
    });
  } catch (error) {
    console.error("LOAD CLASS STUDENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load class students",
        message:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}