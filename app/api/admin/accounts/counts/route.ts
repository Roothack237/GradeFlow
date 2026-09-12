import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const [teachers, parents, students] =
      await Promise.all([
        prisma.teacher.count(),
        prisma.parent.count(),
        prisma.student.count(),
      ]);

    return NextResponse.json(
      {
        teachers,
        parents,
        students,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET ACCOUNT COUNTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load account counts",
      },
      {
        status: 500,
      }
    );
  }
}