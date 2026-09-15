import { NextResponse } from "next/server";
import { auth } from "@/auth";

import prisma from "@/lib/prisma";
import { runAiChat } from "@/lib/ai-chat";
import { generateParentAnalysis, isGeminiConfigured } from "@/lib/gemini";

/**
 * POST /api/ai/parent
 * Body: { message: string, conversationId?: string }
 *
 * Parent AI assistant. The analysis is grounded in the parent's real
 * GradeFlow data (children, marks, attendance, report cards) and both turns
 * are stored in the database.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        status: true,
        parent: { select: { id: true } },
      },
    });

    if (!user || user.role !== "PARENT" || !user.parent) {
      return NextResponse.json(
        { error: "Parent access required." },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "This parent account is suspended." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const conversationId =
      typeof body?.conversationId === "string" ? body.conversationId : null;

    return await runAiChat({
      userId: user.id,
      message,
      conversationId,
      analyze: (question, history) =>
        generateParentAnalysis({
          parentId: user.parent!.id,
          question,
          history,
        }),
    });
  } catch (error) {
    console.error("PARENT AI CHAT ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong on the server. Please try again." },
      { status: 500 }
    );
  }
}

/** GET /api/ai/parent — reports whether the AI assistant is configured. */
export async function GET() {
  return NextResponse.json({ configured: isGeminiConfigured() });
}
