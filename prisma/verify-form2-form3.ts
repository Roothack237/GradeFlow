import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Mark completeness verification for the Form 2 / Form 3 dataset of
 * Academic Year 2026/2027.
 *
 * For every student it checks:
 *
 *   student → assigned subjects of their class → every sequence of the year
 *           → a Mark row exists
 *
 * and prints the requested summary:
 *
 *   students · subjects · expected marks · actual marks · missing marks
 *
 * Exit code is 1 when something is missing, so it can be used in CI.
 *
 * Run with:  npx tsx prisma/verify-form2-form3.ts
 */

const YEAR_NAME = "2026/2027";
const CLASS_PATTERN = /^form\s*[23]\b/i;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
});

type Result = {
  className: string;
  students: number;
  subjects: number;
  sequences: number;
  expected: number;
  actual: number;
  missing: number;
  missingDetails: string[];
  incompleteStudents: number;
};

async function verifyClass(
  classroom: { id: string; name: string },
  sequenceIds: string[]
): Promise<Result> {
  const [students, assignments, marks] = await Promise.all([
    prisma.student.findMany({
      where: { classroomId: classroom.id },
      select: { id: true, firstName: true, lastName: true, matricule: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),

    prisma.teacherAssignment.findMany({
      where: { classroomId: classroom.id },
      select: { subjectId: true, subject: { select: { name: true } } },
    }),

    prisma.mark.findMany({
      where: {
        student: { classroomId: classroom.id },
        sequenceId: { in: sequenceIds },
      },
      select: { studentId: true, subjectId: true, sequenceId: true },
    }),
  ]);

  const subjectIds = Array.from(
    new Set(assignments.map((assignment) => assignment.subjectId))
  );

  const subjectName = new Map(
    assignments.map((assignment) => [
      assignment.subjectId,
      assignment.subject?.name ?? assignment.subjectId,
    ])
  );

  const present = new Set(
    marks.map((mark) => `${mark.studentId}:${mark.subjectId}:${mark.sequenceId}`)
  );

  const missingDetails: string[] = [];
  let expected = 0;
  let actual = 0;
  let incompleteStudents = 0;

  for (const student of students) {
    let studentMissing = 0;

    for (const subjectId of subjectIds) {
      for (const sequenceId of sequenceIds) {
        expected += 1;

        if (present.has(`${student.id}:${subjectId}:${sequenceId}`)) {
          actual += 1;
        } else {
          studentMissing += 1;

          missingDetails.push(
            `${student.matricule} ${student.firstName} ${student.lastName} — ${
              subjectName.get(subjectId) ?? subjectId
            }`
          );
        }
      }
    }

    if (studentMissing > 0) incompleteStudents += 1;
  }

  return {
    className: classroom.name,
    students: students.length,
    subjects: subjectIds.length,
    sequences: sequenceIds.length,
    expected,
    actual,
    missing: Math.max(0, expected - actual),
    missingDetails: missingDetails.slice(0, 20),
    incompleteStudents,
  };
}

async function main() {
  console.log(
    `\n=== Mark completeness — Academic Year ${YEAR_NAME} ===\n`
  );

  const academicYear = await prisma.academicYear.findUnique({
    where: { name: YEAR_NAME },
    include: {
      terms: {
        orderBy: { order: "asc" },
        include: { sequences: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!academicYear) {
    console.error(`Academic year ${YEAR_NAME} not found.`);
    process.exit(1);
  }

  const sequenceIds = academicYear.terms.flatMap((term) =>
    term.sequences.map((sequence) => sequence.id)
  );

  const classrooms = await prisma.classroom.findMany({
    where: { academicYearId: academicYear.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const targets = classrooms.filter((classroom) =>
    CLASS_PATTERN.test(classroom.name)
  );

  if (!targets.length) {
    console.error("No Form 2 / Form 3 class found for this academic year.");
    process.exit(1);
  }

  const results: Result[] = [];

  for (const classroom of targets) {
    results.push(await verifyClass(classroom, sequenceIds));
  }

  let totalMissing = 0;

  for (const result of results) {
    console.log(`Class: ${result.className}`);
    console.log(`  Students            : ${result.students}`);
    console.log(`  Subject assignments : ${result.subjects}`);
    console.log(`  Sequences (year)    : ${result.sequences}`);
    console.log(`  Expected marks      : ${result.expected}`);
    console.log(`  Actual marks        : ${result.actual}`);
    console.log(`  Missing marks       : ${result.missing}`);

    if (result.incompleteStudents) {
      console.log(
        `  Students with gaps  : ${result.incompleteStudents}`
      );

      for (const line of result.missingDetails) {
        console.log(`    · ${line}`);
      }
    }

    console.log("");

    totalMissing += result.missing;
  }

  /* ---- cross-checks asked for in the acceptance list ---- */

  const classIds = targets.map((classroom) => classroom.id);

  const [studentsOverall, studentsWithoutParent, marksOverall, attendanceOverall] =
    await Promise.all([
      prisma.student.count({ where: { classroomId: { in: classIds } } }),
      prisma.student.count({
        where: { classroomId: { in: classIds }, parentId: null },
      }),
      prisma.mark.count({
        where: { student: { classroomId: { in: classIds } } },
      }),
      prisma.attendance.count({
        where: { student: { classroomId: { in: classIds } } },
      }),
    ]);

  const multiChildParents = await prisma.parent.count({
    where: {
      children: { some: { classroomId: { in: classIds } } },
    },
  });

  const families = await prisma.student.groupBy({
    by: ["parentId"],
    where: { classroomId: { in: classIds }, parentId: { not: null } },
    _count: { _all: true },
  });

  const parentsWithSeveralChildren = families.filter(
    (family) => family._count._all > 1
  ).length;

  const reportCards = await prisma.reportCard.count({
    where: { student: { classroomId: { in: classIds } } },
  });

  console.log("Cross-checks");
  console.log(`  Students (Form 2 + Form 3)   : ${studentsOverall}`);
  console.log(`  Students without a parent    : ${studentsWithoutParent}`);
  console.log(`  Parents linked to Form 2/3   : ${multiChildParents}`);
  console.log(`  Parents with several children: ${parentsWithSeveralChildren}`);
  console.log(`  Marks in PostgreSQL          : ${marksOverall}`);
  console.log(`  Attendance in PostgreSQL     : ${attendanceOverall}`);
  console.log(`  Report cards stored          : ${reportCards}`);
  console.log(
    `\nResult: ${totalMissing === 0 ? "COMPLETE — no missing marks" : `${totalMissing} MISSING MARK(S)`}\n`
  );

  await prisma.$disconnect();

  if (totalMissing > 0) process.exit(1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
