import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, serverError, str } from "@/lib/http";
import { createManyNotifications } from "@/lib/notifications";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/publications
 * Publication state of a term for every class, at both levels:
 *   - the term publication        (class x term)
 *   - the sequence publications   (class x sequence)
 *
 * Query: ?termId= &classroomId=
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    let termId = str(searchParams.get("termId"));
    const classroomId = str(searchParams.get("classroomId"));

    if (!termId) {
      const current = await prisma.term.findFirst({
        where: { isCurrent: true },
        select: { id: true },
      });

      termId = current?.id ?? "";
    }

    if (!termId) {
      return NextResponse.json({
        term: null,
        classes: [],
        summary: { classes: 0, sequences: 0, published: 0, pending: 0 },
        message: "No term is available yet.",
      });
    }

    const term = await prisma.term.findUnique({
      where: { id: termId },
      select: {
        id: true,
        name: true,
        order: true,
        isCurrent: true,
        academicYear: { select: { id: true, name: true } },
        sequences: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, order: true },
        },
      },
    });

    if (!term) {
      return NextResponse.json({ error: "Term not found." }, { status: 404 });
    }

    const classrooms = await prisma.classroom.findMany({
      where: classroomId ? { id: classroomId } : {},
      select: {
        id: true,
        name: true,
        section: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    });

    const classroomIds = classrooms.map((classroom) => classroom.id);

    const [termPublications, sequencePublications, markGroups] =
      await Promise.all([
        prisma.resultPublication.findMany({
          where: { termId, classroomId: { in: classroomIds } },
          select: {
            classroomId: true,
            status: true,
            publishedAt: true,
            notes: true,
            publishedBy: { select: { firstName: true, lastName: true } },
          },
        }),

        prisma.sequencePublication.findMany({
          where: {
            classroomId: { in: classroomIds },
            sequence: { termId },
          },
          select: {
            classroomId: true,
            sequenceId: true,
            status: true,
            publishedAt: true,
          },
        }),

        prisma.mark.groupBy({
          by: ["studentId"],
          where: {
            sequence: { termId },
            student: { classroomId: { in: classroomIds } },
          },
          _count: { _all: true },
        }),
      ]);

    /* marks per class, resolved through the students of each class */

    const studentsByClass = await prisma.student.groupBy({
      by: ["classroomId"],
      where: { classroomId: { in: classroomIds } },
      _count: { _all: true },
    });

    const marksByClass = new Map<string, number>();

    const students = await prisma.student.findMany({
      where: { classroomId: { in: classroomIds } },
      select: { id: true, classroomId: true },
    });

    const classByStudent = new Map(
      students.map((student) => [student.id, student.classroomId])
    );

    for (const group of markGroups) {
      const classId = classByStudent.get(group.studentId);

      if (!classId) continue;

      marksByClass.set(
        classId,
        (marksByClass.get(classId) ?? 0) + group._count._all
      );
    }

    const termMap = new Map(
      termPublications.map((row) => [row.classroomId, row])
    );

    const sequenceMap = new Map(
      sequencePublications.map((row) => [
        `${row.sequenceId}:${row.classroomId}`,
        row,
      ])
    );

    let publishedCount = 0;
    let pendingCount = 0;

    const classes = classrooms.map((classroom) => {
      const termPublication = termMap.get(classroom.id);

      const sequences = term.sequences.map((sequence) => {
        const publication = sequenceMap.get(`${sequence.id}:${classroom.id}`);

        if (publication?.status === "PUBLISHED") publishedCount += 1;
        else pendingCount += 1;

        return {
          id: sequence.id,
          name: sequence.name,
          order: sequence.order,
          publication: publication
            ? {
                status: publication.status,
                publishedAt: publication.publishedAt,
              }
            : null,
        };
      });

      return {
        id: classroom.id,
        name: classroom.name,
        section: classroom.section,
        students: classroom._count.students,
        marks: marksByClass.get(classroom.id) ?? 0,
        expectedStudents:
          studentsByClass.find((row) => row.classroomId === classroom.id)
            ?._count._all ?? 0,
        termPublication: termPublication
          ? {
              status: termPublication.status,
              publishedAt: termPublication.publishedAt,
              notes: termPublication.notes,
              publishedBy: termPublication.publishedBy
                ? `${termPublication.publishedBy.firstName} ${termPublication.publishedBy.lastName}`
                : null,
            }
          : null,
        sequences,
      };
    });

    const termPublished = classes.filter(
      (classroom) => classroom.termPublication?.status === "PUBLISHED"
    ).length;

    return NextResponse.json({
      term,
      classes,
      summary: {
        classes: classes.length,
        sequences: classes.length * term.sequences.length,
        sequencesPublished: publishedCount,
        sequencesPending: pendingCount,
        termsPublished: termPublished,
        termsPending: classes.length - termPublished,
      },
    });
  } catch (error) {
    return serverError("ADMIN PUBLICATIONS LIST ERROR", error);
  }
}

/**
 * POST /api/admin/publications
 * Publishes or unpublishes results at one of the two levels.
 *
 * Body:
 *   {
 *     scope: "TERM" | "SEQUENCE",
 *     termId: string,
 *     classroomId: string,
 *     sequenceId?: string,       // required for scope = SEQUENCE
 *     action: "PUBLISH" | "UNPUBLISH",
 *     notes?: string
 *   }
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();

    const scope = (str(body.scope) || "TERM").toUpperCase();
    const action = (str(body.action) || "PUBLISH").toUpperCase();
    const termId = str(body.termId);
    const classroomId = str(body.classroomId);
    const sequenceId = str(body.sequenceId);
    const notes = str(body.notes);

    if (!termId || !classroomId) {
      return badRequest("A term and a class are required to publish results.");
    }

    if (!["TERM", "SEQUENCE"].includes(scope)) {
      return badRequest("Scope must be TERM or SEQUENCE.");
    }

    if (!["PUBLISH", "UNPUBLISH"].includes(action)) {
      return badRequest("Action must be PUBLISH or UNPUBLISH.");
    }

    if (scope === "SEQUENCE" && !sequenceId) {
      return badRequest("A sequence is required to publish a sequence.");
    }

    const [term, classroom] = await Promise.all([
      prisma.term.findUnique({
        where: { id: termId },
        select: { id: true, name: true, academicYear: { select: { name: true } } },
      }),
      prisma.classroom.findUnique({
        where: { id: classroomId },
        select: {
          id: true,
          name: true,
          students: { select: { parentId: true } },
          assignments: { select: { teacher: { select: { userId: true } } } },
        },
      }),
    ]);

    if (!term) return badRequest("Term not found.");
    if (!classroom) return badRequest("Class not found.");

    const status = action === "PUBLISH" ? "PUBLISHED" : "UNPUBLISHED";

    let label = `${classroom.name} · ${term.name}`;
    let sequenceName: string | null = null;

    if (scope === "SEQUENCE") {
      const sequence = await prisma.sequence.findUnique({
        where: { id: sequenceId },
        select: { id: true, name: true, termId: true },
      });

      if (!sequence) return badRequest("Sequence not found.");

      if (sequence.termId !== termId) {
        return badRequest("The selected sequence does not belong to this term.");
      }

      sequenceName = sequence.name;
      label = `${classroom.name} · ${sequence.name}`;
    }

    /* ---- make sure there is something to publish ---- */

    const marks = await prisma.mark.count({
      where: {
        student: { classroomId },
        ...(scope === "SEQUENCE"
          ? { sequenceId }
          : { sequence: { termId } }),
      },
    });

    if (action === "PUBLISH" && marks === 0) {
      return badRequest(
        `No mark has been recorded for ${label} yet, so there is nothing to publish.`
      );
    }

    /* ---- write the publication record ---- */

    if (scope === "TERM") {
      await prisma.resultPublication.upsert({
        where: { termId_classroomId: { termId, classroomId } },
        update: {
          status: status as never,
          publishedAt: action === "PUBLISH" ? new Date() : null,
          publishedById: guard.user.id,
          notes: notes || null,
        },
        create: {
          termId,
          classroomId,
          status: status as never,
          publishedAt: action === "PUBLISH" ? new Date() : null,
          publishedById: guard.user.id,
          notes: notes || null,
        },
      });
    } else {
      await prisma.sequencePublication.upsert({
        where: {
          sequenceId_classroomId: { sequenceId, classroomId },
        },
        update: {
          status: status as never,
          publishedAt: action === "PUBLISH" ? new Date() : null,
          publishedById: guard.user.id,
        },
        create: {
          sequenceId,
          classroomId,
          status: status as never,
          publishedAt: action === "PUBLISH" ? new Date() : null,
          publishedById: guard.user.id,
        },
      });
    }

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: action === "PUBLISH" ? "RESULT_PUBLISHED" : "RESULT_UNPUBLISHED",
      entityType: scope === "TERM" ? "ResultPublication" : "SequencePublication",
      entityId: scope === "TERM" ? `${termId}:${classroomId}` : `${sequenceId}:${classroomId}`,
      description: `${action === "PUBLISH" ? "Published" : "Unpublished"} ${label} (${marks} mark(s))`,
      metadata: { scope, termId, classroomId, sequenceId: sequenceId || null },
    });

    /* ---- notify the parents and the teachers of the class ---- */

    let notified = 0;

    if (action === "PUBLISH") {
      const parentIds = Array.from(
        new Set(
          classroom.students
            .map((student) => student.parentId)
            .filter((id): id is string => Boolean(id))
        )
      );

      const parents = parentIds.length
        ? await prisma.parent.findMany({
            where: { id: { in: parentIds } },
            select: { userId: true },
          })
        : [];

      const recipientIds = Array.from(
        new Set([
          ...parents.map((parent) => parent.userId),
          ...classroom.assignments.map((assignment) => assignment.teacher.userId),
        ])
      );

      if (recipientIds.length) {
        const result = await createManyNotifications(recipientIds, {
          title:
            scope === "TERM"
              ? `Results published — ${term.name}`
              : `Results published — ${sequenceName ?? "sequence"}`,
          message:
            scope === "TERM"
              ? `The ${term.name} results of ${classroom.name} (${term.academicYear.name}) are now available.`
              : `The ${sequenceName} results of ${classroom.name} are now available.`,
          type: "RESULT_PUBLISHED",
          senderId: guard.user.id,
          audience: "CLASS",
          actionUrl: "/parent/children",
          relatedType: "Classroom",
          relatedId: classroomId,
        });

        notified = result.count;
      }
    }

    return NextResponse.json({
      message:
        action === "PUBLISH"
          ? `${label} published${notified ? ` and ${notified} notification(s) sent` : ""}.`
          : `${label} unpublished.`,
      scope,
      status,
      marks,
      notified,
    });
  } catch (error) {
    return serverError("ADMIN PUBLICATION UPDATE ERROR", error);
  }
}
