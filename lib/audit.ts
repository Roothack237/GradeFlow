import prisma from "@/lib/prisma";

export type AuditAction =
  | "STUDENT_CREATED"
  | "STUDENT_UPDATED"
  | "STUDENT_DELETED"
  | "STUDENT_STATUS_CHANGED"
  | "TEACHER_CREATED"
  | "TEACHER_UPDATED"
  | "TEACHER_DELETED"
  | "TEACHER_STATUS_CHANGED"
  | "PARENT_CREATED"
  | "PARENT_UPDATED"
  | "PARENT_DELETED"
  | "PARENT_APPROVED"
  | "PARENT_LINK_CHANGED"
  | "CLASS_CREATED"
  | "CLASS_UPDATED"
  | "CLASS_DELETED"
  | "SUBJECT_CREATED"
  | "SUBJECT_UPDATED"
  | "SUBJECT_DELETED"
  | "ACADEMIC_YEAR_CREATED"
  | "ACADEMIC_YEAR_UPDATED"
  | "ACADEMIC_YEAR_ACTIVATED"
  | "TERM_CREATED"
  | "TERM_UPDATED"
  | "SEQUENCE_CREATED"
  | "SEQUENCE_UPDATED"
  | "ASSIGNMENT_CREATED"
  | "ASSIGNMENT_UPDATED"
  | "ASSIGNMENT_DELETED"
  | "ATTENDANCE_RECORDED"
  | "ATTENDANCE_UPDATED"
  | "MARK_UPDATED"
  | "RESULT_PUBLISHED"
  | "RESULT_UNPUBLISHED"
  | "NOTIFICATION_SENT"
  | "NOTIFICATION_UPDATED"
  | "NOTIFICATION_DELETED"
  | "REPORT_GENERATED"
  | "FORUM_CATEGORY_CREATED"
  | "FORUM_CATEGORY_UPDATED"
  | "FORUM_CATEGORY_DELETED"
  | "FORUM_POST_PINNED"
  | "FORUM_POST_LOCKED"
  | "FORUM_POST_DELETED"
  | "FORUM_COMMENT_DELETED"
  | "TIMETABLE_ENTRY_CREATED"
  | "TIMETABLE_ENTRY_UPDATED"
  | "TIMETABLE_ENTRY_DELETED"
  | "TIMETABLE_PUBLISHED"
  | "TIMETABLE_UNPUBLISHED"
  | "AI_QUERY";

type AuditInput = {
  actorId?: string | null;
  actorName?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Record<string, unknown> | null;
};

/**
 * Records an administrative action.
 *
 * Auditing must never break the action it describes, so failures are logged
 * and swallowed. Credentials, login codes and secrets are never recorded.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        description: input.description,
        metadata: (input.metadata ?? undefined) as never,
      },
    });
  } catch (error) {
    console.error("AUDIT LOG ERROR:", error);
  }
}
