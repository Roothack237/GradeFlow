import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      subjectId,
      teacherId,
      sequence1Id,
      sequence2Id,
      students,
    } = body;

    for (const student of students) {
      await prisma.mark.upsert({
        where: {
          studentId_subjectId_sequenceId: {
            studentId: student.studentId,
            subjectId,
            sequenceId: sequence1Id,
          },
        },
        update: {
          average: Number(student.seq1),
        },
        create: {
          studentId: student.studentId,
          subjectId,
          teacherId,
          sequenceId: sequence1Id,
          ca1: 0,
          ca2: 0,
          exam: 0,
          average: Number(student.seq1),
        },
      });

      await prisma.mark.upsert({
        where: {
          studentId_subjectId_sequenceId: {
            studentId: student.studentId,
            subjectId,
            sequenceId: sequence2Id,
          },
        },
        update: {
          average: Number(student.seq2),
        },
        create: {
          studentId: student.studentId,
          subjectId,
          teacherId,
          sequenceId: sequence2Id,
          ca1: 0,
          ca2: 0,
          exam: 0,
          average: Number(student.seq2),
        },
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}