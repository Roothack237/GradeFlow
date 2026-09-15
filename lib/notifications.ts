import prisma from "@/lib/prisma";

export type NotificationTypeValue =
  | "INFO"
  | "WARNING"
  | "SUCCESS"
  | "RESULT_PUBLISHED"
  | "ATTENDANCE_ALERT"
  | "MARK_UPDATE"
  | "ANNOUNCEMENT"
  | "REPORT_AVAILABLE"
  | "SYSTEM";

export type NotificationAudience =
  | "ALL"
  | "ALL_TEACHERS"
  | "ALL_PARENTS"
  | "CLASS"
  | "SELECTED_USERS";

export type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type?: NotificationTypeValue;
  senderId?: string | null;
  audience?: NotificationAudience | null;
  actionUrl?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
};

/** Creates a single database-backed notification for one user. */
export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? "INFO",
      senderId: input.senderId ?? null,
      audience: input.audience ?? null,
      actionUrl: input.actionUrl ?? null,
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
    },
  });
}

/** Creates the same notification for many recipients in one round trip. */
export async function createManyNotifications(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">
) {
  const unique = Array.from(new Set(userIds.filter(Boolean)));

  if (!unique.length) return { count: 0 };

  return prisma.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      title: input.title,
      message: input.message,
      type: input.type ?? "INFO",
      senderId: input.senderId ?? null,
      audience: input.audience ?? null,
      actionUrl: input.actionUrl ?? null,
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
    })),
  });
}

/**
 * Resolves the recipient user ids for an Admin announcement.
 * Uses only database relationships — never client supplied user lists.
 */
export async function resolveAudience(options: {
  audience: NotificationAudience;
  classroomId?: string | null;
  userIds?: string[];
}): Promise<string[]> {
  const { audience, classroomId, userIds } = options;

  switch (audience) {
    case "ALL_TEACHERS": {
      const teachers = await prisma.teacher.findMany({ select: { userId: true } });
      return teachers.map((t) => t.userId);
    }

    case "ALL_PARENTS": {
      const parents = await prisma.parent.findMany({ select: { userId: true } });
      return parents.map((p) => p.userId);
    }

    case "CLASS": {
      if (!classroomId) return [];

      const students = await prisma.student.findMany({
        where: { classroomId, parentId: { not: null } },
        select: { parent: { select: { userId: true } } },
      });

      return students
        .map((s) => s.parent?.userId)
        .filter((id): id is string => Boolean(id));
    }

    case "SELECTED_USERS": {
      if (!userIds?.length) return [];

      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });

      return users.map((u) => u.id);
    }

    case "ALL": {
      const users = await prisma.user.findMany({
        where: { role: { in: ["TEACHER", "PARENT"] }, status: { not: "SUSPENDED" } },
        select: { id: true },
      });

      return users.map((u) => u.id);
    }

    default:
      return [];
  }
}

/**
 * Notifies every administrator account. Used when teachers submit marks,
 * attendance or availability so the administration stays informed.
 */
export async function notifyAdmins(
  input: Omit<CreateNotificationInput, "userId">
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: { not: "SUSPENDED" } },
    select: { id: true },
  });

  return createManyNotifications(
    admins.map((admin) => admin.id),
    input
  );
}

/**
 * Notifies the parent or guardian linked to a student. Returns a count of 0
 * when the student has no linked parent account, so callers can ignore it.
 */
export async function notifyGuardian(
  studentId: string,
  input: {
    title: string;
    message: string;
    type?: NotificationTypeValue;
    senderId?: string | null;
    actionUrl?: string | null;
    relatedType?: string | null;
    relatedId?: string | null;
  }
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { parent: { select: { userId: true } } },
  });

  const userId = student?.parent?.userId;

  if (!userId) return { count: 0 };

  await createNotification({
    userId,
    audience: "CLASS",
    ...input,
  });

  return { count: 1 };
}
