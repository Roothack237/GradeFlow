import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, pagination, serverError, str, optionalStr } from "@/lib/http";
import prisma from "@/lib/prisma";

// =========================================================
// GENERATE MATRICULE
// =========================================================

function generateMatricule() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);

  return `GF-${year}-${random}`;
}

// =========================================================
// GET STUDENTS
// =========================================================
// Supports optional server-side search, filtering and pagination:
//   ?search=&classroomId=&sectionId=&status=&gender=&parentId=
//   &page=1&pageSize=20
// When `page`/`pageSize` are omitted every matching student is returned,
// which keeps the older admin screens working unchanged.

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);

    const search = str(searchParams.get("search"));
    const classroomId = optionalStr(searchParams.get("classroomId"));
    const sectionId = optionalStr(searchParams.get("sectionId"));
    const status = optionalStr(searchParams.get("status"));
    const gender = optionalStr(searchParams.get("gender"));
    const parentId = optionalStr(searchParams.get("parentId"));
    const withoutParent = searchParams.get("withoutParent") === "true";

    const where = {
      ...(classroomId ? { classroomId } : {}),
      ...(parentId ? { parentId } : {}),
      ...(withoutParent ? { parentId: null } : {}),
      ...(status ? { status: status as never } : {}),
      ...(gender ? { gender: gender as never } : {}),
      ...(sectionId ? { classroom: { sectionId } } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { matricule: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const wantsPagination =
      searchParams.has("page") || searchParams.has("pageSize");

    const { skip, take, page, pageSize } = pagination(searchParams, 20, 100);

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          classroom: { include: { section: true } },
          parent: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        ...(wantsPagination ? { skip, take } : {}),
      }),
      wantsPagination ? prisma.student.count({ where }) : Promise.resolve(0),
    ]);

    const formattedStudents = students.map((student) => ({
      id: student.id,

      firstName: student.firstName,
      lastName: student.lastName,

      fullName: `${student.firstName} ${student.lastName}`.trim(),

      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      status: student.status,

      matricule: student.matricule,

      classroomId: student.classroomId,

      className: student.classroom?.name ?? null,

      sectionId: student.classroom?.sectionId ?? null,
      sectionName: student.classroom?.section?.name ?? null,

      parentId: student.parentId,
      parentName: student.parent?.fullName ?? null,
      parentEmail: student.parent?.email ?? null,

      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    }));

    return NextResponse.json({
      students: formattedStudents,
      ...(wantsPagination
        ? {
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
          }
        : {}),
    });
  } catch (error) {
    return serverError("GET STUDENTS ERROR", error);
  }
}

// =========================================================
// CREATE STUDENT
// =========================================================
// A parent is optional: the Admin can register a student first and link a
// parent/guardian later from the student detail screen.

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();

    const firstName = str(body.firstName);
    const lastName = str(body.lastName);
    const gender = str(body.gender);
    const dateOfBirth = str(body.dateOfBirth);
    const classroomId = str(body.classroomId);
    const parentId = optionalStr(body.parentId);
    const status = str(body.status) || "ACTIVE";
    let matricule = str(body.matricule);

    if (!firstName || !lastName || !gender || !dateOfBirth || !classroomId) {
      return badRequest(
        "First name, last name, gender, date of birth and class are required."
      );
    }

    if (!["MALE", "FEMALE"].includes(gender)) {
      return badRequest("Gender must be MALE or FEMALE.");
    }

    const parsedDate = new Date(dateOfBirth);

    if (Number.isNaN(parsedDate.getTime())) {
      return badRequest("Please provide a valid date of birth.");
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      return badRequest("Selected class does not exist.");
    }

    if (parentId) {
      const parent = await prisma.parent.findUnique({ where: { id: parentId } });

      if (!parent) {
        return badRequest("Selected parent does not exist.");
      }
    }

    if (matricule) {
      const duplicate = await prisma.student.findUnique({
        where: { matricule },
      });

      if (duplicate) {
        return badRequest(
          `The matricule "${matricule}" is already used by another student.`
        );
      }
    } else {
      matricule = generateMatricule();

      let existing = await prisma.student.findUnique({ where: { matricule } });

      while (existing) {
        matricule = generateMatricule();
        existing = await prisma.student.findUnique({ where: { matricule } });
      }
    }

    const student = await prisma.student.create({
      data: {
        matricule,
        firstName,
        lastName,
        gender: gender as never,
        dateOfBirth: parsedDate,
        status: status as never,
        classroomId,
        parentId,
      },
      include: { classroom: true },
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "STUDENT_CREATED",
      entityType: "Student",
      entityId: student.id,
      description: `Registered student ${student.firstName} ${student.lastName} (${student.matricule})`,
      metadata: { classroomId, parentId },
    });

    return NextResponse.json(
      {
        message: "Student created successfully.",
        student,
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError("CREATE STUDENT ERROR", error);
  }
}
