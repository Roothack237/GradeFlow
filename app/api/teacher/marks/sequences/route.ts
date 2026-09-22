import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // --------------------------------------------------
    // 1. CHECK AUTHENTICATION
    // --------------------------------------------------
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. CHECK TEACHER ROLE
    // --------------------------------------------------
    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 3. GET termId FROM URL
    // --------------------------------------------------
    const { searchParams } = new URL(request.url);

    const termId = searchParams.get("termId");

    if (!termId) {
      return NextResponse.json(
        {
          error: "termId is required",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. FIND THE TERM
    // --------------------------------------------------
    const term = await prisma.term.findUnique({
      where: {
        id: termId,
      },
    });

    if (!term) {
      return NextResponse.json(
        {
          error: "Term not found",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 5. GET SEQUENCES BELONGING TO THIS TERM
    // --------------------------------------------------
    const sequences = await prisma.sequence.findMany({
      where: {
        termId: termId,
      },
      orderBy: {
        order: "asc",
      },
    });

    // --------------------------------------------------
    // 6. RETURN SEQUENCES
    // --------------------------------------------------
    return NextResponse.json({
      success: true,
      sequences,
    });
  } catch (error) {
    console.error(
      "GET /api/teacher/marks/sequences ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load sequences",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}