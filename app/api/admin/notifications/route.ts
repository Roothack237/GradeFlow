import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, pagination, serverError, str } from "@/lib/http";
import {
  createManyNotifications,
  resolveAudience,
  type NotificationAudience,
  type NotificationTypeValue,
} from "@/lib/notifications";
import prisma from "@/lib/prisma";

const AUDIENCES: NotificationAudience[] = [
  "ALL",
  "ALL_TEACHERS",
  "ALL_PARENTS",
  "CLASS",
  "SELECTED_USERS",
];

const TYPES: NotificationTypeValue[] = [
  "INFO",
  "WARNING",
  "SUCCESS",
  "RESULT_PUBLISHED",
  "ATTENDANCE_ALERT",
  "MARK_UPDATE",
  "ANNOUNCEMENT",
  "REPORT_AVAILABLE",
  "SYSTEM",
];

/**
 * GET /api/admin/notifications
 * Every notification stored in the database, with filters and statistics.
 *
 * Query: ?search= &type= &audience= &isRead= &recipientRole= &page= &pageSize=
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const search = str(searchParams.get("search"));
    const type = str(searchParams.get("type")).toUpperCase();
    const audience = str(searchParams.get("audience")).toUpperCase();
    const isReadParam = str(searchParams.get("isRead")).toLowerCase();
    const recipientRole = str(searchParams.get("recipientRole")).toUpperCase();

    const where = {
      ...(type && TYPES.includes(type as NotificationTypeValue)
        ? { type: type as NotificationTypeValue }
        : {}),
      ...(audience ? { audience } : {}),
      ...(isReadParam === "true"
        ? { isRead: true }
        : isReadParam === "false"
          ? { isRead: false }
          : {}),
      ...(recipientRole ? { user: { role: recipientRole as never } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { message: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const { skip, take, page, pageSize } = pagination(searchParams, 20, 100);

    const [notifications, total, unread, typeGroups, audienceGroups] =
      await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            audience: true,
            isRead: true,
            actionUrl: true,
            relatedType: true,
            relatedId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                email: true,
              },
            },
            sender: { select: { firstName: true, lastName: true } },
          },
        }),

        prisma.notification.count({ where }),
        prisma.notification.count({ where: { ...where, isRead: false } }),

        prisma.notification.groupBy({
          by: ["type"],
          _count: { _all: true },
        }),

        prisma.notification.groupBy({
          by: ["audience"],
          _count: { _all: true },
        }),
      ]);

    return NextResponse.json({
      notifications,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),

      summary: {
        total,
        unread,
        read: total - unread,
        byType: typeGroups.map((group) => ({
          type: group.type,
          count: group._count._all,
        })),
        byAudience: audienceGroups.map((group) => ({
          audience: group.audience ?? "DIRECT",
          count: group._count._all,
        })),
      },
    });
  } catch (error) {
    return serverError("ADMIN NOTIFICATIONS LIST ERROR", error);
  }
}

/**
 * POST /api/admin/notifications
 * Sends a database-backed notification to a resolved audience.
 *
 * Body: { title, message, type?, audience, classroomId?, userIds?, actionUrl? }
 * The recipient list is always resolved from the database — the client can
 * never inject arbitrary recipients.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();

    const title = str(body.title);
    const message = str(body.message);
    const audience = (str(body.audience) || "ALL").toUpperCase();
    const type = (str(body.type) || "ANNOUNCEMENT").toUpperCase();
    const classroomId = str(body.classroomId);
    const actionUrl = str(body.actionUrl);
    const userIds = Array.isArray(body.userIds)
      ? body.userIds.map((id: unknown) => String(id))
      : [];

    if (!title || !message) {
      return badRequest("A title and a message are required.");
    }

    if (!AUDIENCES.includes(audience as NotificationAudience)) {
      return badRequest(
        `Audience must be one of: ${AUDIENCES.join(", ")}.`
      );
    }

    if (!TYPES.includes(type as NotificationTypeValue)) {
      return badRequest(`Type must be one of: ${TYPES.join(", ")}.`);
    }

    if (audience === "CLASS" && !classroomId) {
      return badRequest("Select the class that should receive this message.");
    }

    if (audience === "SELECTED_USERS" && userIds.length === 0) {
      return badRequest("Select at least one recipient.");
    }

    const recipientIds = await resolveAudience({
      audience: audience as NotificationAudience,
      classroomId: classroomId || null,
      userIds,
    });

    if (recipientIds.length === 0) {
      return badRequest(
        "No user matches this audience, so nothing was sent."
      );
    }

    const result = await createManyNotifications(recipientIds, {
      title,
      message,
      type: type as NotificationTypeValue,
      senderId: guard.user.id,
      audience: audience as NotificationAudience,
      actionUrl: actionUrl || null,
      relatedType: classroomId ? "Classroom" : null,
      relatedId: classroomId || null,
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "NOTIFICATION_SENT",
      entityType: "Notification",
      description: `Sent "${title}" to ${result.count} recipient(s)`,
      metadata: { audience, classroomId: classroomId || null, type },
    });

    return NextResponse.json(
      {
        message: `Notification sent to ${result.count} recipient(s).`,
        sent: result.count,
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError("ADMIN NOTIFICATION CREATE ERROR", error);
  }
}

/**
 * PATCH /api/admin/notifications
 * Bulk action on notifications: mark all (or the selected ones) as read or
 * unread. Body: { action: "READ" | "UNREAD", ids?: string[] }
 */
export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();

    const action = (str(body.action) || "").toUpperCase();
    const ids = Array.isArray(body.ids)
      ? body.ids.map((id: unknown) => String(id))
      : [];

    if (!["READ", "UNREAD"].includes(action)) {
      return badRequest("Action must be READ or UNREAD.");
    }

    const result = await prisma.notification.updateMany({
      where: ids.length ? { id: { in: ids } } : {},
      data: { isRead: action === "READ" },
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "NOTIFICATION_UPDATED",
      entityType: "Notification",
      description:
        action === "READ"
          ? `Marked ${result.count} notification(s) as read`
          : `Marked ${result.count} notification(s) as unread`,
    });

    return NextResponse.json({
      message:
        action === "READ"
          ? `${result.count} notification(s) marked as read.`
          : `${result.count} notification(s) marked as unread.`,
      updated: result.count,
    });
  } catch (error) {
    return serverError("ADMIN NOTIFICATION BULK UPDATE ERROR", error);
  }
}
