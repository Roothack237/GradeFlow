import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireParentChild } from "@/lib/parent-child";
import { round2 } from "@/lib/grading";

/**
 * GET /api/parent/attendance?studentId=
 *
 * The child's attendance: overall summary (hours present / absent / late /
 * excused — one record is one lesson hour), per-subject breakdown and the
 * recent records.
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

    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { fullName: true } },
        sequence: { select: { name: true, term: { select: { name: true } } } },
      },
      orderBy: { date: "desc" },
      take: 500,
    });

    const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };

    for (const record of attendances) {
      summary[record.status] += 1;
    }

    const total = attendances.length;

    /* per-subject hours absent / late (drives the risk highlighting) */
    const bySubject = new Map<string, { present: number; absent: number; late: number; excused: number }>();

    for (const record of attendances) {
      const entry = bySubject.get(record.subject.name) ?? {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };

      if (record.status === "PRESENT") entry.present += 1;
      else if (record.status === "ABSENT") entry.absent += 1;
      else if (record.status === "LATE") entry.late += 1;
      else entry.excused += 1;

      bySubject.set(record.subject.name, entry);
    }

    return NextResponse.json({
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        matricule: student.matricule,
        class: student.classroom?.name ?? null,
        section: student.classroom?.section.name ?? null,
      },
      summary: {
        hoursPresent: summary.PRESENT,
        hoursAbsent: summary.ABSENT,
        hoursLate: summary.LATE,
        hoursExcused: summary.EXCUSED,
        records: total,
        rate: total
          ? round2(((summary.PRESENT + summary.LATE) / total) * 100)
          : null,
      },
      bySubject: Array.from(bySubject.entries())
        .map(([subject, value]) => ({
          subject,
          ...value,
          total: value.present + value.absent + value.late + value.excused,
        }))
        .sort((a, b) => b.absent + b.late - (a.absent + a.late)),
      records: attendances.slice(0, 100).map((record) => ({
        id: record.id,
        date: record.date,
        status: record.status,
        subject: record.subject.name,
        teacher: record.teacher.fullName,
        sequence: record.sequence.name,
        term: record.sequence.term.name,
      })),
    });
  } catch (error) {
    console.error("PARENT ATTENDANCE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load the attendance." },
      { status: 500 }
    );
  }
}
