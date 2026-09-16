/**
 * Student lifecycle helpers — single source of truth for the ACTIVE /
 * SUSPENDED / DISMISSED behaviour used across the API routes, the report
 * card generator and the admin/teacher UI.
 *
 * The values mirror the `AccountStatus` enum of prisma/schema.prisma.
 *
 * Rules implemented everywhere:
 *
 *   ACTIVE     the student is enrolled: normal academic operations continue.
 *   SUSPENDED  the student (and every mark, attendance record, report card
 *              and parent link) stays in the database, is clearly flagged in
 *              the UI, and is excluded from the operations that require an
 *              actively enrolled student (new marks, new attendance, current
 *              class report cards).
 *   DISMISSED  same as SUSPENDED, permanently: the record is kept for the
 *              historical archive and is never deleted.
 *   PENDING    registered but not confirmed (kept for accounts).
 */

export const STUDENT_STATUSES = [
  "ACTIVE",
  "SUSPENDED",
  "DISMISSED",
  "PENDING",
] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];

/**
 * Type-only import: keeps this module usable from client components without
 * bundling the Prisma client.
 */
import type { AccountStatus } from "@prisma/client";

/** The only status that counts as an actively enrolled student. */
export const ENROLLED_STATUS: StudentStatus = "ACTIVE";

/** Statuses that keep a student's history but bar current operations. */
export const INACTIVE_STATUSES: StudentStatus[] = ["SUSPENDED", "DISMISSED"];

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DISMISSED: "Dismissed",
  PENDING: "Pending",
};

/** Human readable explanation shown in the admin UI. */
export const STUDENT_STATUS_DESCRIPTIONS: Record<StudentStatus, string> = {
  ACTIVE: "Currently enrolled — normal academic operations continue.",
  SUSPENDED:
    "Temporarily barred from class. Marks, attendance, results and history are preserved.",
  DISMISSED:
    "Permanently removed from the current rolls. The academic history is archived and preserved.",
  PENDING: "Registered, waiting for confirmation.",
};

export function isStudentStatus(value: unknown): value is StudentStatus {
  return (
    typeof value === "string" &&
    (STUDENT_STATUSES as readonly string[]).includes(value)
  );
}

/** True only for an actively enrolled student. */
export function isEnrolled(status: string | null | undefined): boolean {
  return status === ENROLLED_STATUS;
}

/**
 * Prisma filter that restricts a student query to actively enrolled students.
 *
 * Used by every operation that requires an actively enrolled student: the
 * report card generator of the current year, the teacher mark/attendance
 * sheets, and the class roll calls.
 */
export function enrolledOnly(): { status: AccountStatus } {
  return { status: ENROLLED_STATUS as AccountStatus };
}

/** Prisma filter for the students whose history must still be listed. */
export function notEnrolled(): { status: { not: AccountStatus } } {
  return { status: { not: ENROLLED_STATUS as AccountStatus } };
}

/** True for suspended / dismissed students (historical record only). */
export function isInactive(status: string | null | undefined): boolean {
  return status === "SUSPENDED" || status === "DISMISSED";
}

/* =========================================================
   ACTIONS
========================================================= */

export type StudentStatusAction = "SUSPEND" | "DISMISS" | "REACTIVATE";

export const STATUS_ACTION_TARGET: Record<StudentStatusAction, StudentStatus> =
  {
    SUSPEND: "SUSPENDED",
    DISMISS: "DISMISSED",
    REACTIVATE: "ACTIVE",
  };

/** Which actions are offered for a given status (admin UI + API guard). */
export function availableStatusActions(
  status: string | null | undefined
): StudentStatusAction[] {
  switch (status) {
    case "ACTIVE":
      return ["SUSPEND", "DISMISS"];
    case "SUSPENDED":
      return ["REACTIVATE", "DISMISS"];
    case "DISMISSED":
      return ["REACTIVATE"];
    default:
      return ["REACTIVATE"];
  }
}

/** A reason is required to suspend or dismiss, optional when reactivating. */
export function requiresReason(action: StudentStatusAction): boolean {
  return action === "SUSPEND" || action === "DISMISS";
}

/**
 * The audit action recorded for a status change. The project already has one
 * audit action for student status changes, so it is reused instead of adding
 * a new one.
 */
export const STUDENT_STATUS_AUDIT_ACTION = "STUDENT_STATUS_CHANGED";

/* =========================================================
   UI TONES
========================================================= */

/** Badge tones of components/admin/ui. */
export const STUDENT_STATUS_TONES: Record<
  StudentStatus,
  "green" | "amber" | "red" | "gray"
> = {
  ACTIVE: "green",
  SUSPENDED: "amber",
  DISMISSED: "red",
  PENDING: "gray",
};

/** Tailwind classes for the portals that do not use the admin UI kit. */
export const STUDENT_STATUS_BADGE_CLASSES: Record<StudentStatus, string> = {
  ACTIVE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  SUSPENDED: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  DISMISSED: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  PENDING: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export function statusLabel(status: string | null | undefined): string {
  return isStudentStatus(status)
    ? STUDENT_STATUS_LABELS[status]
    : String(status ?? "—");
}

export function statusTone(
  status: string | null | undefined
): "green" | "amber" | "red" | "gray" {
  return isStudentStatus(status) ? STUDENT_STATUS_TONES[status] : "gray";
}

export function statusBadgeClasses(status: string | null | undefined): string {
  return isStudentStatus(status)
    ? STUDENT_STATUS_BADGE_CLASSES[status]
    : STUDENT_STATUS_BADGE_CLASSES.PENDING;
}

export function actionLabel(action: StudentStatusAction): string {
  switch (action) {
    case "SUSPEND":
      return "Suspend";
    case "DISMISS":
      return "Dismiss";
    case "REACTIVATE":
      return "Reactivate";
  }
}
