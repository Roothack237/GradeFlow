import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// =========================================================
// UPDATE STUDENT
// =========================================================
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      classroomId,
    } = body;

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!firstName || !lastName) {
      return NextResponse.json(
        {
          error: "First name and last name are required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // CHECK STUDENT
    // -----------------------------------------------------

    const existingStudent = await prisma.student.findUnique({
      where: {
        id,
      },
    });

    if (!existingStudent) {
      return NextResponse.json(
        {
          error: "Student not found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------------------
    // CHECK CLASSROOM IF PROVIDED
    // -----------------------------------------------------

    if (classroomId) {
      const classroom = await prisma.classroom.findUnique({
        where: {
          id: classroomId,
        },
      });

      if (!classroom) {
        return NextResponse.json(
          {
            error: "Selected classroom does not exist.",
          },
          { status: 400 }
        );
      }
    }

    // -----------------------------------------------------
    // UPDATE STUDENT
    // -----------------------------------------------------

    const student = await prisma.student.update({
      where: {
        id,
      },

      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),

        ...(gender
          ? {
              gender,
            }
          : {}),

        ...(dateOfBirth
          ? {
              dateOfBirth: new Date(dateOfBirth),
            }
          : {}),

        ...(classroomId
          ? {
              classroomId,
            }
          : {}),
      },

      include: {
        classroom: {
          include: {
            section: true,
          },
        },
      },
    });

    // -----------------------------------------------------
    // SUCCESS
    // -----------------------------------------------------

    return NextResponse.json(
      {
        message: "Student updated successfully.",
        student,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE STUDENT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to update student.",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE STUDENT
// =========================================================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // -----------------------------------------------------
    // CHECK STUDENT
    // -----------------------------------------------------

    const existingStudent = await prisma.student.findUnique({
      where: {
        id,
      },
    });

    if (!existingStudent) {
      return NextResponse.json(
        {
          error: "Student not found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------------------
    // DELETE STUDENT
    // -----------------------------------------------------

    await prisma.student.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        message: "Student deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE STUDENT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to delete student.",
      },
      { status: 500 }
    );
  }
}