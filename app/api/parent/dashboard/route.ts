import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get logged-in user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Make sure the logged-in user is a parent
    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    // Find parent and all linked children
    const parent = await prisma.parent.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        user: true,

        children: {
          include: {
            classroom: {
              include: {
                section: true,
              },
            },
            marks: true,
            attendances: true,
          },

          orderBy: {
            lastName: "asc",
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { message: "Parent profile not found" },
        { status: 404 }
      );
    }

    // Parent title
    const gender = parent.gender?.toLowerCase();

    const title =
      gender === "female"
        ? "Mme"
        : gender === "male"
        ? "Mr"
        : "";

    // Parent full name
    const fullName =
      parent.fullName ||
      `${parent.user.firstName} ${parent.user.lastName}`;

    // Format children
    const children = parent.children.map((child) => {
      // Calculate average from the recorded marks
      const average =
        child.marks.length > 0
          ? child.marks.reduce(
              (total, mark) => total + mark.average,
              0
            ) / child.marks.length
          : 0;

      // Attendance rate from the recorded attendance
      const attended = child.attendances.filter(
        (record) => record.status === "PRESENT" || record.status === "LATE"
      ).length;

      const attendance =
        child.attendances.length > 0
          ? Math.round((attended / child.attendances.length) * 100)
          : 0;

      // Child initials
      const initials =
        `${child.firstName?.charAt(0) || ""}${child.lastName?.charAt(0) || ""}`.toUpperCase();

      // Child full name
      const childFullName =
        `${child.firstName} ${child.lastName}`.trim();

      return {
        id: child.id,

        // Child's name
        firstName: child.firstName,
        lastName: child.lastName,
        fullName: childFullName,
        name: childFullName,

        // Matricule
        matricule: child.matricule,

        // Gender
        gender: child.gender,

        // Classroom
        classroom: child.classroom
          ? {
              id: child.classroom.id,
              name: child.classroom.name,
            }
          : null,

        // Keep className as well in case other pages use it
        className:
          child.classroom?.name || "Class not assigned",

        // Classroom ID
        classroomId: child.classroomId,

        // Section (from the classroom, never hardcoded)
        section:
          child.classroom?.section?.name === "FRANCOPHONE"
            ? "Francophone"
            : "Anglophone",

        // Academic information
        average: Number(average.toFixed(1)),
        attendance,

        // Initials
        initials,
      };
    });

    // Latest notifications for the parent
    const notificationRecords = await prisma.notification.findMany({
      where: { userId: parent.userId, archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      parent: {
        id: parent.id,

        firstName: parent.user.firstName,
        lastName: parent.user.lastName,

        fullName,

        displayName:
          `${title} ${fullName}`.trim(),

        email:
          parent.email ?? parent.user.email,

        phone:
          parent.phone ?? parent.user.phone,

        gender: parent.gender,
      },

      // All children belonging to this parent
      children,

      // Notifications
      notifications: notificationRecords.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.isRead,
        createdAt: notification.createdAt,
      })),
    });
  } catch (error) {
    console.error(
      "PARENT DASHBOARD ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to load parent dashboard",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
