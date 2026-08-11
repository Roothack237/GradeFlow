import { sendTeacherLoginCode } from "@/lib/mail";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateLoginCode } from "@/lib/auth-code";

const teacherSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must contain at least 2 characters"),

  lastName: z
    .string()
    .min(2, "Last name must contain at least 2 characters"),

  email: z
    .string()
    .email("Enter a valid email address"),

  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = teacherSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Invalid information.",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
    } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    const loginCode = generateLoginCode();

    const teacherId = `TCH-${Date.now()}`;
    const teacherCode = `TC-${Date.now()}`;

    const teacher = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        loginCode,
        role: "TEACHER",
        status: "ACTIVE",

        teacher: {
          create: {
            teacherId,
            teacherCode,
            firstName,
            fullName: `${firstName} ${lastName}`,
            loginCode,
            lastName,
            phone,
          },
        },
      },

      include: {
        teacher: true,
      },
    });
        await sendTeacherLoginCode(
        teacher.email,
        teacher.firstName,
        loginCode
        );
    return NextResponse.json(
      {
        message: "Teacher account created successfully.",

        teacher: {
           teacherId: teacher.teacher?.teacherId,
            teacherCode: teacher.teacher?.teacherCode,
            loginCode,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
        },

      },
      { status: 201 }
    );

  } catch (error) {
    console.error("CREATE TEACHER ERROR:", error);

    return NextResponse.json(
      {
        message:
          "Something went wrong while creating the teacher.",
      },
      { status: 500 }
    );
  }
}