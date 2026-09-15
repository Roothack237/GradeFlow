import { NextResponse } from "next/server";
import { auth } from "@/auth";

import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { categoryVisibleTo, displayName, getSessionUser } from "@/lib/forum";

/**
 * GET /api/forum/posts/[id]
 * A post (visible to the signed-in role) with its comments and reactions.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.forumPost.findFirst({
      where: { id, isDeleted: false },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            teacher: { select: { fullName: true } },
            parent: { select: { fullName: true } },
            administrator: { select: { fullName: true } },
          },
        },
        comments: {
          where: { isDeleted: false },
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                teacher: { select: { fullName: true } },
                parent: { select: { fullName: true } },
                administrator: { select: { fullName: true } },
              },
            },
          },
        },
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
      },
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

    /* Count the view once per page load. */
    await prisma.forumPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        body: post.body,
        isPinned: post.isPinned,
        isLocked: post.isLocked,
        views: post.views + 1,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        category: {
          id: post.category.id,
          name: post.category.name,
          slug: post.category.slug,
          scope: post.category.scope,
        },
        author: { id: post.author.id, name: displayName(post.author), role: post.author.role },
        comments: post.comments.map((comment) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt,
          author: { id: comment.author.id, name: displayName(comment.author), role: comment.author.role },
        })),
        reactions: {
          likes: post.reactions.filter((reaction) => reaction.type === "LIKE").length,
          likedByMe: post.reactions.some(
            (reaction) => reaction.type === "LIKE" && reaction.userId === user.id
          ),
        },
      },
    });
  } catch (error) {
    console.error("FORUM POST GET ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load the post." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forum/posts/[id]
 * Body: { body }
 * Adds a comment to a post (respecting the category scope) and notifies the
 * post author through the existing notification system.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json().catch(() => ({}));

    const commentBody = typeof body?.body === "string" ? body.body.trim() : "";

    if (!commentBody) {
      return NextResponse.json({ error: "A comment cannot be empty." }, { status: 400 });
    }

    const post = await prisma.forumPost.findFirst({
      where: { id, isDeleted: false },
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

    if (post.isLocked) {
      return NextResponse.json(
        { error: "This post is locked; commenting is disabled." },
        { status: 403 }
      );
    }

    const comment = await prisma.forumComment.create({
      data: {
        postId: post.id,
        authorId: user.id,
        body: commentBody,
      },
    });

    /* Notify the post author (never the commenter themselves). */
    if (post.authorId !== user.id) {
      try {
        const commenterName = displayName(user);

        await createNotification({
          userId: post.authorId,
          title: "New reply to your forum post",
          message: `${commenterName} replied to "${post.title.slice(0, 80)}" in ${post.category.name}.`,
          type: "INFO",
          senderId: user.id,
          relatedType: "FORUM_POST",
          relatedId: post.id,
          actionUrl: `/forum/posts/${post.id}`,
        });
      } catch (notificationError) {
        console.error("FORUM COMMENT NOTIFICATION ERROR:", notificationError);
      }
    }

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt,
          author: {
            id: user.id,
            name:
              user.teacher?.fullName ??
              user.parent?.fullName ??
              `${user.firstName} ${user.lastName}`,
            role: user.role,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("FORUM COMMENT POST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to publish the comment." },
      { status: 500 }
    );
  }
}
