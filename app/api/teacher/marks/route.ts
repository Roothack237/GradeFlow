import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import prisma  from "@/lib/prisma";

type SaveStudentMark = {
  studentId: string;
  score: number | null;
};

type SaveMarksBody = {
  classroomId: string;
  subjectId: string;
  termId: string;
  sequenceId: string;
  students: SaveStudentMark[];
};

/*
 * ---------------------------------------------------------
 * GET
 * ---------------------------------------------------------
 *
 * Returns:
 *
 * {
 *   students: [...],
 *   marks: [...]
 * }
 *
 * Query parameters:
 *
 * classroomId
 * subjectId
 * termId
 * sequenceId
 */
export async function GET(
  request: NextRequest
) {
  try {
    /*
     * -------------------------------------------------------
     * AUTHENTICATION
     * -------------------------------------------------------
     */

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Only teachers can use this endpoint.
     */
    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        {
          error:
            "Only teachers can access marks.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * GET TEACHER
     * -------------------------------------------------------
     *
     * The logged-in session contains User.id.
     *
     * Teacher.userId -> User.id
     */
    const teacher = await prisma.teacher.findUnique(
      {
        where: {
          userId: session.user.id,
        },
      }
    );

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "Teacher profile was not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * READ QUERY PARAMETERS
     * -------------------------------------------------------
     */

    const { searchParams } =
      new URL(request.url);

    const classroomId =
      searchParams.get("classroomId");

    const subjectId =
      searchParams.get("subjectId");

    const termId =
      searchParams.get("termId");

    const sequenceId =
      searchParams.get("sequenceId");

    if (!classroomId) {
      return NextResponse.json(
        {
          error:
            "classroomId is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        {
          error:
            "subjectId is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!termId) {
      return NextResponse.json(
        {
          error: "termId is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!sequenceId) {
      return NextResponse.json(
        {
          error:
            "sequenceId is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * VERIFY TEACHER ASSIGNMENT
     * -------------------------------------------------------
     *
     * A teacher can only enter marks for a classroom +
     * subject combination that has actually been assigned
     * to them.
     */
    const assignment =
      await prisma.teacherAssignment.findFirst(
        {
          where: {
            teacherId: teacher.id,
            classroomId,
            subjectId,
          },

          include: {
            classroom: true,
            subject: true,
          },
        }
      );

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to this classroom and subject.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * VERIFY TERM
     * -------------------------------------------------------
     */

    const term = await prisma.term.findUnique(
      {
        where: {
          id: termId,
        },
      }
    );

    if (!term) {
      return NextResponse.json(
        {
          error: "Term not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * VERIFY SEQUENCE
     * -------------------------------------------------------
     *
     * A sequence must belong to the selected term.
     */
    const sequence =
      await prisma.sequence.findUnique({
        where: {
          id: sequenceId,
        },
      });

    if (!sequence) {
      return NextResponse.json(
        {
          error:
            "Sequence not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (sequence.termId !== termId) {
      return NextResponse.json(
        {
          error:
            "The selected sequence does not belong to the selected term.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * LOAD STUDENTS
     * -------------------------------------------------------
     *
     * Current schema:
     *
     * Student.classroomId
     *
     * Therefore we load students directly by classroomId.
     */
    const students =
      await prisma.student.findMany({
        where: {
          classroomId,
        },

        orderBy: [
          {
            lastName: "asc",
          },
          {
            firstName: "asc",
          },
        ],

        select: {
          id: true,
          matricule: true,
          firstName: true,
          lastName: true,
          gender: true,
          classroomId: true,
        },
      });

    /*
     * -------------------------------------------------------
     * LOAD EXISTING MARKS
     * -------------------------------------------------------
     *
     * Only marks for:
     *
     * teacher
     * classroom students
     * subject
     * term
     * sequence
     *
     * are returned.
     */
    const studentIds =
      students.map(
        (student) => student.id
      );

    const marks =
      studentIds.length > 0
        ? await prisma.mark.findMany({
            where: {
              teacherId: teacher.id,
              subjectId,
              termId,
              sequenceId,

              studentId: {
                in: studentIds,
              },
            },

            select: {
              id: true,
              studentId: true,
              subjectId: true,
              teacherId: true,
              termId: true,
              sequenceId: true,
              score: true,
            },
          })
        : [];

    /*
     * -------------------------------------------------------
     * RESPONSE
     * -------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      classroom: {
        id: assignment.classroom.id,
        name: assignment.classroom.name,
      },

      subject: {
        id: assignment.subject.id,
        name: assignment.subject.name,
        code: assignment.subject.code,
        coefficient:
          assignment.subject.coefficient,
      },

      term: {
        id: term.id,
        name: term.name,
        order: term.order,
        isCurrent: term.isCurrent,
      },

      sequence: {
        id: sequence.id,
        name: sequence.name,
        order: sequence.order,
        termId: sequence.termId,
      },

      students,

      marks,
    });
  } catch (error) {
    console.error(
      "GET /api/teacher/marks ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load marks.",
        message:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ---------------------------------------------------------
 * POST
 * ---------------------------------------------------------
 *
 * Saves or updates marks.
 *
 * Body:
 *
 * {
 *   classroomId: "...",
 *   subjectId: "...",
 *   termId: "...",
 *   sequenceId: "...",
 *   students: [
 *     {
 *       studentId: "...",
 *       score: 15.5
 *     }
 *   ]
 * }
 */
export async function POST(
  request: NextRequest
) {
  try {
    /*
     * -------------------------------------------------------
     * AUTHENTICATION
     * -------------------------------------------------------
     */

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Only teachers can save marks.
     */
    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        {
          error:
            "Only teachers can save marks.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * GET TEACHER
     * -------------------------------------------------------
     */

    const teacher = await prisma.teacher.findUnique(
      {
        where: {
          userId: session.user.id,
        },
      }
    );

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "Teacher profile was not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * PARSE REQUEST
     * -------------------------------------------------------
     */

    let body: SaveMarksBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      classroomId,
      subjectId,
      termId,
      sequenceId,
      students,
    } = body;

    /*
     * -------------------------------------------------------
     * BASIC VALIDATION
     * -------------------------------------------------------
     */

    if (!classroomId) {
      return NextResponse.json(
        {
          error:
            "classroomId is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        {
          error:
            "subjectId is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!termId) {
      return NextResponse.json(
        {
          error:
            "termId is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!sequenceId) {
      return NextResponse.json(
        {
          error:
            "sequenceId is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!Array.isArray(students)) {
      return NextResponse.json(
        {
          error:
            "students must be an array.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * VERIFY TEACHER ASSIGNMENT
     * -------------------------------------------------------
     */

    const assignment =
      await prisma.teacherAssignment.findFirst(
        {
          where: {
            teacherId: teacher.id,
            classroomId,
            subjectId,
          },

          include: {
            classroom: true,
            subject: true,
          },
        }
      );

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to this classroom and subject.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * VERIFY TERM
     * -------------------------------------------------------
     */

    const term = await prisma.term.findUnique(
      {
        where: {
          id: termId,
        },
      }
    );

    if (!term) {
      return NextResponse.json(
        {
          error: "Term not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * VERIFY SEQUENCE
     * -------------------------------------------------------
     */

    const sequence =
      await prisma.sequence.findUnique({
        where: {
          id: sequenceId,
        },
      });

    if (!sequence) {
      return NextResponse.json(
        {
          error:
            "Sequence not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (sequence.termId !== termId) {
      return NextResponse.json(
        {
          error:
            "The selected sequence does not belong to the selected term.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * LOAD CLASSROOM STUDENTS
     * -------------------------------------------------------
     *
     * This gives us the authoritative list of students
     * belonging to this classroom.
     */
    const classroomStudents =
      await prisma.student.findMany({
        where: {
          classroomId,
        },

        select: {
          id: true,
        },
      });

    const classroomStudentIds =
      new Set(
        classroomStudents.map(
          (student) => student.id
        )
      );

    /*
     * -------------------------------------------------------
     * VALIDATE EVERY MARK
     * -------------------------------------------------------
     */

    for (const studentMark of students) {
      if (!studentMark?.studentId) {
        return NextResponse.json(
          {
            error:
              "Every mark must contain a studentId.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Prevent a teacher from submitting marks for a
       * student who isn't in the selected classroom.
       */
      if (
        !classroomStudentIds.has(
          studentMark.studentId
        )
      ) {
        return NextResponse.json(
          {
            error:
              "One or more students do not belong to the selected classroom.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * null means remove/clear the mark.
       */
      if (studentMark.score === null) {
        continue;
      }

      if (
        typeof studentMark.score !==
        "number" ||
        !Number.isFinite(
          studentMark.score
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Scores must be valid numbers.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        studentMark.score < 0 ||
        studentMark.score > 20
      ) {
        return NextResponse.json(
          {
            error:
              "Scores must be between 0 and 20.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * -------------------------------------------------------
     * REMOVE DUPLICATE STUDENTS FROM REQUEST
     * -------------------------------------------------------
     */

    const uniqueStudents =
      Array.from(
        new Map(
          students.map((student) => [
            student.studentId,
            student,
          ])
        ).values()
      );

    /*
     * -------------------------------------------------------
     * SAVE INSIDE A TRANSACTION
     * -------------------------------------------------------
     *
     * Each mark is:
     *
     * studentId
     * subjectId
     * teacherId
     * termId
     * sequenceId
     * score
     *
     * No CA1.
     * No CA2.
     * No exam.
     * No average.
     * No grade.
     * No remark.
     */
    await prisma.$transaction(
      async (tx) => {
        for (const studentMark of uniqueStudents) {
          /*
           * -------------------------------------------------
           * CLEAR MARK
           * -------------------------------------------------
           *
           * An empty score from the frontend becomes null.
           *
           * If a mark already exists, delete it.
           */
          if (
            studentMark.score === null
          ) {
            await tx.mark.deleteMany({
              where: {
                studentId:
                  studentMark.studentId,

                subjectId,

                teacherId:
                  teacher.id,

                termId,

                sequenceId,
              },
            });

            continue;
          }

          /*
           * -------------------------------------------------
           * UPSERT MARK
           * -------------------------------------------------
           *
           * Requires this Prisma constraint:
           *
           * @@unique([
           *   studentId,
           *   subjectId,
           *   termId,
           *   sequenceId
           * ])
           *
           * IMPORTANT:
           * teacherId is intentionally NOT part of the
           * unique key.
           *
           * A student has one mark for a subject/sequence,
           * not one mark per teacher.
           */
          await tx.mark.upsert({
            where: {
              studentId_subjectId_termId_sequenceId:
                {
                  studentId:
                    studentMark.studentId,

                  subjectId,

                  termId,

                  sequenceId,
                },
            },

            update: {
              /*
               * The authenticated teacher becomes the
               * teacher recorded on the mark.
               */
              teacherId:
                teacher.id,

              score:
                studentMark.score,
            },

            create: {
              studentId:
                studentMark.studentId,

              subjectId,

              teacherId:
                teacher.id,

              termId,

              sequenceId,

              score:
                studentMark.score,
            },
          });
        }
      }
    );

    /*
     * -------------------------------------------------------
     * RETURN UPDATED MARKS
     * -------------------------------------------------------
     */

    const studentIds =
      uniqueStudents.map(
        (student) => student.studentId
      );

    const updatedMarks =
      studentIds.length > 0
        ? await prisma.mark.findMany({
            where: {
              subjectId,
              termId,
              sequenceId,

              studentId: {
                in: studentIds,
              },
            },

            select: {
              id: true,
              studentId: true,
              subjectId: true,
              teacherId: true,
              termId: true,
              sequenceId: true,
              score: true,
            },
          })
        : [];

    /*
     * -------------------------------------------------------
     * RESPONSE
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Marks saved successfully.",

        count: uniqueStudents.length,

        marks: updatedMarks,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/teacher/marks ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to save marks.",

        message:
          error instanceof Error
            ? error.message
            : "Unknown server error.",
      },
      {
        status: 500,
      }
    );
  }
}