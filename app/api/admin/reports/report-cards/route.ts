// app/api/admin/reports/report-cards/route.ts

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const academicYearId = searchParams.get("academicYearId");
    const termId = searchParams.get("termId");
    const sequenceId = searchParams.get("sequenceId");
    const classroomId = searchParams.get("classroomId");

    if (!academicYearId || !termId || !sequenceId || !classroomId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Academic year, term, sequence and class are required.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 1. Find the classroom
    // ---------------------------------------------------------
    const classroom = await prisma.classroom.findUnique({
      where: {
        id: classroomId,
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

    // ---------------------------------------------------------
    // 2. Find the academic year
    // ---------------------------------------------------------
    const academicYear = await prisma.academicYear.findUnique({
      where: {
        id: academicYearId,
      },
    });

    if (!academicYear) {
      return NextResponse.json(
        {
          success: false,
          error: "Academic year not found.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 3. Find the term
    // ---------------------------------------------------------
    const term = await prisma.term.findUnique({
      where: {
        id: termId,
      },
    });

    if (!term) {
      return NextResponse.json(
        {
          success: false,
          error: "Term not found.",
        },
        { status: 404 }
      );
    }

    if (term.academicYearId !== academicYearId) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected term does not belong to the selected academic year.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 4. Find the sequence
    // ---------------------------------------------------------
    const sequence = await prisma.sequence.findUnique({
      where: {
        id: sequenceId,
      },
    });

    if (!sequence) {
      return NextResponse.json(
        {
          success: false,
          error: "Sequence not found.",
        },
        { status: 404 }
      );
    }

    // Make sure the selected sequence belongs to the selected term.
    if (sequence.termId !== termId) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected sequence does not belong to the selected term.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 5. Get active students and their marks
    // ---------------------------------------------------------
    const students = await prisma.student.findMany({
      where: {
        classroomId,
        status: "ACTIVE",
      },
      include: {
        marks: {
          where: {
            termId,
            sequenceId,
          },
          select: {
            id: true,
            subjectId: true,
            teacherId: true,
            termId: true,
            sequenceId: true,
            score: true,
          },
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    // ---------------------------------------------------------
    // 6. Calculate each student's average
    // ---------------------------------------------------------
    const studentReports = students.map((student) => {
      const scores = student.marks
        .map((mark) => Number(mark.score))
        .filter((score) => Number.isFinite(score));

      const average =
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) /
            scores.length
          : 0;

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        average: Number(average.toFixed(2)),
        totalSubjects: scores.length,
      };
    });

    // ---------------------------------------------------------
    // 7. Sort students by average
    // ---------------------------------------------------------
    studentReports.sort((a, b) => {
      if (b.average !== a.average) {
        return b.average - a.average;
      }

      return a.name.localeCompare(b.name);
    });

    // ---------------------------------------------------------
    // 8. Assign positions
    // ---------------------------------------------------------
    const rankedStudents = studentReports.map((student, index) => ({
      ...student,
      rank: index + 1,
    }));

    // ---------------------------------------------------------
    // 9. Calculate class average
    // ---------------------------------------------------------
    const classAverage =
      rankedStudents.length > 0
        ? rankedStudents.reduce(
            (sum, student) => sum + student.average,
            0
          ) / rankedStudents.length
        : 0;

    // ---------------------------------------------------------
    // 10. Return report-card data
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,

      academicYear: {
        id: academicYear.id,
        name: academicYear.name,
      },

      classroom: {
        id: classroom.id,
        name: classroom.name,
      },

      term: {
        id: term.id,
        name: term.name,
      },

      sequence: {
        id: sequence.id,
        name: sequence.name,
      },

      summary: {
        totalStudents: rankedStudents.length,
        classAverage: Number(classAverage.toFixed(2)),
        published: true,
      },

      students: rankedStudents,
    });
  } catch (error) {
    console.error("ADMIN REPORT CARD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),

        stack:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : null
            : undefined,
      },
      { status: 500 }
    );
  }
}