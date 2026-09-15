import { NextResponse } from "next/server";
import { auth } from "@/auth";

import prisma from "@/lib/prisma";
import { buildTeacherAnalytics } from "@/lib/teacher-analytics";

/**
 * GET /api/teacher/analytics
 *
 * Real analytics for the signed-in teacher: class averages, subject
 * averages, pass rates, best and at-risk students, attendance trends and
 * mark trends — all computed from Prisma.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { teacher: true },
    });

    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Teacher account not found." },
        { status: 403 }
      );
    }

    const analytics = await buildTeacherAnalytics(user.teacher.id);

    if (!analytics) {
      return NextResponse.json(
        { error: "Teacher profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("TEACHER ANALYTICS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load analytics." },
      { status: 500 }
    );
  }
}
