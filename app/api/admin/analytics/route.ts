import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { buildAdminAiContext } from "@/lib/ai-context";
import { serverError } from "@/lib/http";

/**
 * GET /api/admin/analytics
 *
 * School-wide analytics computed from Prisma: school performance, class
 * comparisons, section comparisons, academic year comparisons, attendance
 * issues and teacher workload.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const context = await buildAdminAiContext();

    return NextResponse.json(context);
  } catch (error) {
    return serverError("ADMIN ANALYTICS ERROR", error);
  }
}
