import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { isEnrolled, statusLabel } from "@/lib/student-status";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // =========================================================
    // AUTHENTICATION
    // =========================================================
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // =========================================================
    // GET CLASS ID FROM [id]
    // =========================================================
    const { id } = await params;

    console.log("CLASS STUDENTS [id] API:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // =========================================================
    // FIND TEACHER
    // =========================================================
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
        { error: "Teacher account not found" },
        { status: 403 }
      );
    }

    const teacherId = user.teacher.id;

    // =========================================================
    // CHECK TEACHER ASSIGNMENT
    // =========================================================
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        classroomId: id,
      },
      select: {
        id: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to teach any subject in this classroom.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // LOAD CLASSROOM + STUDENTS
    // =========================================================
    const classroom = await prisma.classroom.findUnique({
      where: {
        id,
      },

      include: {
        section: true,
        academicYear: true,

        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            gender: true,
            status: true,
          },

          orderBy: [
            {
              lastName: "asc",
            },
            {
              firstName: "asc",
            },
          ],
        },
      },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // =========================================================
    // ENROLLED STUDENTS
    // =========================================================
    const enrolledStudents = classroom.students.filter((student) =>
      isEnrolled(student.status)
    );

    const inactiveStudents = classroom.students.filter(
      (student) => !isEnrolled(student.status)
    );

    // =========================================================
    // FORMAT STUDENTS
    // =========================================================
    const students = enrolledStudents.map((student) => ({
      id: student.id,
      fullName: `${student.firstName} ${student.lastName}`.trim(),
      firstName: student.firstName,
      lastName: student.lastName,
      matricule: student.matricule,
      gender: student.gender,
      status: student.status,
      statusLabel: statusLabel(student.status),
    }));

    // =========================================================
    // LOAD TEACHER SUBJECTS FOR THIS CLASS
    // =========================================================
    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId,
        classroomId: id,
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
      },

      orderBy: {
        subject: {
          name: "asc",
        },
      },
    });

    const subjectMap = new Map();

    for (const assignment of assignments) {
      subjectMap.set(
        assignment.subject.id,
        assignment.subject
      );
    }

    const subjects = Array.from(subjectMap.values());

    // =========================================================
    // RESPONSE
    // =========================================================
    return NextResponse.json(
      {
        success: true,

        classroom: {
          id: classroom.id,
          name: classroom.name,

          section: classroom.section
            ? {
                id: classroom.section.id,
                name: classroom.section.name,
              }
            : null,

          academicYear: classroom.academicYear
            ? {
                id: classroom.academicYear.id,
                name: classroom.academicYear.name,
              }
            : null,
        },

        students,

        subjects,

        totalStudents: students.length,

        inactiveStudents: inactiveStudents.map((student) => ({
          id: student.id,
          fullName: `${student.firstName} ${student.lastName}`.trim(),
          matricule: student.matricule,
          status: student.status,
          statusLabel: statusLabel(student.status),
        })),

        inactiveCount: inactiveStudents.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET TEACHER CLASS STUDENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load students",
      },
      { status: 500 }
    );
  }
}