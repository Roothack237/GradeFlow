import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const session = await auth();

    console.log("========== ADMIN AVAILABILITY ==========");
    console.log("SESSION:", session);
    console.log("USER:", session?.user);
    console.log("USER ID:", session?.user?.id);
    console.log("USER ROLE:", session?.user?.role);
    console.log("=======================================");

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          error: "Access denied",
          currentRole: session.user.role ?? null,
          expectedRole: Role.ADMIN,
        },
        { status: 403 }
      );
    }

    const availability =
      await prisma.teacherAvailability.findMany({
        include: {
          teacher: {
            select: {
              id: true,
              teacherId: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: [
          {
            status: "asc",
          },
          {
            day: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      });

    return NextResponse.json(availability);
  } catch (error) {
    console.error(
      "ADMIN AVAILABILITY GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load teacher availability",
      },
      { status: 500 }
    );
  }
}