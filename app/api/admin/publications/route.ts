import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, serverError, str } from "@/lib/http";
import { createManyNotifications } from "@/lib/notifications";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/publications
 * Publication state for a term, per class, at both levels:
 *   - term level   (ResultPublication)
 *   - sequence level (SequencePublication)
 *
 * Query: ?termId=   (defaults to the current term)
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    let termId = str(searchParams.get("termId"));

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
        sequences: [],
        classes: [],
        message: "No current term is set. Choose a term to manage its results.",
      });
    }

    const [term, classrooms, termPublications, sequencePublications] =
      await Promise.all([
        prisma.term.findUnique({
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
        }),

        prisma.classroom.findMany({
          select: {
            id: true,
            name: true,
            section: { select: { name: true } },
            _count: { select: { students: true } },
          },
          orderBy: { name: "asc" },
        }),

        prisma.resultPublication.findMany({
          where: { termId },
          select: {
            classroomId: true,
            status: true,
            publishedAt: true,
            notes: true,
            publishedBy: { select: { firstName: true, lastName: true } },
          },
        }),

        prisma.sequencePublication.findMany({
          where: { sequence: { termId } },
          select: {
            sequenceId: true,
            classroomId: true,
            status: true,
            publishedAt: true,
          },
        }),
      ]);

    if (!term) {
      return NextResponse.json(
        { error: "Term not found." },
        { status: 404 }
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

    return NextResponse.json({
      term,

      sequences: term.sequences,

      classes: classrooms.map((classroom) => {
        const termLevel = termMap.get(classroom.id);

        return {
          id: classroom.id,
          name: classroom.name,
          sectionName: classroom.section?.name ?? null,
          students: classroom._count.students,

          termStatus: termLevel?.status ?? "NOT_PUBLISHED",
          termPublishedAt: termLevel?.publishedAt ?? null,
          termPublishedBy: termLevel?.publishedBy
            ? `${termLevel.publishedBy.firstName} ${termLevel.publishedBy.lastName}`
            : null,

          sequences: term.sequences.map((sequence) => {
            const entry = sequenceMap.get(`${sequence.id}:${classroom.id}`);

            return {
              sequenceId: sequence.id,
              sequenceName: sequence.name,
              status: entry?.status ?? "NOT_PUBLISHED",
              publishedAt: entry?.publishedAt ?? null,
            };
          }),
        };
      }),
    });
  } catch (error) {
    return serverError("ADMIN PUBLICATIONS LIST ERROR", error);
  }
}

/**
 * POST /api/admin/publications
 * Publish or unpublish results.
 *
 * Body:
 *   {
 *     scope: "TERM" | "SEQUENCE",
 *     termId: string,
 *     classroomId: string,
 *     sequenceId?: string,           // required when scope === "SEQUENCE"
 *     action: "PUBLISH" | "UNPUBLISH"
 *   }
 *
 * Publishing notifies the parents of the class and the teachers involved.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();

    const scope = str(body.scope).toUpperCase() || "TERM";
    const action = str(body.action).toUpperCase() || "PUBLISH";
    const termId = str(body.termId);
    const classroomId = str(body.classroomId);
    const sequenceId = str(body.sequenceId);

    if (!termId || !classroomId) {
      return badRequest("A term and a class are required.");
    }

    if (!["TERM", "SEQUENCE"].includes(scope)) {
      return badRequest("Scope must be TERM or SEQUENCE.");
    }

    if (!["PUBLISH", "UNPUBLISH"].includes(action)) {
      return badRequest("Action must be PUBLISH or UNPUBLISH.");
    }

    if (scope === "SEQUENCE" && !sequenceId) {
      return badRequest("A sequence is required when publishing a sequence.");
    }

    const [term, classroom] = await Promise.all([
      prisma.term.findUnique({
        where: { id: termId },
        select: { id: true, name: true, academicYear: { select: { name: true } } },
      }),
      prisma.classroom.findUnique({
        where: { id: classroomId },
        select: { id: true, name: true },
      }),
    ]);

    if (!term) return badRequest("Term not found.");
    if (!classroom) return badRequest("Class not found.");

    const status = action === "PUBLISH" ? "PUBLISHED" : "UNPUBLISHED";

    let label = `${classroom.name} · ${term.name}`;

    if (scope === "SEQUENCE") {
      const sequence = await prisma.sequence.findUnique({
        where: { id: sequenceId },
        select: { id: true, name: true, termId: true },
      });

      if (!sequence) return badRequest("Sequence not found.");

      if (sequence.termId !== termId) {
        return badRequest("The selected sequence does not belong to this term.");
      }

      label = `${classroom.name} · ${sequence.name}`;

      await prisma.sequencePublication.upsert({
        where: {
          sequenceId_classroomId: { sequenceId, classroomId },
        },
        update: {
          status,
          publishedAt: action === "PUBLISH" ? new Date() : null,
          publishedById: guard.user.id,
        },
        create: {
          sequenceId,
          classroomId,
          status,
          publishedAt: action === "PUBLISH" ? new Date() : null,
          publishedById: guard.user.id,
        },
      });
    } else {
      await prisma.resultPublication.upsert({
        where: { termId_classroomId: { termId, classroomId } },
        update: {
          status,
          publishedAt: action === "PUBLISH" ? new Date() : null,
          publishedById: guard.user.id,
        },
        create: {
          termId,
          classroomId,
          status,
          publishedAt: action === "PUBLISH" ? new Date() : null,
          publishedById: guard.user.id,
        },
      });
    }

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: action === "PUBLISH" ? "RESULT_PUBLISHED" : "RESULT_UNPUBLISHED",
      entityType: scope === "SEQUENCE" ? "SequencePublication" : "ResultPublication",
      entityId: `${termId}:${classroomId}:${sequenceId}`,
      description: `${action === "PUBLISH" ? "Published" : "Unpublished"} ${
        term.academicYear.name
      } ${label} results`,
      metadata: { scope, classroomId, sequenceId: sequenceId || null },
    });

    /* ---------- notify the families and the teachers ---------- */

    if (action === "PUBLISH") {
      const [students, assignments] = await Promise.all([
        prisma.student.findMany({
          where: { classroomId, parentId: { not: null } },
          select: { parent: { select: { userId: true } } },
        }),
        prisma.teacherAssignment.findMany({
          where: { classroomId },
          select: { teacher: { select: { userId: true } } },
        }),
      ]);

      const recipientIds = Array.from(
        new Set([
          ...students
            .map((student) => student.parent?.userId)
            .filter((id): id is string => Boolean(id)),
          ...assignments.map((assignment) => assignment.teacher.userId),
        ])
      );

      if (recipientIds.length) {
        await createManyNotifications(recipientIds, {
          title: "Results published",
          message: `Results for ${label} have been published. You can now review them on GradeFlow.`,
          type: "RESULT_PUBLISHED",
          senderId: guard.user.id,
          audience: "CLASS",
          actionUrl: "/parent/children",
          relatedType: "Classroom",
          relatedId: classroomId,
        });
      }
    }

    return NextResponse.json({
      message:
        action === "PUBLISH"
          ? `Results published for ${label}.`
          : `Results unpublished for ${label}.`,
      scope,
      status,
    });
  } catch (error) {
    return serverError("ADMIN PUBLICATION UPDATE ERROR", error);
  }
}
