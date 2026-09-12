
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Make sure the user is logged in
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only parents can access this endpoint
    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find the parent profile belonging to the logged-in User
    const parent = await prisma.parent.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        fullName: true,
        lastName: true,
        gender: true,
      },
    });

    if (!parent) {
      return NextResponse.json(
        { message: "Parent profile not found" },
        { status: 404 }
      );
    }

    /*
     * IMPORTANT:
     * parentId must match the logged-in parent's Parent.id.
     *
     * This prevents a parent from changing:
     *
     * /parent/children/child-A
     *
     * to:
     *
     * /parent/children/child-B
     *
     * and viewing another parent's child.
     */
    const child = await prisma.student.findFirst({
      where: {
        id,
        parentId: parent.id,
      },
      include: {
        classroom: true,

        marks: {
          include: {
            subject: true,
            sequence: {
              include: {
                term: {
                  include: {
                    academicYear: true,
                  },
                },
              },
            },
          },
          orderBy: {
            subject: {
              name: "asc",
            },
          },
        },

        reportCards: {
          include: {
            term: {
              include: {
                academicYear: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        attendances: {
          include: {
            subject: true,
            sequence: {
              include: {
                term: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!child) {
      return NextResponse.json(
        { message: "Child not found or does not belong to this parent" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      parent: {
        id: parent.id,
        fullName: parent.fullName,
        lastName: parent.lastName,
        gender: parent.gender,
      },

      child: {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        fullName: `${child.firstName} ${child.lastName}`,
        matricule: child.matricule,
        gender: child.gender,
        dateOfBirth: child.dateOfBirth,
        status: child.status,

        classroom: child.classroom
          ? {
              id: child.classroom.id,
              name: child.classroom.name,
              sectionId: child.classroom.sectionId,
            }
          : null,

        marks: child.marks,
        reportCards: child.reportCards,
        attendances: child.attendances,
      },
    });
  } catch (error) {
    console.error("CHILD RESULTS ERROR:", error);

    return NextResponse.json(
      { message: "Failed to load child results" },
      { status: 500 }
    );
  }
}
