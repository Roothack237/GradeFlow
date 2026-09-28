import prisma from "@/lib/prisma";

/**
 * Synchronizes one classroom's communication group.
 *
 * Class group members are USERS who can actually log in:
 *
 * - Active ADMIN users
 * - Active teachers assigned to the classroom
 * - Active parents of students in the classroom
 *
 * Students are NOT added directly because students are not
 * login actors in GradeFlow.
 */
export async function syncClassGroup(classroomId: string) {
  const classroom = await prisma.classroom.findUnique({
    where: {
      id: classroomId,
    },
    include: {
      section: true,

      assignments: {
        include: {
          teacher: {
            include: {
              user: true,
            },
          },
        },
      },

      students: {
        include: {
          parent: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!classroom) {
    throw new Error("Classroom not found.");
  }

  // ----------------------------------------------------------
  // CREATE OR GET GROUP
  // ----------------------------------------------------------

  const group = await prisma.classGroup.upsert({
    where: {
      classroomId,
    },

    update: {
      name: `${classroom.section.name} - ${classroom.name}`,
    },

    create: {
      name: `${classroom.section.name} - ${classroom.name}`,
      classroomId,
    },
  });

  // ----------------------------------------------------------
  // COLLECT USERS
  // ----------------------------------------------------------

  const userIds = new Set<string>();

  // ----------------------------------------------------------
  // 1. ACTIVE ADMINS
  // ----------------------------------------------------------

  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      status: "ACTIVE",
    },

    select: {
      id: true,
    },
  });

  for (const admin of admins) {
    userIds.add(admin.id);
  }

  // ----------------------------------------------------------
  // 2. ACTIVE TEACHERS ASSIGNED TO THIS CLASS
  // ----------------------------------------------------------

  for (const assignment of classroom.assignments) {
    const teacherUser = assignment.teacher?.user;

    if (teacherUser && teacherUser.status === "ACTIVE") {
      userIds.add(teacherUser.id);
    }
  }

  // ----------------------------------------------------------
  // 3. ACTIVE PARENTS OF STUDENTS IN THIS CLASS
  // ----------------------------------------------------------

  for (const student of classroom.students) {
    const parentUser = student.parent?.user;

    if (parentUser && parentUser.status === "ACTIVE") {
      userIds.add(parentUser.id);
    }
  }

  // ----------------------------------------------------------
  // REMOVE OLD MEMBERS WHO NO LONGER BELONG
  // ----------------------------------------------------------

  await prisma.classGroupMember.deleteMany({
    where: {
      groupId: group.id,

      ...(userIds.size > 0
        ? {
            userId: {
              notIn: Array.from(userIds),
            },
          }
        : {}),
    },
  });

  // ----------------------------------------------------------
  // ADD CURRENT MEMBERS
  // ----------------------------------------------------------

  if (userIds.size > 0) {
    await prisma.classGroupMember.createMany({
      data: Array.from(userIds).map((userId) => ({
        groupId: group.id,
        userId,
      })),

      skipDuplicates: true,
    });
  }

  return {
    group,
    memberCount: userIds.size,
  };
}

/**
 * Synchronize all classroom groups.
 */
export async function syncAllClassGroups(
  academicYearId?: string
) {
  const classrooms = await prisma.classroom.findMany({
    where: academicYearId
      ? {
          academicYearId,
        }
      : undefined,

    select: {
      id: true,
    },
  });

  for (const classroom of classrooms) {
    await syncClassGroup(classroom.id);
  }

  return classrooms.length;
}

/**
 * Check whether a user can access a class group.
 */
export async function canAccessClassGroup(
  userId: string,
  groupId: string
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      role: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return false;
  }

  // Admins can access every class group.
  if (user.role === "ADMIN") {
    return true;
  }

  const membership =
    await prisma.classGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },

      select: {
        id: true,
      },
    });

  return !!membership;
}