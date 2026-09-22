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
    // =========================================================
    // 1. AUTHENTICATE TEACHER
    // =========================================================
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

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

    // =========================================================
    // 2. READ REQUEST
    // =========================================================
    const body = await req.json();

    const {
      classroomId,
      subjectId,
      term,
      date,
      students,
    } = body;

    // =========================================================
    // 3. VALIDATE REQUIRED FIELDS
    // =========================================================
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

    // =========================================================
    // 4. VERIFY TEACHER ASSIGNMENT
    // =========================================================
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        classroomId,
        subjectId,
      },
      include: {
        subject: true,
        classroom: true,
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

    // =========================================================
    // 5. GET ACADEMIC YEAR
    // =========================================================
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        name: "2026/2027",
      },
    });

    if (!academicYear) {
      return NextResponse.json(
        {
          error: "Academic year 2026/2027 was not found.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 6. GET TERM
    // =========================================================
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

    // =========================================================
    // 7. GET FIRST SEQUENCE
    // =========================================================
    const sequence = foundTerm.sequences[0];

    if (!sequence) {
      return NextResponse.json(
        {
          error: `No sequence exists for ${term}.`,
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 8. EXTRACT STUDENT IDS
    // =========================================================
    const studentIds = students.map(
      (student: { studentId: string }) => student.studentId
    );

    // =========================================================
    // 9. VERIFY STUDENTS BELONG TO CLASS
    // =========================================================
    const classroomStudents = await prisma.student.findMany({
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

    // =========================================================
    // 10. VALIDATE EACH STUDENT
    // =========================================================
    const validStatuses: AttendanceStatus[] = [
      "PRESENT",
      "ABSENT",
      "LATE",
      "EXCUSED",
    ];

    for (const student of students) {
      if (!validStudentIds.has(student.studentId)) {
        return NextResponse.json(
          {
            error: `Student ${student.studentId} does not belong to this classroom.`,
          },
          { status: 400 }
        );
      }

      if (!validStatuses.includes(student.status)) {
        return NextResponse.json(
          {
            error: `Invalid attendance status for student ${student.studentId}.`,
          },
          { status: 400 }
        );
      }
    }

    // =========================================================
    // 11. VALIDATE DATE
    // =========================================================
    const attendanceDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(attendanceDate.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid attendance date.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 12. SAVE ATTENDANCE
    // =========================================================
    const savedAttendance = [];

    for (const student of students) {
      const attendance = await prisma.attendance.upsert({
        where: {
          studentId_subjectId_date: {
            studentId: student.studentId,
            subjectId,
            date: attendanceDate,
          },
        },

        update: {
          status: student.status as AttendanceStatus,
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

    // =========================================================
    // 13. NOTIFY ADMINS
    // =========================================================
    try {
      await notifyAdmins({
        title: "Attendance submitted",

        message: `${user.teacher.fullName} submitted attendance for ${assignment.classroom.name} - ${assignment.subject.name}.`,

        type: "INFO",

        senderId: user.id,

        relatedType: "ATTENDANCE",

        relatedId: classroomId,

        actionUrl: "/admin/attendance",
      });
    } catch (notificationError) {
      console.error(
        "ATTENDANCE NOTIFICATION ERROR:",
        notificationError
      );
    }

    // =========================================================
    // 14. CHECK ABSENCE ALERTS
    // =========================================================
    try {
      await checkAbsenceAlerts({
        studentIds,
        subjectId,
        senderId: user.id,
      });
    } catch (alertError) {
      console.error(
        "ABSENCE ALERT CHECK ERROR:",
        alertError
      );
    }

    // =========================================================
    // 15. RESPONSE
    // =========================================================
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
      "SAVE TEACHER ATTENDANCE ERROR:",
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