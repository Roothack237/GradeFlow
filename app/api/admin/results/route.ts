import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { pagination, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/results
 * Review the marks recorded by teachers.
 *
 * Filters: termId, sequenceId, classroomId, sectionId, subjectId, teacherId,
 *          studentId, search, page, pageSize
 *
 * Each mark carries its publication state, resolved from the class + term and
 * class + sequence publication records.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const termId = str(searchParams.get("termId"));
    const sequenceId = str(searchParams.get("sequenceId"));
    const classroomId = str(searchParams.get("classroomId"));
    const sectionId = str(searchParams.get("sectionId"));
    const subjectId = str(searchParams.get("subjectId"));
    const teacherId = str(searchParams.get("teacherId"));
    const studentId = str(searchParams.get("studentId"));
    const search = str(searchParams.get("search"));

    const where = {
      ...(sequenceId ? { sequenceId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(studentId ? { studentId } : {}),
      ...(termId ? { sequence: { termId } } : {}),
      ...(classroomId || sectionId || search
        ? {
            student: {
              ...(classroomId ? { classroomId } : {}),
              ...(sectionId ? { classroom: { sectionId } } : {}),
              ...(search
                ? {
                    OR: [
                      { firstName: { contains: search, mode: "insensitive" as const } },
                      { lastName: { contains: search, mode: "insensitive" as const } },
                      { matricule: { contains: search, mode: "insensitive" as const } },
                    ],
                  }
                : {}),
            },
          }
        : {}),
    };

    const wantsPagination =
      searchParams.has("page") || searchParams.has("pageSize");

    const { skip, take, page, pageSize } = pagination(searchParams, 25, 200);

    const [marks, total, aggregate] = await Promise.all([
      prisma.mark.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              matricule: true,
              classroom: {
                select: {
                  id: true,
                  name: true,
                  section: { select: { id: true, name: true } },
                },
              },
            },
          },
          subject: { select: { id: true, name: true, code: true, coefficient: true } },
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
        orderBy: [{ sequence: { order: "asc" } }, { updatedAt: "desc" }],
        ...(wantsPagination ? { skip, take } : {}),
      }),

      wantsPagination ? prisma.mark.count({ where }) : Promise.resolve(0),

      prisma.mark.aggregate({
        where,
        _avg: { average: true },
        _count: { _all: true },
      }),
    ]);

    /* ---- publication state for the classes/terms in this page ---- */

    const classroomIds = Array.from(
      new Set(marks.map((mark) => mark.student.classroom?.id).filter(Boolean))
    ) as string[];

    const termIds = Array.from(
      new Set(marks.map((mark) => mark.sequence.term.id))
    );

    const sequenceIds = Array.from(
      new Set(marks.map((mark) => mark.sequence.id))
    );

    const [termPublications, sequencePublications] = await Promise.all([
      classroomIds.length && termIds.length
        ? prisma.resultPublication.findMany({
            where: {
              classroomId: { in: classroomIds },
              termId: { in: termIds },
            },
            select: {
              termId: true,
              classroomId: true,
              status: true,
              publishedAt: true,
            },
          })
        : Promise.resolve([]),

      classroomIds.length && sequenceIds.length
        ? prisma.sequencePublication.findMany({
            where: {
              classroomId: { in: classroomIds },
              sequenceId: { in: sequenceIds },
            },
            select: {
              sequenceId: true,
              classroomId: true,
              status: true,
              publishedAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const termKey = (term: string, classroom: string) => `${term}:${classroom}`;
    const sequenceKey = (sequence: string, classroom: string) =>
      `${sequence}:${classroom}`;

    const termMap = new Map(
      termPublications.map((row) => [
        termKey(row.termId, row.classroomId),
        row.status,
      ])
    );

    const sequenceMap = new Map(
      sequencePublications.map((row) => [
        sequenceKey(row.sequenceId, row.classroomId),
        row.status,
      ])
    );

    const passCount = await prisma.mark.count({
      where: { ...where, average: { gte: 50 } },
    });

    return NextResponse.json({
      results: marks.map((mark) => {
        const classId = mark.student.classroom?.id ?? "";
        const termStatus = termMap.get(termKey(mark.sequence.term.id, classId));
        const sequenceStatus = sequenceMap.get(
          sequenceKey(mark.sequence.id, classId)
        );

        return {
          id: mark.id,
          ca1: mark.ca1,
          ca2: mark.ca2,
          exam: mark.exam,
          average: mark.average,
          grade: mark.grade,
          remark: mark.remark,
          updatedAt: mark.updatedAt,

          studentId: mark.studentId,
          studentName: `${mark.student.firstName} ${mark.student.lastName}`.trim(),
          matricule: mark.student.matricule,

          classroomId: classId,
          className: mark.student.classroom?.name ?? null,
          sectionName: mark.student.classroom?.section?.name ?? null,

          subjectId: mark.subjectId,
          subjectName: mark.subject.name,
          coefficient: mark.subject.coefficient,

          teacherId: mark.teacherId,
          teacherName: mark.teacher.fullName,

          sequenceId: mark.sequenceId,
          sequenceName: mark.sequence.name,
          termId: mark.sequence.term.id,
          termName: mark.sequence.term.name,
          academicYearName: mark.sequence.term.academicYear.name,

          published:
            termStatus === "PUBLISHED" || sequenceStatus === "PUBLISHED",
          publicationStatus:
            sequenceStatus === "PUBLISHED"
              ? "SEQUENCE_PUBLISHED"
              : termStatus === "PUBLISHED"
                ? "TERM_PUBLISHED"
                : termStatus === "UNPUBLISHED" || sequenceStatus === "UNPUBLISHED"
                  ? "UNPUBLISHED"
                  : "NOT_PUBLISHED",
        };
      }),

      summary: {
        average:
          aggregate._avg.average === null
            ? null
            : Math.round(aggregate._avg.average * 100) / 100,
        recorded: aggregate._count._all,
        passed: passCount,
        passRate:
          aggregate._count._all > 0
            ? Math.round((passCount / aggregate._count._all) * 1000) / 10
            : null,
      },

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
    return serverError("ADMIN RESULTS LIST ERROR", error);
  }
}
