
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
  if (!guard.ok) return guard.response;

  try {
    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    const session = await auth();

    console.log(
      "========== ADMIN TIMETABLE GET =========="
    );
    console.log("SESSION USER:", session?.user);
    console.log("USER EMAIL:", session?.user?.email);
    console.log("USER ID:", session?.user?.id);
    console.log("USER ROLE:", session?.user?.role);
    console.log("==========================================");

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "No authenticated session was found.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // VERIFY ADMIN FROM DATABASE
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
          error: "Unauthorized",
          message: "User account was not found.",
        },
        { status: 401 }
      );
    }

    if (admin.status === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied",
          message: "This account has been suspended.",
        },
        { status: 403 }
      );
    }

    
    // --------------------------------------------------
    // GET REQUEST PARAMETERS
    // --------------------------------------------------

    const { searchParams } = new URL(request.url);

    const academicYearId =
      searchParams.get("academicYearId");

    const termId = searchParams.get("termId");

    // --------------------------------------------------
    // GET ACADEMIC YEARS AND TERMS
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
    // GET ALL TEACHERS
    //
    // IMPORTANT:
    // We get EVERY teacher, including teachers who
    // have submitted NO availability.
    //
    // This is what allows us to calculate:
    // 24 MISSING + 1 PENDING
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

          // --------------------------------------------
          // TEACHER AVAILABILITY
          // --------------------------------------------

          availability: {
            orderBy: [
              {
                day: "asc",
              },
              {
                startTime: "asc",
              },
            ],

            select: {
              id: true,
              day: true,
              startTime: true,
              endTime: true,
              status: true,
              note: true,
              createdAt: true,
              updatedAt: true,
            },
          },

          // --------------------------------------------
          // TEACHER ASSIGNMENTS
          // --------------------------------------------

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
    // BUILD AVAILABILITY SUMMARY
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

        // ----------------------------------------------
        // DETERMINE OVERALL TEACHER STATUS
        // ----------------------------------------------
        //
        // MISSING:
        // No availability has been submitted.
        //
        // PENDING:
        // Availability exists but nothing has been
        // approved yet.
        //
        // READY:
        // At least one availability slot is approved.
        //
        // REJECTED:
        // Availability exists but all submitted slots
        // are rejected.
        // ----------------------------------------------

        let status:
          | "READY"
          | "PENDING"
          | "MISSING"
          | "REJECTED";

        if (approved.length > 0) {
          status = "READY";
        } else if (pending.length > 0) {
          status = "PENDING";
        } else if (
          rejected.length > 0
        ) {
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

          // Counts
          approvedCount: approved.length,
          pendingCount: pending.length,
          rejectedCount: rejected.length,

          // Overall status
          status,

          // Actual availability records
          availability: teacher.availability,

          // Teacher assignments
          assignments: teacher.assignments,
        };
      }
    );

    // --------------------------------------------------
    // CALCULATE GLOBAL AVAILABILITY COUNTS
    //
    // These values should give:
    //
    // 24 MISSING
    // 1 PENDING
    //
    // when 25 teachers exist and only one submitted.
    // --------------------------------------------------

    const availabilityCounts = {
      totalTeachers: teachers.length,

      missing: availabilitySummary.filter(
        (teacher) =>
          teacher.status === "MISSING"
      ).length,

      pending: availabilitySummary.filter(
        (teacher) =>
          teacher.status === "PENDING"
      ).length,

      ready: availabilitySummary.filter(
        (teacher) =>
          teacher.status === "READY"
      ).length,

      rejected: availabilitySummary.filter(
        (teacher) =>
          teacher.status === "REJECTED"
      ).length,
    };

    console.log(
      "========== AVAILABILITY COUNTS =========="
    );

    console.log(
      "TOTAL TEACHERS:",
      availabilityCounts.totalTeachers
    );

    console.log(
      "MISSING:",
      availabilityCounts.missing
    );

    console.log(
      "PENDING:",
      availabilityCounts.pending
    );

    console.log(
      "READY:",
      availabilityCounts.ready
    );

    console.log(
      "REJECTED:",
      availabilityCounts.rejected
    );

    console.log(
      "========================================="
    );

    // --------------------------------------------------
    // GET TIMETABLE
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
              email: true,
              phone: true,
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
            include: {
              section: true,
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
    // RETURN DATA
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      academicYears,

      availabilitySummary,

      // IMPORTANT:
      // Global counts are now available to the frontend.
      availabilityCounts,

      timetable,
    });
  } catch (error) {
    console.error(
      "ADMIN TIMETABLE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load timetable data.",
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
  if (!guard.ok) return guard.response;

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
          message:
            "No authenticated session was found.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // VERIFY ADMIN FROM DATABASE
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
          error: "Unauthorized",
          message:
            "User account was not found.",
        },
        { status: 401 }
      );
    }

    if (admin.status === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied",
          message:
            "This account has been suspended.",
        },
        { status: 403 }
      );
    }

    if (admin.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied",
          message:
            "Administrator privileges are required.",
          currentRole: admin.role,
          expectedRole: Role.ADMIN,
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // REQUEST DATA
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
    // GET ALL TEACHER ASSIGNMENTS
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
    // GET APPROVED AVAILABILITY ONLY
    //
    // PENDING availability must NOT be used to
    // generate the timetable.
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
    // GET EXISTING TIMETABLE
    //
    // IMPORTANT:
    // Existing timetable entries are NOT deleted.
    // Running Generate again only adds new entries.
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
    // TRACK ALREADY SCHEDULED ASSIGNMENTS
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
      const teacherKey = [
        entry.teacherId,
        entry.day,
        entry.startTime,
        entry.endTime,
      ].join("|");

      const classroomKey = [
        entry.classroomId,
        entry.day,
        entry.startTime,
        entry.endTime,
      ].join("|");

      occupiedTeacherSlots.add(
        teacherKey
      );

      occupiedClassroomSlots.add(
        classroomKey
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
    // PROCESS EACH ASSIGNMENT
    // --------------------------------------------------

    for (const assignment of assignments) {
      const assignmentKey = [
        assignment.teacherId,
        assignment.classroomId,
        assignment.subjectId,
      ].join("|");

      // -----------------------------------------------
      // ALREADY SCHEDULED
      // -----------------------------------------------

      if (
        scheduledAssignmentKeys.has(
          assignmentKey
        )
      ) {
        continue;
      }

      // -----------------------------------------------
      // CHECK TEACHER AVAILABILITY
      // -----------------------------------------------

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

      // -----------------------------------------------
      // SEARCH FOR A FREE SLOT
      // -----------------------------------------------

      for (const day of DAYS) {
        if (assigned) {
          break;
        }

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
          if (assigned) {
            break;
          }

          // -------------------------------------------
          // CHECK AVAILABILITY
          // -------------------------------------------

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

          // -------------------------------------------
          // CHECK TEACHER CONFLICT
          // -------------------------------------------

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

          // -------------------------------------------
          // CHECK CLASSROOM CONFLICT
          // -------------------------------------------

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

          // -------------------------------------------
          // CHECK TEACHER OVERLAP
          // -------------------------------------------

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

          // -------------------------------------------
          // CHECK CLASSROOM OVERLAP
          // -------------------------------------------

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

          // -------------------------------------------
          // CREATE NEW ENTRY
          // -------------------------------------------

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

          // Mark teacher slot as occupied.
          occupiedTeacherSlots.add(
            [
              assignment.teacherId,
              day,
              slot.startTime,
              slot.endTime,
            ].join("|")
          );

          // Mark classroom slot as occupied.
          occupiedClassroomSlots.add(
            [
              assignment.classroomId,
              day,
              slot.startTime,
              slot.endTime,
            ].join("|")
          );

          // Mark assignment as scheduled.
          scheduledAssignmentKeys.add(
            assignmentKey
          );

          assigned = true;
        }
      }

      // -----------------------------------------------
      // COULD NOT SCHEDULE
      // -----------------------------------------------

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
    // SAVE NEW ENTRIES
    // --------------------------------------------------

    let createdEntries: any[] = [];

    if (newEntries.length > 0) {
      createdEntries =
        await prisma.$transaction(
          async (tx) => {
            await tx.timetable.createMany({
              data: newEntries,
            });

            return tx.timetable.findMany({
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
                    coefficient: true,
                  },
                },

                classroom: {
                  include: {
                    section: true,
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
          }
        );
    } else {
      // Nothing new was created.
      // Return the existing timetable unchanged.

      createdEntries =
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
                coefficient: true,
              },
            },

            classroom: {
              include: {
                section: true,
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
    }

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        newEntries.length > 0
          ? `Timetable updated successfully. ${
              newEntries.length
            } new period${
              newEntries.length === 1
                ? ""
                : "s"
            } added.`
          : "No new assignments could be scheduled. Existing timetable was kept unchanged.",

      createdCount:
        newEntries.length,

      totalScheduled:
        createdEntries.length,

      unscheduled,

      timetable:
        createdEntries,
    });
  } catch (error) {
    console.error(
      "TIMETABLE GENERATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to generate timetable",
      },
      { status: 500 }
    );
  }
}

