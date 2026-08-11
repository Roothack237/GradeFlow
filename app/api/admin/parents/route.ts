import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateParentId() {
  return `PAR-${Date.now()}`;
}

function generateLoginCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "GF-";

  for (let i = 0; i < 8; i++) {
    code += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return code;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      childName,
      childClass,
    } = body;

    // Check required parent information
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        {
          error: "First name, last name and email are required.",
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // Find child if child information was provided
    let student = null;

    if (childName) {
      const nameParts = childName.trim().split(/\s+/);

      const firstChildName = nameParts[0];
      const lastChildName = nameParts.slice(1).join(" ");

      student = await prisma.student.findFirst({
        where: {
          firstName: {
            equals: firstChildName,
            mode: "insensitive",
          },
          lastName: {
            equals: lastChildName,
            mode: "insensitive",
          },
          parentId: null,
        },
      });

      if (!student) {
        return NextResponse.json(
          {
            error:
              "The child could not be found or is already assigned to a parent.",
          },
          { status: 404 }
        );
      }
    }

    // Generate unique credentials
    const parentId = generateParentId();
    const loginCode = generateLoginCode();

    // Create User + Parent together
    const parent = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        loginCode,
        role: "PARENT",
        status: "ACTIVE",

        parent: {
          create: {
            parentId,
            fullName: `${firstName} ${lastName}`,
            lastName,
            phone: phone || null,
          },
        },
      },

      include: {
        parent: true,
      },
    });

    // Assign child to the newly-created parent
    if (student && parent.parent) {
      await prisma.student.update({
        where: {
          id: student.id,
        },
        data: {
          parentId: parent.parent.id,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Parent account created successfully.",

        parent: {
          id: parent.parent?.id,
          parentId: parent.parent?.parentId,
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          loginCode: parent.loginCode,
          child: student
            ? {
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
                matricule: student.matricule,
              }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PARENT ERROR:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating the parent.",
      },
      { status: 500 }
    );
  }
}