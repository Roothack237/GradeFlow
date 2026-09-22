import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          error: "Classroom ID is required",
        },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.findUnique({
      where: {
        id: classId,
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
          error: "Classroom not found",
        },
        { status: 404 }
      );
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        student: {
          classroomId: classId,
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
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
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
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    /*
     * Group individual student attendance records
     * into attendance sessions.
     *
     * A session is identified by:
     * date + subject + teacher + sequence
     */
    const sessionsMap = new Map<
      string,
      {
        id: string;
        date: string;
        subject: {
          id: string;
          name: string;
          code: string;
        };
        teacher: {
          id: string;
          firstName: string;
          lastName: string;
          fullName: string;
        };
        sequence: {
          id: string;
          name: string;
          order: number;
          term: {
            id: string;
            name: string;
            order: number;
          };
        };
        students: typeof attendances;
      }
    >();

    for (const attendance of attendances) {
      const sessionKey = [
        attendance.date.toISOString(),
        attendance.subjectId,
        attendance.teacherId,
        attendance.sequenceId,
      ].join("_");

      if (!sessionsMap.has(sessionKey)) {
        sessionsMap.set(sessionKey, {
          id: attendance.id,
          date: attendance.date.toISOString(),
          subject: attendance.subject,
          teacher: attendance.teacher,
          sequence: attendance.sequence,
          students: [],
        });
      }

      sessionsMap.get(sessionKey)!.students.push(attendance);
    }

    const sessions = Array.from(sessionsMap.values()).map(
      (session) => {
        const present = session.students.filter(
          (student) =>
            student.status === "PRESENT"
        ).length;

        const absent = session.students.filter(
          (student) =>
            student.status === "ABSENT"
        ).length;

        const late = session.students.filter(
          (student) =>
            student.status === "LATE"
        ).length;

        const excused = session.students.filter(
          (student) =>
            student.status === "EXCUSED"
        ).length;

        return {
          id: session.id,
          date: session.date,
          subject: session.subject,
          teacher: session.teacher,
          sequence: session.sequence,

          totalStudents: session.students.length,

          present,
          absent,
          late,
          excused,

          students: session.students.map(
            (attendance) => ({
              id: attendance.id,
              student: attendance.student,
              status: attendance.status,
            })
          ),
        };
      }
    );

    return NextResponse.json({
      success: true,
      classroom,
      sessions,
    });
  } catch (error) {
    console.error(
      "LOAD CLASS ATTENDANCE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load class attendance",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}