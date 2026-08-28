import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: {
        fullName: "asc",
      },

      select: {
        id: true,
        teacherId: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,

        assignments: {
          select: {
            id: true,

            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },

            classroom: {
              select: {
                id: true,
                name: true,

                section: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(teachers);
  } catch (error: any) {
    console.error("GET TEACHERS ERROR:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to fetch teachers",
      },
      { status: 500 }
    );
  }
}