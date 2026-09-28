
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

import {
  AvailabilityStatus,
} from "@prisma/client";

// ======================================================
// HELPERS
// ======================================================

function getDayName(dayOfWeek: number): string {
  switch (dayOfWeek) {
    case 1:
      return "MONDAY";

    case 2:
      return "TUESDAY";

    case 3:
      return "WEDNESDAY";

    case 4:
      return "THURSDAY";

    case 5:
      return "FRIDAY";

    default:
      return "UNKNOWN";
  }
}

// ======================================================
// GET - LOAD TEACHER AVAILABILITY
// ======================================================

export async function GET() {
  try {
    // ==================================================
    // AUTHENTICATION
    // ==================================================

    const session = await auth();

    console.log("SESSION:", session);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    console.log("USER ID:", userId);

    // ==================================================
    // FIND TEACHER
    // ==================================================

    const teacher =
      await prisma.teacher.findUnique({
        where: {
          userId,
        },

        select: {
          id: true,
          teacherId: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
        },
      });

    console.log("TEACHER:", teacher);

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Teacher profile was not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // LOAD AVAILABILITY
    // ==================================================

    const availability =
      await prisma.teacherAvailability.findMany({
        where: {
          teacherId: teacher.id,
        },

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
      });

    // ==================================================
    // FORMAT RESPONSE
    // ==================================================

    const formattedAvailability =
      availability.map((item) => ({
        id: item.id,

        teacherId:
          item.teacherId,

        dayOfWeek:
          item.dayOfWeek,

        dayName:
          getDayName(item.dayOfWeek),

        startTime:
          item.startTime,

        endTime:
          item.endTime,

        status:
          item.status,

        createdAt:
          item.createdAt,

        updatedAt:
          item.updatedAt,
      }));

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      teacher: {
        id: teacher.id,
        teacherId: teacher.teacherId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        fullName: teacher.fullName,
        email: teacher.email,
      },

      availability:
        formattedAvailability,
    });
  } catch (error) {
    console.error(
      "🔥 GET TEACHER AVAILABILITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to load teacher availability.",

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
// POST - SUBMIT TEACHER AVAILABILITY
// ======================================================

export async function POST(
  request: Request
) {
  try {
    // ==================================================
    // AUTHENTICATION
    // ==================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // ==================================================
    // FIND TEACHER
    // ==================================================

    const teacher =
      await prisma.teacher.findUnique({
        where: {
          userId: session.user.id,
        },

        select: {
          id: true,
          teacherId: true,
          fullName: true,
        },
      });

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Teacher profile was not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // REQUEST BODY
    // ==================================================

    const body = await request.json();

    const dayOfWeek =
      Number(body?.dayOfWeek);

    const startTime =
      body?.startTime;

    const endTime =
      body?.endTime;

    // ==================================================
    // VALIDATE DAY
    // ==================================================

    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 1 ||
      dayOfWeek > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid day. Use 1 for Monday through 5 for Friday.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // VALIDATE TIME
    // ==================================================

    const timePattern =
      /^([01]\d|2[0-3]):[0-5]\d$/;

    if (
      typeof startTime !== "string" ||
      typeof endTime !== "string" ||
      !timePattern.test(startTime) ||
      !timePattern.test(endTime)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Start time and end time must use HH:MM format.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // CHECK TIME ORDER
    // ==================================================

    const [startHour, startMinute] =
      startTime.split(":").map(Number);

    const [endHour, endMinute] =
      endTime.split(":").map(Number);

    const startMinutes =
      startHour * 60 + startMinute;

    const endMinutes =
      endHour * 60 + endMinute;

    if (endMinutes <= startMinutes) {
      return NextResponse.json(
        {
          success: false,
          error:
            "End time must be after start time.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // SCHOOL TIME VALIDATION
    // ==================================================

    const schoolStart = 8 * 60;
    const schoolEnd = 15 * 60;

    if (
      startMinutes < schoolStart ||
      endMinutes > schoolEnd
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Teacher availability must be between 08:00 and 15:00.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // CHECK OVERLAPPING AVAILABILITY
    // ==================================================

    const existing =
      await prisma.teacherAvailability.findMany({
        where: {
          teacherId: teacher.id,
          dayOfWeek,
        },

        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      });

    const hasOverlap =
      existing.some((item) => {
        const [itemStartHour, itemStartMinute] =
          item.startTime
            .split(":")
            .map(Number);

        const [itemEndHour, itemEndMinute] =
          item.endTime
            .split(":")
            .map(Number);

        const itemStart =
          itemStartHour * 60 +
          itemStartMinute;

        const itemEnd =
          itemEndHour * 60 +
          itemEndMinute;

        return (
          startMinutes < itemEnd &&
          endMinutes > itemStart
        );
      });

    if (hasOverlap) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This availability period overlaps an existing availability period.",
        },
        { status: 409 }
      );
    }

    // ==================================================
    // CREATE AVAILABILITY
    // ==================================================

    const created =
      await prisma.teacherAvailability.create({
        data: {
          teacherId: teacher.id,

          dayOfWeek,

          startTime,

          endTime,

          status:
            AvailabilityStatus.PENDING,
        },

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
      });

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Availability submitted successfully. It is now waiting for administrator approval.",

        availability: {
          ...created,

          dayName:
            getDayName(
              created.dayOfWeek
            ),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "🔥 POST TEACHER AVAILABILITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to submit teacher availability.",

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
// DELETE - REMOVE TEACHER AVAILABILITY
// ======================================================

export async function DELETE(
  request: Request
) {
  try {
    // ==================================================
    // AUTHENTICATION
    // ==================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // ==================================================
    // FIND TEACHER
    // ==================================================

    const teacher =
      await prisma.teacher.findUnique({
        where: {
          userId: session.user.id,
        },

        select: {
          id: true,
        },
      });

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Teacher profile was not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // GET ID
    // ==================================================

    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Availability ID is required.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // FIND RECORD
    // ==================================================

    const availability =
      await prisma.teacherAvailability.findFirst(
        {
          where: {
            id,
            teacherId: teacher.id,
          },

          select: {
            id: true,
            status: true,
          },
        }
      );

    if (!availability) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Availability record was not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // PREVENT DELETING APPROVED AVAILABILITY
    // ==================================================

    if (
      availability.status ===
      AvailabilityStatus.APPROVED
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Approved availability cannot be deleted. Please contact the administrator if it needs to be changed.",
        },
        { status: 409 }
      );
    }

    // ==================================================
    // DELETE
    // ==================================================

    await prisma.teacherAvailability.delete({
      where: {
        id: availability.id,
      },
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      message:
        "Availability removed successfully.",
    });
  } catch (error) {
    console.error(
      "🔥 DELETE TEACHER AVAILABILITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to remove teacher availability.",

        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

