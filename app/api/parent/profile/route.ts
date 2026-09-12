import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    const parent = await prisma.parent.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        children: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            gender: true,
            classroom: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { message: "Parent profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      parent: {
        id: parent.id,
        fullName: parent.fullName,
        gender: parent.gender || "",
        email: parent.email || "",
        phone: parent.phone || "",
        image: null,
        children: parent.children,
      },
    });
  } catch (error) {
    console.error("PARENT PROFILE GET ERROR:", error);

    return NextResponse.json(
      { message: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const fullName = body.fullName?.trim();
    const gender = body.gender?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim();

    if (!fullName) {
      return NextResponse.json(
        { message: "Full name is required" },
        { status: 400 }
      );
    }

    if (!gender) {
      return NextResponse.json(
        { message: "Gender is required" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const parent = await prisma.parent.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!parent) {
      return NextResponse.json(
        { message: "Parent profile not found" },
        { status: 404 }
      );
    }

    // Check whether another user already uses this email
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: session.user.id,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "This email is already being used by another account." },
        { status: 409 }
      );
    }

    // Update Parent and User together
    const updatedParent = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          firstName: fullName.split(" ")[0],
          lastName: fullName.split(" ").slice(1).join(" "),
          email,
        },
      });

      return tx.parent.update({
        where: {
          id: parent.id,
        },
        data: {
          fullName,
          gender,
          email,
          phone: phone || null,
        },
        include: {
          children: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              matricule: true,
              gender: true,
              classroom: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json({
  message: "Profile updated successfully",
  parent: {
    id: updatedParent.id,
    fullName: updatedParent.fullName,
    gender: updatedParent.gender || "",
    email: updatedParent.email || "",
    phone: updatedParent.phone || "",
    image: updatedParent.image || null,
    children: updatedParent.children,
  },
});
  } catch (error) {
    console.error("PARENT PROFILE PUT ERROR:", error);

    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}