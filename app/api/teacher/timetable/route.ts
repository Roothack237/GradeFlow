import { NextResponse } from "next/server";
import { auth } from "@/auth";

import prisma from "@/lib/prisma";

/**
 * GET /api/teacher/timetable
 * Query: ?academicYearId= (defaults to the active year)
 *
 * The signed-in teacher's published timetable entries: subject, class, day,
 * start time, end time and room. Entries are only returned for classes whose
 * timetable has been PUBLISHED by an administrator for that term.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { teacher: true },
    });

    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Teacher account not found." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const requestedYearId = searchParams.get("academicYearId");

    const academicYear = requestedYearId
      ? await prisma.academicYear.findUnique({ where: { id: requestedYearId } })
      : await prisma.academicYear.findFirst({ where: { isActive: true } });

    if (!academicYear) {
      return NextResponse.json({
        academicYear: null,
        entries: [],
        publications: [],
      });
    }

    const [entries, publications] = await Promise.all([
      prisma.timetable.findMany({
        where: {
          teacherId: user.teacher.id,
          academicYearId: academicYear.id,
          classroom: {
            timetablePublications: {
              some: { status: "PUBLISHED" },
            },
          },
        },
        include: {
          classroom: { select: { id: true, name: true, section: { select: { name: true } } } },
          subject: { select: { id: true, name: true } },
          term: { select: { id: true, name: true } },
        },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      }),
      prisma.timetablePublication.findMany({
        where: {
          status: "PUBLISHED",
          term: { academicYearId: academicYear.id },
          classroom: { timetable: { some: { teacherId: user.teacher.id } } },
        },
        include: {
          classroom: { select: { id: true, name: true } },
          term: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      academicYear: { id: academicYear.id, name: academicYear.name },
      entries: entries.map((entry) => ({
        id: entry.id,
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room,
        subject: entry.subject.name,
        class: entry.classroom.name,
        section: entry.classroom.section.name,
        term: entry.term.name,
      })),
      publications: publications.map((publication) => ({
        id: publication.id,
        class: publication.classroom.name,
        term: publication.term.name,
        publishedAt: publication.publishedAt,
      })),
    });
  } catch (error) {
    console.error("TEACHER TIMETABLE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load the timetable." },
      { status: 500 }
    );
  }
}
