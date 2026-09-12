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
        teacherId: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        userId: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      teacher,
    });
  } catch (error) {
    console.error("Teacher profile error:", error);

    return NextResponse.json(
      { error: "Failed to load teacher profile" },
      { status: 500 }
    );
  }
}