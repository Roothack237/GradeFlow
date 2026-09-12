import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import {
  badRequest,
  dateFrom,
  endOfDay,
  pagination,
  serverError,
  str,
} from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * Builds the attendance filter shared by the list and the statistics query.
 * Every filter is resolved through database relationships, never trusted
 * blindly from the client.
 */
function buildWhere(searchParams: URLSearchParams) {
  const studentId = str(searchParams.get("studentId"));
  const classroomId = str(searchParams.get("classroomId"));
  const sectionId = str(searchParams.get("sectionId"));
  const teacherId = str(searchParams.get("teacherId"));
  const subjectId = str(searchParams.get("subjectId"));
  const sequenceId = str(searchParams.get("sequenceId"));
  const termId = str(searchParams.get("termId"));
  const academicYearId = str(searchParams.get("academicYearId"));
  const status = str(searchParams.get("status"));
  const search = str(searchParams.get("search"));

  const from = dateFrom(searchParams.get("from"));
  const to = endOfDay(searchParams.get("to"));

  // Student relation filter: class / section filters and the free-text search
  // are merged so they can be combined safely.
  const studentFilter: Record<string, unknown> = {
    ...(studentId ? { id: studentId } : {}),
    ...(classroomId ? { classroomId } : {}),
    ...(sectionId ? { classroom: { sectionId } } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { matricule: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return {
    ...(Object.keys(studentFilter).length ? { student: studentFilter } : {}),
    ...(teacherId ? { teacherId } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(sequenceId ? { sequenceId } : {}),
    ...(status ? { status: status as never } : {}),
    ...(from || to
      ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
    ...(termId || academicYearId
      ? {
          sequence: {
            term: {
              ...(termId ? { id: termId } : {}),
              ...(academicYearId ? { academicYearId } : {}),
            },
          },
        }
      : {}),
  };
}

/**
 * GET /api/admin/attendance
 * Admin view of the attendance records teachers record, with filters,
 * statistics and optional pagination. Supports:
 *   studentId, classroomId, sectionId, teacherId, subjectId, sequenceId,
 *   termId, academicYearId, status, from, to, page, pageSize
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const where = buildWhere(searchParams);

    const wantsPagination =
      searchParams.has("page") || searchParams.has("pageSize");

    const { skip, take, page, pageSize } = pagination(searchParams, 25, 200);

    const [records, total, groups] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              matricule: true,
              classroom: { select: { id: true, name: true } },
            },
          },
          subject: { select: { id: true, name: true, code: true } },
          teacher: { select: { id: true, fullName: true } },
          sequence: {
            select: {
              id: true,
              name: true,
              term: {
                select: {
                  id: true,
                  name: true,
                  academicYear: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        ...(wantsPagination ? { skip, take } : {}),
      }),

      wantsPagination ? prisma.attendance.count({ where }) : Promise.resolve(0),

      prisma.attendance.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
    ]);

    const summary = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
      total: 0,
      rate: null as number | null,
    };

    for (const group of groups) {
      summary[group.status] = group._count._all;
      summary.total += group._count._all;
    }

    summary.rate =
      summary.total > 0
        ? Math.round(
            ((summary.PRESENT + summary.LATE) / summary.total) * 1000
          ) / 10
        : null;

    return NextResponse.json({
      attendance: records.map((record) => ({
        id: record.id,
        date: record.date,
        status: record.status,
        studentId: record.studentId,
        studentName: `${record.student.firstName} ${record.student.lastName}`.trim(),
        matricule: record.student.matricule,
        className: record.student.classroom?.name ?? null,
        classroomId: record.student.classroom?.id ?? null,
        subjectName: record.subject.name,
        subjectId: record.subjectId,
        teacherName: record.teacher.fullName,
        sequenceName: record.sequence.name,
        termName: record.sequence.term.name,
        academicYearName: record.sequence.term.academicYear.name,
        createdAt: record.createdAt,
      })),
      summary,
      ...(wantsPagination
        ? {
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
          }
        : {}),
    });
  } catch (error) {
    return serverError("ADMIN ATTENDANCE LIST ERROR", error);
  }
}

/**
 * POST /api/admin/attendance
 * Lets an administrator record (or correct) a single attendance entry.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();

    const studentId = str(body.studentId);
    const subjectId = str(body.subjectId);
    const sequenceId = str(body.sequenceId);
    const teacherId = str(body.teacherId);
    const status = str(body.status) || "PRESENT";
    const dateValue = str(body.date);

    if (!studentId || !subjectId || !sequenceId || !dateValue) {
      return badRequest(
        "Student, subject, sequence and date are required to record attendance."
      );
    }

    if (!["PRESENT", "ABSENT", "LATE", "EXCUSED"].includes(status)) {
      return badRequest("Invalid attendance status.");
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return badRequest("Please provide a valid date.");
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { classroom: true },
    });

    if (!student) return badRequest("Selected student does not exist.");

    let resolvedTeacherId = teacherId;

    if (!resolvedTeacherId) {
      const assignment = await prisma.teacherAssignment.findFirst({
        where: { classroomId: student.classroomId, subjectId },
        select: { teacherId: true },
      });

      if (!assignment) {
        return badRequest(
          "No teacher is assigned to this subject for the student's class."
        );
      }

      resolvedTeacherId = assignment.teacherId;
    }

    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_subjectId_date: { studentId, subjectId, date },
      },
    });

    const record = existing
      ? await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: status as never, sequenceId, teacherId: resolvedTeacherId },
        })
      : await prisma.attendance.create({
          data: {
            studentId,
            subjectId,
            teacherId: resolvedTeacherId,
            sequenceId,
            date,
            status: status as never,
          },
        });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: existing ? "ATTENDANCE_UPDATED" : "ATTENDANCE_RECORDED",
      entityType: "Attendance",
      entityId: record.id,
      description: `${existing ? "Updated" : "Recorded"} ${status.toLowerCase()} attendance for ${student.firstName} ${student.lastName}`,
      metadata: { subjectId, sequenceId, date: dateValue },
    });

    return NextResponse.json(
      {
        message: existing
          ? "Attendance updated successfully."
          : "Attendance recorded successfully.",
        attendance: record,
      },
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    return serverError("ADMIN ATTENDANCE CREATE ERROR", error);
  }
}
