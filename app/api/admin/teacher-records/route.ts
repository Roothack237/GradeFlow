
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // =====================================================
    // GET DATABASE USER
    // =====================================================

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    console.log("TEACHER RECORDS AUTH:", {
      sessionEmail: session.user.email,
      databaseUser: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
          }
        : null,
    });

    // =====================================================
    // ADMIN ONLY
    // =====================================================

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    // =====================================================
    // GET FILTER PARAMETERS
    // =====================================================

    const { searchParams } = new URL(request.url);

    const teacherId =
      searchParams.get("teacherId") || "";

    const sectionId =
      searchParams.get("sectionId") || "";

    const classroomId =
      searchParams.get("classroomId") || "";

    const subjectId =
      searchParams.get("subjectId") || "";

    const academicYearId =
      searchParams.get("academicYearId") || "";

    const termId =
      searchParams.get("termId") || "";

    const sequenceId =
      searchParams.get("sequenceId") || "";

    // =====================================================
    // MARK FILTERS
    // =====================================================

    const markWhere: any = {};

    // Teacher
    if (teacherId) {
      markWhere.teacherId = teacherId;
    }

    // Subject
    if (subjectId) {
      markWhere.subjectId = subjectId;
    }

    // Sequence
    if (sequenceId) {
      markWhere.sequenceId = sequenceId;
    }

    // Student / Classroom / Section
    if (classroomId || sectionId) {
      markWhere.student = {
        ...(classroomId
          ? {
              classroomId,
            }
          : {}),

        ...(sectionId
          ? {
              classroom: {
                sectionId,
              },
            }
          : {}),
      };
    }

    // Term / Academic Year
    if (termId || academicYearId) {
      markWhere.sequence = {
        ...(termId
          ? {
              termId,
            }
          : {}),

        ...(academicYearId
          ? {
              term: {
                academicYearId,
              },
            }
          : {}),
      };
    }

    // =====================================================
    // ATTENDANCE FILTERS
    // =====================================================

    const attendanceWhere: any = {};

    // Teacher
    if (teacherId) {
      attendanceWhere.teacherId = teacherId;
    }

    // Subject
    if (subjectId) {
      attendanceWhere.subjectId = subjectId;
    }

    // Sequence
    if (sequenceId) {
      attendanceWhere.sequenceId = sequenceId;
    }

    // Student / Classroom / Section
    if (classroomId || sectionId) {
      attendanceWhere.student = {
        ...(classroomId
          ? {
              classroomId,
            }
          : {}),

        ...(sectionId
          ? {
              classroom: {
                sectionId,
              },
            }
          : {}),
      };
    }

    // Term / Academic Year
    if (termId || academicYearId) {
      attendanceWhere.sequence = {
        ...(termId
          ? {
              termId,
            }
          : {}),

        ...(academicYearId
          ? {
              term: {
                academicYearId,
              },
            }
          : {}),
      };
    }

    // =====================================================
    // GET MARKS
    // =====================================================

    const marks = await prisma.mark.findMany({
      where: markWhere,

      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,

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
        },

        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            coefficient: true,
          },
        },

        teacher: {
          select: {
            id: true,
            teacherId: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
          },
        },

        sequence: {
          select: {
            id: true,
            name: true,
            order: true,

            term: {
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
            },
          },
        },
      },

      orderBy: [
        {
          sequence: {
            term: {
              order: "asc",
            },
          },
        },

        {
          sequence: {
            order: "asc",
          },
        },

        {
          student: {
            lastName: "asc",
          },
        },
      ],
    });

    // =====================================================
    // GET ATTENDANCE
    // =====================================================

    const attendance =
      await prisma.attendance.findMany({
        where: attendanceWhere,

        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              matricule: true,

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
          },

          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              coefficient: true,
            },
          },

          teacher: {
            select: {
              id: true,
              teacherId: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
            },
          },

          sequence: {
            select: {
              id: true,
              name: true,
              order: true,

              term: {
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
              },
            },
          },
        },

        orderBy: {
          date: "desc",
        },
      });

    // =====================================================
    // GET TEACHERS
    // =====================================================

    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        teacherId: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
      },

      orderBy: {
        lastName: "asc",
      },
    });

    // =====================================================
    // GET CLASSROOMS + SECTIONS
    // =====================================================

    const classrooms =
      await prisma.classroom.findMany({
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

        orderBy: {
          name: "asc",
        },
      });

    // =====================================================
    // GET SUBJECTS
    // =====================================================

    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },

      orderBy: {
        name: "asc",
      },
    });

    // =====================================================
    // GET ACADEMIC YEARS
    // INCLUDING TERMS + SEQUENCES
    // =====================================================

    const academicYears =
      await prisma.academicYear.findMany({
        select: {
          id: true,
          name: true,

          terms: {
            select: {
              id: true,
              name: true,
              order: true,

              sequences: {
                select: {
                  id: true,
                  name: true,
                  order: true,
                },

                orderBy: {
                  order: "asc",
                },
              },
            },

            orderBy: {
              order: "asc",
            },
          },
        },

        orderBy: {
          startDate: "desc",
        },
      });

    // =====================================================
    // RETURN EVERYTHING TO FRONTEND
    // =====================================================

    return NextResponse.json({
      marks,
      attendance,

      filters: {
        teachers,
        classrooms,
        subjects,
        academicYears,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN TEACHER RECORDS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load teacher records.",
      },
      {
        status: 500,
      }
    );
  }
}

