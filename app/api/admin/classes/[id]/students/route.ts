import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const classroom = await prisma.class.findUnique({
      where: {
        id: params.id,
      },
      include: {
        section: true,
        students: {
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json(
        {
          error: "Class not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      classroom: {
        id: classroom.id,
        name: classroom.name,
        section: {
          name: classroom.section.name,
        },
      },
      students: classroom.students,
    });
  } catch (error) {
    console.error(
      "GET CLASS STUDENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load students",
      },
      {
        status: 500,
      }
    );
  }
}