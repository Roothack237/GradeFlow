import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Teacher access only" },
        { status: 403 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacher.id,
      },
      include: {
        section: {
          select: {
            id: true,
            name: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            coefficient: true,
          },
        },
      },
      orderBy: [
        {
          classroom: {
            name: "asc",
          },
        },
        {
          subject: {
            name: "asc",
          },
        },
      ],
    });

    return NextResponse.json({
      assignments,
    });
  } catch (error) {
    console.error("Teacher assignments error:", error);

    return NextResponse.json(
      { error: "Failed to load teaching assignments" },
      { status: 500 }
    );
  }
}