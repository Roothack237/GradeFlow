import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

type SequenceName =
  | "First Sequence"
  | "Second Sequence"
  | "Third Sequence"
  | "Fourth Sequence"
  | "Fifth Sequence"
  | "Sixth Sequence";

async function getTeacherFromSession() {
  try {
    console.log("========== TEACHER MARKS AUTH START ==========");

    const session = await auth();

    console.log(
      "========== TEACHER MARKS AUTH RESULT ==========",
      session
    );

    const email = session?.user?.email;

    console.log(
      "========== TEACHER MARKS EMAIL ==========",
      email
    );

    if (!email) {
      console.log(
        "TEACHER MARKS: No email found in session"
      );

      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        teacher: true,
      },
    });

    console.log(
      "========== TEACHER MARKS DATABASE USER ==========",
      user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            hasTeacher: !!user.teacher,
          }
        : null
    );

    if (
      !user ||
      user.role !== "TEACHER" ||
      !user.teacher
    ) {
      console.log(
        "TEACHER MARKS: Teacher account not found"
      );

      return null;
    }

    console.log(
      "========== TEACHER MARKS TEACHER FOUND ==========",
      user.teacher.id
    );

    return user.teacher;
  } catch (error) {
    console.error(
      "========== TEACHER MARKS AUTH ERROR =========="
    );

    console.error(error);

    if (error instanceof Error) {
      console.error("MESSAGE:", error.message);
      console.error("STACK:", error.stack);
    }

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| GET MARKS
|--------------------------------------------------------------------------
*/

export async function GET(request: Request) {
  try {
    const teacher = await getTeacherFromSession();

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "Teacher session not found or teacher account does not exist.",
        },
        { status: 401 }
      );
    }

    const teacherId = teacher.id;

    const { searchParams } = new URL(request.url);

    const classroomId =
      searchParams.get("classroomId");

    const subjectId =
      searchParams.get("subjectId");

    const termId =
      searchParams.get("termId");

    if (
      !classroomId ||
      !subjectId ||
      !termId
    ) {
      return NextResponse.json(
        {
          error:
            "classroomId, subjectId and termId are required",
        },
        { status: 400 }
      );
    }

    /*
     * Verify that this teacher is assigned
     * to this classroom and subject.
     */

    const assignment =
      await prisma.teacherAssignment.findFirst({
        where: {
          teacherId,
          classroomId,
          subjectId,
        },
      });

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to this classroom and subject.",
        },
        { status: 403 }
      );
    }

    /*
     * Get the selected term and
     * its sequences.
     */

    const term =
      await prisma.term.findUnique({
        where: {
          id: termId,
        },
        include: {
          sequences: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });

    if (!term) {
      return NextResponse.json(
        {
          error: "Term not found",
        },
        { status: 404 }
      );
    }

    /*
     * Get students in classroom.
     */

    const students =
      await prisma.student.findMany({
        where: {
          classroomId,
          status: "ACTIVE",
        },
        orderBy: [
          {
            lastName: "asc",
          },
          {
            firstName: "asc",
          },
        ],
      });

    /*
     * Get marks for the selected term.
     */

    const marks =
      await prisma.mark.findMany({
        where: {
          teacherId,
          subjectId,
          sequence: {
            termId: term.id,
          },
          student: {
            classroomId,
          },
        },
        include: {
          sequence: true,
        },
      });

    return NextResponse.json({
      term: {
        id: term.id,
        name: term.name,
      },

      sequences: term.sequences.map(
        (sequence) => ({
          id: sequence.id,
          name: sequence.name,
          order: sequence.order,
        })
      ),

      students,

      marks: marks.map(
        (mark) => ({
          id: mark.id,

          studentId:
            mark.studentId,

          subjectId:
            mark.subjectId,

          sequenceId:
            mark.sequenceId,

          average:
            mark.average,

          ca1:
            mark.ca1,

          ca2:
            mark.ca2,

          exam:
            mark.exam,

          grade:
            mark.grade,

          remark:
            mark.remark,

          sequence:
            mark.sequence.name,

          sequenceName:
            mark.sequence.name,
        })
      ),
    });
  } catch (error) {
    console.error(
      "GET /api/teacher/marks ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load marks",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| SAVE MARKS
|--------------------------------------------------------------------------
*/

export async function POST(request: Request) {
  try {
    const teacher =
      await getTeacherFromSession();

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "Teacher session not found or teacher account does not exist.",
        },
        { status: 401 }
      );
    }

    const teacherId = teacher.id;

    const body = await request.json();

    const {
      classroomId,
      subjectId,
      termId,
      term,
      sequence,
      sequenceKey,
      sequenceOrder,
      students,
    } = body as {
      classroomId?: string;

      subjectId?: string;

      termId?: string;

      term?: string;

      sequence?: SequenceName;

      sequenceKey?: string;

      sequenceOrder?: number;

      students?: {
        studentId: string;
        mark: number | string | null;
      }[];
    };

    console.log(
      "========== SAVE MARKS REQUEST =========="
    );

    console.log({
      teacherId,
      classroomId,
      subjectId,
      termId,
      term,
      sequence,
      sequenceKey,
      sequenceOrder,
      studentsCount:
        students?.length,
    });

    /*
     * Validate required fields.
     */

    if (
      !classroomId ||
      !subjectId ||
      !termId ||
      !Array.isArray(students)
    ) {
      return NextResponse.json(
        {
          error:
            "classroomId, subjectId, termId and students are required",
        },
        { status: 400 }
      );
    }

    /*
     * IMPORTANT:
     *
     * sequenceKey can be something like:
     *
     * "first"
     * "second"
     *
     * We DO NOT use sequenceKey to identify
     * the database sequence.
     *
     * We use the actual sequence name:
     *
     * "First Sequence"
     * "Second Sequence"
     * etc.
     */

    const validSequences: SequenceName[] = [
      "First Sequence",
      "Second Sequence",
      "Third Sequence",
      "Fourth Sequence",
      "Fifth Sequence",
      "Sixth Sequence",
    ];

    if (
      !sequence ||
      !validSequences.includes(sequence)
    ) {
      console.log(
        "INVALID SEQUENCE RECEIVED:",
        sequence
      );

      return NextResponse.json(
        {
          error: "Invalid sequence.",

          receivedSequence:
            sequence ?? null,

          receivedSequenceKey:
            sequenceKey ?? null,

          validSequences,
        },
        { status: 400 }
      );
    }

    /*
     * Verify teacher assignment.
     */

    const assignment =
      await prisma.teacherAssignment.findFirst({
        where: {
          teacherId,
          classroomId,
          subjectId,
        },
      });

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to this classroom and subject.",
        },
        { status: 403 }
      );
    }

    /*
     * Get selected term WITH its sequences.
     *
     * This is important because we want to
     * find the exact sequence belonging to
     * this term.
     */

    const selectedTerm =
      await prisma.term.findUnique({
        where: {
          id: termId,
        },
        include: {
          sequences: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });

    /*
     * Fallback using term name if necessary.
     */

    let finalTerm = selectedTerm;

    if (!finalTerm && term) {
      finalTerm =
        await prisma.term.findFirst({
          where: {
            name: term,
          },
          include: {
            sequences: {
              orderBy: {
                order: "asc",
              },
            },
          },
        });
    }

    if (!finalTerm) {
      return NextResponse.json(
        {
          error: "Term not found.",
          termId,
          termName: term ?? null,
        },
        { status: 404 }
      );
    }

    console.log(
      "========== SELECTED TERM =========="
    );

    console.log({
      id: finalTerm.id,

      name: finalTerm.name,

      sequences:
        finalTerm.sequences.map(
          (item) => ({
            id: item.id,
            name: item.name,
            order: item.order,
          })
        ),
    });

    /*
     * Find the exact sequence BY NAME.
     *
     * We no longer guess the sequence
     * using sequenceOrder.
     *
     * The database already knows which
     * sequences belong to this term.
     */

    const selectedSequenceRecord =
      finalTerm.sequences.find(
        (item) =>
          item.name === sequence
      );

    console.log(
      "========== SELECTED SEQUENCE =========="
    );

    console.log({
      requestedSequence:
        sequence,

      requestedSequenceKey:
        sequenceKey,

      requestedSequenceOrder:
        sequenceOrder,

      foundSequence:
        selectedSequenceRecord
          ? {
              id:
                selectedSequenceRecord.id,

              name:
                selectedSequenceRecord.name,

              order:
                selectedSequenceRecord.order,
            }
          : null,
    });

    if (!selectedSequenceRecord) {
      return NextResponse.json(
        {
          error:
            `${sequence} was not found for ${finalTerm.name}.`,

          requestedSequence:
            sequence,

          availableSequences:
            finalTerm.sequences.map(
              (item) => ({
                id: item.id,

                name: item.name,

                order: item.order,
              })
            ),
        },
        { status: 400 }
      );
    }

    /*
     * Verify students.
     */

    const studentIds =
      students.map(
        (student) =>
          student.studentId
      );

    const validStudents =
      await prisma.student.findMany({
        where: {
          id: {
            in: studentIds,
          },

          classroomId,

          status: "ACTIVE",
        },

        select: {
          id: true,
        },
      });

    const validStudentIds =
      new Set(
        validStudents.map(
          (student) =>
            student.id
        )
      );

    for (const student of students) {
      if (
        !validStudentIds.has(
          student.studentId
        )
      ) {
        return NextResponse.json(
          {
            error:
              `Invalid student: ${student.studentId}`,
          },
          { status: 400 }
        );
      }
    }

    /*
     * Save marks.
     */

    let savedCount = 0;

    for (const student of students) {
      /*
       * Skip empty marks.
       */

      if (
        student.mark === null ||
        student.mark === undefined ||
        student.mark === ""
      ) {
        continue;
      }

      const numericMark =
        Number(student.mark);

      /*
       * Validate number.
       */

      if (
        Number.isNaN(
          numericMark
        )
      ) {
        return NextResponse.json(
          {
            error:
              `Invalid mark for student ${student.studentId}`,
          },
          { status: 400 }
        );
      }

      /*
       * Validate range.
       */

      if (
        numericMark < 0 ||
        numericMark > 20
      ) {
        return NextResponse.json(
          {
            error:
              "Mark must be between 0 and 20.",
          },
          { status: 400 }
        );
      }

      /*
       * Create or update mark.
       */

      await prisma.mark.upsert({
        where: {
          studentId_subjectId_sequenceId:
            {
              studentId:
                student.studentId,

              subjectId,

              sequenceId:
                selectedSequenceRecord.id,
            },
        },

        update: {
          average:
            numericMark,

          teacherId,
        },

        create: {
          studentId:
            student.studentId,

          subjectId,

          teacherId,

          sequenceId:
            selectedSequenceRecord.id,

          ca1: 0,

          ca2: 0,

          exam: 0,

          average:
            numericMark,
        },
      });

      savedCount++;
    }

    /*
     * Success log.
     */

    console.log(
      "========== MARKS SAVED =========="
    );

    console.log({
      teacherId,

      classroomId,

      subjectId,

      termId:
        finalTerm.id,

      term:
        finalTerm.name,

      sequence:
        selectedSequenceRecord.name,

      sequenceId:
        selectedSequenceRecord.id,

      sequenceOrder:
        selectedSequenceRecord.order,

      savedCount,
    });

    /*
     * Return success response.
     */

    return NextResponse.json({
      success: true,

      message:
        `${selectedSequenceRecord.name} saved successfully.`,

      savedCount,

      term: {
        id:
          finalTerm.id,

        name:
          finalTerm.name,
      },

      sequence: {
        id:
          selectedSequenceRecord.id,

        name:
          selectedSequenceRecord.name,

        order:
          selectedSequenceRecord.order,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/teacher/marks ERROR:",
      error
    );

    if (error instanceof Error) {
      console.error(
        "ERROR MESSAGE:",
        error.message
      );

      console.error(
        "ERROR STACK:",
        error.stack
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to save marks",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}