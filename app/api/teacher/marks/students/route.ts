import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const classroomId =
      req.nextUrl.searchParams.get("classroomId");

    if (!classroomId) {
      return NextResponse.json(
        {
          success: false,
          message: "Classroom ID required",
        },
        {
          status: 400,
        }
      );
    }

    const students = await prisma.student.findMany({
      where: {
        classroomId,
      },
      orderBy: [
        {
          lastName: "asc",
        },
        {
          firstName: "asc",
        },
      ],
      select: {
        id: true,
        matricule: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json({
      success: true,
      students,
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