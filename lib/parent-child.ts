import { NextResponse } from "next/server";
import { auth } from "@/auth";

import prisma from "@/lib/prisma";

/**
 * Guard for parent endpoints that target one child: the student must be
 * linked to the signed-in parent. Prevents a parent from reading another
 * family's data by changing the URL.
 */
export async function requireParentChild(studentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true },
  });

  if (!user || user.role !== "PARENT") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Parent access required." },
        { status: 403 }
      ),
    };
  }

  if (user.status === "SUSPENDED") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "This parent account is suspended." },
        { status: 403 }
      ),
    };
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: user.id },
    select: { id: true, fullName: true },
  });

  if (!parent) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Parent profile not found." },
        { status: 404 }
      ),
    };
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, parentId: parent.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      matricule: true,
      classroomId: true,
      classroom: {
        select: {
          id: true,
          name: true,
          section: { select: { name: true } },
          academicYear: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!student) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Child not found or does not belong to this parent." },
        { status: 404 }
      ),
    };
  }

  return { ok: true as const, parent, student };
}
