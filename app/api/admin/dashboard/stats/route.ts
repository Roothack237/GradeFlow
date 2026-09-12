import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { serverError } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/dashboard/stats
 * Everything the Admin dashboard shows, computed from the database.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const [
      students,
      teachers,
      parents,
      classes,
      subjects,
      academicYear,
      currentTerm,
      attendanceGroups,
      markAggregate,
      recentMarks,
      recentAttendance,
      notifications,
      recentActivity,
      unassignedTeachers,
      studentsWithoutParent,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.parent.count(),
      prisma.classroom.count(),
      prisma.subject.count(),

      prisma.academicYear.findFirst({
        where: { isActive: true },
        select: { id: true, name: true, startDate: true, endDate: true },
      }),

      prisma.term.findFirst({
        where: { isCurrent: true },
        select: {
          id: true,
          name: true,
          order: true,
          academicYear: { select: { name: true } },
        },
      }),

      prisma.attendance.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),

      prisma.mark.aggregate({
        _avg: { average: true },
        _count: { _all: true },
      }),

      prisma.mark.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          average: true,
          grade: true,
          updatedAt: true,
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
          subject: { select: { id: true, name: true } },
          sequence: { select: { id: true, name: true } },
        },
      }),

      prisma.attendance.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          status: true,
          date: true,
          createdAt: true,
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
          subject: { select: { id: true, name: true } },
          teacher: { select: { id: true, fullName: true } },
        },
      }),

      prisma.notification.findMany({
        where: { userId: guard.user.id, archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          createdAt: true,
        },
      }),

      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          action: true,
          entityType: true,
          description: true,
          actorName: true,
          createdAt: true,
        },
      }),

      prisma.teacher.count({ where: { assignments: { none: {} } } }),
      prisma.student.count({ where: { parentId: null } }),
    ]);

    /* ---------------- attendance overview ---------------- */

    const attendanceTotals = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    } as Record<string, number>;

    let attendanceTotal = 0;

    for (const group of attendanceGroups) {
      attendanceTotals[group.status] = group._count._all;
      attendanceTotal += group._count._all;
    }

    const attendanceRate =
      attendanceTotal > 0
        ? Math.round(
            ((attendanceTotals.PRESENT + attendanceTotals.LATE) /
              attendanceTotal) *
              1000
          ) / 10
        : null;

    /* ---------------- performance overview ---------------- */

    const overallAverage =
      markAggregate._avg.average === null
        ? null
        : Math.round(markAggregate._avg.average * 100) / 100;

    const [passingMarks, subjectAverages, publicationCount] = await Promise.all([
      prisma.mark.count({ where: { average: { gte: 50 } } }),
      prisma.mark.groupBy({
        by: ["subjectId"],
        _avg: { average: true },
        where: { average: { not: 0 } },
      }),
      prisma.resultPublication.count({ where: { status: "PUBLISHED" } }),
    ]);

    const subjectIds = subjectAverages.map((row) => row.subjectId);

    const subjectNames = subjectIds.length
      ? await prisma.subject.findMany({
          where: { id: { in: subjectIds } },
          select: { id: true, name: true },
        })
      : [];

    const nameById = new Map(subjectNames.map((s) => [s.id, s.name]));

    const rankedSubjects = subjectAverages
      .map((row) => ({
        subjectId: row.subjectId,
        name: nameById.get(row.subjectId) ?? "Unknown subject",
        average: Math.round((row._avg.average ?? 0) * 100) / 100,
      }))
      .sort((a, b) => b.average - a.average);

    const passRate =
      markAggregate._count._all > 0
        ? Math.round((passingMarks / markAggregate._count._all) * 1000) / 10
        : null;

    /* ---------------- alerts ---------------- */

    const alerts: {
      tone: "warning" | "info" | "danger";
      title: string;
      message: string;
      href: string;
    }[] = [];

    if (!academicYear) {
      alerts.push({
        tone: "danger",
        title: "No active academic year",
        message:
          "Set an active academic year so results, attendance and timetables are grouped correctly.",
        href: "/admin/academic-years",
      });
    }

    if (!currentTerm) {
      alerts.push({
        tone: "warning",
        title: "No current term selected",
        message:
          "Mark the term currently in progress so teachers record results in the right place.",
        href: "/admin/terms",
      });
    }

    if (unassignedTeachers > 0) {
      alerts.push({
        tone: "warning",
        title: `${unassignedTeachers} teacher${
          unassignedTeachers === 1 ? "" : "s"
        } without a teaching assignment`,
        message:
          "Assign a subject and class so these teachers can enter marks and attendance.",
        href: "/admin/assignments",
      });
    }

    if (studentsWithoutParent > 0) {
      alerts.push({
        tone: "info",
        title: `${studentsWithoutParent} student${
          studentsWithoutParent === 1 ? "" : "s"
        } without a linked parent`,
        message:
          "Link a parent account so results and announcements reach the family.",
        href: "/admin/students",
      });
    }

    return NextResponse.json({
      counts: {
        students,
        teachers,
        parents,
        classes,
        subjects,
      },

      academicYear,
      currentTerm,

      attendance: {
        total: attendanceTotal,
        ...attendanceTotals,
        rate: attendanceRate,
      },

      performance: {
        overallAverage,
        passRate,
        marksRecorded: markAggregate._count._all,
        strongestSubject: rankedSubjects[0] ?? null,
        weakestSubject:
          rankedSubjects.length > 1
            ? rankedSubjects[rankedSubjects.length - 1]
            : null,
        publishedResults: publicationCount,
      },

      recentMarks,
      recentAttendance,
      notifications,
      recentActivity,
      alerts,
    });
  } catch (error) {
    return serverError("ADMIN DASHBOARD STATS ERROR", error);
  }
}
