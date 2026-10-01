import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";
import { NextResponse } from "next/server";

const VALID_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
] as const;

const VALID_TERMS = [
  "FIRST_TERM",
  "SECOND_TERM",
  "THIRD_TERM",
] as const;

export async function POST(request: Request) {
  try {
    // =========================================================
    // 1. AUTHENTICATION
    // =========================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        {
          success: false,
          error: "Teacher access only.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 2. GET TEACHER
    // =========================================================

    const teacher = await prisma.teacher.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          error: "Teacher profile not found.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 3. READ REQUEST BODY
    // =========================================================

    const body = await request.json();

    const {
      classroomId,
      subjectId,
      term,
      date,
      students,
    } = body;

    // =========================================================
    // 4. VALIDATE BASIC DATA
    // =========================================================

    if (!classroomId) {
      return NextResponse.json(
        {
          success: false,
          error: "Classroom ID is required.",
        },
        { status: 400 }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Subject ID is required.",
        },
        { status: 400 }
      );
    }

    if (!VALID_TERMS.includes(term)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid term: ${term}`,
        },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance date is required.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No students were supplied.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 5. FIND CLASSROOM
    // =========================================================

    const classroom = await prisma.classroom.findUnique({
      where: {
        id: classroomId,
      },
      include: {
        section: true,
        academicYear: true,
      },
    });

    if (!classroom) {
      return NextResponse.json(
        {
          success: false,
          error: "Classroom not found.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 6. FIND SUBJECT
    // =========================================================

    const subject = await prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
    });

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          error: "Subject not found.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 7. VERIFY TEACHER ASSIGNMENT
    // =========================================================

    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacher.id,
        classroomId,
        subjectId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not assigned to this subject for this classroom.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 8. FIND TERM
    // =========================================================
    //
    // Term is a MODEL relation, not a string field on Sequence.
    //
    // We first find the Term using its name and academic year.
    //

    const termRecord = await prisma.term.findFirst({
      where: {
        name: term,
        academicYearId: classroom.academicYearId,
      },
    });

    if (!termRecord) {
      return NextResponse.json(
        {
          success: false,
          error: `No ${term} record exists for academic year ${classroom.academicYear.name}.`,
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 9. FIND SEQUENCE FOR THAT TERM
    // =========================================================

    const sequence = await prisma.sequence.findFirst({
      where: {
        termId: termRecord.id,
      },
      orderBy: {
        order: "asc",
      },
    });

    if (!sequence) {
      return NextResponse.json(
        {
          success: false,
          error: `No sequence exists for ${termRecord.name}. Please create a sequence for this term first.`,
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 10. VALIDATE DATE
    // =========================================================

    const attendanceDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(attendanceDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid attendance date.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 11. GET STUDENT IDS
    // =========================================================

    const studentIds = students.map(
      (student: { studentId: string }) => student.studentId
    );

    // =========================================================
    // 12. VERIFY STUDENTS BELONG TO CLASS
    // =========================================================

    const classroomStudents = await prisma.student.findMany({
      where: {
        id: {
          in: studentIds,
        },
        classroomId,
      },
      select: {
        id: true,
      },
    });

    const validStudentIds = new Set(
      classroomStudents.map((student) => student.id)
    );

    // =========================================================
    // 13. VALIDATE EACH ATTENDANCE RECORD
    // =========================================================

    for (const student of students) {
      if (!student.studentId) {
        return NextResponse.json(
          {
            success: false,
            error: "A student ID is missing.",
          },
          { status: 400 }
        );
      }

      if (!validStudentIds.has(student.studentId)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "One or more students do not belong to this classroom.",
          },
          { status: 400 }
        );
      }

      if (!VALID_STATUSES.includes(student.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid attendance status: ${student.status}`,
          },
          { status: 400 }
        );
      }
    }

    // =========================================================
    // 14. SAVE ATTENDANCE
    // =========================================================

    let savedCount = 0;

    for (const student of students) {
      await prisma.attendance.upsert({
        where: {
          studentId_subjectId_date: {
            studentId: student.studentId,
            subjectId,
            date: attendanceDate,
          },
        },

        // -----------------------------------------------------
        // EXISTING RECORD
        // -----------------------------------------------------

        update: {
          status: student.status,

          teacher: {
            connect: {
              id: teacher.id,
            },
          },

          sequence: {
            connect: {
              id: sequence.id,
            },
          },
        },

        // -----------------------------------------------------
        // NEW RECORD
        // -----------------------------------------------------

        create: {
          date: attendanceDate,

          status: student.status,

          student: {
            connect: {
              id: student.studentId,
            },
          },

          subject: {
            connect: {
              id: subjectId,
            },
          },

          teacher: {
            connect: {
              id: teacher.id,
            },
          },

          sequence: {
            connect: {
              id: sequence.id,
            },
          },
        },
      });

      savedCount++;
    }

    try {
      await notifyAdmins({
        title: "Attendance submitted",
        message: `${teacher.firstName} ${teacher.lastName} submitted attendance for ${classroom.section.name} · ${classroom.name} · ${subject.name} on ${attendanceDate.toLocaleDateString("en-GB")}.`,
        type: "INFO",
        senderId: session.user.id,
        actionUrl: "/admin/results",
        relatedType: "ATTENDANCE",
        relatedId: classroom.id,
      });
    } catch (notificationError) {
      console.error("ATTENDANCE ADMIN NOTIFICATION ERROR:", notificationError);
    }

    // =========================================================
    // 15. SUCCESS
    // =========================================================

    return NextResponse.json(
      {
        success: true,

        message: `Attendance saved successfully for ${savedCount} student${
          savedCount === 1 ? "" : "s"
        }.`,

        count: savedCount,

        classroom: classroom.name,

        subject: subject.name,

        term: termRecord.name,

        sequence: {
          id: sequence.id,
          name: sequence.name,
          order: sequence.order,
        },

        date,
      },
      { status: 200 }
    );
  } catch (caughtError: unknown) {
    const error =
      caughtError && typeof caughtError === "object"
        ? (caughtError as { message?: string; code?: string; meta?: unknown })
        : null;

    // =========================================================
    // ERROR HANDLING
    // =========================================================

    console.error("========================================");
    console.error("SAVE ATTENDANCE ERROR");
    console.error(caughtError);
    console.error("MESSAGE:", error?.message);
    console.error("CODE:", error?.code);
    console.error("META:", error?.meta);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to save attendance.",

        code: error?.code || null,

        meta: error?.meta || null,
      },
      { status: 500 }
    );
  }
}