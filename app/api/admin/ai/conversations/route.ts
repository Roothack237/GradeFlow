import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isAiConfigured } from "@/lib/ai";
import { isGeminiConfigured } from "@/lib/gemini";
import { badRequest, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/ai/conversations
 * The conversation history of the signed-in administrator.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const conversations = await prisma.aIConversation.findMany({
      where: { userId: guard.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({
      configured: isGeminiConfigured() || isAiConfigured(),
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation._count.messages,
        lastMessage: conversation.messages[0] ?? null,
      })),
    });
  } catch (error) {
    return serverError("ADMIN AI CONVERSATIONS ERROR", error);
  }
}

/**
 * POST /api/admin/ai/conversations
 * Creates an empty conversation. Body: { title? }
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => ({}));

    const title = str(body.title) || "New conversation";

    const conversation = await prisma.aIConversation.create({
      data: { userId: guard.user.id, title: title.slice(0, 80) },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(
      { message: "Conversation created.", conversation },
      { status: 201 }
    );
  } catch (error) {
    return serverError("ADMIN AI CONVERSATION CREATE ERROR", error);
  }
}

/**
 * DELETE /api/admin/ai/conversations?id=
 * Removes one conversation (and its messages) or the whole history when the
 * `id` is omitted and `all=true` is sent.
 */
export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const id = str(searchParams.get("id"));
    const all = str(searchParams.get("all")) === "true";

    if (!id && !all) {
      return badRequest("Provide a conversation id, or all=true.");
    }

    const result = await prisma.aIConversation.deleteMany({
      where: { userId: guard.user.id, ...(id ? { id } : {}) },
    });

    if (id && result.count === 0) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: id
        ? "Conversation deleted."
        : `${result.count} conversation(s) deleted.`,
      deleted: result.count,
    });
  } catch (error) {
    return serverError("ADMIN AI CONVERSATION DELETE ERROR", error);
  }
}
