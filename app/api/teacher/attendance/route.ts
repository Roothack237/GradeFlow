import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";
import { checkAbsenceAlerts } from "@/lib/absence-alerts";

type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "EXCUSED";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // Find the logged-in teacher
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        teacher: true,
      },
    });

    if (!user || user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Teacher account not found." },
        { status: 403 }
      );
    }

    const teacherId = user.teacher.id;

    const body = await req.json();

    const {
      classroomId,
      subjectId,
      term,
      date,
      students,
    } = body;

    // ---------------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------------

    if (!classroomId) {
      return NextResponse.json(
        { error: "Classroom is required." },
        { status: 400 }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        { error: "Subject is required." },
        { status: 400 }
      );
    }

    if (!term) {
      return NextResponse.json(
        { error: "Term is required." },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Date is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "No students were provided." },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // VERIFY TEACHER ASSIGNMENT
    // ---------------------------------------------------------

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
            "You are not assigned to teach this subject in this classroom.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // FIND TERM
    // ---------------------------------------------------------

    const academicYear =
      await prisma.academicYear.findFirst({
        where: {
          name: "2025/2026",
        },
      });

    if (!academicYear) {
      return NextResponse.json(
        {
          error: "Academic year 2025/2026 was not found.",
        },
        { status: 404 }
      );
    }

    const foundTerm = await prisma.term.findFirst({
      where: {
        academicYearId: academicYear.id,
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

    if (!foundTerm) {
      return NextResponse.json(
        {
          error: `Term "${term}" was not found.`,
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // DETERMINE SEQUENCE
    // ---------------------------------------------------------
    //
    // First Term  -> First Sequence
    // Second Term -> Third Sequence
    // Third Term  -> Fifth Sequence
    //
    // Attendance page currently represents the first
    // sequence of the selected term.
    // ---------------------------------------------------------

    const sequence = foundTerm.sequences[0];

    if (!sequence) {
      return NextResponse.json(
        {
          error: `No sequence exists for ${term}.`,
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // VALIDATE STUDENTS
    // ---------------------------------------------------------

    const studentIds = students.map(
      (student: { studentId: string }) =>
        student.studentId
    );

    const classroomStudents =
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

    const validStudentIds = new Set(
      classroomStudents.map((student) => student.id)
    );

    for (const student of students) {
      if (!validStudentIds.has(student.studentId)) {
        return NextResponse.json(
          {
            error: `Student ${student.studentId} does not belong to this classroom.`,
          },
          { status: 400 }
        );
      }

      const validStatuses: AttendanceStatus[] = [
        "PRESENT",
        "ABSENT",
        "LATE",
        "EXCUSED",
      ];

      if (!validStatuses.includes(student.status)) {
        return NextResponse.json(
          {
            error: `Invalid attendance status for student ${student.studentId}.`,
          },
          { status: 400 }
        );
      }
    }

    // ---------------------------------------------------------
    // DATE
    // ---------------------------------------------------------

    const attendanceDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(attendanceDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid attendance date." },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // SAVE ATTENDANCE
    // ---------------------------------------------------------

    const savedAttendance = [];

    for (const student of students) {
      const attendance =
        await prisma.attendance.upsert({
          where: {
            studentId_subjectId_date: {
              studentId: student.studentId,
              subjectId,
              date: attendanceDate,
            },
          },

          update: {
            status: student.status as AttendanceStatus,

            // Important:
            // If another teacher edits this record,
            // the current responsible teacher becomes
            // the teacher who last saved it.
            teacherId,
            sequenceId: sequence.id,
          },

          create: {
            studentId: student.studentId,
            subjectId,
            teacherId,
            sequenceId: sequence.id,
            date: attendanceDate,
            status: student.status as AttendanceStatus,
          },
        });

      savedAttendance.push(attendance);
    }

    /*
     * Notify the administration and run the absence alert check through the
     * existing notification system. Failures here must never break the
     * attendance submission.
     */

    try {
      const classroomRecord = await prisma.classroom.findUnique({
        where: { id: classroomId },
        select: { name: true },
      });

      await notifyAdmins({
        title: "Attendance submitted",
        message: `${user.teacher.fullName} submitted attendance for ${
          classroomRecord?.name ?? "a class"
        }.`,
        type: "INFO",
        senderId: user.id,
        relatedType: "ATTENDANCE",
        relatedId: classroomId,
        actionUrl: "/admin/attendance",
      });
    } catch (notificationError) {
      console.error(
        "ATTENDANCE SUBMISSION NOTIFICATION ERROR:",
        notificationError
      );
    }

    try {
      await checkAbsenceAlerts({
        studentIds: studentIds,
        subjectId,
        senderId: user.id,
      });
    } catch (alertError) {
      console.error("ABSENCE ALERT CHECK ERROR:", alertError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Attendance saved successfully.",
        count: savedAttendance.length,
        attendance: savedAttendance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "TEACHER ATTENDANCE POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to save attendance.",
      },
      { status: 500 }
    );
  }
}