import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { pagination, serverError, str } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/results
 * Review the marks recorded by teachers, with the publication state of each
 * mark resolved from both publication levels:
 *   - the sequence publication (class x sequence)
 *   - the term publication (class x term)
 *
 * Query: ?termId= &sequenceId= &classroomId= &subjectId= &teacherId=
 *        &studentId= &search= &publication= &page= &pageSize=
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const termId = str(searchParams.get("termId"));
    const sequenceId = str(searchParams.get("sequenceId"));
    const classroomId = str(searchParams.get("classroomId"));
    const subjectId = str(searchParams.get("subjectId"));
    const teacherId = str(searchParams.get("teacherId"));
    const studentId = str(searchParams.get("studentId"));
    const search = str(searchParams.get("search"));
    const publication = str(searchParams.get("publication")).toUpperCase();

    const where = {
      ...(sequenceId ? { sequenceId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(studentId ? { studentId } : {}),
      ...(termId ? { sequence: { termId } } : {}),
      ...(classroomId || search
        ? {
            student: {
              ...(classroomId ? { classroomId } : {}),
              ...(search
                ? {
                    OR: [
                      {
                        firstName: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                      {
                        lastName: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                      {
                        matricule: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    ],
                  }
                : {}),
            },
          }
        : {}),
    };

    const { skip, take, page, pageSize } = pagination(searchParams, 25, 200);

    const marks = await prisma.mark.findMany({
      where,
      orderBy: [
        { sequence: { term: { order: "asc" } } },
        { sequence: { order: "asc" } },
        { student: { lastName: "asc" } },
        { subject: { name: "asc" } },
      ],
      skip,
      take,
      select: {
        id: true,
        ca1: true,
        ca2: true,
        exam: true,
        average: true,
        grade: true,
        remark: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            classroomId: true,
            classroom: {
              select: {
                id: true,
                name: true,
                section: { select: { name: true } },
              },
            },
          },
        },
        subject: {
          select: { id: true, name: true, code: true, coefficient: true },
        },
        sequence: {
          select: {
            id: true,
            name: true,
            order: true,
            term: {
              select: {
                id: true,
                name: true,
                academicYear: { select: { id: true, name: true } },
              },
            },
          },
        },
        teacher: { select: { id: true, fullName: true } },
      },
    });

    const [total, aggregates] = await Promise.all([
      prisma.mark.count({ where }),
      prisma.mark.aggregate({
        where,
        _avg: { average: true },
        _max: { average: true },
        _min: { average: true },
        _count: { _all: true },
      }),
    ]);

    /* ---- publication state for the page of marks ---- */

    const classroomIds = Array.from(
      new Set(
        marks
          .map((mark) => mark.student.classroomId)
          .filter((id): id is string => Boolean(id))
      )
    );

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

    const termMap = new Map(
      termPublications.map((row) => [
        `${row.termId}:${row.classroomId}`,
        row,
      ])
    );

    const sequenceMap = new Map(
      sequencePublications.map((row) => [
        `${row.sequenceId}:${row.classroomId}`,
        row,
      ])
    );

    function publicationStateFor(termId: string, sequenceId: string, classId: string | null) {
      if (!classId) return "NOT_PUBLISHED";

      const sequencePublication = sequenceMap.get(`${sequenceId}:${classId}`);
      const termPublication = termMap.get(`${termId}:${classId}`);

      if (sequencePublication?.status === "PUBLISHED") {
        return "SEQUENCE_PUBLISHED";
      }

      if (termPublication?.status === "PUBLISHED") {
        return "TERM_PUBLISHED";
      }

      if (
        sequencePublication?.status === "UNPUBLISHED" ||
        termPublication?.status === "UNPUBLISHED"
      ) {
        return "UNPUBLISHED";
      }

      return "NOT_PUBLISHED";
    }

    const results = marks.map((mark) => ({
      id: mark.id,
      ca1: mark.ca1,
      ca2: mark.ca2,
      exam: mark.exam,
      average: mark.average,
      grade: mark.grade,
      remark: mark.remark,
      updatedAt: mark.updatedAt,
      student: {
        id: mark.student.id,
        name: `${mark.student.firstName} ${mark.student.lastName}`.trim(),
        matricule: mark.student.matricule,
      },
      classroom: mark.student.classroom,
      subject: mark.subject,
      sequence: {
        id: mark.sequence.id,
        name: mark.sequence.name,
        order: mark.sequence.order,
      },
      term: mark.sequence.term,
      teacher: mark.teacher,
      publicationState: publicationStateFor(
        mark.sequence.term.id,
        mark.sequence.id,
        mark.student.classroomId
      ),
    }));

    const filtered =
      publication === "PUBLISHED"
        ? results.filter(
            (row) =>
              row.publicationState === "SEQUENCE_PUBLISHED" ||
              row.publicationState === "TERM_PUBLISHED"
          )
        : publication === "NOT_PUBLISHED"
          ? results.filter(
              (row) =>
                row.publicationState === "NOT_PUBLISHED" ||
                row.publicationState === "UNPUBLISHED"
            )
          : results;

    const passed = aggregates._count._all
      ? await prisma.mark.count({ where: { ...where, average: { gte: 50 } } })
      : 0;

    return NextResponse.json({
      results: filtered,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),

      summary: {
        marks: aggregates._count._all,
        average:
          aggregates._avg.average === null
            ? null
            : Math.round(aggregates._avg.average * 100) / 100,
        highest:
          aggregates._max.average === null
            ? null
            : Math.round(aggregates._max.average * 100) / 100,
        lowest:
          aggregates._min.average === null
            ? null
            : Math.round(aggregates._min.average * 100) / 100,
        passed,
        passRate: aggregates._count._all
          ? Math.round((passed / aggregates._count._all) * 1000) / 10
          : null,
      },
    });
  } catch (error) {
    return serverError("ADMIN RESULTS LIST ERROR", error);
  }
}
