import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const {
      classroomId,
      termId,
    } = await req.json();

    const students = await prisma.student.findMany({
      where: {
        classroomId,
      },
      include: {
        marks: {
          where: {
            termId,
          },
          include: {
            subject: true,
          },
        },
        classroom: true,
      },
    });

    for (const student of students) {
      const subjectMap = new Map<
        string,
        {
          subjectId: string;
          subjectName: string;
          values: number[];
        }
      >();

      student.marks.forEach((mark) => {
        const current =
          subjectMap.get(mark.subjectId) || {
            subjectId: mark.subjectId,
            subjectName: mark.subject.name,
            values: [],
          };

        current.values.push(mark.average || 0);

        subjectMap.set(mark.subjectId, current);
      });

      const subjects = Array.from(
        subjectMap.values()
      );

      const subjectResults = subjects.map(
        (subject) => {
          const average =
            subject.values.reduce(
              (a, b) => a + b,
              0
            ) / subject.values.length;

          return {
            subjectId: subject.subjectId,
            average,
          };
        }
      );

      const total = subjectResults.reduce(
        (sum, s) => sum + s.average,
        0
      );

      const average =
        subjectResults.length > 0
          ? total / subjectResults.length
          : 0;

      const report =
        await prisma.reportCard.upsert({
          where: {
            studentId_termId: {
              studentId: student.id,
              termId,
            },
          },
          update: {
            total,
            average,
          },
          create: {
            studentId: student.id,
            classroomId,
            termId,
            academicYearId:
              student.academicYearId,
            total,
            average,
          },
        });

      await prisma.reportCardSubject.deleteMany({
        where: {
          reportCardId: report.id,
        },
      });

      await prisma.reportCardSubject.createMany({
        data: subjectResults.map((s) => ({
          reportCardId: report.id,
          subjectId: s.subjectId,
          mark: s.average,
        })),
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
  console.error("========================================");
  console.error("REPORT CARDS API ERROR");
  console.error("========================================");
  console.error(error);

  return NextResponse.json(
    {
      success: false,
      error: "Failed to generate report cards.",
      message:
        error instanceof Error
          ? error.message
          : String(error),
    },
    { status: 500 }
  );
}
}