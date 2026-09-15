import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireParentChild } from "@/lib/parent-child";

/**
 * GET /api/parent/timetable?studentId=
 *
 * The weekly timetable of the child's class. Only classes whose timetable
 * has been PUBLISHED by an administrator are returned.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const studentId = searchParams.get("studentId")?.trim() || "";

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required." },
        { status: 400 }
      );
    }

    const guard = await requireParentChild(studentId);
    if (!guard.ok) return guard.response;

    const { student } = guard;

    if (!student.classroom) {
      return NextResponse.json({
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
        },
        class: null,
        published: false,
        entries: [],
      });
    }

    const publication = await prisma.timetablePublication.findFirst({
      where: { classroomId: student.classroom.id, status: "PUBLISHED" },
      include: { term: { select: { name: true } } },
    });

    const entries = await prisma.timetable.findMany({
      where: {
        classroomId: student.classroom.id,
        ...(publication
          ? { termId: publication.termId }
          : { classroom: { timetablePublications: { none: {} } } }),
      },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { fullName: true } },
        term: { select: { name: true } },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        matricule: student.matricule,
      },
      class: student.classroom.name,
      section: student.classroom.section.name,
      published: Boolean(publication),
      term: publication?.term.name ?? null,
      publishedAt: publication?.publishedAt ?? null,
      entries: publication
        ? entries.map((entry) => ({
            id: entry.id,
            day: entry.day,
            startTime: entry.startTime,
            endTime: entry.endTime,
            room: entry.room,
            subject: entry.subject.name,
            teacher: entry.teacher.fullName,
            term: entry.term.name,
          }))
        : [],
    });
  } catch (error) {
    console.error("PARENT TIMETABLE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load the timetable." },
      { status: 500 }
    );
  }
}
