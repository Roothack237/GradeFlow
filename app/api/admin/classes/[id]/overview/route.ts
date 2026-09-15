import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { PASS_MARK, gradeOf, round2 } from "@/lib/grading";

/**
 * GET /api/admin/classes/[id]/overview
 *
 * The complete class page data (Phase 8): class information, subjects,
 * teachers, students, attendance statistics, academic performance and the
 * class timetable with its publication state.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        section: { select: { name: true } },
        academicYear: { select: { id: true, name: true, isActive: true } },
        assignments: {
          include: {
            subject: { select: { id: true, name: true, code: true, coefficient: true } },
            teacher: {
              select: {
                id: true,
                fullName: true,
                teacherId: true,
                email: true,
              },
            },
          },
          orderBy: { subject: { name: "asc" } },
        },
        students: {
          where: { status: { not: "SUSPENDED" } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            gender: true,
            dateOfBirth: true,
            parent: { select: { fullName: true, phone: true } },
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const studentIds = classroom.students.map((student) => student.id);

    const [marks, attendances, timetable, publications] = await Promise.all([
      studentIds.length
        ? prisma.mark.findMany({
            where: { studentId: { in: studentIds } },
            select: {
              average: true,
              studentId: true,
              subjectId: true,
              subject: { select: { name: true } },
              sequence: {
                select: {
                  name: true,
                  order: true,
                  term: { select: { name: true, order: true } },
                },
              },
            },
          })
        : Promise.resolve([]),
      studentIds.length
        ? prisma.attendance.findMany({
            where: { studentId: { in: studentIds } },
            select: { status: true, studentId: true, subjectId: true },
          })
        : Promise.resolve([]),
      prisma.timetable.findMany({
        where: { classroomId: id },
        include: {
          subject: { select: { name: true } },
          teacher: { select: { fullName: true } },
          term: { select: { id: true, name: true } },
        },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      }),
      prisma.timetablePublication.findMany({
        where: { classroomId: id },
        include: { term: { select: { id: true, name: true } } },
      }),
    ]);

    /* ---- academic performance ---- */

    const subjectById = new Map(
      classroom.assignments.map((assignment) => [assignment.subject.id, assignment.subject])
    );

    const performance = {
      marksRecorded: marks.length,
      average: marks.length
        ? round2(marks.reduce((total, mark) => total + mark.average, 0) / marks.length)
        : null,
      passRate: marks.length
        ? round2(
            (marks.filter((mark) => mark.average >= PASS_MARK).length / marks.length) * 100
          )
        : null,
      bySubject: Array.from(
        marks
          .reduce((map, mark) => {
            const entry = map.get(mark.subject.name) ?? { total: 0, count: 0 };
            entry.total += mark.average;
            entry.count += 1;
            map.set(mark.subject.name, entry);
            return map;
          }, new Map<string, { total: number; count: number }>())
          .entries()
      )
        .map(([subject, value]) => ({
          subject,
          average: round2(value.total / value.count),
          marks: value.count,
        }))
        .sort((a, b) => a.subject.localeCompare(b.subject)),
      bySequence: Array.from(
        marks
          .reduce((map, mark) => {
            const key = `${mark.sequence.term.name} · ${mark.sequence.name}`;
            const entry = map.get(key) ?? {
              order: mark.sequence.term.order * 10 + mark.sequence.order,
              total: 0,
              count: 0,
            };
            entry.total += mark.average;
            entry.count += 1;
            map.set(key, entry);
            return map;
          }, new Map<string, { order: number; total: number; count: number }>())
          .entries()
      )
        .map(([sequence, value]) => ({
          sequence,
          average: round2(value.total / value.count),
          marks: value.count,
        }))
        .sort((a, b) => a.sequence.localeCompare(b.sequence)),
    };

    /* ---- attendance statistics ---- */

    const attendanceCounts = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };

    for (const record of attendances) attendanceCounts[record.status] += 1;

    const attendanceTotal = Object.values(attendanceCounts).reduce(
      (total, value) => total + value,
      0
    );

    /* per-student absence hours for the student table */
    const absenceByStudent = new Map<string, number>();
    const lateByStudent = new Map<string, number>();
    const averageByStudent = new Map<string, { total: number; count: number }>();

    for (const record of attendances) {
      if (record.status === "ABSENT") {
        absenceByStudent.set(record.studentId, (absenceByStudent.get(record.studentId) ?? 0) + 1);
      } else if (record.status === "LATE") {
        lateByStudent.set(record.studentId, (lateByStudent.get(record.studentId) ?? 0) + 1);
      }
    }

    for (const mark of marks) {
      const entry = averageByStudent.get(mark.studentId) ?? { total: 0, count: 0 };
      entry.total += mark.average;
      entry.count += 1;
      averageByStudent.set(mark.studentId, entry);
    }

    return NextResponse.json({
      classroom: {
        id: classroom.id,
        name: classroom.name,
        section: classroom.section.name,
        academicYear: classroom.academicYear,
        students: classroom.students.length,
        subjects: subjectById.size,
        teachers: new Set(classroom.assignments.map((a) => a.teacher.id)).size,
      },
      subjects: Array.from(subjectById.values()).sort((a, b) => a.name.localeCompare(b.name)),
      teachers: Array.from(
        classroom.assignments
          .reduce((map, assignment) => {
            const entry = map.get(assignment.teacher.id) ?? {
              id: assignment.teacher.id,
              fullName: assignment.teacher.fullName,
              teacherId: assignment.teacher.teacherId,
              email: assignment.teacher.email,
              subjects: [] as string[],
            };

            if (!entry.subjects.includes(assignment.subject.name)) {
              entry.subjects.push(assignment.subject.name);
            }

            map.set(assignment.teacher.id, entry);
            return map;
          }, new Map<string, {
            id: string;
            fullName: string;
            teacherId: string;
            email: string;
            subjects: string[];
          }>())
          .values()
      ).sort((a, b) => a.fullName.localeCompare(b.fullName)),
      students: classroom.students.map((student) => {
        const average = averageByStudent.get(student.id);

        return {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          matricule: student.matricule,
          gender: student.gender,
          parent: student.parent?.fullName ?? null,
          parentPhone: student.parent?.phone ?? null,
          average: average ? round2(average.total / average.count) : null,
          grade: average ? gradeOf(average.total / average.count) : null,
          hoursAbsent: absenceByStudent.get(student.id) ?? 0,
          hoursLate: lateByStudent.get(student.id) ?? 0,
        };
      }),
      attendance: {
        records: attendanceTotal,
        ...attendanceCounts,
        rate: attendanceTotal
          ? round2(
              ((attendanceCounts.PRESENT + attendanceCounts.LATE) / attendanceTotal) * 100
            )
          : null,
      },
      performance,
      timetable: timetable.map((entry) => ({
        id: entry.id,
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room,
        subject: entry.subject.name,
        teacher: entry.teacher.fullName,
        term: entry.term.name,
      })),
      publications: publications.map((publication) => ({
        id: publication.id,
        term: publication.term.name,
        status: publication.status,
        publishedAt: publication.publishedAt,
      })),
      scale: { maxMark: 20, passMark: PASS_MARK },
    });
  } catch (error) {
    console.error("CLASS OVERVIEW ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load the class overview." },
      { status: 500 }
    );
  }
}
