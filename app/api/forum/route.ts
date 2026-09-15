import { NextResponse } from "next/server";
import { auth } from "@/auth";

import prisma from "@/lib/prisma";
import { categoryVisibleTo, getSessionUser } from "@/lib/forum";

/**
 * GET /api/forum?categoryId=&search=&page=&pageSize=
 * Categories visible to the signed-in role + the latest posts of those
 * categories.
 */
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const categoryId = searchParams.get("categoryId")?.trim() || null;
    const search = searchParams.get("search")?.trim() || null;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize")) || 15));

    const categories = await prisma.forumCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { posts: { where: { isDeleted: false } } } } },
    });

    const visibleCategories = categories.filter((category) =>
      categoryVisibleTo(category.scope, user.role)
    );

    const visibleCategoryIds = visibleCategories.map((category) => category.id);

    if (!visibleCategoryIds.length) {
      return NextResponse.json({ categories: [], posts: [], total: 0, page, pageSize });
    }

    const where = {
      isDeleted: false,
      categoryId: categoryId
        ? visibleCategoryIds.includes(categoryId)
          ? categoryId
          : "__none__"
        : { in: visibleCategoryIds },
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { body: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, name: true, slug: true, scope: true } },
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
          _count: { select: { comments: { where: { isDeleted: false } }, reactions: true } },
        },
      }),
      prisma.forumPost.count({ where }),
    ]);

    return NextResponse.json({
      categories: visibleCategories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        scope: category.scope,
        isLocked: category.isLocked,
        posts: category._count.posts,
      })),
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        body: post.body,
        isPinned: post.isPinned,
        isLocked: post.isLocked,
        views: post.views,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        category: post.category,
        author: {
          id: post.author.id,
          name:
            post.author.teacher?.fullName ??
            post.author.parent?.fullName ??
            post.author.administrator?.fullName ??
            `${post.author.firstName} ${post.author.lastName}`,
          role: post.author.role,
        },
        comments: post._count.comments,
        reactions: post._count.reactions,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("FORUM GET ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load the forum." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forum
 * Body: { categoryId, title, body }
 * Creates a post in a category the signed-in role may access.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const postBody = typeof body?.body === "string" ? body.body.trim() : "";

    if (!categoryId || !title || !postBody) {
      return NextResponse.json(
        { error: "Category, title and body are required." },
        { status: 400 }
      );
    }

    if (title.length > 150) {
      return NextResponse.json(
        { error: "Please keep the title under 150 characters." },
        { status: 400 }
      );
    }

    const category = await prisma.forumCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    if (!categoryVisibleTo(category.scope, user.role)) {
      return NextResponse.json(
        { error: "You do not have access to this forum." },
        { status: 403 }
      );
    }

    if (category.isLocked) {
      return NextResponse.json(
        { error: "This forum is locked; new posts are disabled." },
        { status: 403 }
      );
    }

    const post = await prisma.forumPost.create({
      data: {
        categoryId,
        authorId: user.id,
        title,
        body: postBody,
      },
      include: {
        category: { select: { id: true, name: true, slug: true, scope: true } },
      },
    });

    return NextResponse.json(
      {
        post: {
          id: post.id,
          title: post.title,
          body: post.body,
          createdAt: post.createdAt,
          category: post.category,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("FORUM POST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create the post." },
      { status: 500 }
    );
  }
}
