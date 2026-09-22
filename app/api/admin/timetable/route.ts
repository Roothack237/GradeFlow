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

const DAYS: WeekDay[] = [
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
];

const TIME_SLOTS = [
  { startTime: "08:00", endTime: "09:00" },
  { startTime: "09:00", endTime: "10:00" },
  { startTime: "10:00", endTime: "11:00" },
  { startTime: "11:00", endTime: "12:00" },
  { startTime: "12:00", endTime: "13:00" },
  { startTime: "13:00", endTime: "14:00" },
  { startTime: "14:00", endTime: "15:00" },
  { startTime: "15:00", endTime: "16:00" },
];

// ======================================================
// HELPERS
// ======================================================

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

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

  const availableStart = timeToMinutes(availability.startTime);
  const availableEnd = timeToMinutes(availability.endTime);

  return (
    lessonStart >= availableStart &&
    lessonEnd <= availableEnd
  );
}

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

// ======================================================
// GET - LOAD TIMETABLE DATA
// ======================================================

export async function GET(request: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return guard.response;
  }

  try {
    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

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

    // --------------------------------------------------
    // VERIFY ADMIN
    // --------------------------------------------------

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
          error: "Administrator privileges are required.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // REQUEST PARAMETERS
    // --------------------------------------------------

    const { searchParams } = new URL(request.url);

    const academicYearId =
      searchParams.get("academicYearId");

    const termId = searchParams.get("termId");

    console.log("========== TIMETABLE GET ==========");
    console.log("Academic Year:", academicYearId);
    console.log("Term:", termId);

    // --------------------------------------------------
    // ACADEMIC YEARS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // TEACHERS + AVAILABILITY + ASSIGNMENTS
    // --------------------------------------------------

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
            orderBy: {
              startTime: "asc",
            },
            select: {
              id: true,
              day: true,
              startTime: true,
              endTime: true,
              status: true,
              note: true,
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

    // --------------------------------------------------
    // AVAILABILITY SUMMARY
    // --------------------------------------------------

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

          availability: teacher.availability,
          assignments: teacher.assignments,
        };
      }
    );

    // --------------------------------------------------
    // AVAILABILITY COUNTS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // TIMETABLE
    // --------------------------------------------------

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

    // --------------------------------------------------
    // PUBLICATIONS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      academicYears,

      availabilitySummary,

      availabilityCounts,

      timetable,

      publications: publications.map(
        (publication) => ({
          id: publication.id,
          termId: publication.termId,
          classroomId:
            publication.classroomId,

          class:
            publication.classroom.name,

          term:
            publication.term.name,

          status: publication.status,

          publishedAt:
            publication.publishedAt,

          notes: publication.notes,
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
        error: "Failed to load timetable data.",
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
    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

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

    // --------------------------------------------------
    // VERIFY ADMIN
    // --------------------------------------------------

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

    // --------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------

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

    // --------------------------------------------------
    // VERIFY TERM
    // --------------------------------------------------

    const term = await prisma.term.findFirst({
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

    // --------------------------------------------------
    // GET TEACHER ASSIGNMENTS
    // --------------------------------------------------

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

    if (assignments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No teacher assignments exist yet.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // APPROVED AVAILABILITY
    // --------------------------------------------------

    const approvedAvailability =
      await prisma.teacherAvailability.findMany({
        where: {
          status:
            AvailabilityStatus.APPROVED,
        },

        select: {
          teacherId: true,
          day: true,
          startTime: true,
          endTime: true,
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

    // --------------------------------------------------
    // GROUP AVAILABILITY BY TEACHER
    // --------------------------------------------------

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

    // --------------------------------------------------
    // EXISTING TIMETABLE
    // --------------------------------------------------

    const existingTimetable =
      await prisma.timetable.findMany({
        where: {
          academicYearId,
          termId,
        },

        select: {
          id: true,
          teacherId: true,
          classroomId: true,
          subjectId: true,
          day: true,
          startTime: true,
          endTime: true,
        },
      });

    // --------------------------------------------------
    // TRACK SCHEDULED ASSIGNMENTS
    // --------------------------------------------------

    const scheduledAssignmentKeys =
      new Set<string>();

    for (const entry of existingTimetable) {
      const key = [
        entry.teacherId,
        entry.classroomId,
        entry.subjectId,
      ].join("|");

      scheduledAssignmentKeys.add(key);
    }

    // --------------------------------------------------
    // TRACK OCCUPIED SLOTS
    // --------------------------------------------------

    const occupiedTeacherSlots =
      new Set<string>();

    const occupiedClassroomSlots =
      new Set<string>();

    for (const entry of existingTimetable) {
      occupiedTeacherSlots.add(
        [
          entry.teacherId,
          entry.day,
          entry.startTime,
          entry.endTime,
        ].join("|")
      );

      occupiedClassroomSlots.add(
        [
          entry.classroomId,
          entry.day,
          entry.startTime,
          entry.endTime,
        ].join("|")
      );
    }

    // --------------------------------------------------
    // NEW ENTRIES
    // --------------------------------------------------

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
      teacherId: string;
      teacherName: string;
      teacherCode: string;
      classroomName: string;
      subjectName: string;
      subjectCode: string;
      reason: string;
    }> = [];

    // --------------------------------------------------
    // PROCESS ASSIGNMENTS
    // --------------------------------------------------

    for (const assignment of assignments) {
      const assignmentKey = [
        assignment.teacherId,
        assignment.classroomId,
        assignment.subjectId,
      ].join("|");

      if (
        scheduledAssignmentKeys.has(
          assignmentKey
        )
      ) {
        continue;
      }

      const teacherAvailability =
        availabilityByTeacher.get(
          assignment.teacherId
        ) ?? [];

      if (
        teacherAvailability.length === 0
      ) {
        unscheduled.push({
          assignmentId: assignment.id,
          teacherId: assignment.teacher.id,
          teacherName:
            assignment.teacher.fullName,
          teacherCode:
            assignment.teacher.teacherId,
          classroomName:
            assignment.classroom.name,
          subjectName:
            assignment.subject.name,
          subjectCode:
            assignment.subject.code,
          reason:
            "Teacher has no approved availability.",
        });

        continue;
      }

      let assigned = false;

      // ------------------------------------------------
      // SEARCH FOR SLOT
      // ------------------------------------------------

      for (const day of DAYS) {
        if (assigned) break;

        const dayAvailability =
          teacherAvailability.filter(
            (availability) =>
              availability.day === day
          );

        if (
          dayAvailability.length === 0
        ) {
          continue;
        }

        for (const slot of TIME_SLOTS) {
          if (assigned) break;

          const available =
            dayAvailability.some(
              (availability) =>
                isWithinAvailability(
                  slot.startTime,
                  slot.endTime,
                  availability
                )
            );

          if (!available) {
            continue;
          }

          // --------------------------------------------
          // TEACHER CONFLICT
          // --------------------------------------------

          const teacherConflict =
            occupiedTeacherSlots.has(
              [
                assignment.teacherId,
                day,
                slot.startTime,
                slot.endTime,
              ].join("|")
            );

          if (teacherConflict) {
            continue;
          }

          // --------------------------------------------
          // CLASSROOM CONFLICT
          // --------------------------------------------

          const classroomConflict =
            occupiedClassroomSlots.has(
              [
                assignment.classroomId,
                day,
                slot.startTime,
                slot.endTime,
              ].join("|")
            );

          if (classroomConflict) {
            continue;
          }

          // --------------------------------------------
          // TEACHER OVERLAP
          // --------------------------------------------

          const hasTeacherOverlap =
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

          if (hasTeacherOverlap) {
            continue;
          }

          // --------------------------------------------
          // CLASSROOM OVERLAP
          // --------------------------------------------

          const hasClassroomOverlap =
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

          if (hasClassroomOverlap) {
            continue;
          }

          // --------------------------------------------
          // CREATE ENTRY
          // --------------------------------------------

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

          occupiedTeacherSlots.add(
            [
              assignment.teacherId,
              day,
              slot.startTime,
              slot.endTime,
            ].join("|")
          );

          occupiedClassroomSlots.add(
            [
              assignment.classroomId,
              day,
              slot.startTime,
              slot.endTime,
            ].join("|")
          );

          scheduledAssignmentKeys.add(
            assignmentKey
          );

          assigned = true;
        }
      }

      // ------------------------------------------------
      // UNSCHEDULED
      // ------------------------------------------------

      if (!assigned) {
        unscheduled.push({
          assignmentId: assignment.id,
          teacherId: assignment.teacher.id,
          teacherName:
            assignment.teacher.fullName,
          teacherCode:
            assignment.teacher.teacherId,
          classroomName:
            assignment.classroom.name,
          subjectName:
            assignment.subject.name,
          subjectCode:
            assignment.subject.code,
          reason:
            "No free timetable slot matches the teacher's approved availability.",
        });
      }
    }

    // --------------------------------------------------
    // SAVE
    // --------------------------------------------------

    if (newEntries.length > 0) {
      await prisma.timetable.createMany({
        data: newEntries,
      });
    }

    // --------------------------------------------------
    // LOAD FINAL TIMETABLE
    // --------------------------------------------------

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

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        newEntries.length > 0
          ? `Timetable updated successfully. ${newEntries.length} new period${
              newEntries.length === 1
                ? ""
                : "s"
            } added.`
          : "No new assignments could be scheduled. Existing timetable was kept unchanged.",

      createdCount:
        newEntries.length,

      totalScheduled:
        finalTimetable.length,

      unscheduled,

      timetable:
        finalTimetable,
    });
  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      "TIMETABLE GENERATION ERROR"
    );

    console.error(error);

    console.error(
      "========================================"
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