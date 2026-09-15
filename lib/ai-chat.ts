import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  GeminiNotConfiguredError,
  GeminiProviderError,
  type GeminiChatMessage,
} from "@/lib/gemini";

/**
 * Shared server-side chat pipeline for the role AI assistants
 * (/api/ai/teacher, /api/ai/parent, /api/ai/admin).
 *
 * - validates the question,
 * - resolves/creates the AIConversation of the signed-in user,
 * - loads the recent conversation history,
 * - delegates the actual analysis to the role-specific Gemini function,
 * - stores both turns in the database.
 */
export async function runAiChat(options: {
  userId: string;
  message: string;
  conversationId?: string | null;
  historyLimit?: number;
  analyze: (
    question: string,
    history: GeminiChatMessage[]
  ) => Promise<{ content: string; model: string }>;
}): Promise<NextResponse> {
  const {
    userId,
    message,
    conversationId,
    historyLimit = 10,
    analyze,
  } = options;

  if (!message) {
    return NextResponse.json(
      { error: "Please type a question for the assistant." },
      { status: 400 }
    );
  }

  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Please keep the question under 2000 characters." },
      { status: 400 }
    );
  }

  /* ---- resolve or create the conversation ---- */

  let conversation = conversationId
    ? await prisma.aIConversation.findFirst({
        where: { id: conversationId, userId },
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
      data: { userId, title: message.slice(0, 60) },
      select: { id: true, title: true },
    });
  }

  const history = await prisma.aIMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: historyLimit,
    select: { role: true, content: true },
  });

  await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: message,
    },
  });

  /* ---- ask Gemini through the role-specific analysis ---- */

  try {
    const answer = await analyze(
      message,
      history
        .reverse()
        .map((entry) => ({
          role: entry.role === "USER" ? ("user" as const) : ("model" as const),
          text: entry.content,
        }))
    );

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
    if (error instanceof GeminiNotConfiguredError) {
      return NextResponse.json(
        { error: error.message, code: "AI_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    if (error instanceof GeminiProviderError) {
      return NextResponse.json(
        { error: error.message, code: "AI_PROVIDER_ERROR" },
        { status: 502 }
      );
    }

    throw error;
  }
}
