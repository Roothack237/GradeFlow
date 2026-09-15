import { NextResponse } from "next/server";
import { auth } from "@/auth";

import prisma from "@/lib/prisma";

/**
 * GET /api/teacher/notifications
 * The signed-in teacher's real notifications.
 *
 * PATCH  /api/teacher/notifications   Body: { id } | { markAll: true }
 * DELETE /api/teacher/notifications   Body: { id } | { clearAll: true }
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Teacher access required." },
        { status: 403 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        sender: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.isRead,
        actionUrl: notification.actionUrl,
        sender: notification.sender
          ? `${notification.sender.firstName} ${notification.sender.lastName}`.trim()
          : null,
        createdAt: notification.createdAt,
      })),
      unread: notifications.filter((notification) => !notification.isRead).length,
    });
  } catch (error) {
    console.error("TEACHER NOTIFICATIONS GET ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (body?.markAll === true) {
      const result = await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, updated: result.count });
    }

    if (typeof body?.id === "string") {
      const notification = await prisma.notification.findFirst({
        where: { id: body.id, userId: session.user.id },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found." },
          { status: 404 }
        );
      }

      await prisma.notification.update({
        where: { id: notification.id },
        data: { isRead: !notification.isRead },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Provide a notification id or markAll." },
      { status: 400 }
    );
  } catch (error) {
    console.error("TEACHER NOTIFICATIONS PATCH ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update the notification." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (body?.clearAll === true) {
      const result = await prisma.notification.updateMany({
        where: { userId: session.user.id, archivedAt: null },
        data: { archivedAt: new Date() },
      });

      return NextResponse.json({ success: true, archived: result.count });
    }

    if (typeof body?.id === "string") {
      const notification = await prisma.notification.findFirst({
        where: { id: body.id, userId: session.user.id },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found." },
          { status: 404 }
        );
      }

      await prisma.notification.update({
        where: { id: notification.id },
        data: { archivedAt: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Provide a notification id or clearAll." },
      { status: 400 }
    );
  } catch (error) {
    console.error("TEACHER NOTIFICATIONS DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete the notification." },
      { status: 500 }
    );
  }
}
