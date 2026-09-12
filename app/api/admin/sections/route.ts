import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const sections = await prisma.section.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("GET SECTIONS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load sections. Please try again.",
      },
      { status: 500 }
    );
  }
}