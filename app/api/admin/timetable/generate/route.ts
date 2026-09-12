import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
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

// One-hour school periods.
// You can change these later.
const TIME_SLOTS = [
  {
    startTime: "08:00",
    endTime: "09:00",
  },
  {
    startTime: "09:00",
    endTime: "10:00",
  },
  {
    startTime: "10:00",
    endTime: "11:00",
  },
  {
    startTime: "11:00",
    endTime: "12:00",
  },
  {
    startTime: "12:00",
    endTime: "13:00",
  },
  {
    startTime: "13:00",
    endTime: "14:00",
  },
  {
    startTime: "14:00",
    endTime: "15:00",
  },
  {
    startTime: "15:00",
    endTime: "16:00",
  },
];

// ======================================================
// HELPERS
// ======================================================

function timeToMinutes(time: string): number {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

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
  const lessonStart =
    timeToMinutes(startTime);

  const lessonEnd =
    timeToMinutes(endTime);

  const availableStart =
    timeToMinutes(availability.startTime);

  const availableEnd =
    timeToMinutes(availability.endTime);

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

  return (
    aStart < bEnd &&
    aEnd > bStart
  );
}

// ======================================================
// POST - GENERATE TIMETABLE
// ======================================================

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // Authentication
    // --------------------------------------------------

  const session = await auth();

if (!session?.user?.email) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}

const admin = await prisma.user.findUnique({
  where: {
    email: session.user.email,
  },
  select: {
    id: true,
    email: true,
    role: true,
  },
});

if (!admin) {
  return NextResponse.json(
    { error: "User account not found" },
    { status: 401 }
  );
}

if (admin.role !== Role.ADMIN) {
  return NextResponse.json(
    {
      error: "Access denied",
      currentRole: admin.role,
      expectedRole: Role.ADMIN,
    },
    { status: 403 }
  );
}
    // --------------------------------------------------
    // Read request body
    // --------------------------------------------------

    let body: {
      academicYearId?: string;
      termId?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or empty JSON request body",
        },
        {
          status: 400,
        }
      );
    }

    const {
      academicYearId,
      termId,
    } = body;

    // --------------------------------------------------
    // Validate selected academic year
    // --------------------------------------------------

    if (!academicYearId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Academic year is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!termId) {
      return NextResponse.json(
        {
          success: false,
          error: "Term is required",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // Verify academic year
    // --------------------------------------------------

    const academicYear =
      await prisma.academicYear.findUnique({
        where: {
          id: academicYearId,
        },

        include: {
          terms: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });

    if (!academicYear) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Academic year not found",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------
    // Verify term
    // --------------------------------------------------

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
            "Selected term does not belong to the selected academic year",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // Load ALL assignments
    // --------------------------------------------------

    const assignments =
      await prisma.teacherAssignment.findMany({
        orderBy: {
          createdAt: "asc",
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
              coefficient: true,
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
      });

    if (assignments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No teacher assignments found. Assign teachers to classes and subjects before generating the timetable.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // Load teacher availability
    // ONLY APPROVED availability can be used
    // --------------------------------------------------

    const availability =
      await prisma.teacherAvailability.findMany({
        where: {
          status:
            AvailabilityStatus.APPROVED,
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

    if (availability.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No approved teacher availability was found. Teachers must submit availability and the administrator must approve it before generating the timetable.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // Group availability by teacher
    // --------------------------------------------------

    const availabilityByTeacher =
      new Map<
        string,
        typeof availability
      >();

    for (const slot of availability) {
      const existing =
        availabilityByTeacher.get(
          slot.teacherId
        ) ?? [];

      existing.push(slot);

      availabilityByTeacher.set(
        slot.teacherId,
        existing
      );
    }

    // --------------------------------------------------
    // Track scheduled lessons
    // --------------------------------------------------

    type GeneratedEntry = {
      classroomId: string;
      subjectId: string;
      teacherId: string;
      academicYearId: string;
      termId: string;
      day: WeekDay;
      startTime: string;
      endTime: string;
    };

    const generatedEntries: GeneratedEntry[] =
      [];

    // --------------------------------------------------
    // Unscheduled assignments
    // --------------------------------------------------

    const unscheduled: Array<{
      assignmentId: string;
      teacher: string;
      teacherId: string;
      classroom: string;
      section: string;
      subject: string;
      reason: string;
    }> = [];

    // ==================================================
    // CHECK CONFLICTS
    // ==================================================

    function hasTeacherConflict(
      teacherId: string,
      day: WeekDay,
      startTime: string,
      endTime: string
    ) {
      return generatedEntries.some(
        (entry) =>
          entry.teacherId ===
            teacherId &&
          entry.day === day &&
          overlaps(
            entry.startTime,
            entry.endTime,
            startTime,
            endTime
          )
      );
    }

    function hasClassConflict(
      classroomId: string,
      day: WeekDay,
      startTime: string,
      endTime: string
    ) {
      return generatedEntries.some(
        (entry) =>
          entry.classroomId ===
            classroomId &&
          entry.day === day &&
          overlaps(
            entry.startTime,
            entry.endTime,
            startTime,
            endTime
          )
      );
    }

    function hasClassroomConflict(
      classroomId: string,
      day: WeekDay,
      startTime: string,
      endTime: string
    ) {
      return generatedEntries.some(
        (entry) =>
          entry.classroomId ===
            classroomId &&
          entry.day === day &&
          overlaps(
            entry.startTime,
            entry.endTime,
            startTime,
            endTime
          )
      );
    }

    // ==================================================
    // GENERATE
    // ==================================================

    for (const assignment of assignments) {
      const teacherId =
        assignment.teacherId;

      const teacherAvailability =
        availabilityByTeacher.get(
          teacherId
        ) ?? [];

      if (
        teacherAvailability.length === 0
      ) {
        unscheduled.push({
          assignmentId:
            assignment.id,

          teacher:
            assignment.teacher.fullName,

          teacherId:
            assignment.teacher.teacherId,

          classroom:
            assignment.classroom.name,

          section:
            assignment.classroom
              .section.name,

          subject:
            assignment.subject.name,

          reason:
            "Teacher has no approved availability.",
        });

        continue;
      }

      let scheduled = false;

      // ------------------------------------------------
      // Try every day
      // ------------------------------------------------

      for (const day of DAYS) {
        if (scheduled) {
          break;
        }

        // Availability for this teacher/day
        const dailyAvailability =
          teacherAvailability.filter(
            (slot) =>
              slot.day === day
          );

        if (
          dailyAvailability.length === 0
        ) {
          continue;
        }

        // ----------------------------------------------
        // Try every time slot
        // ----------------------------------------------

        for (const timeSlot of TIME_SLOTS) {
          if (scheduled) {
            break;
          }

          // --------------------------------------------
          // Must fit approved availability
          // --------------------------------------------

          const fitsAvailability =
            dailyAvailability.some(
              (availabilitySlot) =>
                isWithinAvailability(
                  timeSlot.startTime,
                  timeSlot.endTime,
                  availabilitySlot
                )
            );

          if (!fitsAvailability) {
            continue;
          }

          // --------------------------------------------
          // Teacher conflict
          // --------------------------------------------

          if (
            hasTeacherConflict(
              teacherId,
              day,
              timeSlot.startTime,
              timeSlot.endTime
            )
          ) {
            continue;
          }

          // --------------------------------------------
          // Classroom/class conflict
          // --------------------------------------------

          if (
            hasClassConflict(
              assignment.classroomId,
              day,
              timeSlot.startTime,
              timeSlot.endTime
            )
          ) {
            continue;
          }

          // --------------------------------------------
          // Classroom conflict
          // --------------------------------------------

          if (
            hasClassroomConflict(
              assignment.classroomId,
              day,
              timeSlot.startTime,
              timeSlot.endTime
            )
          ) {
            continue;
          }

          // --------------------------------------------
          // Assignment is valid
          // --------------------------------------------

          generatedEntries.push({
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
              timeSlot.startTime,

            endTime:
              timeSlot.endTime,
          });

          scheduled = true;
        }
      }

      // ------------------------------------------------
      // Couldn't schedule
      // ------------------------------------------------

      if (!scheduled) {
        unscheduled.push({
          assignmentId:
            assignment.id,

          teacher:
            assignment.teacher.fullName,

          teacherId:
            assignment.teacher.teacherId,

          classroom:
            assignment.classroom.name,

          section:
            assignment.classroom
              .section.name,

          subject:
            assignment.subject.name,

          reason:
            "No conflict-free timetable slot was available within the teacher's approved availability.",
        });
      }
    }

    // --------------------------------------------------
    // No lessons could be generated
    // --------------------------------------------------

    if (generatedEntries.length === 0) {
      return NextResponse.json(
        {
          success: false,

          error:
            "The timetable could not be generated. No assignment could be placed within the approved teacher availability.",

          generatedCount: 0,

          totalAssignments:
            assignments.length,

          unscheduled,
        },
        {
          status: 409,
        }
      );
    }

    // ==================================================
    // SAVE TIMETABLE
    // ==================================================

    await prisma.$transaction(
      async (tx) => {
        // ----------------------------------------------
        // Remove existing generated timetable
        // for this academic year + term
        // ----------------------------------------------

        await tx.timetable.deleteMany({
          where: {
            academicYearId,
            termId,
          },
        });

        // ----------------------------------------------
        // Create new timetable
        // ----------------------------------------------

        await tx.timetable.createMany({
          data: generatedEntries,
        });
      }
    );

    // ==================================================
    // LOAD SAVED TIMETABLE
    // ==================================================

    const timetable =
      await prisma.timetable.findMany({
        where: {
          academicYearId,
          termId,
        },

        orderBy: [
          {
            day: "asc",
          },
          {
            startTime: "asc",
          },
        ],

        include: {
          teacher: {
            select: {
              id: true,
              teacherId: true,
              fullName: true,
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
      });

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        message:
          unscheduled.length > 0
            ? "Timetable generated with some assignments left unscheduled."
            : "Timetable generated successfully.",

        academicYear: {
          id: academicYear.id,
          name: academicYear.name,
        },

        term: {
          id: term.id,
          name: term.name,
        },

        generatedCount:
          generatedEntries.length,

        totalAssignments:
          assignments.length,

        scheduledCount:
          generatedEntries.length,

        unscheduledCount:
          unscheduled.length,

        unscheduled,

        timetable,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GENERATE TIMETABLE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate timetable",
      },
      {
        status: 500,
      }
    );
  }
}