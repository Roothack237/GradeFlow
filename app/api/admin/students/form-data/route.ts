import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const classrooms = await prisma.classroom.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      classrooms,
    });
  } catch (error) {
    console.error("FORM DATA ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load classrooms.",
      },
      { status: 500 }
    );
  }
}