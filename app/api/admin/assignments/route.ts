import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const assignment =
      await prisma.teacherAssignment.create({
        data: {
          teacherId: body.teacherId,
          sectionId: body.sectionId,
          classroomId: body.classroomId,
          subjectId: body.subjectId,
        },
      });

    return NextResponse.json(
      assignment
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to create assignment",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
    const assignments =
      await prisma.teacherAssignment.findMany({
        include: {
          teacher: true,
          section: true,
          classroom: true,
          subject: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      assignments,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to load assignments",
      },
      {
        status: 500,
      }
    );
  }
}