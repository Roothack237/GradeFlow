import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/parent/children
 * Returns the children linked to the signed-in parent.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        children: {
          include: {
            classroom: { include: { section: true } },
          },
          orderBy: { lastName: "asc" },
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
      children: parent.children.map((child) => ({
        id: child.id,
        matricule: child.matricule,
        firstName: child.firstName,
        lastName: child.lastName,
        fullName: `${child.firstName} ${child.lastName}`.trim(),
        gender: child.gender,
        dateOfBirth: child.dateOfBirth,
        status: child.status,
        classroomId: child.classroomId,
        className: child.classroom?.name ?? null,
        sectionName: child.classroom?.section?.name ?? null,
      })),
    });
  } catch (error) {
    console.error("PARENT CHILDREN ERROR:", error);

    return NextResponse.json(
      { message: "Failed to load children." },
      { status: 500 }
    );
  }
}
