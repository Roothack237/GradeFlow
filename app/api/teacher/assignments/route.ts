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
    // LOAD ASSIGNMENTS
    // =========================================================
    const assignments =
      await prisma.teacherAssignment.findMany({
        where: {
          teacherId: teacher.id,
        },

        include: {
          section: {
            select: {
              id: true,
              name: true,
            },
          },

          classroom: {
            select: {
              id: true,
              name: true,

              students: {
                select: {
                  id: true,
                  matricule: true,
                  firstName: true,
                  lastName: true,
                  gender: true,
                },

                orderBy: [
                  {
                    lastName: "asc",
                  },
                  {
                    firstName: "asc",
                  },
                ],
              },
            },
          },

          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              coefficient: true,
            },
          },
        },

        orderBy: [
          {
            classroom: {
              name: "asc",
            },
          },
          {
            subject: {
              name: "asc",
            },
          },
        ],
      });

    // =========================================================
    // RESPONSE
    // =========================================================
    return NextResponse.json(
      {
        success: true,
        assignments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET TEACHER ASSIGNMENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load teaching assignments",
      },
      { status: 500 }
    );
  }
}