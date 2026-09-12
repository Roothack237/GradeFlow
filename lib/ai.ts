/**
 * Minimal OpenAI-compatible client for the admin AI assistant.
 *
 * The API key always comes from the environment (`AI_API_KEY`); the optional
 * `AI_BASE_URL` and `AI_MODEL` environment variables make it possible to point
 * the assistant at any compatible provider. No response is ever invented: when
 * the provider is not configured or fails, the caller receives an explicit
 * error instead of a fabricated answer.
 */

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function isAiConfigured() {
  return Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.trim());
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "The AI assistant is not configured. Set the AI_API_KEY environment variable on the server to enable it."
    );
    this.name = "AiNotConfiguredError";
  }
}

export class AiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderError";
  }
}

/**
 * Sends the conversation to the provider and returns the assistant reply.
 * Throws AiNotConfiguredError when no key is set and AiProviderError when the
 * provider rejects the request.
 */
export async function askAi(
  messages: AiChatMessage[],
  options?: { timeoutMs?: number }
): Promise<{ content: string; model: string }> {
  if (!isAiConfigured()) throw new AiNotConfiguredError();

  const baseUrl = (
    process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/$/, "");

  const model = process.env.AI_MODEL?.trim() || "gpt-4o-mini";

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options?.timeoutMs ?? 30000
  );

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");

      throw new AiProviderError(
        `The AI provider rejected the request (status ${response.status}). ${
          detail ? detail.slice(0, 300) : ""
        }`.trim()
      );
    }

    const payload = await response.json().catch(() => null);

    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      throw new AiProviderError(
        "The AI provider returned an empty response."
      );
    }

    return { content: content.trim(), model: payload?.model ?? model };
  } catch (error) {
    if (error instanceof AiProviderError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new AiProviderError("The AI provider took too long to answer.");
    }

    throw new AiProviderError(
      error instanceof Error
        ? `The AI provider could not be reached: ${error.message}`
        : "The AI provider could not be reached."
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** The system prompt: the assistant only reasons about the supplied context. */
export const AI_SYSTEM_PROMPT = `You are the GradeFlow admin assistant. You help a school administrator understand the school data that is provided to you as JSON.

Rules:
- Use only the data in the provided context. If something is not in the context, say that the information is not available in the current context instead of guessing.
- Never invent student names, marks, or statistics.
- Quote real numbers from the context and explain what they mean.
- Answer in a concise, professional tone, using short paragraphs or bullet lists.
- When the question is outside school management, say that you can only help with the school data.`;
