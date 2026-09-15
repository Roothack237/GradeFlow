import { GoogleGenAI } from "@google/genai";

import {
  buildAdminAiContext,
  buildParentAiContext,
  buildTeacherAiContext,
  renderContext,
} from "@/lib/ai-context";

/**
 * GradeFlow's Gemini AI layer.
 *
 * All requests to Google Gemini go through this module (server side only).
 * The API key always comes from the environment (`GEMINI_API_KEY`); the
 * optional `GEMINI_MODEL` variable selects the model (default
 * `gemini-2.5-flash`). No answer is ever invented: when the provider is not
 * configured or fails, the caller receives an explicit error instead of a
 * fabricated analysis.
 */

export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
}

export class GeminiNotConfiguredError extends Error {
  constructor() {
    super(
      "The AI assistant is not configured. Set the GEMINI_API_KEY environment variable on the server to enable it."
    );
    this.name = "GeminiNotConfiguredError";
  }
}

export class GeminiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiProviderError";
  }
}

/** A single turn of the conversation, in Gemini role terms. */
export type GeminiChatMessage = {
  role: "user" | "model";
  text: string;
};

/** Low-level call to the official Google Gemini SDK. */
export async function askGemini(options: {
  system: string;
  context: string;
  messages: GeminiChatMessage[];
  timeoutMs?: number;
}): Promise<{ content: string; model: string }> {
  if (!isGeminiConfigured()) throw new GeminiNotConfiguredError();

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 45000);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: options.messages
        .filter((message) => message.text.trim().length > 0)
        .map((message) => ({
          role: message.role,
          parts: [{ text: message.text }],
        })),
      config: {
        systemInstruction: `${options.system}\n\nCurrent GradeFlow data (JSON):\n${options.context}`,
        temperature: 0.2,
        abortSignal: controller.signal,
      },
    });

    const content = response.text?.trim();

    if (!content) {
      throw new GeminiProviderError("Gemini returned an empty response.");
    }

    return { content, model: response.modelVersion ?? GEMINI_MODEL };
  } catch (error) {
    if (error instanceof GeminiProviderError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new GeminiProviderError("Gemini took too long to answer.");
    }

    throw new GeminiProviderError(
      error instanceof Error
        ? `Gemini could not be reached: ${error.message}`
        : "Gemini could not be reached."
    );
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================
   ROLE PROMPTS
========================================================= */

const SHARED_RULES = `
Rules:
- Use only the data in the provided context. If something is not in the context, say that the information is not available in the current context instead of guessing.
- Never invent student names, marks, attendance figures or statistics.
- Quote real numbers from the context and explain what they mean.
- Answer in a concise, professional tone, using short paragraphs or bullet lists.
- When the question is outside school management, say that you can only help with the school data.`;

export const TEACHER_SYSTEM_PROMPT = `You are the GradeFlow teacher AI assistant. You help a teacher understand their classes: class and subject averages, student marks, attendance records and performance trends. You identify weak and high-performing students, attendance problems, suggest interventions and study strategies, and summarize class performance.
${SHARED_RULES}`;

export const PARENT_SYSTEM_PROMPT = `You are the GradeFlow parent AI assistant. You help a parent or guardian understand their child's school data: report cards, marks per subject, attendance trends, strengths and weaknesses. You explain what the figures mean in plain language, recommend concrete ways to support the child at home, and highlight risk areas (failing subjects, repeated absences or lateness).
${SHARED_RULES}`;

export const ADMIN_SYSTEM_PROMPT = `You are the GradeFlow admin AI assistant. You help a school administrator understand the whole school: comparisons between classes, sections and academic years, attendance and performance issues, teacher workload, and you recommend concrete interventions.
${SHARED_RULES}`;

/* =========================================================
   REUSABLE ANALYSIS FUNCTIONS (real database data only)
========================================================= */

/**
 * Answers a teacher's question with an analysis grounded in their real
 * GradeFlow data: assigned classes and subjects, marks, attendance and
 * performance trends.
 */
export async function generateTeacherAnalysis(options: {
  teacherId: string;
  question: string;
  history?: GeminiChatMessage[];
  timeoutMs?: number;
}) {
  const context = await buildTeacherAiContext(options.teacherId);

  return askGemini({
    system: TEACHER_SYSTEM_PROMPT,
    context: renderContext(context),
    messages: [
      ...(options.history ?? []),
      { role: "user", text: options.question },
    ],
    timeoutMs: options.timeoutMs,
  });
}

/**
 * Answers a parent's question with an analysis grounded in their real
 * GradeFlow data: children, marks, attendance and report cards.
 */
export async function generateParentAnalysis(options: {
  parentId: string;
  question: string;
  history?: GeminiChatMessage[];
  timeoutMs?: number;
}) {
  const context = await buildParentAiContext(options.parentId);

  return askGemini({
    system: PARENT_SYSTEM_PROMPT,
    context: renderContext(context),
    messages: [
      ...(options.history ?? []),
      { role: "user", text: options.question },
    ],
    timeoutMs: options.timeoutMs,
  });
}

/**
 * Answers an administrator's question with an analysis grounded in real
 * school-wide data: class/section/year comparisons, attendance, performance
 * and teacher workload.
 */
export async function generateAdminAnalysis(options: {
  question: string;
  history?: GeminiChatMessage[];
  timeoutMs?: number;
}) {
  const context = await buildAdminAiContext();

  return askGemini({
    system: ADMIN_SYSTEM_PROMPT,
    context: renderContext(context),
    messages: [
      ...(options.history ?? []),
      { role: "user", text: options.question },
    ],
    timeoutMs: options.timeoutMs,
  });
}
