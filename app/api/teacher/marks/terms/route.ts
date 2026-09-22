import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // =========================================================
    // AUTHENTICATION
    // =========================================================
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

    // =========================================================
    // FIND TEACHER
    // =========================================================
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

    // =========================================================
    // LOAD TERMS
    // =========================================================
    const terms = await prisma.term.findMany({
      orderBy: {
        order: "asc",
      },

      include: {
        sequences: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    // =========================================================
    // RESPONSE
    // =========================================================
    return NextResponse.json(
      {
        success: true,
        terms,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET TEACHER TERMS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load terms",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}