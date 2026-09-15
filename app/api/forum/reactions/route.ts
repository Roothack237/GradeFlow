import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { categoryVisibleTo, getSessionUser } from "@/lib/forum";

/**
 * POST /api/forum/reactions
 * Body: { postId, type?: "LIKE" }
 * Toggles the signed-in user's reaction on a post.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const postId = typeof body?.postId === "string" ? body.postId : "";
    const type = typeof body?.type === "string" && body.type ? body.type : "LIKE";

    if (!postId) {
      return NextResponse.json({ error: "postId is required." }, { status: 400 });
    }

    const post = await prisma.forumPost.findFirst({
      where: { id: postId, isDeleted: false },
      include: { category: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    if (!categoryVisibleTo(post.category.scope, user.role)) {
      return NextResponse.json(
        { error: "You do not have access to this forum." },
        { status: 403 }
      );
    }

    const existing = await prisma.forumReaction.findUnique({
      where: { postId_userId_type: { postId, userId: user.id, type } },
    });

    if (existing) {
      await prisma.forumReaction.delete({ where: { id: existing.id } });

      const count = await prisma.forumReaction.count({
        where: { postId, type },
      });

      return NextResponse.json({ liked: false, count });
    }

    await prisma.forumReaction.create({
      data: { postId, userId: user.id, type },
    });

    const count = await prisma.forumReaction.count({
      where: { postId, type },
    });

    return NextResponse.json({ liked: true, count });
  } catch (error) {
    console.error("FORUM REACTION ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update the reaction." },
      { status: 500 }
    );
  }
}
