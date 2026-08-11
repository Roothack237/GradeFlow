import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const classrooms = await prisma.classroom.findMany({
      include: {
        level: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(classrooms);
  } catch (error) {
    console.error("GET CLASSROOMS ERROR:", error);

    return NextResponse.json(
      { error: "Unable to load classrooms." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, levelId } = body;

    if (!name || !levelId) {
      return NextResponse.json(
        {
          error: "Class name and level are required.",
        },
        { status: 400 }
      );
    }

    const level = await prisma.level.findUnique({
      where: {
        id: levelId,
      },
    });

    if (!level) {
      return NextResponse.json(
        {
          error: "Selected level does not exist.",
        },
        { status: 404 }
      );
    }

    const existingClassroom = await prisma.classroom.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
        levelId,
      },
    });

    if (existingClassroom) {
      return NextResponse.json(
        {
          error: "This class already exists for the selected level.",
        },
        { status: 409 }
      );
    }

    const classroom = await prisma.classroom.create({
      data: {
        name: name.trim(),
        levelId,
      },
      include: {
        level: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Class created successfully.",
        classroom,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE CLASSROOM ERROR:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating the class.",
      },
      { status: 500 }
    );
  }
}