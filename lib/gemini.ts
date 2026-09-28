
import { GoogleGenAI } from "@google/genai";

import {
  buildAdminAiContext,
  buildParentAiContext,
  buildTeacherAiContext,
  renderContext,
} from "@/lib/ai-context";

/**
 * GradeFlow Gemini AI layer.
 *
 * All Gemini requests are made server-side.
 *
 * The model can be configured with:
 *
 * GEMINI_MODEL=gemini-3.8-flash
 *
 * If GEMINI_MODEL is not provided, GradeFlow uses gemini-3.8-flash.
 *
 * Temporary Gemini errors such as 503, 429 and 5xx are retried
 * automatically with exponential backoff.
 */

// ============================================================
// CONFIGURATION
// ============================================================

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() ||
  "gemini-3.8-flash";

const DEFAULT_TIMEOUT_MS = 45000;

const MAX_RETRIES = 3;

// ============================================================
// GEMINI CONFIGURATION CHECK
// ============================================================

export function isGeminiConfigured() {
  return Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim()
  );
}

// ============================================================
// ERRORS
// ============================================================

export class GeminiNotConfiguredError extends Error {
  constructor() {
    super(
      "The AI assistant is not configured. Set the GEMINI_API_KEY environment variable on the server to enable it."
    );

    this.name =
      "GeminiNotConfiguredError";
  }
}

export class GeminiProviderError extends Error {
  constructor(message: string) {
    super(message);

    this.name =
      "GeminiProviderError";
  }
}

// ============================================================
// CHAT MESSAGE TYPE
// ============================================================

export type GeminiChatMessage = {
  role: "user" | "model";
  text: string;
};

// ============================================================
// HELPER: WAIT
// ============================================================

function sleep(
  milliseconds: number
): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(
      resolve,
      milliseconds
    )
  );
}

// ============================================================
// HELPER: EXTRACT HTTP STATUS
// ============================================================

function getErrorStatus(
  error: unknown
): number | null {
  if (!error) {
    return null;
  }

  // Some SDK errors expose status directly.
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error
  ) {
    const status = Number(
      (error as { status?: unknown }).status
    );

    if (Number.isFinite(status)) {
      return status;
    }
  }

  // Other SDK errors include the HTTP status
  // inside the error message.
  if (error instanceof Error) {
    const match =
      error.message.match(
        /\b(408|429|500|502|503|504)\b/
      );

    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

// ============================================================
// HELPER: SHOULD RETRY?
// ============================================================

function shouldRetry(
  error: unknown
): boolean {
  const status =
    getErrorStatus(error);

  // Gemini recommends retrying transient errors
  // such as 429 and 5xx.
  if (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }

  return false;
}

// ============================================================
// LOW-LEVEL GEMINI CALL
// ============================================================

export async function askGemini(options: {
  system: string;
  context: string;
  messages: GeminiChatMessage[];
  timeoutMs?: number;
}): Promise<{
  content: string;
  model: string;
}> {
  if (!isGeminiConfigured()) {
    throw new GeminiNotConfiguredError();
  }

  const apiKey =
    process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new GeminiNotConfiguredError();
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const timeoutMs =
    options.timeoutMs ??
    DEFAULT_TIMEOUT_MS;

  // ==========================================================
  // RETRY LOOP
  // ==========================================================

  for (
    let attempt = 0;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    try {
      const response =
        await ai.models.generateContent({
          model: GEMINI_MODEL,

          contents:
            options.messages
              .filter(
                (message) =>
                  message.text
                    .trim()
                    .length > 0
              )
              .map((message) => ({
                role: message.role,

                parts: [
                  {
                    text: message.text,
                  },
                ],
              })),

          config: {
            systemInstruction:
              `${options.system}\n\n` +
              `Current GradeFlow data (JSON):\n` +
              `${options.context}`,

            temperature: 0.2,

            abortSignal:
              controller.signal,
          },
        });

      const content =
        response.text?.trim();

      if (!content) {
        throw new GeminiProviderError(
          "Gemini returned an empty response."
        );
      }

      return {
        content,

        model:
          response.modelVersion ??
          GEMINI_MODEL,
      };
    } catch (error) {
      // ------------------------------------------------------
      // Our own provider error
      // ------------------------------------------------------

      if (
        error instanceof
        GeminiProviderError
      ) {
        throw error;
      }

      // ------------------------------------------------------
      // Timeout
      // ------------------------------------------------------

      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new GeminiProviderError(
          "Gemini took too long to answer. Please try again."
        );
      }

      // ------------------------------------------------------
      // Temporary Gemini error
      // ------------------------------------------------------

      const retryable =
        shouldRetry(error);

      const hasRetriesLeft =
        attempt < MAX_RETRIES;

      if (
        retryable &&
        hasRetriesLeft
      ) {
        /*
         * Exponential backoff:
         *
         * attempt 0 → 1 second
         * attempt 1 → 2 seconds
         * attempt 2 → 4 seconds
         *
         * A small random amount is added so
         * repeated requests do not all retry
         * at exactly the same moment.
         */

        const baseDelay =
          1000 *
          Math.pow(
            2,
            attempt
          );

        const jitter =
          Math.floor(
            Math.random() * 500
          );

        const delay =
          baseDelay + jitter;

        console.warn(
          `Gemini temporary error. ` +
            `Retrying in ${delay}ms ` +
            `(attempt ${
              attempt + 1
            }/${MAX_RETRIES})...`
        );

        await sleep(delay);

        continue;
      }

      // ------------------------------------------------------
      // Final error
      // ------------------------------------------------------

      throw new GeminiProviderError(
        error instanceof Error
          ? `Gemini could not be reached: ${error.message}`
          : "Gemini could not be reached."
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // This should never be reached.
  throw new GeminiProviderError(
    "Gemini could not be reached after multiple attempts."
  );
}

// ============================================================
// SHARED RULES
// ============================================================

const SHARED_RULES = `
Rules:

- Use only the data in the provided context.
- If something is not in the context, say that the information is not available in the current context instead of guessing.
- Never invent student names, marks, attendance figures or statistics.
- Quote real numbers from the context and explain what they mean.
- Answer in a concise, professional tone.
- Use short paragraphs or bullet lists.
- When the question is outside school management, say that you can only help with the school data.
`;

// ============================================================
// TEACHER PROMPT
// ============================================================

export const TEACHER_SYSTEM_PROMPT = `
You are the GradeFlow teacher AI assistant.

You help teachers understand:

- their assigned classes
- their assigned subjects
- student marks
- class averages
- subject averages
- attendance
- performance trends
- high-performing students
- students who may need attention

You can suggest educational interventions and study strategies based only on the available GradeFlow data.

${SHARED_RULES}
`;

// ============================================================
// PARENT PROMPT
// ============================================================

export const PARENT_SYSTEM_PROMPT = `
You are the GradeFlow parent AI assistant.

You help parents and guardians understand their child's school data:

- marks
- subjects
- report cards
- attendance
- performance trends
- strengths
- weaknesses

Explain academic information in simple language and suggest practical ways a parent can support the child at home.

${SHARED_RULES}
`;

// ============================================================
// ADMIN PROMPT
// ============================================================

export const ADMIN_SYSTEM_PROMPT = `
You are the GradeFlow administrator AI assistant.

You help school administrators understand:

- class performance
- section performance
- academic-year performance
- attendance
- student performance
- teacher workload
- academic problems

You can suggest concrete school-management interventions based only on the available GradeFlow data.

${SHARED_RULES}
`;

// ============================================================
// TEACHER ANALYSIS
// ============================================================

export async function generateTeacherAnalysis(options: {
  teacherId: string;
  question: string;
  history?: GeminiChatMessage[];
  timeoutMs?: number;
}) {
  const context =
    await buildTeacherAiContext(
      options.teacherId
    );

  return askGemini({
    system:
      TEACHER_SYSTEM_PROMPT,

    context:
      renderContext(context),

    messages: [
      ...(options.history ?? []),

      {
        role: "user",
        text: options.question,
      },
    ],

    timeoutMs:
      options.timeoutMs,
  });
}

// ============================================================
// PARENT ANALYSIS
// ============================================================

export async function generateParentAnalysis(options: {
  parentId: string;
  question: string;
  history?: GeminiChatMessage[];
  timeoutMs?: number;
}) {
  const context =
    await buildParentAiContext(
      options.parentId
    );

  return askGemini({
    system:
      PARENT_SYSTEM_PROMPT,

    context:
      renderContext(context),

    messages: [
      ...(options.history ?? []),

      {
        role: "user",
        text: options.question,
      },
    ],

    timeoutMs:
      options.timeoutMs,
  });
}

// ============================================================
// ADMIN ANALYSIS
// ============================================================

export async function generateAdminAnalysis(options: {
  question: string;
  history?: GeminiChatMessage[];
  timeoutMs?: number;
}) {
  const context =
    await buildAdminAiContext();

  return askGemini({
    system:
      ADMIN_SYSTEM_PROMPT,

    context:
      renderContext(context),

    messages: [
      ...(options.history ?? []),

      {
        role: "user",
        text: options.question,
      },
    ],

    timeoutMs:
      options.timeoutMs,
  });
}
