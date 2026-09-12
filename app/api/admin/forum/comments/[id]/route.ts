import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { notFound, serverError } from "@/lib/http";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/forum/comments/[id]
 * Hides (soft delete) or restores a comment.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.forumComment.findUnique({
      where: { id },
      select: { id: true, body: true, isDeleted: true, postId: true },
    });

    if (!existing) return notFound("Comment not found.");

    if (typeof body.isDeleted !== "boolean") {
      return NextResponse.json(
        { error: "A boolean isDeleted value is required." },
        { status: 400 }
      );
    }

    const comment = await prisma.forumComment.update({
      where: { id },
      data: { isDeleted: body.isDeleted },
      select: { id: true, isDeleted: true },
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: body.isDeleted ? "FORUM_COMMENT_DELETED" : "FORUM_CATEGORY_UPDATED",
      entityType: "ForumComment",
      entityId: id,
      description: body.isDeleted
        ? `Removed a forum comment: "${existing.body.slice(0, 80)}"`
        : `Restored a forum comment: "${existing.body.slice(0, 80)}"`,
      metadata: { postId: existing.postId },
    });

    return NextResponse.json({ message: "Comment updated.", comment });
  } catch (error) {
    return serverError("ADMIN FORUM COMMENT UPDATE ERROR", error);
  }
}

/** DELETE /api/admin/forum/comments/[id] — permanently deletes a comment. */
export async function DELETE(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const comment = await prisma.forumComment.findUnique({
      where: { id },
      select: { id: true, body: true },
    });

    if (!comment) return notFound("Comment not found.");

    await prisma.forumComment.delete({ where: { id } });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "FORUM_COMMENT_DELETED",
      entityType: "ForumComment",
      entityId: id,
      description: `Permanently deleted a forum comment: "${comment.body.slice(0, 80)}"`,
    });

    return NextResponse.json({ message: "Comment deleted." });
  } catch (error) {
    return serverError("ADMIN FORUM COMMENT DELETE ERROR", error);
  }
}
