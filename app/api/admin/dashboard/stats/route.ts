import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { serverError } from "@/lib/http";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/dashboard/stats
 *
 * Dashboard statistics for the administrator.
 *
 * Current Mark model:
 * - score
 * - studentId
 * - subjectId
 * - teacherId
 * - termId
 * - sequenceId
 *
 * Scores are stored on a 0–20 scale.
 */

export async function GET() {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    // =========================================================
    // BASIC COUNTS
    // =========================================================

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

      // =======================================================
      // ACTIVE ACADEMIC YEAR
      // =======================================================

      prisma.academicYear.findFirst({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
        },
      }),

      // =======================================================
      // CURRENT TERM
      // =======================================================

      prisma.term.findFirst({
        where: {
          isCurrent: true,
        },
        select: {
          id: true,
          name: true,
          order: true,
          academicYear: {
            select: {
              name: true,
            },
          },
        },
      }),

      // =======================================================
      // ATTENDANCE
      // =======================================================

      prisma.attendance.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      // =======================================================
      // MARKS
      // =======================================================

      prisma.mark.aggregate({
        _avg: {
          score: true,
        },
        _count: {
          _all: true,
        },
      }),

      // =======================================================
      // RECENT MARKS
      // =======================================================

      prisma.mark.findMany({
        orderBy: {
          updatedAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          score: true,
          updatedAt: true,

          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },

          subject: {
            select: {
              id: true,
              name: true,
            },
          },

          sequence: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // =======================================================
      // RECENT ATTENDANCE
      // =======================================================

      prisma.attendance.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          status: true,
          date: true,
          createdAt: true,

          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },

          subject: {
            select: {
              id: true,
              name: true,
            },
          },

          teacher: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),

      // =======================================================
      // ADMIN NOTIFICATIONS
      // =======================================================

      prisma.notification.findMany({
        where: {
          userId: guard.user.id,
          archivedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
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

      // =======================================================
      // RECENT SYSTEM ACTIVITY
      // =======================================================

      prisma.auditLog.findMany({
        orderBy: {
          createdAt: "desc",
        },
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

      // =======================================================
      // TEACHERS WITHOUT ASSIGNMENTS
      // =======================================================

      prisma.teacher.count({
        where: {
          assignments: {
            none: {},
          },
        },
      }),

      // =======================================================
      // STUDENTS WITHOUT PARENT
      // =======================================================

      prisma.student.count({
        where: {
          parentId: null,
        },
      }),
    ]);

    // =========================================================
    // ATTENDANCE OVERVIEW
    // =========================================================

    const attendanceTotals: Record<string, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };

    let attendanceTotal = 0;

    for (const group of attendanceGroups) {
      attendanceTotals[group.status] = group._count._all;
      attendanceTotal += group._count._all;
    }

    const attendanceRate =
      attendanceTotal > 0
        ? Math.round(
            ((attendanceTotals.PRESENT +
              attendanceTotals.LATE) /
              attendanceTotal) *
              1000
          ) / 10
        : null;

    // =========================================================
    // PERFORMANCE OVERVIEW
    // =========================================================

    const overallAverage =
      markAggregate._avg.score === null
        ? null
        : Math.round(markAggregate._avg.score * 100) / 100;

    // ---------------------------------------------------------
    // PASSING MARKS
    // Passing score = 10/20
    // ---------------------------------------------------------

    const passingMarks = await prisma.mark.count({
      where: {
        score: {
          gte: 10,
        },
      },
    });

    // =========================================================
    // AVERAGE SCORE BY SUBJECT
    // =========================================================

    const subjectAverages = await prisma.mark.groupBy({
      by: ["subjectId"],
      _avg: {
        score: true,
      },
      where: {
        score: {
          not: 0,
        },
      },
    });

    // =========================================================
    // PUBLISHED RESULTS
    // =========================================================

    const publicationCount =
      await prisma.resultPublication.count({
        where: {
          status: "PUBLISHED",
        },
      });

    // =========================================================
    // SUBJECT NAMES
    // =========================================================

    const subjectIds = subjectAverages.map(
      (row) => row.subjectId
    );

    const subjectNames =
      subjectIds.length > 0
        ? await prisma.subject.findMany({
            where: {
              id: {
                in: subjectIds,
              },
            },
            select: {
              id: true,
              name: true,
            },
          })
        : [];

    const nameById = new Map(
      subjectNames.map((subject) => [
        subject.id,
        subject.name,
      ])
    );

    // =========================================================
    // RANK SUBJECTS
    // =========================================================

    const rankedSubjects = subjectAverages
      .map((row) => ({
        subjectId: row.subjectId,

        name:
          nameById.get(row.subjectId) ??
          "Unknown subject",

        average:
          Math.round(
            (row._avg.score ?? 0) * 100
          ) / 100,
      }))
      .sort(
        (a, b) =>
          b.average - a.average
      );

    // =========================================================
    // PASS RATE
    // =========================================================

    const passRate =
      markAggregate._count._all > 0
        ? Math.round(
            (passingMarks /
              markAggregate._count._all) *
              1000
          ) / 10
        : null;

    // =========================================================
    // ALERTS
    // =========================================================

    const alerts: {
      tone: "warning" | "info" | "danger";
      title: string;
      message: string;
      href: string;
    }[] = [];

    // ---------------------------------------------------------
    // No active academic year
    // ---------------------------------------------------------

    if (!academicYear) {
      alerts.push({
        tone: "danger",
        title: "No active academic year",
        message:
          "Set an active academic year so results, attendance and timetables are grouped correctly.",
        href: "/admin/academic-years",
      });
    }

    // ---------------------------------------------------------
    // No current term
    // ---------------------------------------------------------

    if (!currentTerm) {
      alerts.push({
        tone: "warning",
        title: "No current term selected",
        message:
          "Mark the term currently in progress so teachers record results in the right place.",
        href: "/admin/terms",
      });
    }

    // ---------------------------------------------------------
    // Teachers without assignments
    // ---------------------------------------------------------

    if (unassignedTeachers > 0) {
      alerts.push({
        tone: "warning",
        title: `${unassignedTeachers} teacher${
          unassignedTeachers === 1
            ? ""
            : "s"
        } without a teaching assignment`,
        message:
          "Assign a subject and class so these teachers can enter marks and attendance.",
        href: "/admin/assignments",
      });
    }

    // ---------------------------------------------------------
    // Students without parents
    // ---------------------------------------------------------

    if (studentsWithoutParent > 0) {
      alerts.push({
        tone: "info",
        title: `${studentsWithoutParent} student${
          studentsWithoutParent === 1
            ? ""
            : "s"
        } without a linked parent`,
        message:
          "Link a parent account so results and announcements reach the family.",
        href: "/admin/students",
      });
    }

    // =========================================================
    // RESPONSE
    // =========================================================

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

        marksRecorded:
          markAggregate._count._all,

        strongestSubject:
          rankedSubjects[0] ?? null,

        weakestSubject:
          rankedSubjects.length > 1
            ? rankedSubjects[
                rankedSubjects.length - 1
              ]
            : null,

        publishedResults:
          publicationCount,
      },

      recentMarks,

      recentAttendance,

      notifications,

      recentActivity,

      alerts,
    });
  } catch (error) {
    console.error(
      "ADMIN DASHBOARD STATS ERROR:",
      error
    );

    return serverError(
      "ADMIN DASHBOARD STATS ERROR"
    );
  }
}