import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, notFound, serverError } from "@/lib/http";
import prisma from "@/lib/prisma";

/** PATCH /api/admin/notifications/[id] — mark one notification read/unread. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (typeof body.isRead !== "boolean") {
      return badRequest("A boolean isRead value is required.");
    }

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) return notFound("Notification not found.");

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: body.isRead },
    });

    return NextResponse.json({
      message: body.isRead
        ? "Notification marked as read."
        : "Notification marked as unread.",
      notification: { id: updated.id, isRead: updated.isRead },
    });
  } catch (error) {
    return serverError("ADMIN NOTIFICATION UPDATE ERROR", error);
  }
}

/** DELETE /api/admin/notifications/[id] — removes a notification record. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, title: true, user: { select: { firstName: true, lastName: true } } },
    });

    if (!notification) return notFound("Notification not found.");

    await prisma.notification.delete({ where: { id } });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "NOTIFICATION_DELETED",
      entityType: "Notification",
      entityId: id,
      description: `Deleted notification "${notification.title}"`,
    });

    return NextResponse.json({ message: "Notification deleted." });
  } catch (error) {
    return serverError("ADMIN NOTIFICATION DELETE ERROR", error);
  }
}
