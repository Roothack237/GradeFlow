import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

/*
 * =========================================================
 * GET STUDENTS IN A TEACHER'S CLASS
 * =========================================================
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    /*
     * Check that this class exists.
     */
    const classroom = await prisma.classroom.findUnique({
      where: {
        id,
      },
      include: {
        students: {
          select: {
            id: true,
            fullName: true,
            matricule: true,
            gender: true,
            email: true,
          },
          orderBy: {
            fullName: "asc",
          },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    /*
     * Return the classroom and ALL students
     * registered in it.
     */
    return NextResponse.json({
      classroom: {
        id: classroom.id,
        name: classroom.name,
      },
      students: classroom.students,
      totalStudents: classroom.students.length,
    });
  } catch (error) {
    console.error(
      "GET TEACHER CLASS STUDENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load students",
      },
      { status: 500 }
    );
  }
}