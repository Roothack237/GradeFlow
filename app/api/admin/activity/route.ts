import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { dateFrom, endOfDay, pagination, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/activity
 * The audit trail: every administrative action recorded by the application.
 *
 * Query: ?search= &action= &entityType= &actorId= &from= &to= &page= &pageSize=
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const search = str(searchParams.get("search"));
    const action = str(searchParams.get("action")).toUpperCase();
    const entityType = str(searchParams.get("entityType"));
    const actorId = str(searchParams.get("actorId"));
    const from = dateFrom(searchParams.get("from"));
    const to = endOfDay(searchParams.get("to"));

    const where = {
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(actorId ? { actorId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" as const } },
              { actorName: { contains: search, mode: "insensitive" as const } },
              { entityType: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const { skip, take, page, pageSize } = pagination(searchParams, 25, 100);

    const [logs, total, actionGroups, entityGroups, actors] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          metadata: true,
          actorName: true,
          createdAt: true,
          actor: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      }),

      prisma.auditLog.count({ where }),

      prisma.auditLog.groupBy({
        by: ["action"],
        _count: { _all: true },
        orderBy: { _count: { action: "desc" } },
      }),

      prisma.auditLog.groupBy({
        by: ["entityType"],
        _count: { _all: true },
        orderBy: { _count: { entityType: "desc" } },
      }),

      prisma.auditLog.findMany({
        where: { actorName: { not: null } },
        distinct: ["actorId"],
        select: {
          actorName: true,
          actor: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),

      summary: {
        total,
        actions: actionGroups.map((group) => ({
          action: group.action,
          count: group._count._all,
        })),
        entities: entityGroups.map((group) => ({
          entityType: group.entityType,
          count: group._count._all,
        })),
        actors: actors.filter((entry) => entry.actor),
      },
    });
  } catch (error) {
    return serverError("ADMIN ACTIVITY LIST ERROR", error);
  }
}
