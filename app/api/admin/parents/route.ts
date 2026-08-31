import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendParentLoginCode } from "@/lib/email";

// ============================================================
// GENERATE PARENT ID
// ============================================================

function generateParentId() {
  return `PAR-${Math.floor(100000 + Math.random() * 900000)}`;
}

// ============================================================
// GENERATE 4-DIGIT LOGIN CODE
// ============================================================

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ============================================================
// GET ALL PARENTS
// ============================================================

export async function GET() {
  try {
    const parents = await prisma.parent.findMany({
      include: {
        children: true,
      },
      orderBy: {
        fullName: "asc",
      },
    });

    return NextResponse.json({ parents });
  } catch (error) {
    console.error("FETCH PARENTS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch parents." },
      { status: 500 }
    );
  }
}

// ============================================================
// CREATE PARENT
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      dateOfBirth,
      children,
    } = body;

    // ========================================================
    // VALIDATE PARENT INFORMATION
    // ========================================================

    if (!firstName?.trim()) {
      return NextResponse.json(
        { error: "First name is required." },
        { status: 400 }
      );
    }

    if (!lastName?.trim()) {
      return NextResponse.json(
        { error: "Last name is required." },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(children) || children.length === 0) {
      return NextResponse.json(
        { error: "At least one child is required." },
        { status: 400 }
      );
    }

    // ========================================================
    // CHECK IF EMAIL ALREADY EXISTS
    // ========================================================

    const parentEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: parentEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    // ========================================================
    // VERIFY CHILDREN
    // ========================================================

    const studentIds: string[] = [];

    for (const child of children) {
      if (!child.studentId) {
        return NextResponse.json(
          {
            error: `Please verify child "${
              child.name || "Unknown"
            }" before creating the parent.`,
          },
          { status: 400 }
        );
      }

      const student = await prisma.student.findUnique({
        where: {
          id: child.studentId,
        },
      });

      if (!student) {
        return NextResponse.json(
          {
            error: `Student "${
              child.name || "Unknown"
            }" was not found.`,
          },
          { status: 400 }
        );
      }

      // Student already belongs to another parent
      if (student.parentId) {
        return NextResponse.json(
          {
            error: `Student "${student.firstName} ${student.lastName}" is already assigned to a parent.`,
          },
          { status: 400 }
        );
      }

      studentIds.push(student.id);
    }

    // ========================================================
    // PREVENT DUPLICATE CHILDREN
    // ========================================================

    const uniqueStudentIds = [...new Set(studentIds)];

    if (uniqueStudentIds.length !== studentIds.length) {
      return NextResponse.json(
        {
          error:
            "The same child cannot be assigned more than once.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // GENERATE PARENT CREDENTIALS
    // ========================================================

    const parentId = generateParentId();
    const pin = generatePin();

    console.log("Creating parent:", {
      parentId,
      email: parentEmail,
    });

    // ========================================================
    // CREATE USER + PARENT + ASSIGN CHILDREN
    // ========================================================

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: parentEmail,
          role: "PARENT",
          loginCode: pin,
          phone: phone?.trim() || null,
          status: "ACTIVE",
        },
      });

      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          parentId,
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          lastName: lastName.trim(),
          email: parentEmail,
          phone: phone?.trim() || null,
          gender: gender || null,
          dateOfBirth: dateOfBirth
            ? new Date(dateOfBirth)
            : null,
        },
      });

      // Assign children to the parent
      await tx.student.updateMany({
        where: {
          id: {
            in: uniqueStudentIds,
          },
        },
        data: {
          parentId: parent.id,
        },
      });

      return {
        user,
        parent,
      };
    });

    // ========================================================
    // SEND LOGIN CODE TO PARENT'S REAL EMAIL
    // ========================================================

    try {
      console.log(
        `Sending login code to ${result.parent.email}...`
      );

      await sendParentLoginCode(
        result.parent.email,
        result.parent.fullName,
        result.parent.parentId,
        pin
      );

      console.log(
        `Parent login code successfully sent to ${result.parent.email}`
      );
    } catch (emailError) {
      console.error(
        "PARENT EMAIL FAILED:",
        emailError
      );

      // Account was created successfully,
      // but email delivery failed.
      return NextResponse.json(
        {
          success: true,
          warning:
            "Parent account was created, but the login code email could not be sent.",
          parent: result.parent,
        },
        { status: 201 }
      );
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Parent account created successfully. The login code has been sent to the parent's email.",
        parent: result.parent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PARENT ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create parent.",
      },
      { status: 500 }
    );
  }
}