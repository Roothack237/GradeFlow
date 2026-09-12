import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, notFound, serverError, str } from "@/lib/http";
import { notifyGuardian } from "@/lib/notifications";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

/**
 * PATCH /api/admin/attendance/[id]
 * Administrator correction of an attendance record.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    });

    if (!existing) return notFound("Attendance record not found.");

    const status = str(body.status);

    if (!STATUSES.includes(status)) {
      return badRequest("Invalid attendance status.");
    }

    const record = await prisma.attendance.update({
      where: { id },
      data: { status: status as never },
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "ATTENDANCE_UPDATED",
      entityType: "Attendance",
      entityId: id,
      description: `Changed attendance for ${existing.student.firstName} ${existing.student.lastName} from ${existing.status} to ${status}`,
    });

    if (
      (status === "ABSENT" || status === "LATE") &&
      existing.status !== status
    ) {
      await notifyGuardian(existing.studentId, {
        title: status === "ABSENT" ? "Absence recorded" : "Late arrival recorded",
        message: `${existing.student.firstName} ${existing.student.lastName} was marked ${
          status === "ABSENT" ? "absent" : "late"
        } on ${existing.date.toLocaleDateString("en-GB")}.`,
        type: "ATTENDANCE_ALERT",
        senderId: guard.user.id,
        actionUrl: "/parent/children",
        relatedType: "Attendance",
        relatedId: id,
      });
    }

    return NextResponse.json({
      message: "Attendance updated successfully.",
      attendance: record,
    });
  } catch (error) {
    return serverError("ADMIN ATTENDANCE UPDATE ERROR", error);
  }
}

/**
 * DELETE /api/admin/attendance/[id]
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: { student: { select: { firstName: true, lastName: true } } },
    });

    if (!existing) return notFound("Attendance record not found.");

    await prisma.attendance.delete({ where: { id } });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "ATTENDANCE_UPDATED",
      entityType: "Attendance",
      entityId: id,
      description: `Deleted an attendance record for ${existing.student.firstName} ${existing.student.lastName}`,
    });

    return NextResponse.json({ message: "Attendance record deleted." });
  } catch (error) {
    return serverError("ADMIN ATTENDANCE DELETE ERROR", error);
  }
}
