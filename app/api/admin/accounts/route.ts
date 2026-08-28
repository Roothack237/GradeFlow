import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [teachers, parents, students] = await Promise.all([
      prisma.teacher.count(),
      prisma.parent.count(),
      prisma.student.count(),
    ]);

    return NextResponse.json({
      teachers,
      parents,
      students,
    });
  } catch (error) {
    console.error("GET ACCOUNT COUNTS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load account counts",
      },
      { status: 500 }
    );
  }
}