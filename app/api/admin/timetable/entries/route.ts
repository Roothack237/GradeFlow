import { NextResponse } from "next/server";
import { WeekDay } from "@prisma/client";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/admin/timetable/entries
 * Body: {
 *   id?: string,          // update when provided, create otherwise
 *   academicYearId, termId, classroomId, subjectId, teacherId,
 *   day: WeekDay, startTime: "HH:MM", endTime: "HH:MM", room?: string
 * }
 *
 * Manual timetable entry creation (Phase 10: "Admin can create timetable").
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => ({}));

    const id = typeof body?.id === "string" && body.id ? body.id : null;
    const academicYearId =
      typeof body?.academicYearId === "string" ? body.academicYearId : "";
    const termId = typeof body?.termId === "string" ? body.termId : "";
    const classroomId = typeof body?.classroomId === "string" ? body.classroomId : "";
    const subjectId = typeof body?.subjectId === "string" ? body.subjectId : "";
    const teacherId = typeof body?.teacherId === "string" ? body.teacherId : "";
    const day = typeof body?.day === "string" ? body.day : "";
    const startTime = typeof body?.startTime === "string" ? body.startTime : "";
    const endTime = typeof body?.endTime === "string" ? body.endTime : "";
    const room =
      typeof body?.room === "string" && body.room.trim() ? body.room.trim() : null;

    if (!id && (!academicYearId || !termId)) {
      return NextResponse.json(
        { error: "Academic year and term are required." },
        { status: 400 }
      );
    }

    if (!classroomId || !subjectId || !teacherId || !day || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Class, subject, teacher, day, start time and end time are required." },
        { status: 400 }
      );
    }

    if (!Object.values(WeekDay).includes(day as WeekDay)) {
      return NextResponse.json({ error: "Invalid day." }, { status: 400 });
    }

    if (!/^\d{1,2}:\d{2}$/.test(startTime) || !/^\d{1,2}:\d{2}$/.test(endTime)) {
      return NextResponse.json(
        { error: "Times must use the HH:MM format." },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "The end time must be after the start time." },
        { status: 400 }
      );
    }

    /* Existing entry (for updates) resolves the year/term context. */

    let contextYearId = academicYearId;
    let contextTermId = termId;

    if (id) {
      const existing = await prisma.timetable.findUnique({ where: { id } });

      if (!existing) {
        return NextResponse.json({ error: "Entry not found." }, { status: 404 });
      }

      contextYearId = existing.academicYearId;
      contextTermId = existing.termId;
    }

    /* The classroom must belong to the academic year of the timetable. */

    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, academicYearId: contextYearId },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "The class does not belong to the selected academic year." },
        { status: 400 }
      );
    }

    /* Conflict checks: the class and the teacher must be free at that slot. */

    const conflicting = await prisma.timetable.findMany({
      where: {
        id: id ? { not: id } : undefined,
        termId: contextTermId,
        day: day as WeekDay,
        OR: [{ classroomId }, { teacherId }],
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });

    if (conflicting.length > 0) {
      return NextResponse.json(
        {
          error:
            "This slot conflicts with an existing entry for the same class or teacher.",
        },
        { status: 409 }
      );
    }

    const entry = id
      ? await prisma.timetable.update({
          where: { id },
          data: {
            classroomId,
            subjectId,
            teacherId,
            day: day as WeekDay,
            startTime,
            endTime,
            room,
          },
        })
      : await prisma.timetable.create({
          data: {
            academicYearId: contextYearId,
            termId: contextTermId,
            classroomId,
            subjectId,
            teacherId,
            day: day as WeekDay,
            startTime,
            endTime,
            room,
          },
        });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: id ? "TIMETABLE_ENTRY_UPDATED" : "TIMETABLE_ENTRY_CREATED",
      entityType: "Timetable",
      entityId: entry.id,
      description: `${id ? "Updated" : "Created"} a timetable entry for ${classroom.name} (${day}, ${startTime}–${endTime}).`,
      metadata: { classroomId, subjectId, teacherId, day, startTime, endTime, room },
    });

    return NextResponse.json({ success: true, entry }, { status: id ? 200 : 201 });
  } catch (error) {
    console.error("TIMETABLE ENTRIES POST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to save the timetable entry." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/timetable/entries
 * Body: { id: string }
 */
export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => ({}));

    const id = typeof body?.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json({ error: "Entry id is required." }, { status: 400 });
    }

    const entry = await prisma.timetable.findUnique({ where: { id } });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    await prisma.timetable.delete({ where: { id } });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "TIMETABLE_ENTRY_DELETED",
      entityType: "Timetable",
      entityId: id,
      description: "Deleted a timetable entry.",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("TIMETABLE ENTRIES DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete the timetable entry." },
      { status: 500 }
    );
  }
}
