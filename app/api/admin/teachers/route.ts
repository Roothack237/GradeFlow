import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function generateTeacherId() {
  return `TCH${Date.now().toString().slice(-6)}`;
}

function generateLoginCode() {
  return `TCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: {
        fullName: "asc",
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

    return NextResponse.json(
      {
        success: true,
        teachers,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET TEACHERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch teachers",
        teachers: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // ---------------------------------------
    // Read request body
    // ---------------------------------------
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

    console.log("CREATE TEACHER REQUEST:", body);

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

    // ---------------------------------------
    // Validate required fields
    // ---------------------------------------
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

    // ---------------------------------------
    // Check whether email already exists
    // ---------------------------------------
    const existingUser = await prisma.user.findUnique({
      where: {
        email: cleanEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "A user with this email already exists",
        },
        { status: 409 }
      );
    }

    // ---------------------------------------
    // Generate unique Teacher ID
    // ---------------------------------------
    let finalTeacherId = teacherId
      ? String(teacherId).trim()
      : generateTeacherId();

    let teacherIdExists = await prisma.teacher.findUnique({
      where: {
        teacherId: finalTeacherId,
      },
    });

    while (teacherIdExists) {
      finalTeacherId = generateTeacherId();

      teacherIdExists = await prisma.teacher.findUnique({
        where: {
          teacherId: finalTeacherId,
        },
      });
    }

    // ---------------------------------------
    // Generate unique Login Code
    // ---------------------------------------
    let loginCode = generateLoginCode();

    let loginCodeExists = await prisma.user.findUnique({
      where: {
        loginCode,
      },
    });

    while (loginCodeExists) {
      loginCode = generateLoginCode();

      loginCodeExists = await prisma.user.findUnique({
        where: {
          loginCode,
        },
      });
    }

    // ---------------------------------------
    // Full name
    // ---------------------------------------
    const fullName = `${cleanFirstName} ${cleanLastName}`;

    // ---------------------------------------
    // Create User + Teacher atomically
    // ---------------------------------------
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: cleanFirstName,
          lastName: cleanLastName,
          email: cleanEmail,

          loginCode,

          role: "TEACHER",

          status: "ACTIVE",

          phone: phone ? String(phone).trim() : null,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          firstName: cleanFirstName,
          lastName: cleanLastName,
          fullName,
          email: cleanEmail,
          gender: gender || null,
          
          dateOfBirth: dateOfBirth
            ? new Date(dateOfBirth)
            : null,

          phone: phone ? String(phone).trim() : null,
          teacherId: finalTeacherId,
          loginCode,

          userId: user.id,
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

      return {
        user,
        teacher,
      };
    });

    console.log(
      "TEACHER CREATED SUCCESSFULLY:",
      result.teacher
    );

    // ---------------------------------------
    // Always return JSON
    // ---------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Teacher created successfully",
        teacher: result.teacher,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST TEACHER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to create teacher",
      },
      { status: 500 }
    );
  }
}

