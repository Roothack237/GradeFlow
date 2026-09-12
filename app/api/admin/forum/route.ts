import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, num, pagination, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

const SCOPES = ["ALL", "STAFF", "PARENTS"];

/**
 * GET /api/admin/forum
 * Forum moderation view: categories with their counters, the latest posts with
 * filters, and the moderation statistics.
 *
 * Query: ?categoryId= &search= &authorRole= &state=OPEN|PINNED|LOCKED|REMOVED
 *        &page= &pageSize=
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const categoryId = str(searchParams.get("categoryId"));
    const search = str(searchParams.get("search"));
    const authorRole = str(searchParams.get("authorRole")).toUpperCase();
    const state = str(searchParams.get("state")).toUpperCase();

    const where = {
      ...(categoryId ? { categoryId } : {}),
      ...(authorRole ? { author: { role: authorRole as never } } : {}),
      ...(state === "REMOVED"
        ? { isDeleted: true }
        : state === "PINNED"
          ? { isPinned: true, isDeleted: false }
          : state === "LOCKED"
            ? { isLocked: true, isDeleted: false }
            : state === "OPEN"
              ? { isDeleted: false, isLocked: false, isPinned: false }
              : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { body: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const { skip, take, page, pageSize } = pagination(searchParams, 15, 100);

    const [categories, posts, total, stats, commentCount, removedComments] =
      await Promise.all([
        prisma.forumCategory.findMany({
          orderBy: [{ order: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            scope: true,
            order: true,
            isLocked: true,
            createdAt: true,
            _count: { select: { posts: true } },
          },
        }),

        prisma.forumPost.findMany({
          where,
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          skip,
          take,
          select: {
            id: true,
            title: true,
            body: true,
            isPinned: true,
            isLocked: true,
            isDeleted: true,
            views: true,
            createdAt: true,
            category: { select: { id: true, name: true } },
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            _count: { select: { comments: true, reactions: true } },
          },
        }),

        prisma.forumPost.count({ where }),

        prisma.forumPost.groupBy({
          by: ["isPinned", "isLocked", "isDeleted"],
          _count: { _all: true },
        }),

        prisma.forumComment.count(),

        prisma.forumComment.count({ where: { isDeleted: true } }),
      ]);

    const totals = { posts: 0, pinned: 0, locked: 0, removed: 0 };

    for (const group of stats) {
      totals.posts += group._count._all;
      if (group.isDeleted) totals.removed += group._count._all;
      else {
        if (group.isPinned) totals.pinned += group._count._all;
        if (group.isLocked) totals.locked += group._count._all;
      }
    }

    return NextResponse.json({
      categories,
      posts,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),

      summary: {
        categories: categories.length,
        posts: totals.posts,
        pinned: totals.pinned,
        locked: totals.locked,
        removed: totals.removed,
        comments: commentCount,
        removedComments,
      },
    });
  } catch (error) {
    return serverError("ADMIN FORUM LIST ERROR", error);
  }
}

/**
 * POST /api/admin/forum
 * Creates a forum category. Body: { name, description?, scope?, order? }
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();

    const name = str(body.name);
    const description = str(body.description);
    const scope = (str(body.scope) || "ALL").toUpperCase();
    const order = num(body.order, 0);

    if (!name) return badRequest("A category name is required.");

    if (!SCOPES.includes(scope)) {
      return badRequest(`Scope must be one of: ${SCOPES.join(", ")}.`);
    }

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || `category-${Date.now()}`;

    const existing = await prisma.forumCategory.findFirst({
      where: { OR: [{ name }, { slug }] },
    });

    if (existing) {
      return badRequest(`"${name}" already exists.`);
    }

    const category = await prisma.forumCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        scope: scope as never,
        order: order || (await prisma.forumCategory.count()) + 1,
      },
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "FORUM_CATEGORY_CREATED",
      entityType: "ForumCategory",
      entityId: category.id,
      description: `Created the forum category ${category.name}`,
    });

    return NextResponse.json(
      { message: "Category created.", category },
      { status: 201 }
    );
  } catch (error) {
    return serverError("ADMIN FORUM CATEGORY CREATE ERROR", error);
  }
}
