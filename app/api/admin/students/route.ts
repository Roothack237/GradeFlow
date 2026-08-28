import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

// =========================================================
// GENERATE MATRICULE
// =========================================================

function generateMatricule() {
  const year = new Date().getFullYear();

  const random = Math.floor(
    100000 + Math.random() * 900000
  );

  return `GF-${year}-${random}`;
}

// =========================================================
// GET ALL STUDENTS
// =========================================================

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        classroom: {
          include: {
            section: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedStudents = students.map((student) => ({
      id: student.id,

      firstName: student.firstName,
      lastName: student.lastName,

      fullName: `${student.firstName} ${student.lastName}`.trim(),

      gender: student.gender,
      dateOfBirth: student.dateOfBirth,

      matricule: student.matricule,

      classroomId: student.classroomId,

      className: student.classroom?.name ?? null,

      sectionName: student.classroom?.section?.name ?? null,

      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    }));

    return NextResponse.json({
      students: formattedStudents,
    });
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch students.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// CREATE STUDENT
// =========================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      classroomId,
    } = body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !firstName ||
      !lastName ||
      !gender ||
      !dateOfBirth ||
      !classroomId
    ) {
      return NextResponse.json(
        {
          error:
            "First name, last name, gender, date of birth and class are required.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CHECK CLASSROOM
    // =====================================================

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
          error: "Selected classroom does not exist.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // GENERATE UNIQUE MATRICULE
    // =====================================================

    let matricule = generateMatricule();

    let existingStudent =
      await prisma.student.findUnique({
        where: {
          matricule,
        },
      });

    while (existingStudent) {
      matricule = generateMatricule();

      existingStudent =
        await prisma.student.findUnique({
          where: {
            matricule,
          },
        });
    }

    // =====================================================
    // CREATE STUDENT
    // =====================================================

    const student = await prisma.student.create({
      data: {
        matricule,

        firstName: firstName.trim(),

        lastName: lastName.trim(),

        gender,

        dateOfBirth: new Date(dateOfBirth),

        classroomId,
      },

      include: {
        classroom: {
          include: {
            section: true,
          },
        },
      },
    });

    // =====================================================
    // RETURN CREATED STUDENT
    // =====================================================

    return NextResponse.json(
      {
        message: "Student created successfully.",

        student: {
          id: student.id,

          firstName: student.firstName,

          lastName: student.lastName,

          fullName:
            `${student.firstName} ${student.lastName}`.trim(),

          gender: student.gender,

          dateOfBirth: student.dateOfBirth,

          matricule: student.matricule,

          classroomId: student.classroomId,

          className:
            student.classroom?.name ?? null,

          sectionName:
            student.classroom?.section?.name ?? null,

          createdAt: student.createdAt,

          updatedAt: student.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create student.",

        details:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}