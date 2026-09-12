import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, notFound, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const SCOPES = ["ALL", "STAFF", "PARENTS"];

/** PATCH /api/admin/forum/categories/[id] — updates a forum category. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.forumCategory.findUnique({ where: { id } });

    if (!existing) return notFound("Category not found.");

    const name = str(body.name);
    const scope = str(body.scope).toUpperCase();

    if (scope && !SCOPES.includes(scope)) {
      return badRequest(`Scope must be one of: ${SCOPES.join(", ")}.`);
    }

    if (name && name !== existing.name) {
      const duplicate = await prisma.forumCategory.findFirst({
        where: { name, NOT: { id } },
      });

      if (duplicate) return badRequest(`"${name}" already exists.`);
    }

    const category = await prisma.forumCategory.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(body.description !== undefined
          ? { description: str(body.description) || null }
          : {}),
        ...(scope ? { scope: scope as never } : {}),
        ...(body.order !== undefined ? { order: Number(body.order) || 0 } : {}),
        ...(typeof body.isLocked === "boolean" ? { isLocked: body.isLocked } : {}),
      },
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "FORUM_CATEGORY_UPDATED",
      entityType: "ForumCategory",
      entityId: category.id,
      description: `Updated the forum category ${category.name}`,
    });

    return NextResponse.json({ message: "Category updated.", category });
  } catch (error) {
    return serverError("ADMIN FORUM CATEGORY UPDATE ERROR", error);
  }
}

/**
 * DELETE /api/admin/forum/categories/[id]
 * A category is only removed when it no longer holds any post, so moderation
 * work is never destroyed by accident.
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const category = await prisma.forumCategory.findUnique({
      where: { id },
      select: { id: true, name: true, _count: { select: { posts: true } } },
    });

    if (!category) return notFound("Category not found.");

    if (category._count.posts > 0) {
      return NextResponse.json(
        {
          error: `"${category.name}" still contains ${category._count.posts} post(s). Remove or move them first.`,
        },
        { status: 409 }
      );
    }

    await prisma.forumCategory.delete({ where: { id } });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "FORUM_CATEGORY_DELETED",
      entityType: "ForumCategory",
      entityId: id,
      description: `Deleted the forum category ${category.name}`,
    });

    return NextResponse.json({ message: "Category deleted." });
  } catch (error) {
    return serverError("ADMIN FORUM CATEGORY DELETE ERROR", error);
  }
}
