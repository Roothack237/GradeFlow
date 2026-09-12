import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  AvailabilityStatus,
  Role,
} from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: Params
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const body = await request.json();

    const status = body.status as AvailabilityStatus;

    if (
      status !== AvailabilityStatus.APPROVED &&
      status !== AvailabilityStatus.REJECTED
    ) {
      return NextResponse.json(
        {
          error:
            "Status must be APPROVED or REJECTED",
        },
        { status: 400 }
      );
    }

    const availability =
      await prisma.teacherAvailability.findUnique({
        where: {
          id,
        },
      });

    if (!availability) {
      return NextResponse.json(
        {
          error: "Availability not found",
        },
        { status: 404 }
      );
    }

    const updated =
      await prisma.teacherAvailability.update({
        where: {
          id,
        },
        data: {
          status,
          note:
            body.note !== undefined
              ? body.note
              : availability.note,
        },
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      "ADMIN AVAILABILITY UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update availability",
      },
      { status: 500 }
    );
  }
}