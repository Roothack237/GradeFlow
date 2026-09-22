import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getGrade(mark: number) {
  if (mark >= 16) return "A";
  if (mark >= 14) return "B";
  if (mark >= 12) return "C";
  if (mark >= 10) return "D";
  return "F";
}

function getRemark(mark: number) {
  if (mark >= 16) return "Excellent";
  if (mark >= 14) return "Very Good";
  if (mark >= 12) return "Good";
  if (mark >= 10) return "Pass";
  return "Fail";
}

export async function POST(req: Request) {
  try {
    const { classroomId, termId } = await req.json();

    if (!classroomId || !termId) {
      return NextResponse.json(
        {
          success: false,
          error: "Classroom and term are required",
        },
        { status: 400 }
      );
    }

    const academicYear = await prisma.academicYear.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!academicYear) {
      return NextResponse.json(
        {
          success: false,
          error: "No active academic year found",
        },
        { status: 400 }
      );
    }

    const students = await prisma.student.findMany({
      where: {
        classroomId,
      },
      include: {
        classroom: true,
        marks: {
          include: {
            subject: true,
            sequence: true,
          },
        },
      },
    });

    for (const student of students) {
      const termMarks = student.marks.filter(
        (mark) => mark.sequence.termId === termId
      );

      const subjectMap = new Map<
        string,
        {
          subjectId: string;
          subjectName: string;
          coefficient: number;
          values: number[];
        }
      >();

      for (const mark of termMarks) {
        const existing = subjectMap.get(mark.subjectId);

        if (existing) {
          existing.values.push(mark.average);
        } else {
          subjectMap.set(mark.subjectId, {
            subjectId: mark.subjectId,
            subjectName: mark.subject.name,
            coefficient: mark.subject.coefficient,
            values: [mark.average],
          });
        }
      }

      const subjectResults = Array.from(subjectMap.values()).map(
        (subject) => {
          const average =
            subject.values.reduce((a, b) => a + b, 0) /
            subject.values.length;

          return {
            subjectId: subject.subjectId,
            average,
            grade: getGrade(average),
            remark: getRemark(average),
          };
        }
      );

      const total = subjectResults.reduce(
        (sum, subject) => sum + subject.average,
        0
      );

      const average =
        subjectResults.length > 0
          ? total / subjectResults.length
          : 0;

      const reportCard = await prisma.reportCard.upsert({
        where: {
          studentId_termId: {
            studentId: student.id,
            termId,
          },
        },
        update: {
          total,
          average,
          generatedAt: new Date(),
        },
        create: {
          studentId: student.id,
          classroomId,
          termId,
          academicYearId: academicYear.id,
          total,
          average,
        },
      });

      await prisma.reportCardSubject.deleteMany({
        where: {
          reportCardId: reportCard.id,
        },
      });

      if (subjectResults.length > 0) {
        await prisma.reportCardSubject.createMany({
          data: subjectResults.map((subject) => ({
            reportCardId: reportCard.id,
            subjectId: subject.subjectId,
            mark: subject.average,
            grade: subject.grade,
            remark: subject.remark,
          })),
        });
      }
    }

    // POSITION CALCULATION

    const reports = await prisma.reportCard.findMany({
      where: {
        classroomId,
        termId,
      },
      orderBy: {
        average: "desc",
      },
    });

    for (let i = 0; i < reports.length; i++) {
      await prisma.reportCard.update({
        where: {
          id: reports[i].id,
        },
        data: {
          position: i + 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Report cards generated successfully",
    });
  } catch (error) {
    console.error("REPORT CARD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate report cards",
      },
      { status: 500 }
    );
  }
}