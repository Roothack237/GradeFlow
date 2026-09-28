import { NextResponse } from "next/server";
import { AvailabilityStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin();

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Availability ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = body?.status;

    if (
      status !== AvailabilityStatus.APPROVED &&
      status !== AvailabilityStatus.REJECTED
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Status must be APPROVED or REJECTED.",
        },
        { status: 400 }
      );
    }

    const availability =
      await prisma.teacherAvailability.findUnique({
        where: { id },
        select: {
          id: true,
          teacherId: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      });

    if (!availability) {
      return NextResponse.json(
        {
          success: false,
          error: "Availability record not found.",
        },
        { status: 404 }
      );
    }

    const updated =
      await prisma.teacherAvailability.update({
        where: { id },
        data: {
          status,
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

    return NextResponse.json({
      success: true,
      message:
        status === AvailabilityStatus.APPROVED
          ? "Availability approved successfully."
          : "Availability rejected successfully.",
      availability: updated,
    });
  } catch (error) {
    console.error(
      "UPDATE TEACHER AVAILABILITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update teacher availability.",
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}