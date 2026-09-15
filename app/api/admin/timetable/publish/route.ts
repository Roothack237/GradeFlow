import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { createManyNotifications } from "@/lib/notifications";

/**
 * POST /api/admin/timetable/publish
 * Body: {
 *   termId: string,
 *   classroomId: string | "all",
 *   action: "PUBLISH" | "UNPUBLISH",
 *   room?: string,   // optional room applied to every entry of the class
 *   notes?: string
 * }
 *
 * Publishing a class timetable makes it visible to the affected teachers
 * (and to the parents of the class) and notifies those teachers through the
 * existing notification system.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => ({}));

    const termId = typeof body?.termId === "string" ? body.termId : "";
    const classroomId = typeof body?.classroomId === "string" ? body.classroomId : "";
    const action = body?.action === "UNPUBLISH" ? "UNPUBLISH" : "PUBLISH";
    const room =
      typeof body?.room === "string" && body.room.trim() ? body.room.trim() : null;
    const notes =
      typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

    if (!termId || !classroomId) {
      return NextResponse.json(
        { error: "termId and classroomId (or \"all\") are required." },
        { status: 400 }
      );
    }

    const term = await prisma.term.findUnique({
      where: { id: termId },
      include: { academicYear: { select: { id: true, name: true } } },
    });

    if (!term) {
      return NextResponse.json({ error: "Term not found." }, { status: 404 });
    }

    /* Resolve the target classrooms: one class or every class with entries. */

    const classrooms = await prisma.classroom.findMany({
      where:
        classroomId === "all"
          ? { academicYearId: term.academicYear.id, timetable: { some: { termId } } }
          : { id: classroomId, academicYearId: term.academicYear.id },
      select: { id: true, name: true },
    });

    if (!classrooms.length) {
      return NextResponse.json(
        { error: "No class matches this request for the selected term." },
        { status: 404 }
      );
    }

    let updated = 0;
    let notified = 0;

    for (const classroom of classrooms) {
      const entryCount = await prisma.timetable.count({
        where: { termId, classroomId: classroom.id },
      });

      if (entryCount === 0) {
        continue;
      }

      if (room) {
        await prisma.timetable.updateMany({
          where: { termId, classroomId: classroom.id },
          data: { room },
        });
      }

      await prisma.timetablePublication.upsert({
        where: { termId_classroomId: { termId, classroomId: classroom.id } },
        update: {
          status: action === "PUBLISH" ? "PUBLISHED" : "UNPUBLISHED",
          publishedById: action === "PUBLISH" ? guard.user.id : null,
          publishedAt: action === "PUBLISH" ? new Date() : null,
          notes,
        },
        create: {
          termId,
          classroomId: classroom.id,
          status: action === "PUBLISH" ? "PUBLISHED" : "UNPUBLISHED",
          publishedById: action === "PUBLISH" ? guard.user.id : null,
          publishedAt: action === "PUBLISH" ? new Date() : null,
          notes,
        },
      });

      updated += 1;

      /* Notify the affected teachers when publishing. */

      if (action === "PUBLISH") {
        const entries = await prisma.timetable.findMany({
          where: { termId, classroomId: classroom.id },
          select: { teacherId: true },
        });

        const teacherIds = Array.from(new Set(entries.map((entry) => entry.teacherId)));

        const teachers = teacherIds.length
          ? await prisma.teacher.findMany({
              where: { id: { in: teacherIds } },
              select: { userId: true },
            })
          : [];

        const message =
          `The ${classroom.name} timetable for ${term.name} (${term.academicYear.name}) has been published.` +
          (room ? ` Lessons take place in ${room}.` : "");

        const result = await createManyNotifications(
          teachers.map((teacher) => teacher.userId),
          {
            title: "Timetable published",
            message,
            type: "ANNOUNCEMENT",
            senderId: guard.user.id,
            relatedType: "TIMETABLE_PUBLICATION",
            relatedId: classroom.id,
            actionUrl: "/teacher/timetable",
          }
        );

        notified += result.count;
      }
    }

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: action === "PUBLISH" ? "TIMETABLE_PUBLISHED" : "TIMETABLE_UNPUBLISHED",
      entityType: "TimetablePublication",
      entityId: termId,
      description:
        action === "PUBLISH"
          ? `Published the timetable of ${updated} class(es) for ${term.name} (${term.academicYear.name}).`
          : `Unpublished the timetable of ${updated} class(es) for ${term.name} (${term.academicYear.name}).`,
      metadata: { termId, classroomId, room, notified },
    });

    return NextResponse.json({
      success: true,
      action,
      updated,
      notified,
    });
  } catch (error) {
    console.error("TIMETABLE PUBLISH ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update the timetable publication." },
      { status: 500 }
    );
  }
}
