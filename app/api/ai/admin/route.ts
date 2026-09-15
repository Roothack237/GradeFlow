import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { runAiChat } from "@/lib/ai-chat";
import { generateAdminAnalysis, isGeminiConfigured } from "@/lib/gemini";

/**
 * POST /api/ai/admin
 * Body: { message: string, conversationId?: string }
 *
 * Admin AI assistant. The analysis is grounded in real school-wide
 * GradeFlow data (class/section/year comparisons, attendance, performance,
 * teacher workload) and both turns are stored in the database.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => ({}));

    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const conversationId =
      typeof body?.conversationId === "string" ? body.conversationId : null;

    return await runAiChat({
      userId: guard.user.id,
      message,
      conversationId,
      analyze: (question, history) =>
        generateAdminAnalysis({ question, history }),
    });
  } catch (error) {
    console.error("ADMIN AI CHAT ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong on the server. Please try again." },
      { status: 500 }
    );
  }
}

/** GET /api/ai/admin — reports whether the AI assistant is configured. */
export async function GET() {
  return NextResponse.json({ configured: isGeminiConfigured() });
}
