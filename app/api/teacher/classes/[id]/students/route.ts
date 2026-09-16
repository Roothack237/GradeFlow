import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { isEnrolled, statusLabel } from "@/lib/student-status";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.findUnique({
      where: {
        id,
      },
      include: {
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

    /* Suspended and dismissed students keep their history but are no longer
       part of the current class roll: they are listed separately so marks and
       attendance sheets only cover actively enrolled students. */
    const enrolled = classroom.students.filter((student) =>
      isEnrolled(student.status)
    );

    const inactive = classroom.students.filter(
      (student) => !isEnrolled(student.status)
    );

    const students = enrolled.map((student) => ({
      id: student.id,
      fullName: `${student.firstName} ${student.lastName}`.trim(),
      firstName: student.firstName,
      lastName: student.lastName,
      matricule: student.matricule,
      gender: student.gender,
      status: student.status,
      statusLabel: statusLabel(student.status),
    }));

    return NextResponse.json({
      classroom: {
        id: classroom.id,
        name: classroom.name,
      },
      students,
      totalStudents: students.length,
      inactiveStudents: inactive.map((student) => ({
        id: student.id,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        matricule: student.matricule,
        status: student.status,
        statusLabel: statusLabel(student.status),
      })),
      inactiveCount: inactive.length,
    });
  } catch (error) {
    console.error("GET TEACHER CLASS STUDENTS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load students" },
      { status: 500 }
    );
  }
}