import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { serverError } from "@/lib/http";

/**
 * GET /api/admin/me
 * Returns the signed-in administrator plus their unread notification count.
 * Used by the Admin navbar (profile block and notification bell).
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const [unread, currentTerm] = await Promise.all([
      prisma.notification.count({
        where: { userId: guard.user.id, isRead: false, archivedAt: null },
      }),
      prisma.term.findFirst({
        where: { isCurrent: true },
        select: {
          name: true,
          academicYear: { select: { name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      id: guard.user.id,
      fullName: guard.user.fullName,
      email: guard.user.email,
      image: guard.user.image,
      unreadNotifications: unread,
      currentTerm: currentTerm
        ? {
            name: currentTerm.name,
            academicYear: currentTerm.academicYear.name,
          }
        : null,
    });
  } catch (error) {
    return serverError("ADMIN ME ERROR", error);
  }
}
