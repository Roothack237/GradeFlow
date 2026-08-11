import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const classrooms = await prisma.classroom.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(classrooms);
  } catch (error) {
    console.error("GET CLASSROOMS ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to load classrooms.",
      },
      { status: 500 }
    );
  }
}