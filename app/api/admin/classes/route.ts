import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const classes = await prisma.classroom.findMany({
      include: {
        section: true,

        _count: {
          select: {
            students: true,
          },
        },

        assignments: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                coefficient: true,
              },
            },

            teacher: {
              select: {
                id: true,
                teacherId: true,
                firstName: true,
                lastName: true,
                fullName: true,
              },
            },
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      classes,
    });
  } catch (error: unknown) {
    console.error("GET CLASSES ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load classes",
      },
      { status: 500 }
    );
  }
}