import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const students = await prisma.student.count();
    console.log("Students:", students);

    const teachers = await prisma.teacher.count();
    console.log("Teachers:", teachers);

    const parents = await prisma.parent.count();
    console.log("Parents:", parents);

    const classes = await prisma.classroom.count();
    console.log("Classes:", classes);

    return NextResponse.json({
      students,
      teachers,
      parents,
      classes,
    });
  } catch (error) {
    console.error("DASHBOARD STATS API ERROR:", error);

    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}