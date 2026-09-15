import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import {
  ADMIN_SYSTEM_PROMPT,
  GeminiNotConfiguredError,
  GeminiProviderError,
  askGemini,
  isGeminiConfigured,
} from "@/lib/gemini";
import { buildAdminAiContext, renderContext } from "@/lib/ai-context";
import { badRequest, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

const HISTORY_LIMIT = 12;

/**
 * POST /api/admin/ai/chat
 * Body: { message: string, conversationId?: string }
 *
 * The assistant only ever receives aggregate school figures built on the
 * server (see buildAdminAiContext) plus the recent turns of the conversation.
 * Both the question and the answer are stored in the database.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => ({}));

    const message = str(body.message);
    const conversationId = str(body.conversationId);

    if (!message) return badRequest("Please type a question for the assistant.");

    if (message.length > 2000) {
      return badRequest("Please keep the question under 2000 characters.");
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error: new GeminiNotConfiguredError().message,
          code: "AI_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    /* ---- resolve or create the conversation ---- */

    let conversation = conversationId
      ? await prisma.aIConversation.findFirst({
          where: { id: conversationId, userId: guard.user.id },
          select: { id: true, title: true },
        })
      : null;

    if (conversationId && !conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: {
          userId: guard.user.id,
          title: message.slice(0, 60),
        },
        select: { id: true, title: true },
      });
    }

    const history = await prisma.aIMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
      select: { role: true, content: true },
    });

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: message,
      },
    });

    /* ---- build the prompt ---- */

    const context = await buildAdminAiContext();

    /* ---- ask Gemini ---- */

    try {
      const answer = await askGemini({
        system: ADMIN_SYSTEM_PROMPT,
        context: renderContext(context),
        messages: [
          ...history
            .reverse()
            .map((entry) => ({
              role: entry.role === "USER" ? ("user" as const) : ("model" as const),
              text: entry.content,
            })),
          { role: "user", text: message },
        ],
      });

      const stored = await prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content: answer.content,
        },
      });

      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      await logAudit({
        actorId: guard.user.id,
        actorName: guard.user.fullName,
        action: "AI_QUERY",
        entityType: "AIConversation",
        entityId: conversation.id,
        description: `Asked the admin assistant: ${message.slice(0, 120)}`,
        metadata: { model: answer.model, conversationId: conversation.id },
      });

      return NextResponse.json({
        conversationId: conversation.id,
        reply: {
          id: stored.id,
          role: "ASSISTANT",
          content: answer.content,
          createdAt: stored.createdAt,
        },
        model: answer.model,
      });
    } catch (error) {
      if (error instanceof GeminiProviderError) {
        return NextResponse.json(
          { error: error.message, code: "AI_PROVIDER_ERROR" },
          { status: 502 }
        );
      }

      throw error;
    }
  } catch (error) {
    return serverError("ADMIN AI CHAT ERROR", error);
  }
}
