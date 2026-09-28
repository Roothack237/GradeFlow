
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { canAccessClassGroup } from "@/lib/class-groups";

type RouteContext = {
  params: Promise<{
    groupId: string;
  }>;
};

// ======================================================
// GET CLASS GROUP
// ======================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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

    // IMPORTANT:
    // The folder is [groupId], so we must use groupId here.
    const { groupId } = await context.params;

    if (!groupId) {
      return NextResponse.json(
        {
          success: false,
          message: "Class group ID is required.",
        },
        { status: 400 }
      );
    }

    // Check whether the logged-in user can access this group
    const hasAccess = await canAccessClassGroup(
      userId,
      groupId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have access to this class group.",
        },
        { status: 403 }
      );
    }

    // Get the class group
    const group = await prisma.classGroup.findUnique({
      where: {
        id: groupId,
      },

      include: {
        classroom: {
          include: {
            section: true,
          },
        },

        // Get group members and their user information
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                image: true,
              },
            },
          },

          orderBy: {
            user: {
              firstName: "asc",
            },
          },
        },

        // Get all messages and the sender information
        messages: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                image: true,
              },
            },
          },

          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        {
          success: false,
          message: "Class group not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // FORMAT MEMBERS
    // ==================================================

    const members = group.members.map((member) => {
      const firstName = member.user.firstName || "";
      const lastName = member.user.lastName || "";

      const name =
        `${firstName} ${lastName}`.trim() || "Unknown User";

      return {
        id: member.user.id,
        name,
        role: member.user.role,
        image: member.user.image,
      };
    });

    // ==================================================
    // FORMAT MESSAGES
    // ==================================================

    const messages = group.messages.map((message) => {
      const firstName = message.user.firstName || "";
      const lastName = message.user.lastName || "";

      const senderName =
        `${firstName} ${lastName}`.trim() || "Unknown User";

      return {
        id: message.id,
        message: message.message,
        createdAt: message.createdAt,

        sender: {
          id: message.user.id,
          name: senderName,
          role: message.user.role,
          image: message.user.image,
        },
      };
    });

    // ==================================================
    // RETURN GROUP
    // ==================================================

    return NextResponse.json({
      success: true,

      group: {
        id: group.id,
        name: group.name,

        description:
          group.classroom?.section?.name ||
          group.classroom?.name ||
          null,

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

        memberCount: members.length,
        messageCount: messages.length,

        members,
        messages,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/class-groups/[groupId] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load class group.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// POST MESSAGE
// ======================================================

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
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

    // IMPORTANT:
    // The folder is [groupId].
    const { groupId } = await context.params;

    if (!groupId) {
      return NextResponse.json(
        {
          success: false,
          message: "Class group ID is required.",
        },
        { status: 400 }
      );
    }

    // Check access
    const hasAccess = await canAccessClassGroup(
      userId,
      groupId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have access to this class group.",
        },
        { status: 403 }
      );
    }

    // Read request body
    const body = await request.json();

    const messageText =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!messageText) {
      return NextResponse.json(
        {
          success: false,
          message: "Message cannot be empty.",
        },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.classGroupMessage.create({
      data: {
        groupId,
        userId,
        message: messageText,
      },

      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            image: true,
          },
        },
      },
    });

    // ==================================================
    // FORMAT SENDER
    // ==================================================

    const firstName = message.user.firstName || "";
    const lastName = message.user.lastName || "";

    const senderName =
      `${firstName} ${lastName}`.trim() || "Unknown User";

    return NextResponse.json({
      success: true,

      message: {
        id: message.id,
        message: message.message,
        createdAt: message.createdAt,

        sender: {
          id: message.user.id,
          name: senderName,
          role: message.user.role,
          image: message.user.image,
        },
      },
    });
  } catch (error) {
    console.error(
      "POST /api/class-groups/[groupId] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send message.",
      },
      { status: 500 }
    );
  }
}
