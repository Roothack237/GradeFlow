import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attendanceId: string }> }
) {
  try {
    const { attendanceId } = await params;

    if (!attendanceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance ID is required",
        },
        { status: 400 }
      );
    }

    // Get one attendance record to identify the session
    const anchorAttendance = await prisma.attendance.findUnique({
      where: {
        id: attendanceId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            coefficient: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
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
                order: true,
                academicYear: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            gender: true,
            classroom: {
              select: {
                id: true,
                name: true,
                section: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                academicYear: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!anchorAttendance) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance record not found",
        },
        { status: 404 }
      );
    }

    const classroomId = anchorAttendance.student.classroom.id;

    /*
     * All attendance records belonging to this same attendance session:
     * - same date
     * - same subject
     * - same teacher
     * - same sequence
     * - students from the same classroom
     */
    const sessionAttendances = await prisma.attendance.findMany({
      where: {
        date: anchorAttendance.date,
        subjectId: anchorAttendance.subject.id,
        teacherId: anchorAttendance.teacher.id,
        sequenceId: anchorAttendance.sequence.id,

        student: {
          classroomId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            gender: true,
          },
        },
      },
      orderBy: [
        {
          student: {
            lastName: "asc",
          },
        },
        {
          student: {
            firstName: "asc",
          },
        },
      ],
    });

    const present = sessionAttendances.filter(
      (item) => item.status === "PRESENT"
    ).length;

    const absent = sessionAttendances.filter(
      (item) => item.status === "ABSENT"
    ).length;

    const late = sessionAttendances.filter(
      (item) => item.status === "LATE"
    ).length;

    const excused = sessionAttendances.filter(
      (item) => item.status === "EXCUSED"
    ).length;

    return NextResponse.json({
      success: true,

      session: {
        id: anchorAttendance.id,
        date: anchorAttendance.date.toISOString(),

        subject: anchorAttendance.subject,

        teacher: anchorAttendance.teacher,

        sequence: anchorAttendance.sequence,

        classroom: anchorAttendance.student.classroom,
      },

      students: sessionAttendances.map((attendance) => ({
        id: attendance.id,
        status: attendance.status,
        student: attendance.student,
      })),

      summary: {
        total: sessionAttendances.length,
        present,
        absent,
        late,
        excused,
      },
    });
  } catch (error) {
    console.error("LOAD ATTENDANCE DETAILS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load attendance details",
        message:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}