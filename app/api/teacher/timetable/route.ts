
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

import {
  Role,
  PublicationStatus,
} from "@prisma/client";

// ============================================================
// GET /api/teacher/timetable
//
// Default:
// Returns published class timetables available to the teacher.
//
// Personal mode:
// /api/teacher/timetable?personal=true&termId=...&classroomId=...
//
// In personal mode, ONLY timetable records belonging to the
// currently logged-in teacher are returned.
// ============================================================

export async function GET(request: Request) {
  try {
    // ========================================================
    // 1. AUTHENTICATION
    // ========================================================

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // ========================================================
    // 2. GET CURRENT USER
    // ========================================================

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,

        teacher: {
          select: {
            id: true,
            teacherId: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User account was not found.",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // 3. VERIFY TEACHER
    // ========================================================

    if (user.role !== Role.TEACHER) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This timetable is only available to teachers.",
        },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This teacher account has been suspended.",
        },
        { status: 403 }
      );
    }

    if (!user.teacher) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Teacher profile was not found.",
        },
        { status: 404 }
      );
    }

    const teacherId = user.teacher.id;

    // ========================================================
    // 4. REQUEST PARAMETERS
    // ========================================================

    const { searchParams } =
      new URL(request.url);

    const personal =
      searchParams.get("personal") === "true";

    const termId =
      searchParams.get("termId");

    const classroomId =
      searchParams.get("classroomId");

    const academicYearId =
      searchParams.get("academicYearId");

    // ========================================================
    // 5. PERSONAL TIMETABLE
    // ========================================================
    //
    // This branch is used when the teacher selects:
    //
    // Section
    // Term
    // Class
    //
    // The teacher ID comes from the authenticated session.
    // It is NEVER accepted from the browser.
    // ========================================================

    if (personal) {
      if (!termId || !classroomId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Term and class are required.",
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------------
      // Verify that the teacher is assigned to this class.
      // ------------------------------------------------------

      const assignment =
        await prisma.teacherAssignment.findFirst({
          where: {
            teacherId,
            classroomId,
          },

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

                academicYear: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },

            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        });

      if (!assignment) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You are not assigned to this class.",
          },
          { status: 403 }
        );
      }

      // ------------------------------------------------------
      // Verify the selected term exists.
      // ------------------------------------------------------

      const term =
        await prisma.term.findUnique({
          where: {
            id: termId,
          },

          select: {
            id: true,
            name: true,
            order: true,

            academicYear: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

      if (!term) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The selected term was not found.",
          },
          { status: 404 }
        );
      }

      // ------------------------------------------------------
      // Verify class belongs to the selected academic year.
      // ------------------------------------------------------

      if (
        term.academicYear.id !==
        assignment.classroom.academicYear.id
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The selected class does not belong to the selected academic year.",
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------------
      // Get ONLY this teacher's timetable.
      // ------------------------------------------------------

      const timetable =
        await prisma.timetable.findMany({
          where: {
            teacherId,

            classroomId,

            termId,

            academicYearId:
              term.academicYear.id,
          },

          include: {
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

            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },

            teacher: {
              select: {
                id: true,
                teacherId: true,
                firstName: true,
                lastName: true,
                fullName: true,
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

      // ------------------------------------------------------
      // Make sure the class timetable is published.
      // ------------------------------------------------------

      const publication =
        await prisma.timetablePublication.findUnique({
          where: {
            termId_classroomId: {
              termId,
              classroomId,
            },
          },

          select: {
            id: true,
            status: true,
            publishedAt: true,
            notes: true,
          },
        });

      if (
        !publication ||
        publication.status !==
          PublicationStatus.PUBLISHED
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The timetable for this class and term has not been published yet.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,

        mode: "personal",

        teacher: user.teacher,

        section:
          assignment.section,

        classroom:
          assignment.classroom,

        term,

        publication,

        timetable,
      });
    }

    // ========================================================
    // 6. LOAD TEACHER ASSIGNMENTS
    // ========================================================
    //
    // These determine which sections/classes the teacher can
    // select in the Personal Timetable popup.
    // ========================================================

    const assignments =
      await prisma.teacherAssignment.findMany({
        where: {
          teacherId,
        },

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

              academicYear: {
                select: {
                  id: true,
                  name: true,
                  isActive: true,
                },
              },
            },
          },

          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },

        orderBy: [
          {
            classroom: {
              name: "asc",
            },
          },
          {
            subject: {
              name: "asc",
            },
          },
        ],
      });

    // ========================================================
    // 7. GET PUBLISHED TIMETABLE PUBLICATIONS
    // ========================================================
    //
    // Only PUBLISHED class timetables are returned.
    // ========================================================

    const publishedPublications =
      await prisma.timetablePublication.findMany({
        where: {
          status:
            PublicationStatus.PUBLISHED,
        },

        include: {
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

              academicYear: {
                select: {
                  id: true,
                  name: true,
                  isActive: true,
                },
              },
            },
          },

          term: {
            select: {
              id: true,
              name: true,
              order: true,

              academicYear: {
                select: {
                  id: true,
                  name: true,
                  isActive: true,
                },
              },
            },
          },
        },

        orderBy: [
          {
            publishedAt: "desc",
          },
        ],
      });

    // ========================================================
    // 8. ONLY SHOW PUBLISHED TIMETABLES THAT ARE RELEVANT
    // TO THE TEACHER
    // ========================================================

    const teacherClassroomIds =
      new Set(
        assignments.map(
          (assignment) =>
            assignment.classroom.id
        )
      );

    const availablePublications =
      publishedPublications.filter(
        (publication) =>
          teacherClassroomIds.has(
            publication.classroom.id
          )
      );

    // ========================================================
    // 9. LOAD THE ACTUAL TIMETABLE RECORDS
    // FOR THE PUBLISHED CLASS TIMETABLES
    // ========================================================

    const timetable = await prisma.timetable.findMany({
      where: {
        classroomId: {
          in:
            availablePublications.map(
              (publication) =>
                publication.classroom.id
            ),
        },

        termId: {
          in:
            availablePublications.map(
              (publication) =>
                publication.term.id
            ),
        },
      },

      include: {
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

        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },

        teacher: {
          select: {
            id: true,
            teacherId: true,
            firstName: true,
            lastName: true,
            fullName: true,
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

    // ========================================================
    // 10. PREPARE POPUP OPTIONS
    // ========================================================

    const sectionMap =
      new Map<
        string,
        {
          id: string;
          name: string;
        }
      >();

    const classroomMap =
      new Map<
        string,
        {
          id: string;
          name: string;
          sectionId: string;
          sectionName: string;
          academicYearId: string;
          academicYearName: string;
          isActive: boolean;
        }
      >();

    const termMap =
      new Map<
        string,
        {
          id: string;
          name: string;
          order: number;
          academicYearId: string;
          academicYearName: string;
          isActive: boolean;
        }
      >();

    for (const assignment of assignments) {
      sectionMap.set(
        assignment.section.id,
        {
          id: assignment.section.id,
          name: assignment.section.name,
        }
      );

      classroomMap.set(
        assignment.classroom.id,
        {
          id: assignment.classroom.id,
          name: assignment.classroom.name,
          sectionId:
            assignment.section.id,
          sectionName:
            assignment.section.name,
          academicYearId:
            assignment.classroom.academicYear.id,
          academicYearName:
            assignment.classroom.academicYear.name,
          isActive:
            assignment.classroom.academicYear
              .isActive,
        }
      );
    }

    // Terms are taken from the academic years
    // connected to the teacher's classes.

    const academicYearIds =
      Array.from(
        classroomMap.values()
      ).map(
        (classroom) =>
          classroom.academicYearId
      );

    const terms =
      academicYearIds.length > 0
        ? await prisma.term.findMany({
            where: {
              academicYearId: {
                in: academicYearIds,
              },
            },

            select: {
              id: true,
              name: true,
              order: true,

              academicYear: {
                select: {
                  id: true,
                  name: true,
                  isActive: true,
                },
              },
            },

            orderBy: [
              {
                academicYear: {
                  startDate: "desc",
                },
              },
              {
                order: "asc",
              },
            ],
          })
        : [];

    for (const term of terms) {
      termMap.set(term.id, {
        id: term.id,
        name: term.name,
        order: term.order,
        academicYearId:
          term.academicYear.id,
        academicYearName:
          term.academicYear.name,
        isActive:
          term.academicYear.isActive,
      });
    }

    // ========================================================
    // 11. RETURN DATA
    // ========================================================

    return NextResponse.json({
      success: true,

      mode: "published",

      teacher: user.teacher,

      // Published class timetables
      publications:
        availablePublications.map(
          (publication) => ({
            id: publication.id,

            termId:
              publication.term.id,

            term:
              publication.term.name,

            termOrder:
              publication.term.order,

            classroomId:
              publication.classroom.id,

            classroom:
              publication.classroom.name,

            sectionId:
              publication.classroom.section.id,

            section:
              publication.classroom.section.name,

            academicYearId:
              publication.classroom
                .academicYear.id,

            academicYear:
              publication.classroom
                .academicYear.name,

            status:
              publication.status,

            publishedAt:
              publication.publishedAt,

            notes:
              publication.notes,
          })
        ),

      // Actual timetable entries
      timetable,

      // Data used by the personal timetable popup
      sections:
        Array.from(sectionMap.values()),

      classrooms:
        Array.from(classroomMap.values()),

      terms:
        Array.from(termMap.values()),
    });
  } catch (error) {
    console.error(
      "=========================================="
    );

    console.error(
      "TEACHER TIMETABLE API ERROR"
    );

    console.error(error);

    console.error(
      "=========================================="
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to load teacher timetable.",

        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}


