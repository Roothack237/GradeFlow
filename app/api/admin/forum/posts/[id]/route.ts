import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { notFound, serverError } from "@/lib/http";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/admin/forum/posts/[id] — the full thread for moderation. */
export async function GET(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const post = await prisma.forumPost.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        body: true,
        isPinned: true,
        isLocked: true,
        isDeleted: true,
        views: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true, scope: true } },
        author: {
          select: { id: true, firstName: true, lastName: true, role: true, email: true },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            body: true,
            isDeleted: true,
            createdAt: true,
            author: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        },
        _count: { select: { reactions: true } },
      },
    });

    if (!post) return notFound("Post not found.");

    return NextResponse.json({ post });
  } catch (error) {
    return serverError("ADMIN FORUM POST ERROR", error);
  }
}

/** PATCH /api/admin/forum/posts/[id] — pin, lock or remove a post. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.forumPost.findUnique({
      where: { id },
      select: { id: true, title: true, isPinned: true, isLocked: true, isDeleted: true },
    });

    if (!existing) return notFound("Post not found.");

    const post = await prisma.forumPost.update({
      where: { id },
      data: {
        ...(typeof body.isPinned === "boolean" ? { isPinned: body.isPinned } : {}),
        ...(typeof body.isLocked === "boolean" ? { isLocked: body.isLocked } : {}),
        ...(typeof body.isDeleted === "boolean" ? { isDeleted: body.isDeleted } : {}),
      },
      select: {
        id: true,
        title: true,
        isPinned: true,
        isLocked: true,
        isDeleted: true,
      },
    });

    const changes: string[] = [];

    if (typeof body.isPinned === "boolean" && body.isPinned !== existing.isPinned) {
      changes.push(body.isPinned ? "pinned" : "unpinned");
    }

    if (typeof body.isLocked === "boolean" && body.isLocked !== existing.isLocked) {
      changes.push(body.isLocked ? "locked" : "unlocked");
    }

    if (typeof body.isDeleted === "boolean" && body.isDeleted !== existing.isDeleted) {
      changes.push(body.isDeleted ? "removed" : "restored");
    }

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: post.isPinned
        ? "FORUM_POST_PINNED"
        : post.isLocked
          ? "FORUM_POST_LOCKED"
          : "FORUM_CATEGORY_UPDATED",
      entityType: "ForumPost",
      entityId: id,
      description: `Forum post "${existing.title}" ${changes.join(", ") || "updated"}`,
      metadata: { changes },
    });

    return NextResponse.json({ message: "Post updated.", post });
  } catch (error) {
    return serverError("ADMIN FORUM POST UPDATE ERROR", error);
  }
}

/** DELETE /api/admin/forum/posts/[id] — permanently deletes a post. */
export async function DELETE(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const post = await prisma.forumPost.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!post) return notFound("Post not found.");

    await prisma.forumPost.delete({ where: { id } });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "FORUM_POST_DELETED",
      entityType: "ForumPost",
      entityId: id,
      description: `Permanently deleted the forum post "${post.title}"`,
    });

    return NextResponse.json({ message: "Post deleted." });
  } catch (error) {
    return serverError("ADMIN FORUM POST DELETE ERROR", error);
  }
}
