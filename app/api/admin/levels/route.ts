import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const levels = await prisma.level.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(levels);
  } catch (error) {
    console.error("GET LEVELS ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to load levels.",
      },
      { status: 500 }
    );
  }
}