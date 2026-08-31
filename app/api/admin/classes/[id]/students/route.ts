import { NextResponse } from "next/server";

import  prisma  from "@/lib/prisma";

/*

* =========================================================
* GET STUDENTS IN A CLASSROOM
* =========================================================
  */

export async function GET(
request: Request,
{ params }: { params: Promise<{ id: string }> }
) {
try {
const { id } = await params;


const classroom = await prisma.classroom.findUnique({
  where: {
    id,
  },
  include: {
    students: true,
  },
});

if (!classroom) {
  return NextResponse.json(
    {
      error: "Class not found",
    },
    { status: 404 }
  );
}

return NextResponse.json({
  students: classroom.students,
});

} catch (error) {
console.error("GET CLASSROOM STUDENTS ERROR:", error);


return NextResponse.json(
  {
    error: "Failed to load students",
  },
  { status: 500 }
);

}
}

/*

* =========================================================
* DELETE CLASSROOM
* =========================================================
  */

export async function DELETE(
request: Request,
{ params }: { params: Promise<{ id: string }> }
) {
try {
const { id } = await params;


const classroom = await prisma.classroom.findUnique({
  where: { id },
  include: {
    _count: {
      select: {
        students: true,
        teacherAssignments: true,
        timetable: true,
      },
    },
  },
});

if (!classroom) {
  return NextResponse.json(
    {
      error: "Class not found",
    },
    { status: 404 }
  );
}

if (classroom._count.students > 0) {
  return NextResponse.json(
    {
      error:
        "This class cannot be deleted because it has students.",
    },
    { status: 400 }
  );
}

if (
  classroom._count.teacherAssignments > 0 ||
  classroom._count.timetable > 0
) {
  return NextResponse.json(
    {
      error:
        "This class cannot be deleted because it is being used by assignments or the timetable.",
    },
    { status: 400 }
  );
}

await prisma.classroom.delete({
  where: { id },
});

return NextResponse.json({
  message: "Class deleted successfully",
});


} catch (error) {
console.error("DELETE CLASS ERROR:", error);


return NextResponse.json(
  {
    error: "Failed to delete class",
  },
  { status: 500 }
);


}
}
