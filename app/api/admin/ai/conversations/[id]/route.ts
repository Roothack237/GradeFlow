import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { badRequest, notFound, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/** Loads a conversation only when it belongs to the signed-in admin. */
async function findConversation(id: string, userId: string) {
  return prisma.aIConversation.findFirst({
    where: { id, userId },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
}

/** GET /api/admin/ai/conversations/[id] — the full message history. */
export async function GET(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const conversation = await findConversation(id, guard.user.id);

    if (!conversation) return notFound("Conversation not found.");

    const messages = await prisma.aIMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    return serverError("ADMIN AI CONVERSATION ERROR", error);
  }
}

/** PATCH /api/admin/ai/conversations/[id] — rename the conversation. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const title = str(body.title);

    if (!title) return badRequest("A title is required.");

    const conversation = await findConversation(id, guard.user.id);

    if (!conversation) return notFound("Conversation not found.");

    const updated = await prisma.aIConversation.update({
      where: { id },
      data: { title: title.slice(0, 80) },
      select: { id: true, title: true, updatedAt: true },
    });

    return NextResponse.json({ message: "Conversation renamed.", conversation: updated });
  } catch (error) {
    return serverError("ADMIN AI CONVERSATION UPDATE ERROR", error);
  }
}

/** DELETE /api/admin/ai/conversations/[id] — deletes the conversation. */
export async function DELETE(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const conversation = await findConversation(id, guard.user.id);

    if (!conversation) return notFound("Conversation not found.");

    await prisma.aIConversation.delete({ where: { id } });

    return NextResponse.json({ message: "Conversation deleted." });
  } catch (error) {
    return serverError("ADMIN AI CONVERSATION DELETE ERROR", error);
  }
}
