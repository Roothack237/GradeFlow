import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  Prisma,
  PublicationStatus,
  AccountStatus,
} from "@prisma/client";

// ======================================================
// HELPERS
// ======================================================

function badRequest(message: string) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 400 }
  );
}

function serverError(error: unknown) {
  console.error("[API /admin/publications]", error);

  const message =
    error instanceof Error ? error.message : "Internal server error.";

  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: 500 }
  );
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// ======================================================
// GET PUBLICATIONS
// ======================================================

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    let termId = str(searchParams.get("termId"));
    const classroomId = str(searchParams.get("classroomId"));

    // ==================================================
    // FIND CURRENT TERM
    // ==================================================

    if (!termId) {
      const currentTerm = await prisma.term.findFirst({
        where: {
          isCurrent: true,
        },
        select: {
          id: true,
        },
      });

      termId = currentTerm?.id ?? "";
    }

    if (!termId) {
      return badRequest("No term was found.");
    }

    // ==================================================
    // LOAD TERM
    // ==================================================

    const term = await prisma.term.findUnique({
      where: {
        id: termId,
      },
      select: {
        id: true,
        name: true,
        order: true,
        isCurrent: true,

        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },

        sequences: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
    });

    if (!term) {
      return badRequest("Term not found.");
    }

    // ==================================================
    // LOAD CLASSROOMS
    // ==================================================

    const classrooms = await prisma.classroom.findMany({
      where: classroomId
        ? {
            id: classroomId,
          }
        : undefined,

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,

        section: {
          select: {
            id: true,
            name: true,
          },
        },

        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    const classroomIds = classrooms.map((classroom) => classroom.id);

    // ==================================================
    // LOAD TERM PUBLICATIONS
    // ==================================================

    const termPublications =
      classroomIds.length > 0
        ? await prisma.resultPublication.findMany({
            where: {
              termId,
              classroomId: {
                in: classroomIds,
              },
            },

            select: {
              id: true,
              termId: true,
              classroomId: true,
              status: true,
              publishedAt: true,
              publishedById: true,
              notes: true,
            },
          })
        : [];

    // ==================================================
    // LOAD SEQUENCE PUBLICATIONS
    // ==================================================

    const sequenceIds = term.sequences.map(
      (sequence) => sequence.id
    );

    const sequencePublications =
      classroomIds.length > 0 && sequenceIds.length > 0
        ? await prisma.sequencePublication.findMany({
            where: {
              classroomId: {
                in: classroomIds,
              },

              sequenceId: {
                in: sequenceIds,
              },
            },

            select: {
              id: true,
              sequenceId: true,
              classroomId: true,
              status: true,
              publishedAt: true,
              publishedById: true,
              notes: true,
            },
          })
        : [];

    // ==================================================
    // LOAD STUDENTS
    // ==================================================

      const students =
        classroomIds.length > 0
          ? await prisma.student.findMany({
              where: {
                classroomId: {
                  in: classroomIds,
                },
                status: {
                  not: AccountStatus.SUSPENDED,
                },
              },
              select: {
                id: true,
                classroomId: true,
              },
            })
          : [];
    const studentIds = students.map(
      (student) => student.id
    );

    // ==================================================
    // COUNT MARKS
    // ==================================================

    const markGroups =
      studentIds.length > 0
        ? await prisma.mark.groupBy({
            by: ["studentId"],

            where: {
              studentId: {
                in: studentIds,
              },

              termId,
            },

            _count: {
              id: true,
            },
          })
        : [];

    const studentClassMap = new Map<string, string>();

    for (const student of students) {
      if (student.classroomId) {
        studentClassMap.set(
          student.id,
          student.classroomId
        );
      }
    }

    const marksByClassroom = new Map<string, number>();

    for (const group of markGroups) {
      const classId = studentClassMap.get(
        group.studentId
      );

      if (!classId) continue;

      marksByClassroom.set(
        classId,
        (marksByClassroom.get(classId) ?? 0) +
          group._count.id
      );
    }

    // ==================================================
    // BUILD CLASSROOM RESPONSE
    // ==================================================

    const classes = classrooms.map((classroom) => {
      const termPublication =
        termPublications.find(
          (publication) =>
            publication.classroomId === classroom.id
        );

      const sequences = term.sequences.map(
        (sequence) => {
          const publication =
            sequencePublications.find(
              (item) =>
                item.classroomId === classroom.id &&
                item.sequenceId === sequence.id
            );

          return {
            id: sequence.id,
            name: sequence.name,
            order: sequence.order,

            publication: publication
              ? {
                  id: publication.id,
                  status: publication.status,
                  publishedAt:
                    publication.publishedAt,
                  publishedById:
                    publication.publishedById,
                  notes: publication.notes,
                }
              : {
                  id: null,
                  status: "UNPUBLISHED",
                  publishedAt: null,
                  publishedById: null,
                  notes: null,
                },
          };
        }
      );

      return {
        id: classroom.id,
        name: classroom.name,
        section: classroom.section,

        studentCount:
          classroom._count.students,

        marksCount:
          marksByClassroom.get(classroom.id) ?? 0,

        termPublication: termPublication
          ? {
              id: termPublication.id,
              status: termPublication.status,
              publishedAt:
                termPublication.publishedAt,
              publishedById:
                termPublication.publishedById,
              notes: termPublication.notes,
            }
          : {
              id: null,
              status: "UNPUBLISHED",
              publishedAt: null,
              publishedById: null,
              notes: null,
            },

        sequences,
      };
    });

    // ==================================================
    // SUMMARY
    // ==================================================

    const publishedClasses = classes.filter(
      (item) =>
        item.termPublication.status === "PUBLISHED"
    ).length;

    const publishedSequences = classes.reduce(
      (total, classroom) =>
        total +
        classroom.sequences.filter(
          (sequence) =>
            sequence.publication.status === "PUBLISHED"
        ).length,
      0
    );

    return NextResponse.json({
      success: true,

      term: {
        id: term.id,
        name: term.name,
        order: term.order,
        isCurrent: term.isCurrent,
        academicYear: term.academicYear,
      },

      sequences: term.sequences,

      classes,

      summary: {
        totalClasses: classes.length,

        publishedClasses,

        totalSequences:
          classes.length *
          term.sequences.length,

        publishedSequences,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

// ======================================================
// POST PUBLICATION
// ======================================================

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const scope = str(body.scope).toUpperCase();
    const action = str(body.action).toUpperCase();

    const publicationType = (
      str(body.publicationType) || "RESULT"
    ).toUpperCase();

    const termId = str(body.termId);
    const classroomId = str(body.classroomId);
    const sequenceId = str(body.sequenceId);
    const notes = str(body.notes);

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!["TERM", "SEQUENCE"].includes(scope)) {
      return badRequest(
        "Scope must be TERM or SEQUENCE."
      );
    }

    if (!["PUBLISH", "UNPUBLISH"].includes(action)) {
      return badRequest(
        "Action must be PUBLISH or UNPUBLISH."
      );
    }

    if (
      !["RESULT", "REPORT_CARD"].includes(
        publicationType
      )
    ) {
      return badRequest(
        "Publication type must be RESULT or REPORT_CARD."
      );
    }

    if (!termId) {
      return badRequest("Term is required.");
    }

    if (!classroomId) {
      return badRequest("Classroom is required.");
    }

    if (
      publicationType === "REPORT_CARD" &&
      scope !== "TERM"
    ) {
      return badRequest(
        "Report cards can only be published at term level."
      );
    }

    if (scope === "SEQUENCE" && !sequenceId) {
      return badRequest(
        "Sequence is required for sequence publication."
      );
    }

    // ==================================================
    // LOAD TERM
    // ==================================================

    const term = await prisma.term.findUnique({
      where: {
        id: termId,
      },

      select: {
        id: true,
        name: true,

        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },

        sequences: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
    });

    if (!term) {
      return badRequest("Term not found.");
    }

    // ==================================================
    // LOAD CLASSROOM
    // ==================================================

    const classroom =
      await prisma.classroom.findUnique({
        where: {
          id: classroomId,
        },

        select: {
          id: true,
          name: true,

          students: {
            select: {
              id: true,
              parentId: true,
            },
          },

          assignments: {
            select: {
              teacher: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

    if (!classroom) {
      return badRequest("Classroom not found.");
    }

    // ==================================================
    // VALIDATE SEQUENCE
    // ==================================================

    let selectedSequence:
      | {
          id: string;
          name: string;
          order: number;
        }
      | null = null;

    if (scope === "SEQUENCE") {
      selectedSequence =
        term.sequences.find(
          (sequence) =>
            sequence.id === sequenceId
        ) ?? null;

      if (!selectedSequence) {
        return badRequest(
          "The selected sequence does not belong to this term."
        );
      }
    }

    // ==================================================
    // COUNT MARKS
    // ==================================================

    const markWhere: Prisma.MarkWhereInput = {
      termId,

      studentId: {
        in: classroom.students.map(
          (student) => student.id
        ),
      },

      ...(scope === "SEQUENCE"
        ? {
            sequenceId,
          }
        : {}),
    };

    const marksCount = await prisma.mark.count({
      where: markWhere,
    });

    if (action === "PUBLISH" && marksCount === 0) {
      return badRequest(
        publicationType === "REPORT_CARD"
          ? "No marks have been recorded for this class and term. Generate the report cards after entering marks."
          : "No marks have been recorded for this class and term."
      );
    }

    // ==================================================
    // STATUS
    // ==================================================

    const status: PublicationStatus =
      action === "PUBLISH"
        ? PublicationStatus.PUBLISHED
        : PublicationStatus.UNPUBLISHED;

    // ==================================================
    // TERM PUBLICATION
    // ==================================================

    if (scope === "TERM") {
      const publication =
        await prisma.resultPublication.upsert({
          where: {
            termId_classroomId: {
              termId,
              classroomId,
            },
          },

          create: {
            termId,
            classroomId,
            status,

            publishedAt:
              action === "PUBLISH"
                ? new Date()
                : null,

            publishedById:
              action === "PUBLISH"
                ? admin.id
                : null,

            notes: notes || null,
          },

          update: {
            status,

            publishedAt:
              action === "PUBLISH"
                ? new Date()
                : null,

            publishedById:
              action === "PUBLISH"
                ? admin.id
                : null,

            notes: notes || null,
          },
        });

      // ==================================================
      // AUDIT LOG
      // ==================================================

      await prisma.auditLog.create({
        data: {
          userId: admin.id ?? null,

          action:
            action === "PUBLISH"
              ? "PUBLISH_RESULTS"
              : "UNPUBLISH_RESULTS",

          entityType: "ResultPublication",

          entityId: publication.id,

          description:
            publicationType === "REPORT_CARD"
              ? `Published report cards for ${term.name} - ${classroom.name}.`
              : action === "PUBLISH"
              ? `Published results for ${term.name} - ${classroom.name}.`
              : `Unpublished results for ${term.name} - ${classroom.name}.`,

          metadata: {
            scope,
            publicationType,
            termId,
            classroomId,
            sequenceId: sequenceId || null,
            marksCount,
            notes: notes || null,
          },
        },
      });

      // ==================================================
      // NOTIFICATIONS
      // ==================================================

      let notified = 0;

      if (action === "PUBLISH") {
        const parentIds = Array.from(
          new Set(
            classroom.students
              .map(
                (student) =>
                  student.parentId
              )
              .filter(
                (
                  parentId
                ): parentId is string =>
                  Boolean(parentId)
              )
          )
        );

        const teacherIds = Array.from(
          new Set(
            classroom.assignments
              .map(
                (assignment) =>
                  assignment.teacher.userId
              )
              .filter(
                (
                  teacherId
                ): teacherId is string =>
                  Boolean(teacherId)
              )
          )
        );

        if (
          publicationType === "REPORT_CARD"
        ) {
          const notifications =
            parentIds.map(
              (parentId) => ({
                userId: parentId,

                type:
                  "REPORT_AVAILABLE" as const,

                title:
                  `Report card available — ${term.name}`,

                message:
                  `The ${term.name} report card for ${classroom.name} (${term.academicYear.name}) is now available.`,

                actionUrl:
                  "/parent/report-cards",

                audience: "CLASS",

                relatedType:
                  "Classroom",

                relatedId:
                  classroomId,
              })
            );

          if (notifications.length > 0) {
            await prisma.notification.createMany({
              data: notifications,
            });
          }

          notified =
            notifications.length;
        } else {
          const notifications = [
            ...parentIds.map(
              (parentId) => ({
                userId: parentId,

                type:
                  "RESULT_PUBLISHED" as const,

                title:
                  `Results published — ${term.name}`,

                message:
                  `Results for ${classroom.name} (${term.academicYear.name}) are now available.`,

                actionUrl:
                  "/parent/children",

                audience: "CLASS",

                relatedType:
                  "Classroom",

                relatedId:
                  classroomId,
              })
            ),

            ...teacherIds.map(
              (teacherId) => ({
                userId: teacherId,

                type:
                  "RESULT_PUBLISHED" as const,

                title:
                  `Results published — ${term.name}`,

                message:
                  `Results for ${classroom.name} (${term.academicYear.name}) have been published.`,

                actionUrl:
                  "/teacher",

                audience: "CLASS",

                relatedType:
                  "Classroom",

                relatedId:
                  classroomId,
              })
            ),
          ];

          if (notifications.length > 0) {
            await prisma.notification.createMany({
              data: notifications,
            });
          }

          notified =
            notifications.length;
        }
      }

      return NextResponse.json({
        success: true,

        message:
          action === "PUBLISH"
            ? publicationType ===
              "REPORT_CARD"
              ? `Report cards for ${classroom.name} — ${term.name} have been published successfully.`
              : `Results for ${classroom.name} — ${term.name} have been published successfully.`
            : `Publication for ${classroom.name} — ${term.name} has been unpublished.`,

        publication: {
          id: publication.id,
          scope,
          publicationType,
          status: publication.status,
          termId,
          classroomId,
          sequenceId: null,
          publishedAt:
            publication.publishedAt,
        },

        marks: marksCount,

        notified,
      });
    }

    // ==================================================
    // SEQUENCE PUBLICATION
    // ==================================================

    const sequencePublication =
      await prisma.sequencePublication.upsert({
        where: {
          sequenceId_classroomId: {
            sequenceId,
            classroomId,
          },
        },

        create: {
          sequenceId,
          classroomId,
          status,

          publishedAt:
            action === "PUBLISH"
              ? new Date()
              : null,

          publishedById:
            action === "PUBLISH"
              ? admin.id
              : null,

          notes: notes || null,
        },

        update: {
          status,

          publishedAt:
            action === "PUBLISH"
              ? new Date()
              : null,

          publishedById:
            action === "PUBLISH"
              ? admin.id
              : null,

          notes: notes || null,
        },
      });

    // ==================================================
    // AUDIT LOG
    // ==================================================

    await prisma.auditLog.create({
      data: {
        userId: admin.id ?? null,

        action:
          action === "PUBLISH"
            ? "PUBLISH_RESULTS"
            : "UNPUBLISH_RESULTS",

        entityType:
          "SequencePublication",

        entityId:
          sequencePublication.id,

        description:
          action === "PUBLISH"
            ? `Published ${selectedSequence?.name ?? "sequence"} results for ${classroom.name}.`
            : `Unpublished ${selectedSequence?.name ?? "sequence"} results for ${classroom.name}.`,

        metadata: {
          scope,
          publicationType,
          termId,
          classroomId,
          sequenceId,
          marksCount,
          notes: notes || null,
        },
      },
    });

    // ==================================================
    // SEQUENCE NOTIFICATIONS
    // ==================================================

    let notified = 0;

    if (action === "PUBLISH") {
      const parentIds = Array.from(
        new Set(
          classroom.students
            .map(
              (student) =>
                student.parentId
            )
            .filter(
              (
                parentId
              ): parentId is string =>
                Boolean(parentId)
            )
        )
      );

      const teacherIds = Array.from(
        new Set(
          classroom.assignments
            .map(
              (assignment) =>
                assignment.teacher.userId
            )
            .filter(
              (
                teacherId
              ): teacherId is string =>
                Boolean(teacherId)
            )
        )
      );

      const notifications = [
        ...parentIds.map(
          (parentId) => ({
            userId: parentId,

            type:
              "RESULT_PUBLISHED" as const,

            title:
              `Results published — ${
                selectedSequence?.name ??
                "Sequence"
              }`,

            message:
              `${
                selectedSequence?.name ??
                "Sequence results"
              } for ${classroom.name} are now available.`,

            actionUrl:
              "/parent/children",

            audience: "CLASS",

            relatedType:
              "Classroom",

            relatedId:
              classroomId,
          })
        ),

        ...teacherIds.map(
          (teacherId) => ({
            userId: teacherId,

            type:
              "RESULT_PUBLISHED" as const,

            title:
              `Results published — ${
                selectedSequence?.name ??
                "Sequence"
              }`,

            message:
              `${
                selectedSequence?.name ??
                "Sequence results"
              } for ${classroom.name} have been published.`,

            actionUrl:
              "/teacher",

            audience: "CLASS",

            relatedType:
              "Classroom",

            relatedId:
              classroomId,
          })
        ),
      ];

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }

      notified =
        notifications.length;
    }

    return NextResponse.json({
      success: true,

      message:
        action === "PUBLISH"
          ? `${
              selectedSequence?.name ??
              "Sequence"
            } results for ${classroom.name} have been published successfully.`
          : `${
              selectedSequence?.name ??
              "Sequence"
            } publication for ${classroom.name} has been unpublished.`,

      publication: {
        id: sequencePublication.id,
        scope,
        publicationType,
        status:
          sequencePublication.status,
        termId,
        classroomId,
        sequenceId,
        publishedAt:
          sequencePublication.publishedAt,
      },

      marks: marksCount,

      notified,
    });
  } catch (error) {
    return serverError(error);
  }
}