import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [terms, classrooms, subjects] = await Promise.all([
      prisma.term.findMany({
        orderBy: {
          order: "asc",
        },
        include: {
          sequences: {
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              name: true,
              order: true,
            },
          },
        },
      }),

      prisma.classroom.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
        },
      }),

      prisma.subject.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      terms,
      classrooms,
      subjects,
    });
  } catch (error) {
    console.error("SETUP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load setup data",
      },
      {
        status: 500,
      }
    );
  }
}