import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const name = searchParams.get("name")?.trim();
    const classroomId = searchParams.get("classroomId")?.trim();
    const sectionId = searchParams.get("sectionId")?.trim();

    if (!name || !classroomId || !sectionId) {
      return NextResponse.json(
        {
          error:
            "Child name, section, and class are required for verification.",
        },
        { status: 400 }
      );
    }

    /*
     * Find students whose classroom matches the selected class.
     *
     * We also check the section through the Classroom relation.
     */
    const students = await prisma.student.findMany({
      where: {
        classroomId,
        classroom: {
          sectionId,
        },
        OR: [
          {
            firstName: {
              equals: name,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              equals: name,
              mode: "insensitive",
            },
          },
          {
            AND: [
              {
                firstName: {
                  contains: name.split(" ")[0],
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: name.split(" ").slice(1).join(" "),
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      include: {
        classroom: true,
      },
    });

    /*
     * If no exact-ish match was found, try matching the complete
     * first + last name manually. This makes the verification
     * more tolerant of how the name was entered.
     */
    let student = students[0];

    if (!student) {
      const allStudents = await prisma.student.findMany({
        where: {
          classroomId,
          classroom: {
            sectionId,
          },
        },
        include: {
          classroom: true,
        },
      });

      const normalizedSearchName = name
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      student = allStudents.find((item) => {
        const fullName =
          `${item.firstName} ${item.lastName}`
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        return (
          fullName === normalizedSearchName ||
          `${item.lastName} ${item.firstName}`
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim() === normalizedSearchName
        );
      });
    }

    if (!student) {
      return NextResponse.json(
        {
          error:
            "This child is not registered in the selected class.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`,
        matricule: student.matricule,
        classroomId: student.classroomId,
        className: student.classroom.name,
      },
    });
  } catch (error) {
    console.error("STUDENT VERIFICATION ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to verify student.",
      },
      { status: 500 }
    );
  }
}