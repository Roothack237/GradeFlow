import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { badRequest, notFound, serverError, str, optionalStr } from "@/lib/http";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// =========================================================
// GET ONE STUDENT (full academic profile)
// =========================================================

export async function GET(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        classroom: { include: { section: true } },
        parent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            parentId: true,
            userId: true,
          },
        },
        marks: {
          include: {
            subject: { select: { id: true, name: true, code: true, coefficient: true } },
            sequence: {
              select: {
                id: true,
                name: true,
                order: true,
                term: { select: { id: true, name: true, order: true } },
              },
            },
            teacher: { select: { id: true, fullName: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
        attendances: {
          include: {
            subject: { select: { id: true, name: true } },
            sequence: { select: { id: true, name: true } },
          },
          orderBy: { date: "desc" },
          take: 60,
        },
        reportCards: {
          include: {
            term: {
              select: {
                id: true,
                name: true,
                order: true,
                academicYear: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return notFound("Student not found.");
    }

    /* ---- attendance summary ---- */
    const attendanceSummary = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
      total: student.attendances.length,
      rate: 0,
    } as Record<string, number>;

    for (const record of student.attendances) {
      attendanceSummary[record.status] += 1;
    }

    attendanceSummary.rate =
      attendanceSummary.total > 0
        ? Math.round(
            ((attendanceSummary.PRESENT + attendanceSummary.LATE) /
              attendanceSummary.total) *
              1000
          ) / 10
        : 0;

    /* ---- performance per subject ---- */
    const subjectMap = new Map<
      string,
      {
        subjectId: string;
        subject: string;
        code: string;
        coefficient: number;
        marks: number;
        total: number;
        average: number;
      }
    >();

    for (const mark of student.marks) {
      const key = mark.subjectId;
      const entry =
        subjectMap.get(key) ??
        {
          subjectId: mark.subjectId,
          subject: mark.subject.name,
          code: mark.subject.code,
          coefficient: mark.subject.coefficient,
          marks: 0,
          total: 0,
          average: 0,
        };

      entry.marks += 1;
      entry.total += mark.average;
      entry.average = Math.round((entry.total / entry.marks) * 100) / 100;

      subjectMap.set(key, entry);
    }

    const subjects = Array.from(subjectMap.values()).sort(
      (a, b) => b.average - a.average
    );

    const overallAverage = student.marks.length
      ? Math.round(
          (student.marks.reduce((sum, mark) => sum + mark.average, 0) /
            student.marks.length) *
            100
        ) / 100
      : null;

    /* ---- published results only ---- */
    const publications = await prisma.resultPublication.findMany({
      where: {
        classroomId: student.classroomId,
        status: "PUBLISHED",
        ...(student.classroom ? {} : {}),
      },
      select: { termId: true },
    });

    const publishedTermIds = new Set(publications.map((row) => row.termId));

    return NextResponse.json({
      student: {
        id: student.id,
        matricule: student.matricule,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        status: student.status,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        classroomId: student.classroomId,
        className: student.classroom?.name ?? null,
        sectionId: student.classroom?.sectionId ?? null,
        sectionName: student.classroom?.section?.name ?? null,
      },
      parent: student.parent,
      marks: student.marks,
      subjects,
      overallAverage,
      attendances: student.attendances,
      attendanceSummary,
      reportCards: student.reportCards.map((card) => ({
        ...card,
        published: publishedTermIds.has(card.termId),
      })),
    });
  } catch (error) {
    return serverError("GET STUDENT DETAIL ERROR", error);
  }
}

// =========================================================
// UPDATE STUDENT
// =========================================================

async function updateStudent(
  request: Request,
  { params }: RouteContext
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.student.findUnique({ where: { id } });

    if (!existing) {
      return notFound("Student not found.");
    }

    const data: Record<string, unknown> = {};
    const changes: string[] = [];

    const firstName = str(body.firstName);
    const lastName = str(body.lastName);
    const gender = str(body.gender);
    const dateOfBirth = str(body.dateOfBirth);
    const classroomId = str(body.classroomId);
    const status = str(body.status);
    const matricule = str(body.matricule);

    if ("parentId" in body) {
      const parentId = optionalStr(body.parentId);

      if (parentId) {
        const parent = await prisma.parent.findUnique({ where: { id: parentId } });

        if (!parent) return badRequest("Selected parent does not exist.");
      }

      if (parentId !== existing.parentId) {
        changes.push(parentId ? "linked a parent/guardian" : "unlinked the parent");
      }

      data.parentId = parentId;
    }

    if (firstName && firstName !== existing.firstName) {
      data.firstName = firstName;
      changes.push("changed the first name");
    }

    if (lastName && lastName !== existing.lastName) {
      data.lastName = lastName;
      changes.push("changed the last name");
    }

    if (gender && gender !== existing.gender) {
      if (!["MALE", "FEMALE"].includes(gender)) {
        return badRequest("Gender must be MALE or FEMALE.");
      }

      data.gender = gender;
      changes.push("changed the gender");
    }

    if (dateOfBirth) {
      const parsed = new Date(dateOfBirth);

      if (Number.isNaN(parsed.getTime())) {
        return badRequest("Please provide a valid date of birth.");
      }

      data.dateOfBirth = parsed;
      changes.push("changed the date of birth");
    }

    if (classroomId && classroomId !== existing.classroomId) {
      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
      });

      if (!classroom) return badRequest("Selected class does not exist.");

      data.classroomId = classroomId;
      changes.push(`moved to ${classroom.name}`);
    }

    if (status && status !== existing.status) {
      if (!["ACTIVE", "SUSPENDED", "PENDING"].includes(status)) {
        return badRequest("Invalid account status.");
      }

      data.status = status;
      changes.push(`changed the status to ${status}`);
    }

    if (matricule && matricule !== existing.matricule) {
      const duplicate = await prisma.student.findUnique({
        where: { matricule },
      });

      if (duplicate && duplicate.id !== id) {
        return badRequest(
          `The matricule "${matricule}" is already used by another student.`
        );
      }

      data.matricule = matricule;
      changes.push("changed the matricule");
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({
        message: "Nothing to update.",
        student: existing,
      });
    }

    const student = await prisma.student.update({
      where: { id },
      data,
      include: {
        classroom: { include: { section: true } },
        parent: { select: { id: true, fullName: true } },
      },
    });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "STUDENT_UPDATED",
      entityType: "Student",
      entityId: student.id,
      description: `Updated student ${student.firstName} ${student.lastName} (${changes.join(", ")})`,
    });

    return NextResponse.json({
      message: "Student updated successfully.",
      student,
    });
  } catch (error) {
    return serverError("UPDATE STUDENT ERROR", error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return updateStudent(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return updateStudent(request, context);
}

// =========================================================
// DELETE STUDENT
// =========================================================

export async function DELETE(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const existing = await prisma.student.findUnique({ where: { id } });

    if (!existing) {
      return notFound("Student not found.");
    }

    await prisma.student.delete({ where: { id } });

    await logAudit({
      actorId: guard.user.id,
      actorName: guard.user.fullName,
      action: "STUDENT_DELETED",
      entityType: "Student",
      entityId: id,
      description: `Deleted student ${existing.firstName} ${existing.lastName} (${existing.matricule})`,
    });

    return NextResponse.json({ message: "Student deleted successfully." });
  } catch (error) {
    return serverError("DELETE STUDENT ERROR", error);
  }
}
