import prisma from "@/lib/prisma";
import {
  createManyNotifications,
  createNotification,
  notifyGuardian,
  type NotificationTypeValue,
} from "@/lib/notifications";

/**
 * Absence alerts (priority feature).
 *
 * A student is flagged when they reach 5 hours ABSENT or 5 hours LATE for a
 * single subject (every attendance record is one lesson hour). When the
 * threshold is crossed, the parent, the teachers of that subject for the
 * student's class, and every administrator receive an ATTENDANCE_ALERT
 * notification through the existing notification system.
 *
 * Duplicate alerts are prevented by checking for an earlier alert with the
 * same `relatedType` / `relatedId` marker on the Notification model.
 */

export const ABSENCE_ALERT_HOURS = 5;

/** Marker used to deduplicate alerts for one student + subject + status. */
export function absenceAlertMarker(
  studentId: string,
  subjectId: string,
  status: "ABSENT" | "LATE"
) {
  return `${studentId}:${subjectId}:${status}`;
}

/**
 * Counts the ABSENT and LATE hours recorded for each student in one subject,
 * within the given academic year.
 */
async function countHours(
  studentIds: string[],
  subjectId: string,
  academicYearId: string
) {
  const rows = await prisma.attendance.groupBy({
    by: ["studentId", "status"],
    where: {
      studentId: { in: studentIds },
      subjectId,
      status: { in: ["ABSENT", "LATE"] },
      sequence: { term: { academicYearId } },
    },
    _count: { _all: true },
  });

  const hours = new Map<string, { ABSENT: number; LATE: number }>();

  for (const id of studentIds) hours.set(id, { ABSENT: 0, LATE: 0 });

  for (const row of rows) {
    const entry = hours.get(row.studentId);
    if (!entry) continue;
    entry[row.status as "ABSENT" | "LATE"] += row._count._all;
  }

  return hours;
}

/**
 * Runs the absence alert check after an attendance submission.
 *
 * @param studentIds students whose attendance was just saved
 * @param subjectId  the subject of the lesson
 * @param options.senderId  the teacher user id that submitted (notification sender)
 */
export async function checkAbsenceAlerts(options: {
  studentIds: string[];
  subjectId: string;
  senderId?: string | null;
  academicYearId?: string | null;
}) {
  const { studentIds, subjectId, senderId } = options;

  if (!studentIds.length) return { created: 0 };

  try {
    const year = options.academicYearId
      ? { id: options.academicYearId }
      : await prisma.academicYear.findFirst({
          where: { isActive: true },
          select: { id: true },
        });

    if (!year) return { created: 0 };

    const [subject, hours, existingAlerts, adminUsers] = await Promise.all([
      prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true },
      }),
      countHours(studentIds, subjectId, year.id),
      prisma.notification.findMany({
        where: {
          relatedType: "ABSENCE_ALERT",
          relatedId: {
            in: studentIds.flatMap((studentId) => [
              absenceAlertMarker(studentId, subjectId, "ABSENT"),
              absenceAlertMarker(studentId, subjectId, "LATE"),
            ]),
          },
        },
        select: { relatedId: true },
      }),
      prisma.user.findMany({
        where: { role: "ADMIN", status: { not: "SUSPENDED" } },
        select: { id: true },
      }),
    ]);

    if (!subject) return { created: 0 };

    const alreadyAlerted = new Set(existingAlerts.map((alert) => alert.relatedId));

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        classroomId: true,
        parent: { select: { userId: true } },
      },
    });

    const studentById = new Map(students.map((student) => [student.id, student]));

    /* teachers assigned to this subject for each classroom */
    const classroomIds = Array.from(
      new Set(students.map((student) => student.classroomId).filter(Boolean))
    ) as string[];

    const assignments = classroomIds.length
      ? await prisma.teacherAssignment.findMany({
          where: { subjectId, classroomId: { in: classroomIds } },
          select: { teacher: { select: { userId: true, fullName: true } } },
        })
      : [];

    let created = 0;

    for (const [studentId, totals] of hours) {
      const student = studentById.get(studentId);
      if (!student) continue;

      const studentName = `${student.firstName} ${student.lastName}`;

      for (const status of ["ABSENT", "LATE"] as const) {
        const total = totals[status];

        if (total < ABSENCE_ALERT_HOURS) continue;

        const marker = absenceAlertMarker(studentId, subjectId, status);
        if (alreadyAlerted.has(marker)) continue;
        alreadyAlerted.add(marker);

        const label = status === "ABSENT" ? "absent" : "late";
        const title =
          status === "ABSENT"
            ? "Absence alert: 5+ hours missed"
            : "Lateness alert: 5+ hours accumulated";

        const message = `${studentName} has now been ${label} for ${total} hours of ${subject.name}. Please follow up with the student.`;

        const base = {
          title,
          message,
          type: "ATTENDANCE_ALERT" as NotificationTypeValue,
          senderId: senderId ?? null,
          relatedType: "ABSENCE_ALERT",
          relatedId: marker,
        };

        /* ---- parent ---- */

        if (student.parent?.userId) {
          await createNotification({
            userId: student.parent.userId,
            audience: "CLASS",
            actionUrl: "/parent/attendance",
            ...base,
          });
          created += 1;
        }

        /* ---- teachers of the subject (excluding the sender) ---- */

        const teacherUserIds = Array.from(
          new Set(
            assignments
              .map((assignment) => assignment.teacher.userId)
              .filter((userId) => userId && userId !== senderId)
          )
        );

        if (teacherUserIds.length) {
          await createManyNotifications(teacherUserIds, {
            ...base,
            actionUrl: "/teacher/attendance",
          });
          created += teacherUserIds.length;
        }

        /* ---- administrators ---- */

        const adminIds = adminUsers
          .map((admin) => admin.id)
          .filter((userId) => userId !== senderId);

        if (adminIds.length) {
          await createManyNotifications(adminIds, {
            ...base,
            actionUrl: "/admin/attendance",
          });
          created += adminIds.length;
        }
      }
    }

    return { created };
  } catch (error) {
    /* Alerts must never break the attendance submission itself. */
    console.error("ABSENCE ALERTS ERROR:", error);
    return { created: 0 };
  }
}

/**
 * Convenience wrapper used when a guardian must be notified directly
 * (kept for parity with the rest of the notification helpers).
 */
export async function notifyStudentGuardian(
  studentId: string,
  input: {
    title: string;
    message: string;
    type?: NotificationTypeValue;
    senderId?: string | null;
    actionUrl?: string | null;
  }
) {
  return notifyGuardian(studentId, input);
}
