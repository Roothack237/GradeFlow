import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";
import { AvailabilityStatus, WeekDay } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();

    console.log("SESSION:", session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("USER ID:", session.user.id);

    const teacher = await prisma.teacher.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    console.log("TEACHER:", teacher);

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    const availability =
      await prisma.teacherAvailability.findMany({
        where: {
          teacherId: teacher.id,
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

    console.log("AVAILABILITY:", availability);

    return NextResponse.json(availability);
  } catch (error) {
    console.error(
      "🔥 GET TEACHER AVAILABILITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const { day, startTime, endTime, note } = body;

    if (!day || !startTime || !endTime) {
      return NextResponse.json(
        {
          error: "Day, start time and end time are required",
        },
        { status: 400 }
      );
    }

    if (!Object.values(WeekDay).includes(day)) {
      return NextResponse.json(
        { error: "Invalid day" },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        {
          error: "End time must be after start time",
        },
        { status: 400 }
      );
    }

    // Check for overlapping availability
    const existing = await prisma.teacherAvailability.findMany({
      where: {
        teacherId: teacher.id,
        day,
        status: {
          in: [
            AvailabilityStatus.PENDING,
            AvailabilityStatus.APPROVED,
          ],
        },
      },
    });

    const overlap = existing.some((slot) => {
      return (
        startTime < slot.endTime &&
        endTime > slot.startTime
      );
    });

    if (overlap) {
      return NextResponse.json(
        {
          error:
            "This time overlaps with an existing availability slot.",
        },
        { status: 409 }
      );
    }

    const availability =
      await prisma.teacherAvailability.create({
        data: {
          teacherId: teacher.id,
          day,
          startTime,
          endTime,
          note: note || null,
          status: AvailabilityStatus.PENDING,
        },
      });

    /*
     * Notify the administration through the existing notification system.
     * A failure here must never break the availability submission.
     */

    try {
      const teacherProfile = await prisma.teacher.findUnique({
        where: { id: teacher.id },
        select: { fullName: true },
      });

      await notifyAdmins({
        title: "Availability submitted",
        message: `${teacherProfile?.fullName ?? "A teacher"} submitted a new availability slot (${day}, ${startTime}–${endTime}).`,
        type: "INFO",
        senderId: session.user.id,
        relatedType: "AVAILABILITY",
        relatedId: availability.id,
        actionUrl: "/admin/availability",
      });
    } catch (notificationError) {
      console.error(
        "AVAILABILITY SUBMISSION NOTIFICATION ERROR:",
        notificationError
      );
    }

    return NextResponse.json(
      availability,
      { status: 201 }
    );
  } catch (error) {
    console.error("POST TEACHER AVAILABILITY ERROR:", error);

    return NextResponse.json(
      { error: "Failed to save availability" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required" },
        { status: 400 }
      );
    }

    // Only allow the teacher to delete their own
    // PENDING availability.
    const availability =
      await prisma.teacherAvailability.findFirst({
        where: {
          id,
          teacherId: teacher.id,
          status: AvailabilityStatus.PENDING,
        },
      });

    if (!availability) {
      return NextResponse.json(
        {
          error:
            "Availability not found or it has already been reviewed.",
        },
        { status: 404 }
      );
    }

    await prisma.teacherAvailability.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Availability deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE TEACHER AVAILABILITY ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Failed to delete availability" },
      { status: 500 }
    );
  }
}