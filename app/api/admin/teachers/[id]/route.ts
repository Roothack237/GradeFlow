import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// =====================================================
// GET ONE TEACHER
// =====================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const teacher = await prisma.teacher.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        teacherId: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        loginCode: true,

        assignments: {
          select: {
            id: true,

            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },

            classroom: {
              select: {
                id: true,
                name: true,

                section: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          error: "Teacher not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        teacher,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET TEACHER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch teacher",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// UPDATE TEACHER
// =====================================================

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or empty JSON request body",
        },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      dateOfBirth,
      teacherId,
      assignments = [],
    } = body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "First name, last name and email are required",
        },
        { status: 400 }
      );
    }

    const cleanFirstName = String(firstName).trim();
    const cleanLastName = String(lastName).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (!cleanFirstName || !cleanLastName || !cleanEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "First name, last name and email cannot be empty",
        },
        { status: 400 }
      );
    }

    // =================================================
    // CHECK TEACHER
    // =================================================

    const existingTeacher = await prisma.teacher.findUnique({
      where: {
        id,
      },
    });

    if (!existingTeacher) {
      return NextResponse.json(
        {
          success: false,
          error: "Teacher not found",
        },
        { status: 404 }
      );
    }

    // =================================================
    // CHECK EMAIL
    // =================================================

    const existingUser = await prisma.user.findUnique({
      where: {
        email: cleanEmail,
      },
    });

    if (
      existingUser &&
      existingUser.id !== existingTeacher.userId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A user with this email already exists",
        },
        { status: 409 }
      );
    }

    // =================================================
    // UPDATE TEACHER + USER + ASSIGNMENTS
    // =================================================

    const result = await prisma.$transaction(async (tx) => {
      // -----------------------------------------------
      // UPDATE USER
      // -----------------------------------------------

      await tx.user.update({
        where: {
          id: existingTeacher.userId,
        },
        data: {
          firstName: cleanFirstName,
          lastName: cleanLastName,
          email: cleanEmail,
          phone: phone ? String(phone).trim() : null,
        },
      });

      // -----------------------------------------------
      // UPDATE TEACHER
      // -----------------------------------------------

      const teacher = await tx.teacher.update({
        where: {
          id,
        },
        data: {
          firstName: cleanFirstName,
          lastName: cleanLastName,
          fullName: `${cleanFirstName} ${cleanLastName}`,
          email: cleanEmail,
          phone: phone ? String(phone).trim() : null,
          gender: gender ? String(gender).trim() : null,
          dateOfBirth: dateOfBirth
            ? new Date(dateOfBirth)
            : null,
          ...(teacherId
            ? {
                teacherId: String(teacherId).trim(),
              }
            : {}),
        },
        select: {
          id: true,
          teacherId: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          phone: true,
          gender: true,
          dateOfBirth: true,
          loginCode: true,
        },
      });

      // -----------------------------------------------
      // DELETE OLD ASSIGNMENTS
      // -----------------------------------------------

      await tx.teacherAssignment.deleteMany({
        where: {
          teacherId: teacher.id,
        },
      });

      // -----------------------------------------------
      // CREATE NEW ASSIGNMENTS
      // -----------------------------------------------

      if (Array.isArray(assignments) && assignments.length > 0) {
        await tx.teacherAssignment.createMany({
          data: assignments.map((assignment: any) => ({
            teacherId: teacher.id,
            sectionId: assignment.sectionId,
            classroomId: assignment.classroomId,
            subjectId: assignment.subjectId,
          })),
          skipDuplicates: true,
        });
      }

      return teacher;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Teacher updated successfully",
        teacher: result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("UPDATE TEACHER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to update teacher",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE TEACHER
// =====================================================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const teacher = await prisma.teacher.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          error: "Teacher not found",
        },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Delete teacher.
      // TeacherAssignment records are deleted automatically
      // because of onDelete: Cascade in your Prisma schema.
      await tx.teacher.delete({
        where: {
          id,
        },
      });

      // Delete associated user.
      await tx.user.delete({
        where: {
          id: teacher.userId,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Teacher deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE TEACHER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to delete teacher",
      },
      { status: 500 }
    );
  }
}