import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [students, teachers, parents, classes] =
      await Promise.all([
        prisma.student.count(),
        prisma.teacher.count(),
        prisma.parent.count(),
        prisma.classroom.count(),
      ]);

    return NextResponse.json({
      students,
      teachers,
      parents,
      classes,
    });
  } catch (error) {
    console.error("DASHBOARD STATS API ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load dashboard statistics",
      },
      { status: 500 }
    );
  }
}