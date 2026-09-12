import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { serverError } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/settings
 * Read-only view of the school configuration that actually lives in the
 * database, plus the availability of the optional integrations. Secrets are
 * never returned: only whether an integration is configured.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const [
      years,
      term,
      students,
      teachers,
      parents,
      classrooms,
      subjects,
      marks,
      attendance,
      notifications,
      auditLogs,
    ] = await Promise.all([
      prisma.academicYear.findMany({
        orderBy: { startDate: "desc" },
        select: { id: true, name: true, isActive: true, startDate: true, endDate: true },
      }),
      prisma.term.findFirst({
        where: { isCurrent: true },
        select: {
          id: true,
          name: true,
          order: true,
          academicYear: { select: { name: true } },
          _count: { select: { sequences: true } },
        },
      }),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.parent.count(),
      prisma.classroom.count(),
      prisma.subject.count(),
      prisma.mark.count(),
      prisma.attendance.count(),
      prisma.notification.count(),
      prisma.auditLog.count(),
    ]);

    return NextResponse.json({
      profile: {
        id: guard.user.id,
        fullName: guard.user.fullName,
        email: guard.user.email,
        role: guard.user.role,
      },

      academic: {
        years,
        currentTerm: term,
      },

      data: {
        students,
        teachers,
        parents,
        classrooms,
        subjects,
        marks,
        attendance,
        notifications,
        auditLogs,
      },

      integrations: {
        ai: Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.trim()),
        email: Boolean(
          process.env.EMAIL_USER?.trim() &&
            process.env.EMAIL_APP_PASSWORD?.trim()
        ),
        provider: process.env.AI_BASE_URL?.trim()
          ? "custom endpoint"
          : "OpenAI compatible",
        model: process.env.AI_MODEL?.trim() || "gpt-4o-mini (default)",
      },

      security: {
        adminApiGuarded: true,
        roleCheck: "server side (requireAdmin)",
        sessionProvider: "NextAuth credentials",
      },
    });
  } catch (error) {
    return serverError("ADMIN SETTINGS ERROR", error);
  }
}
