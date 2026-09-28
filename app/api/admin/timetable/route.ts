import { NextResponse } from "next/server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

import {
  Role,
  WeekDay,
  AvailabilityStatus,
} from "@prisma/client";

// ======================================================
// TIMETABLE SETTINGS
// ======================================================
//
// School timetable:
//
// 08:00 - 10:00   Lesson
// 10:00 - 10:15   Break
// 10:15 - 12:00   Lesson
// 12:00 - 12:30   Break
// 12:30 - 14:30   Lesson
// 14:30 - 15:00   Revision / Class Activity
//
// Breaks and revision are NOT stored as Timetable records.
// ======================================================

const DAYS: WeekDay[] = [
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
];

const TIME_SLOTS = [
  {
    startTime: "08:00",
    endTime: "10:00",
  },
  {
    startTime: "10:15",
    endTime: "12:00",
  },
  {
    startTime: "12:30",
    endTime: "14:30",
  },
];

// ======================================================
// HELPERS
// ======================================================

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

// ------------------------------------------------------
// Check whether a lesson completely fits inside one
// approved teacher availability period.
// ------------------------------------------------------

function isWithinAvailability(
  startTime: string,
  endTime: string,
  availability: {
    startTime: string;
    endTime: string;
  }
): boolean {
  const lessonStart = timeToMinutes(startTime);
  const lessonEnd = timeToMinutes(endTime);

  const availableStart = timeToMinutes(
    availability.startTime
  );

  const availableEnd = timeToMinutes(
    availability.endTime
  );

  return (
    lessonStart >= availableStart &&
    lessonEnd <= availableEnd
  );
}

// ------------------------------------------------------
// Check whether two time periods overlap.
// ------------------------------------------------------

function overlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);

  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  return aStart < bEnd && bStart < aEnd;
}

// ------------------------------------------------------
// Convert WeekDay to numeric day.
//
// TeacherAvailability uses:
// 1 = Monday
// 2 = Tuesday
// 3 = Wednesday
// 4 = Thursday
// 5 = Friday
// ------------------------------------------------------

function weekDayToDayNumber(day: WeekDay): number {
  switch (day) {
    case WeekDay.MONDAY:
      return 1;

    case WeekDay.TUESDAY:
      return 2;

    case WeekDay.WEDNESDAY:
      return 3;

    case WeekDay.THURSDAY:
      return 4;

    case WeekDay.FRIDAY:
      return 5;

    default:
      return 0;
  }
}

// ======================================================
// GET - LOAD TIMETABLE DATA
// ======================================================

export async function GET(request: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    // ==================================================
    // AUTHENTICATION
    // ==================================================

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // ==================================================
    // VERIFY ADMIN
    // ==================================================

    const admin = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: "User account was not found.",
        },
        { status: 401 }
      );
    }

    if (admin.status === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          error: "This account has been suspended.",
        },
        { status: 403 }
      );
    }

    if (admin.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Administrator privileges are required.",
        },
        { status: 403 }
      );
    }

    // ==================================================
    // REQUEST PARAMETERS
    // ==================================================

    const { searchParams } = new URL(request.url);

    const academicYearId =
      searchParams.get("academicYearId");

    const termId = searchParams.get("termId");

    console.log(
      "========== TIMETABLE GET =========="
    );

    console.log(
      "Academic Year:",
      academicYearId
    );

    console.log("Term:", termId);

    console.log(
      "==================================="
    );

    // ==================================================
    // ACADEMIC YEARS
    // ==================================================

    const academicYears =
      await prisma.academicYear.findMany({
        include: {
          terms: {
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      });

    // ==================================================
    // CLASSROOMS
    // ==================================================
    //
    // IMPORTANT:
    // The timetable page needs classrooms for the
    // "Select class" dropdown.
    //
    // We return section as a simple string because
    // the frontend Classroom type expects:
    //
    // section?: string | null
    //
    // ==================================================

    const classrooms =
      await prisma.classroom.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          section: {
            select: {
              name: true,
            },
          },
        },
      });

    const formattedClassrooms =
      classrooms.map((classroom) => ({
        id: classroom.id,
        name: classroom.name,
        section:
          classroom.section?.name ?? null,
      }));

    // ==================================================
    // TEACHERS + AVAILABILITY + ASSIGNMENTS
    // ==================================================

    const teachers =
      await prisma.teacher.findMany({
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

          availability: {
            orderBy: [
              {
                dayOfWeek: "asc",
              },
              {
                startTime: "asc",
              },
            ],
            select: {
              id: true,
              teacherId: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },

          assignments: {
            select: {
              id: true,

              section: {
                select: {
                  id: true,
                  name: true,
                },
              },

              classroom: {
                select: {
                  id: true,
                  name: true,
                },
              },

              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  coefficient: true,
                },
              },
            },
          },
        },
      });

    // ==================================================
    // AVAILABILITY SUMMARY
    // ==================================================

    const availabilitySummary = teachers.map(
      (teacher) => {
        const approved =
          teacher.availability.filter(
            (item) =>
              item.status ===
              AvailabilityStatus.APPROVED
          );

        const pending =
          teacher.availability.filter(
            (item) =>
              item.status ===
              AvailabilityStatus.PENDING
          );

        const rejected =
          teacher.availability.filter(
            (item) =>
              item.status ===
              AvailabilityStatus.REJECTED
          );

        let status:
          | "READY"
          | "PENDING"
          | "MISSING"
          | "REJECTED";

        if (approved.length > 0) {
          status = "READY";
        } else if (pending.length > 0) {
          status = "PENDING";
        } else if (rejected.length > 0) {
          status = "REJECTED";
        } else {
          status = "MISSING";
        }

        return {
          teacherId: teacher.id,
          teacherCode: teacher.teacherId,
          teacherName: teacher.fullName,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          phone: teacher.phone,

          approvedCount: approved.length,
          pendingCount: pending.length,
          rejectedCount: rejected.length,

          status,

          availability:
            teacher.availability,

          assignments:
            teacher.assignments,
        };
      }
    );

    // ==================================================
    // AVAILABILITY COUNTS
    // ==================================================

    const availabilityCounts = {
      totalTeachers: teachers.length,

      missing:
        availabilitySummary.filter(
          (teacher) =>
            teacher.status === "MISSING"
        ).length,

      pending:
        availabilitySummary.filter(
          (teacher) =>
            teacher.status === "PENDING"
        ).length,

      ready:
        availabilitySummary.filter(
          (teacher) =>
            teacher.status === "READY"
        ).length,

      rejected:
        availabilitySummary.filter(
          (teacher) =>
            teacher.status === "REJECTED"
        ).length,
    };

    // ==================================================
    // TIMETABLE
    // ==================================================

    const timetableWhere: {
      academicYearId?: string;
      termId?: string;
    } = {};

    if (academicYearId) {
      timetableWhere.academicYearId =
        academicYearId;
    }

    if (termId) {
      timetableWhere.termId = termId;
    }

    const timetable =
      await prisma.timetable.findMany({
        where: timetableWhere,

        include: {
          teacher: {
            select: {
              id: true,
              teacherId: true,
              firstName: true,
              lastName: true,
              fullName: true,
            },
          },

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

          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },

          term: {
            select: {
              id: true,
              name: true,
              order: true,
            },
          },
        },

        orderBy: [
          {
            day: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      });

    // ==================================================
    // PUBLICATIONS
    // ==================================================

    const publicationWhere: {
      termId?: string;
    } = {};

    if (termId) {
      publicationWhere.termId = termId;
    }

    const publications =
      await prisma.timetablePublication.findMany({
        where: publicationWhere,

        include: {
          classroom: {
            select: {
              id: true,
              name: true,
            },
          },

          term: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      // Academic years with their terms
      academicYears,

      // IMPORTANT: classrooms are now returned
      classrooms: formattedClassrooms,

      // Teacher availability
      availabilitySummary,
      availabilityCounts,

      // Timetable
      timetable,

      // Publications
      publications:
        publications.map(
          (publication) => ({
            id: publication.id,

            termId:
              publication.termId,

            classroomId:
              publication.classroomId,

            class:
              publication.classroom.name,

            term:
              publication.term.name,

            status:
              publication.status,

            publishedAt:
              publication.publishedAt,

            notes:
              publication.notes,
          })
        ),
    });
  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      "ADMIN TIMETABLE GET ERROR"
    );

    console.error(error);

    console.error(
      "========================================"
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load timetable data.",

        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

// ======================================================
// POST - GENERATE TIMETABLE
// ======================================================

export async function POST(request: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    // ==================================================
    // AUTHENTICATION
    // ==================================================

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // ==================================================
    // VERIFY ADMIN
    // ==================================================

    const admin = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },

      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: "User account was not found.",
        },
        { status: 401 }
      );
    }

    if (admin.status === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This account has been suspended.",
        },
        { status: 403 }
      );
    }

    if (admin.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Administrator privileges are required.",
        },
        { status: 403 }
      );
    }

    // ==================================================
    // REQUEST
    // ==================================================

    const body = await request.json();

    const academicYearId =
      body?.academicYearId;

    const termId = body?.termId;

    if (!academicYearId || !termId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Academic year and term are required.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // VERIFY TERM
    // ==================================================

    const term =
      await prisma.term.findFirst({
        where: {
          id: termId,
          academicYearId,
        },
      });

    if (!term) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected term does not belong to the selected academic year.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // GET TEACHER ASSIGNMENTS
    // ==================================================

    const assignments =
      await prisma.teacherAssignment.findMany({
        include: {
          teacher: {
            select: {
              id: true,
              teacherId: true,
              fullName: true,
            },
          },

          classroom: {
            select: {
              id: true,
              name: true,
            },
          },

          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          section: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    // ==================================================
    // GET ALL AVAILABILITY
    // ==================================================

    const allAvailability =
      await prisma.teacherAvailability.findMany({
        select: {
          id: true,
          teacherId: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          status: true,
        },

        orderBy: [
          {
            teacherId: "asc",
          },
          {
            dayOfWeek: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      });

    // ==================================================
    // AVAILABILITY COUNTS
    // ==================================================

    const approvedAvailability =
      allAvailability.filter(
        (item) =>
          item.status ===
          AvailabilityStatus.APPROVED
      );

    const pendingAvailability =
      allAvailability.filter(
        (item) =>
          item.status ===
          AvailabilityStatus.PENDING
      );

    const rejectedAvailability =
      allAvailability.filter(
        (item) =>
          item.status ===
          AvailabilityStatus.REJECTED
      );

    // ==================================================
    // DEBUG INFORMATION
    // ==================================================

    console.log(
      "=========================================="
    );

    console.log(
      "SCHOOL TIMETABLE GENERATION"
    );

    console.log(
      "Academic Year:",
      academicYearId
    );

    console.log(
      "Term:",
      termId
    );

    console.log(
      "Teacher Assignments:",
      assignments.length
    );

    console.log(
      "Total Availability:",
      allAvailability.length
    );

    console.log(
      "Approved Availability:",
      approvedAvailability.length
    );

    console.log(
      "Pending Availability:",
      pendingAvailability.length
    );

    console.log(
      "Rejected Availability:",
      rejectedAvailability.length
    );

    console.log(
      "=========================================="
    );

    // ==================================================
    // NO ASSIGNMENTS
    // ==================================================

    if (assignments.length === 0) {
      return NextResponse.json(
        {
          success: false,

          error:
            "No teacher assignments exist.",

          diagnostics: {
            assignments: 0,

            availability:
              allAvailability.length,
          },
        },
        { status: 409 }
      );
    }

    // ==================================================
    // NO AVAILABILITY
    // ==================================================

    if (allAvailability.length === 0) {
      return NextResponse.json(
        {
          success: false,

          error:
            "No teacher availability has been submitted yet.",

          message:
            "Teachers must submit their availability before the timetable can be generated.",

          diagnostics: {
            assignments:
              assignments.length,

            totalAvailability: 0,

            approvedAvailability: 0,
          },
        },
        { status: 409 }
      );
    }

    // ==================================================
    // NO APPROVED AVAILABILITY
    // ==================================================

    if (approvedAvailability.length === 0) {
      return NextResponse.json(
        {
          success: false,

          error:
            "No approved teacher availability exists.",

          message:
            "Teachers have submitted availability, but the administrator must approve availability before generating the timetable.",

          diagnostics: {
            assignments:
              assignments.length,

            totalAvailability:
              allAvailability.length,

            approvedAvailability: 0,

            pendingAvailability:
              pendingAvailability.length,

            rejectedAvailability:
              rejectedAvailability.length,
          },
        },
        { status: 409 }
      );
    }

    // ==================================================
    // CHECK EXISTING TIMETABLE
    // ==================================================
    //
    // Regenerate timetable for the selected
    // academic year and term.
    // ==================================================

    const existingCount =
      await prisma.timetable.count({
        where: {
          academicYearId,
          termId,
        },
      });

    console.log(
      "Existing timetable entries:",
      existingCount
    );

    // ==================================================
    // CLEAR EXISTING TIMETABLE
    // ==================================================

    if (existingCount > 0) {
      await prisma.timetable.deleteMany({
        where: {
          academicYearId,
          termId,
        },
      });

      console.log(
        `Deleted ${existingCount} existing timetable entries before regeneration.`
      );
    }

    // ==================================================
    // GROUP APPROVED AVAILABILITY BY TEACHER
    // ==================================================

    const availabilityByTeacher =
      new Map<
        string,
        typeof approvedAvailability
      >();

    for (const availability of approvedAvailability) {
      const existing =
        availabilityByTeacher.get(
          availability.teacherId
        ) ?? [];

      existing.push(availability);

      availabilityByTeacher.set(
        availability.teacherId,
        existing
      );
    }

    // ==================================================
    // EXISTING TIMETABLE
    // ==================================================

    const existingTimetable: Array<{
      id: string;
      teacherId: string;
      classroomId: string;
      subjectId: string;
      day: WeekDay;
      startTime: string;
      endTime: string;
    }> = [];

    // ==================================================
    // TRACK EXISTING ASSIGNMENTS
    // ==================================================

    const scheduledAssignmentKeys =
      new Set<string>();

    // ==================================================
    // RESULTS
    // ==================================================

    const newEntries: Array<{
      classroomId: string;
      subjectId: string;
      teacherId: string;
      academicYearId: string;
      termId: string;
      day: WeekDay;
      startTime: string;
      endTime: string;
    }> = [];

    const unscheduled: Array<{
      assignmentId: string;
      teacherName: string;
      teacherCode: string;
      classroomName: string;
      subjectName: string;
      reason: string;
    }> = [];

    // ==================================================
    // PROCESS EACH TEACHER ASSIGNMENT
    // ==================================================

    for (const assignment of assignments) {
      const assignmentKey = [
        assignment.teacherId,
        assignment.classroomId,
        assignment.subjectId,
      ].join("|");

      // ------------------------------------------------
      // Already scheduled
      // ------------------------------------------------

      if (
        scheduledAssignmentKeys.has(
          assignmentKey
        )
      ) {
        continue;
      }

      // ------------------------------------------------
      // GET TEACHER APPROVED AVAILABILITY
      // ------------------------------------------------

      const teacherAvailability =
        availabilityByTeacher.get(
          assignment.teacherId
        ) ?? [];

      if (teacherAvailability.length === 0) {
        unscheduled.push({
          assignmentId:
            assignment.id,

          teacherName:
            assignment.teacher.fullName,

          teacherCode:
            assignment.teacher.teacherId,

          classroomName:
            assignment.classroom.name,

          subjectName:
            assignment.subject.name,

          reason:
            "This teacher has no APPROVED availability.",
        });

        continue;
      }

      let assigned = false;

      // =================================================
      // SEARCH MONDAY - FRIDAY
      // =================================================

      for (const day of DAYS) {
        if (assigned) {
          break;
        }

        const dayNumber =
          weekDayToDayNumber(day);

        const dayAvailability =
          teacherAvailability.filter(
            (availability) =>
              availability.dayOfWeek ===
              dayNumber
          );

        if (dayAvailability.length === 0) {
          continue;
        }

        // ===============================================
        // SEARCH THE THREE REAL LESSON PERIODS
        // ===============================================

        for (const slot of TIME_SLOTS) {
          if (assigned) {
            break;
          }

          // ---------------------------------------------
          // Check teacher availability
          // ---------------------------------------------

          const fitsAvailability =
            dayAvailability.some(
              (availability) =>
                isWithinAvailability(
                  slot.startTime,
                  slot.endTime,
                  availability
                )
            );

          if (!fitsAvailability) {
            continue;
          }

          // ---------------------------------------------
          // Check teacher conflict
          // ---------------------------------------------

          const teacherConflict =
            existingTimetable.some(
              (entry) =>
                entry.teacherId ===
                  assignment.teacherId &&
                entry.day === day &&
                overlaps(
                  slot.startTime,
                  slot.endTime,
                  entry.startTime,
                  entry.endTime
                )
            ) ||
            newEntries.some(
              (entry) =>
                entry.teacherId ===
                  assignment.teacherId &&
                entry.day === day &&
                overlaps(
                  slot.startTime,
                  slot.endTime,
                  entry.startTime,
                  entry.endTime
                )
            );

          if (teacherConflict) {
            continue;
          }

          // ---------------------------------------------
          // Check classroom conflict
          // ---------------------------------------------

          const classroomConflict =
            existingTimetable.some(
              (entry) =>
                entry.classroomId ===
                  assignment.classroomId &&
                entry.day === day &&
                overlaps(
                  slot.startTime,
                  slot.endTime,
                  entry.startTime,
                  entry.endTime
                )
            ) ||
            newEntries.some(
              (entry) =>
                entry.classroomId ===
                  assignment.classroomId &&
                entry.day === day &&
                overlaps(
                  slot.startTime,
                  slot.endTime,
                  entry.startTime,
                  entry.endTime
                )
            );

          if (classroomConflict) {
            continue;
          }

          // ---------------------------------------------
          // Create timetable entry
          // ---------------------------------------------

          const newEntry = {
            classroomId:
              assignment.classroomId,

            subjectId:
              assignment.subjectId,

            teacherId:
              assignment.teacherId,

            academicYearId,

            termId,

            day,

            startTime:
              slot.startTime,

            endTime:
              slot.endTime,
          };

          newEntries.push(newEntry);

          scheduledAssignmentKeys.add(
            assignmentKey
          );

          assigned = true;

          break;
        }
      }

      // =================================================
      // ASSIGNMENT COULD NOT BE SCHEDULED
      // =================================================

      if (!assigned) {
        unscheduled.push({
          assignmentId:
            assignment.id,

          teacherName:
            assignment.teacher.fullName,

          teacherCode:
            assignment.teacher.teacherId,

          classroomName:
            assignment.classroom.name,

          subjectName:
            assignment.subject.name,

          reason:
            "All available periods create a teacher or classroom conflict.",
        });
      }
    }

    // ==================================================
    // SAVE NEW ENTRIES
    // ==================================================

    if (newEntries.length > 0) {
      await prisma.timetable.createMany({
        data: newEntries,
      });
    }

    // ==================================================
    // LOAD FINAL TIMETABLE
    // ==================================================

    const finalTimetable =
      await prisma.timetable.findMany({
        where: {
          academicYearId,
          termId,
        },

        include: {
          teacher: {
            select: {
              id: true,
              teacherId: true,
              firstName: true,
              lastName: true,
              fullName: true,
            },
          },

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

        orderBy: [
          {
            day: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      });

    // ==================================================
    // CALCULATE GENERATION STATUS
    // ==================================================

    const scheduledAssignmentCount =
      assignments.length -
      unscheduled.length;

    const generationComplete =
      unscheduled.length === 0;

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      message:
        newEntries.length > 0
          ? `Timetable regenerated successfully. ${
              newEntries.length
            } period${
              newEntries.length === 1
                ? ""
                : "s"
            } created.`
          : "Timetable regenerated, but no assignments could be scheduled.",

      createdCount:
        newEntries.length,

      totalScheduled:
        finalTimetable.length,

      scheduledAssignments:
        scheduledAssignmentCount,

      totalAssignments:
        assignments.length,

      unscheduled,

      generationComplete,

      timetable:
        finalTimetable,

      timetableRules: {
        schoolStart: "08:00",

        schoolEnd: "15:00",

        lessonPeriods:
          TIME_SLOTS,

        breaks: [
          {
            startTime: "10:00",
            endTime: "10:15",
          },
          {
            startTime: "12:00",
            endTime: "12:30",
          },
        ],

        revisionPeriod: {
          startTime: "14:30",
          endTime: "15:00",
        },

        days: DAYS,
      },

      diagnostics: {
        totalAssignments:
          assignments.length,

        totalAvailability:
          allAvailability.length,

        approvedAvailability:
          approvedAvailability.length,

        pendingAvailability:
          pendingAvailability.length,

        rejectedAvailability:
          rejectedAvailability.length,

        assignmentsWithoutAvailability:
          unscheduled.filter(
            (item) =>
              item.reason.includes(
                "no APPROVED availability"
              )
          ).length,

        assignmentsWithoutSlot:
          unscheduled.filter(
            (item) =>
              item.reason.includes(
                "teacher or classroom conflict"
              )
          ).length,

        createdEntries:
          newEntries.length,

        existingEntriesBeforeRegeneration:
          existingCount,

        deletedEntries:
          existingCount,

        finalEntries:
          finalTimetable.length,
      },
    });
  } catch (error) {
    console.error(
      "=========================================="
    );

    console.error(
      "TIMETABLE GENERATION ERROR"
    );

    console.error(error);

    console.error(
      "=========================================="
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to generate timetable.",

        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}