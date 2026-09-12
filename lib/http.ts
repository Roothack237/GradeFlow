import { NextResponse } from "next/server";

/**
 * Shared helpers for Admin API routes.
 *
 * Raw Prisma / database errors are never returned to the client: they are
 * logged on the server and replaced with a safe, generic message.
 */

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    details === undefined ? { error: message } : { error: message, details },
    { status: 400 }
  );
}

export function notFound(message = "Resource not found.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function serverError(scope: string, error: unknown) {
  console.error(`${scope}:`, error);

  return NextResponse.json(
    { error: "Something went wrong on the server. Please try again." },
    { status: 500 }
  );
}

/** Safe parse of an unknown JSON request body. */
export async function readJson(
  request: Request
): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return {};
    }

    return body as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function str(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

export function optionalStr(value: unknown): string | null {
  const text = str(value);
  return text.length ? text : null;
}

export function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(str(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function bool(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === 1;
}

/** Reads `page` / `pageSize` (or `limit`) with sane bounds. */
export function pagination(
  searchParams: URLSearchParams,
  defaultSize = 20,
  maxSize = 100
) {
  const page = Math.max(1, Math.floor(num(searchParams.get("page"), 1)));
  const rawSize =
    searchParams.get("pageSize") ?? searchParams.get("limit") ?? defaultSize;
  const pageSize = Math.min(
    maxSize,
    Math.max(1, Math.floor(num(rawSize, defaultSize)))
  );

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

/** Inclusive date range helpers used by attendance / report filters. */
export function dateFrom(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function endOfDay(value: string | null): Date | undefined {
  const parsed = dateFrom(value);
  if (!parsed) return undefined;
  parsed.setHours(23, 59, 59, 999);
  return parsed;
}

export function monthName(date: Date) {
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}
