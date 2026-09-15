import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Teacher access only" },
        { status: 403 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        userId: session.user.id,
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
        userId: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      teacher,
    });
  } catch (error) {
    console.error("Teacher profile error:", error);

    return NextResponse.json(
      { error: "Failed to load teacher profile" },
      { status: 500 }
    );
  }
}
/**
 * PATCH /api/teacher/profile
 * Body: { firstName?, lastName?, email?, phone?, gender?, dateOfBirth? }
 *
 * Updates the teacher's own profile. teacherId and login code are managed
 * by the administration and cannot be changed here.
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { teacher: true },
    });

    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Teacher access only" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const firstName =
      typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName =
      typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone =
      typeof body?.phone === "string" ? body.phone.trim() : null;
    const gender =
      typeof body?.gender === "string" && body.gender.trim()
        ? body.gender.trim()
        : null;
    const dateOfBirth =
      typeof body?.dateOfBirth === "string" && body.dateOfBirth
        ? new Date(`${body.dateOfBirth}T00:00:00`)
        : null;

    if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
      return NextResponse.json(
        { error: "Invalid date of birth." },
        { status: 400 }
      );
    }

    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json(
          { error: "This email is already used by another account." },
          { status: 409 }
        );
      }
    }

    const teacher = await prisma.teacher.update({
      where: { id: user.teacher.id },
      data: {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(firstName || lastName
          ? {
              fullName: `${firstName || user.teacher.firstName} ${
                lastName || user.teacher.lastName
              }`.trim(),
            }
          : {}),
        ...(email ? { email } : {}),
        ...(phone !== null ? { phone } : {}),
        ...(gender !== null ? { gender } : {}),
        ...(dateOfBirth ? { dateOfBirth } : {}),
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
      },
    });

    if (email && email !== user.email) {
      await prisma.user.update({
        where: { id: user.id },
        data: { email },
      });
    }

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error("Teacher profile update error:", error);

    return NextResponse.json(
      { error: "Failed to update teacher profile" },
      { status: 500 }
    );
  }
}
