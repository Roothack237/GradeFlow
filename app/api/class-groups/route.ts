
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { syncAllClassGroups } from "@/lib/class-groups";

export async function GET() {
  try {
    const session = await auth();

    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Make sure class groups and their members are synchronized
    await syncAllClassGroups();

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "User account is not active.",
        },
        { status: 403 }
      );
    }

    const where =
      user.role === "ADMIN"
        ? {}
        : {
            members: {
              some: {
                userId,
              },
            },
          };

    const groups = await prisma.classGroup.findMany({
      where,

      include: {
        classroom: {
          include: {
            section: true,
          },
        },

        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    /*
     * Return a clean frontend-friendly structure.
     *
     * The important part is that we explicitly create:
     *
     * memberCount
     * messageCount
     *
     * instead of forcing the frontend to understand Prisma's _count.
     */

    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      description:
        group.classroom?.section?.name || group.classroom?.name || null,

      classroom: {
        id: group.classroom.id,
        name: group.classroom.name,
      },

      section: group.classroom.section
        ? {
            id: group.classroom.section.id,
            name: group.classroom.section.name,
          }
        : null,

      memberCount: group._count.members,
      messageCount: group._count.messages,
    }));

    return NextResponse.json({
      success: true,
      groups: formattedGroups,
    });
  } catch (error) {
    console.error("GET /api/class-groups error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load class groups.",
      },
      { status: 500 }
    );
  }
}
