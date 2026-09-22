import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { isEnrolled, statusLabel } from "@/lib/student-status";

export async function GET(request: Request) {
  try {
    // ---------------------------------------------------------
    // AUTHENTICATION
    // ---------------------------------------------------------
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // GET CLASS ID FROM QUERY PARAMETER
    // Example:
    // /api/teacher/classes/students?classId=cmu27rmlr0004iwvl5gt47gjx
    // ---------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    console.log("ATTENDANCE API CLASS ID:", classId);

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // FIND TEACHER
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // CHECK THAT TEACHER IS ASSIGNED TO THIS CLASS
    // ---------------------------------------------------------
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        classroomId: classId,
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

    // ---------------------------------------------------------
    // LOAD CLASSROOM + STUDENTS
    // ---------------------------------------------------------
    const classroom = await prisma.classroom.findUnique({
      where: {
        id: classId,
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

    // ---------------------------------------------------------
    // ONLY ACTIVE / ENROLLED STUDENTS
    // ---------------------------------------------------------
    const enrolledStudents = classroom.students.filter((student) =>
      isEnrolled(student.status)
    );

    const inactiveStudents = classroom.students.filter(
      (student) => !isEnrolled(student.status)
    );

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

    // ---------------------------------------------------------
    // LOAD SUBJECTS TAUGHT BY THIS TEACHER IN THIS CLASS
    // ---------------------------------------------------------
    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId,
        classroomId: classId,
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

    // Remove duplicate subjects
    const subjectsMap = new Map();

    for (const assignment of assignments) {
      subjectsMap.set(assignment.subject.id, assignment.subject);
    }

    const subjects = Array.from(subjectsMap.values());

    // ---------------------------------------------------------
    // RESPONSE
    // ---------------------------------------------------------
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

        subjects,

        students,

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
      "GET TEACHER ATTENDANCE STUDENTS ERROR:",
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