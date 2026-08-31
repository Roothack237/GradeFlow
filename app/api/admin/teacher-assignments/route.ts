import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all teacher assignments
export async function GET() {
  try {
    const assignments = await prisma.teacherAssignment.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        teacher: {
          select: {
            id: true,
            teacherId: true,
            firstName: true,
            lastName: true,
            fullName: true,
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
    });

    return NextResponse.json(assignments, {
      status: 200,
    });
  } catch (error) {
    console.error("GET TEACHER ASSIGNMENTS ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load teacher assignments",
      },
      { status: 500 }
    );
  }
}

// CREATE teacher assignments
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      teacherId,
      classroomId,
      subjectIds,
    } = body;

    // -----------------------------------------
    // Validate required fields
    // -----------------------------------------
    if (!teacherId || !classroomId) {
      return NextResponse.json(
        {
          error:
            "Teacher and classroom are required",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(subjectIds) ||
      subjectIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "At least one subject must be selected",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // Verify teacher
    // -----------------------------------------
    const teacher = await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        {
          error: "Teacher not found",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // Verify classroom
    // -----------------------------------------
    const classroom = await prisma.classroom.findUnique({
      where: {
        id: classroomId,
      },
      include: {
        section: true,
      },
    });

    if (!classroom) {
      return NextResponse.json(
        {
          error: "Classroom not found",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // Verify subjects
    // -----------------------------------------
    const subjects = await prisma.subject.findMany({
      where: {
        id: {
          in: subjectIds,
        },
      },
    });

    if (subjects.length !== subjectIds.length) {
      return NextResponse.json(
        {
          error:
            "One or more selected subjects were not found",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // Remove duplicate subject IDs
    // -----------------------------------------
    const uniqueSubjectIds = [
      ...new Set(subjectIds),
    ];

    // -----------------------------------------
    // Check existing assignments
    // -----------------------------------------
    const existingAssignments =
      await prisma.teacherAssignment.findMany({
        where: {
          teacherId,
          classroomId,
          subjectId: {
            in: uniqueSubjectIds,
          },
        },
        select: {
          subjectId: true,
        },
      });

    const existingSubjectIds =
      new Set(
        existingAssignments.map(
          (assignment) => assignment.subjectId
        )
      );

    const newSubjectIds =
      uniqueSubjectIds.filter(
        (id) => !existingSubjectIds.has(id)
      );

    // -----------------------------------------
    // Nothing new to assign
    // -----------------------------------------
    if (newSubjectIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "All selected subjects are already assigned to this teacher for this class",
        },
        { status: 409 }
      );
    }

    // -----------------------------------------
    // Create all assignments in one transaction
    // -----------------------------------------
    const assignments =
      await prisma.$transaction(
        newSubjectIds.map((subjectId) =>
          prisma.teacherAssignment.create({
            data: {
              teacherId,
              subjectId,
              classroomId,
              sectionId: classroom.sectionId,
            },

            include: {
              teacher: {
                select: {
                  id: true,
                  teacherId: true,
                  fullName: true,
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
          })
        )
      );

    return NextResponse.json(
      {
        message:
          "Teacher assignments created successfully",
        assignments,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "CREATE TEACHER ASSIGNMENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to create teacher assignments",
      },
      {
        status: 500,
      }
    );
  }
}

// DELETE a teacher assignment
export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          error: "Assignment ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const assignment =
      await prisma.teacherAssignment.findUnique({
        where: {
          id,
        },
      });

    if (!assignment) {
      return NextResponse.json(
        {
          error: "Assignment not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.teacherAssignment.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        message:
          "Teacher assignment removed successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "DELETE TEACHER ASSIGNMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to remove teacher assignment",
      },
      {
        status: 500,
      }
    );
  }
}
