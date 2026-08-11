import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  credential: z.string().min(1, "Password or login code is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Please enter your email and password/login code.",
        },
        { status: 400 }
      );
    }

    const { email, credential } = result.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid email or password/login code.",
        },
        { status: 401 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          message:
            "Your account has been suspended. Please contact the school administrator.",
        },
        { status: 403 }
      );
    }

    let validCredential = false;

    // ADMIN → password
    if (user.role === "ADMIN") {
      if (!user.passwordHash) {
        return NextResponse.json(
          {
            message: "Admin account is not configured correctly.",
          },
          { status: 500 }
        );
      }

      validCredential = await bcrypt.compare(
        credential,
        user.passwordHash
      );
    }

    // TEACHER / PARENT → login code
    else {
      validCredential = user.loginCode === credential;
    }

    if (!validCredential) {
      return NextResponse.json(
        {
          message: "Invalid email or password/login code.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Login successful.",

      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        message: "Something went wrong while logging in.",
      },
      { status: 500 }
    );
  }
}