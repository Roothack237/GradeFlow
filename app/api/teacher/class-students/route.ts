import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { isEnrolled, statusLabel } from "@/lib/student-status";

export async function GET(request: Request) {
  try {
    // =========================================================
    // AUTH
    // =========================================================
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // =========================================================
    // CLASS ID
    // =========================================================
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    console.log("========================================");
    console.log("CLASS STUDENTS REQUEST");
    console.log("classId:", classId);
    console.log("teacher email:", session.user.email);
    console.log("========================================");

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // =========================================================
    // FIND USER + TEACHER
    // =========================================================
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        teacher: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    if (user.role !== "TEACHER" || !user.teacher) {
      return NextResponse.json(
        { error: "Teacher account not found" },
        { status: 403 }
      );
    }

    const teacherId = user.teacher.id;

    console.log("Teacher database ID:", teacherId);

    // =========================================================
    // FIND CLASSROOM
    // =========================================================
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

    console.log("Class found:", classroom.name);
    console.log("Class database ID:", classroom.id);

    // =========================================================
    // FIND ALL TEACHER ASSIGNMENTS
    // =========================================================
    const teacherAssignments =
      await prisma.teacherAssignment.findMany({
        where: {
          teacherId,
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

          classroom: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    console.log(
      "Teacher assignments:",
      teacherAssignments.map((assignment) => ({
        assignmentId: assignment.id,
        classroomId: assignment.classroomId,
        classroomName: assignment.classroom.name,
        subject: assignment.subject.name,
      }))
    );

    // =========================================================
    // CHECK WHETHER TEACHER IS ASSIGNED TO THIS CLASS
    // =========================================================
    const classAssignments = teacherAssignments.filter(
      (assignment) => assignment.classroomId === classId
    );

    console.log(
      "Assignments for requested class:",
      classAssignments.length
    );

    if (classAssignments.length === 0) {
      return NextResponse.json(
        {
          error: "You are not assigned to teach any subject in this class.",

          debug: {
            teacherId,
            requestedClassId: classId,
            requestedClassName: classroom.name,

            assignedClasses: teacherAssignments.map(
              (assignment) => ({
                classroomId: assignment.classroomId,
                classroomName: assignment.classroom.name,
                subjectName: assignment.subject.name,
              })
            ),
          },
        },
        { status: 403 }
      );
    }

    // =========================================================
    // STUDENTS
    // =========================================================
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

    // =========================================================
    // SUBJECTS
    // =========================================================
    const subjectMap = new Map();

    for (const assignment of classAssignments) {
      subjectMap.set(
        assignment.subject.id,
        assignment.subject
      );
    }

    const subjects = Array.from(subjectMap.values());

    // =========================================================
    // RESPONSE
    // =========================================================
    return NextResponse.json({
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
    });
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