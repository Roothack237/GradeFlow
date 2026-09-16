import "dotenv/config";

import {
  AccountStatus,
  AttendanceStatus,
  AvailabilityStatus,
  Gender,
  PrismaClient,
  Role,
  SectionType,
  WeekDay,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { gradeOf, remarkOf } from "../lib/grading";

/**
 * Form 2 / Form 3 academic dataset for Academic Year 2026/2027.
 *
 * What it does
 * ------------
 *   • makes sure 2026/2027 (terms + sequences) and the Anglophone section exist
 *   • makes sure the Form 2 and Form 3 classes of 2026/2027 exist
 *   • makes sure every subject of those classes has a teacher (reusing the
 *     teachers already assigned, so no duplicate staff is created)
 *   • makes sure every Form 2 / Form 3 student exists and has a parent
 *     (several parents have more than one child)
 *   • fills the marks of EVERY student × assigned subject × sequence × term
 *     of 2026/2027 — CA1, CA2, exam, average, grade and remark
 *   • records realistic attendance for the same scope
 *
 * Properties
 * ----------
 *   • idempotent: existing rows are reused, never duplicated or deleted
 *   • deterministic: the same students always get the same marks
 *   • realistic: excellent, good, average and weak students, students who are
 *     strong in some subjects and weak in others, plus sequence-by-sequence
 *     variation, so the AI performance analysis has meaningful data
 *
 * Run with:  npx tsx prisma/seed-form2-form3.ts
 */

const YEAR_NAME = "2026/2027";

/** Single streams, as requested: "Form 2" and "Form 3". */
const TARGET_CLASSES = [
  { name: "Form 2", pattern: /^form\s*2\b/i },
  { name: "Form 3", pattern: /^form\s*3\b/i },
];

const STUDENTS_PER_CLASS = 12;

const SUBJECTS = [
  { name: "Mathematics", code: "MATH", coefficient: 5 },
  { name: "English Language", code: "ENG", coefficient: 4 },
  { name: "French", code: "FRE", coefficient: 4 },
  { name: "Biology", code: "BIO", coefficient: 3 },
  { name: "Chemistry", code: "CHE", coefficient: 3 },
  { name: "Physics", code: "PHY", coefficient: 3 },
  { name: "History", code: "HIS", coefficient: 2 },
  { name: "Geography", code: "GEO", coefficient: 2 },
];

const TEACHERS = [
  { firstName: "Peter", lastName: "Ndifor", gender: "Male", code: "MATH" },
  { firstName: "Sarah", lastName: "Johnson", gender: "Female", code: "ENG" },
  { firstName: "David", lastName: "Tchakounte", gender: "Male", code: "FRE" },
  { firstName: "Mary", lastName: "Fomum", gender: "Female", code: "BIO" },
  { firstName: "Paul", lastName: "Eyenga", gender: "Male", code: "CHE" },
  { firstName: "Grace", lastName: "Mbah", gender: "Female", code: "PHY" },
  { firstName: "John", lastName: "Smith", gender: "Male", code: "HIS" },
  { firstName: "Rose", lastName: "Ateba", gender: "Female", code: "GEO" },
];

const PARENTS = [
  { firstName: "James", lastName: "Fonteh", gender: "Male", children: 3 },
  { firstName: "Elizabeth", lastName: "Nkeng", gender: "Female", children: 2 },
  { firstName: "Samuel", lastName: "Biya", gender: "Male", children: 2 },
  { firstName: "Janet", lastName: "Ambe", gender: "Female", children: 1 },
  { firstName: "Martin", lastName: "Ngo", gender: "Male", children: 1 },
  { firstName: "Claire", lastName: "Tabi", gender: "Female", children: 3 },
  { firstName: "Eric", lastName: "Fonda", gender: "Male", children: 2 },
  { firstName: "Dora", lastName: "Che", gender: "Female", children: 1 },
  { firstName: "Vincent", lastName: "Njoya", gender: "Male", children: 2 },
  { firstName: "Amina", lastName: "Sali", gender: "Female", children: 1 },
  { firstName: "Georges", lastName: "Mbarga", gender: "Male", children: 2 },
  { firstName: "Solange", lastName: "Ndongo", gender: "Female", children: 2 },
];

const STUDENT_FIRST_NAMES_M = [
  "Daniel", "Emmanuel", "Fritz", "Gerald", "Harris", "Ivan", "Junior", "Karl",
  "Leon", "Marvin", "Nathan", "Oscar", "Pascal", "Rodrigue", "Serge", "Thierry",
  "Bertrand", "Cedric", "Didier", "Etienne",
];

const STUDENT_FIRST_NAMES_F = [
  "Amanda", "Brenda", "Carine", "Delphine", "Estelle", "Fiona", "Gaelle", "Helene",
  "Iris", "Josiane", "Kelly", "Larissa", "Mireille", "Nadege", "Ophelie", "Pauline",
  "Sandrine", "Therese", "Vanessa", "Yolande",
];

const STUDENT_LAST_NAMES = [
  "Abanda", "Belinga", "Che", "Dikongue", "Ebolo", "Fotso", "Gwanwa", "Ilunga",
  "Jemea", "Kang", "Lontsi", "Mang", "Ngu", "Omgba", "Penda", "Sadou",
];

const LESSON_DATES = [
  "2026-09-14", "2026-09-21", "2026-09-28", // September   (First Sequence)
  "2026-10-05", "2026-10-12", "2026-10-19", // October     (Second Sequence)
  "2027-01-11", "2027-01-18", "2027-01-25", // January     (Third Sequence)
  "2027-02-01", "2027-02-08", "2027-02-15", // February    (Fourth Sequence)
  "2027-04-12", "2027-04-19", "2027-04-26", // April       (Fifth Sequence)
  "2027-05-03", "2027-05-10", "2027-05-17", // May         (Sixth Sequence)
];

/* =========================================================
   DETERMINISTIC PSEUDO RANDOM
========================================================= */

let seedState = 20262027;

function rand() {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}

function randInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randInt(0, items.length - 1)];
}

/** Stable 0..1 hash of two strings — used for per student/subject ability. */
function hash01(a: string, b: string) {
  let hash = 2166136261;

  for (const character of `${a}::${b}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return ((hash >>> 0) % 100000) / 100000;
}

function clamp(value: number, min = 0, max = 20) {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
});

/* =========================================================
   MARK GENERATION
========================================================= */

/**
 * Ability profile of one student: a base level plus a per-subject affinity,
 * so a student can be excellent in Mathematics and weak in French.
 */
function studentAbility(student: {
  id: string;
  firstName: string;
  lastName: string;
  index: number;
}) {
  const roll = hash01(student.id, "ability");

  /* 8% excellent, 34% good, 30% average, 28% weak */
  let base: number;

  if (roll > 0.92) base = randInt(16, 18);
  else if (roll > 0.58) base = randInt(12, 15);
  else if (roll > 0.28) base = randInt(9, 12);
  else base = randInt(5, 9);

  return base;
}

function subjectAffinity(studentId: string, subjectCode: string) {
  const roll = hash01(studentId, subjectCode);

  /* Some students are clearly stronger or weaker in a given subject. */
  if (roll > 0.88) return 2.6;
  if (roll > 0.72) return 1.4;
  if (roll < 0.08) return -2.8;
  if (roll < 0.24) return -1.5;

  return (roll - 0.5) * 1.6;
}

type GeneratedMark = {
  ca1: number;
  ca2: number;
  exam: number;
  average: number;
  grade: string;
  remark: string;
};

/**
 * One sequence mark for one student in one subject.
 *
 * `base` is the student level, `affinity` the student's strength in that
 * subject, `termIndex` (0..2) a slow progression through the year and `rand`
 * the sequence-to-sequence variation.
 */
function generateMark(
  base: number,
  affinity: number,
  termIndex: number,
  sequenceIndexInTerm: number
): GeneratedMark {
  const progression = termIndex * 0.35;
  const drift = (rand() - 0.5) * 2.6 + (sequenceIndexInTerm === 1 ? 0.3 : 0);

  const target = clamp(base + affinity + progression + drift, 2.5, 19.5);

  const ca1 = clamp(Math.round((target + (rand() - 0.4) * 2) * 2) / 2);
  const ca2 = clamp(Math.round((target + (rand() - 0.5) * 2.4) * 2) / 2);
  const exam = clamp(Math.round((target + (rand() - 0.5) * 3) * 2) / 2);

  const average = round2((ca1 + ca2 + exam) / 3);

  return {
    ca1,
    ca2,
    exam,
    average,
    grade: gradeOf(average),
    remark: remarkOf(average) ?? "",
  };
}

/* =========================================================
   MAIN
========================================================= */

async function main() {
  console.log(`\n=== Form 2 / Form 3 dataset — Academic Year ${YEAR_NAME} ===\n`);

  /* ---------- 1. academic year, terms, sequences ---------- */

  const academicYear = await prisma.academicYear.upsert({
    where: { name: YEAR_NAME },
    update: {},
    create: {
      name: YEAR_NAME,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
    },
  });

  await prisma.academicYear.updateMany({
    where: { id: { not: academicYear.id } },
    data: { isActive: false },
  });

  await prisma.academicYear.update({
    where: { id: academicYear.id },
    data: { isActive: true },
  });

  const termTemplates = [
    {
      name: "First Term",
      order: 1,
      sequences: [
        { name: "First Sequence", order: 1 },
        { name: "Second Sequence", order: 2 },
      ],
    },
    {
      name: "Second Term",
      order: 2,
      sequences: [
        { name: "Third Sequence", order: 1 },
        { name: "Fourth Sequence", order: 2 },
      ],
    },
    {
      name: "Third Term",
      order: 3,
      sequences: [
        { name: "Fifth Sequence", order: 1 },
        { name: "Sixth Sequence", order: 2 },
      ],
    },
  ];

  const terms: {
    id: string;
    name: string;
    order: number;
    sequences: { id: string; name: string; order: number }[];
  }[] = [];

  for (const template of termTemplates) {
    let term = await prisma.term.findFirst({
      where: { name: template.name, academicYearId: academicYear.id },
    });

    if (!term) {
      term = await prisma.term.create({
        data: {
          name: template.name,
          order: template.order,
          academicYearId: academicYear.id,
        },
      });

      console.log(`+ term ${template.name}`);
    }

    const sequences: { id: string; name: string; order: number }[] = [];

    for (const sequenceTemplate of template.sequences) {
      let sequence = await prisma.sequence.findFirst({
        where: { termId: term.id, order: sequenceTemplate.order },
      });

      if (!sequence) {
        sequence = await prisma.sequence.create({
          data: {
            name: sequenceTemplate.name,
            order: sequenceTemplate.order,
            termId: term.id,
          },
        });

        console.log(`  + sequence ${sequenceTemplate.name}`);
      }

      sequences.push({
        id: sequence.id,
        name: sequence.name,
        order: sequence.order,
      });
    }

    terms.push({
      id: term.id,
      name: term.name,
      order: term.order,
      sequences,
    });
  }

  await prisma.term.updateMany({
    where: { academicYearId: { not: academicYear.id } },
    data: { isCurrent: false },
  });

  const firstTerm = terms[0];

  await prisma.term.update({
    where: { id: firstTerm.id },
    data: { isCurrent: true },
  });

  /* ---------- 2. section + classes ---------- */

  const section = await prisma.section.upsert({
    where: { name: SectionType.ANGLOPHONE },
    update: {},
    create: { name: SectionType.ANGLOPHONE },
  });

  const classrooms: {
    id: string;
    name: string;
    students: { id: string; firstName: string; lastName: string }[];
  }[] = [];

  for (const target of TARGET_CLASSES) {
    const allInYear = await prisma.classroom.findMany({
      where: { academicYearId: academicYear.id },
      orderBy: { name: "asc" },
    });

    /* reuse an existing "Form 2"/"Form 2A"/... class of the year, so running
       this script against a real database never creates a duplicate stream */
    let classroom =
      allInYear.find((entry) => target.pattern.test(entry.name)) ?? null;

    if (!classroom) {
      classroom = await prisma.classroom.create({
        data: {
          name: target.name,
          sectionId: section.id,
          academicYearId: academicYear.id,
        },
      });

      console.log(`+ class ${target.name} (${YEAR_NAME})`);
    } else {
      console.log(`  class ${classroom.name} (${YEAR_NAME}) already exists`);
    }

    const students = await prisma.student.findMany({
      where: { classroomId: classroom.id },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    classrooms.push({ id: classroom.id, name: classroom.name, students });
  }

  /* ---------- 3. subjects ---------- */

  const subjects: {
    id: string;
    name: string;
    code: string;
    coefficient: number;
  }[] = [];

  for (const subject of SUBJECTS) {
    const record = await prisma.subject.upsert({
      where: { code: subject.code },
      update: {},
      create: subject,
    });

    subjects.push({
      id: record.id,
      name: record.name,
      code: record.code,
      coefficient: record.coefficient,
    });
  }

  /* ---------- 4. teachers + assignments ---------- */

  const assignmentByClassSubject = new Map<
    string,
    { teacherId: string; teacherName: string }
  >();

  for (const classroom of classrooms) {
    for (const subject of subjects) {
      const existing = await prisma.teacherAssignment.findFirst({
        where: { classroomId: classroom.id, subjectId: subject.id },
        include: { teacher: { select: { id: true, fullName: true } } },
      });

      if (existing) {
        assignmentByClassSubject.set(`${classroom.id}:${subject.id}`, {
          teacherId: existing.teacher.id,
          teacherName: existing.teacher.fullName,
        });

        continue;
      }

      /* reuse a teacher who already teaches this subject anywhere, so the
         script never creates a duplicate member of staff */
      const sameSubject = await prisma.teacherAssignment.findFirst({
        where: { subjectId: subject.id },
        include: { teacher: { select: { id: true, fullName: true } } },
      });

      let teacherId = sameSubject?.teacher.id ?? null;
      let teacherName = sameSubject?.teacher.fullName ?? null;

      if (!teacherId) {
        const template =
          TEACHERS.find((entry) => entry.code === subject.code) ?? TEACHERS[0];

        const loginCode = `TCH${subject.code.toUpperCase()}`;

        const existingUser = await prisma.user.findFirst({
          where: { loginCode },
        });

        if (existingUser?.id) {
          const teacher = await prisma.teacher.findUnique({
            where: { userId: existingUser.id },
            select: { id: true, fullName: true },
          });

          teacherId = teacher?.id ?? null;
          teacherName = teacher?.fullName ?? null;
        }

        if (!teacherId) {
          const user = await prisma.user.create({
            data: {
              firstName: template.firstName,
              lastName: template.lastName,
              email: `${subject.code.toLowerCase()}.teacher@gradeflow.com`,
              loginCode,
              role: Role.TEACHER,
              status: AccountStatus.ACTIVE,
              teacher: {
                create: {
                  firstName: template.firstName,
                  lastName: template.lastName,
                  fullName: `${template.firstName} ${template.lastName}`,
                  email: `${subject.code.toLowerCase()}.teacher@gradeflow.com`,
                  phone: "+237 6 00 00 00 0" + randInt(0, 9),
                  gender: template.gender,
                  teacherId: `T-${subject.code.toUpperCase()}-01`,
                  loginCode,
                },
              },
            },
            include: { teacher: { select: { id: true, fullName: true } } },
          });

          teacherId = user.teacher?.id ?? null;
          teacherName = user.teacher?.fullName ?? null;

          console.log(
            `+ teacher ${teacherName} (${loginCode}) for ${subject.name}`
          );
        }
      }

      if (!teacherId) continue;

      await prisma.teacherAssignment.create({
        data: {
          teacherId,
          sectionId: section.id,
          classroomId: classroom.id,
          subjectId: subject.id,
        },
      });

      assignmentByClassSubject.set(`${classroom.id}:${subject.id}`, {
        teacherId,
        teacherName: teacherName ?? "",
      });
    }
  }

  console.log(
    `  ${assignmentByClassSubject.size} class/subject assignments in place`
  );

  /* ---------- 5. parents ---------- */

  const parentRecords: { id: string; fullName: string; slots: number }[] = [];

  for (let index = 0; index < PARENTS.length; index += 1) {
    const parent = PARENTS[index];
    const loginCode = `PAR${String(index + 1).padStart(3, "0")}`;

    const existing = await prisma.parent.findFirst({
      where: { user: { loginCode } },
      select: { id: true, fullName: true },
    });

    if (existing) {
      parentRecords.push({
        id: existing.id,
        fullName: existing.fullName,
        slots: parent.children,
      });

      continue;
    }

    const created = await prisma.user.create({
      data: {
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: `parent${index + 1}@gradeflow.com`,
        loginCode,
        role: Role.PARENT,
        status: AccountStatus.ACTIVE,
        parent: {
          create: {
            fullName: `${parent.firstName} ${parent.lastName}`,
            lastName: parent.lastName,
            parentId: `P-${String(index + 1).padStart(3, "0")}`,
            email: `parent${index + 1}@gradeflow.com`,
            phone: "+237 6 7" + randInt(10, 99) + " " + randInt(100, 999) + " " + randInt(100, 999),
            gender: parent.gender,
          },
        },
      },
      include: { parent: { select: { id: true, fullName: true } } },
    });

    if (created.parent) {
      parentRecords.push({
        id: created.parent.id,
        fullName: created.parent.fullName,
        slots: parent.children,
      });
    }
  }

  console.log(`  ${parentRecords.length} parents available`);

  /* parent assignment: the first parents get several children (multi-child
     families), the rest one each */
  const parentQueue: string[] = [];

  for (const parent of parentRecords) {
    for (let slot = 0; slot < parent.slots; slot += 1) {
      parentQueue.push(parent.id);
    }
  }

  let parentCursor = 0;

  function nextParentId() {
    const parentId = parentQueue[parentCursor % parentQueue.length];
    parentCursor += 1;
    return parentId;
  }

  /* ---------- 6. students ---------- */

  let createdStudents = 0;
  let linkedParents = 0;

  for (const classroom of classrooms) {
    const existing = await prisma.student.findMany({
      where: { classroomId: classroom.id },
      select: { id: true, firstName: true, lastName: true, parentId: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    /* every student must have a parent */
    for (const student of existing) {
      if (student.parentId) continue;

      await prisma.student.update({
        where: { id: student.id },
        data: { parentId: nextParentId() },
      });

      linkedParents += 1;
    }

    const current = await prisma.student.count({
      where: { classroomId: classroom.id },
    });

    const missing = Math.max(0, STUDENTS_PER_CLASS - current);

    for (let index = 0; index < missing; index += 1) {
      const gender = rand() > 0.5 ? Gender.MALE : Gender.FEMALE;

      const firstName =
        gender === Gender.MALE
          ? pick(STUDENT_FIRST_NAMES_M)
          : pick(STUDENT_FIRST_NAMES_F);

      const lastName = pick(STUDENT_LAST_NAMES);

      const matricule = `GF-26-${classroom.name.replace(/\s+/g, "").toUpperCase()}-${String(
        current + index + 1
      ).padStart(3, "0")}`;

      const existingMatricule = await prisma.student.findUnique({
        where: { matricule },
        select: { id: true },
      });

      if (existingMatricule) continue;

      const year = 2026 - randInt(12, 14);

      await prisma.student.create({
        data: {
          matricule,
          firstName,
          lastName,
          gender,
          dateOfBirth: new Date(
            `${year}-${String(randInt(1, 12)).padStart(2, "0")}-${String(
              randInt(1, 28)
            ).padStart(2, "0")}`
          ),
          status: AccountStatus.ACTIVE,
          classroomId: classroom.id,
          parentId: nextParentId(),
        },
      });

      createdStudents += 1;
    }
  }

  console.log(
    `  students created: ${createdStudents}, parent links completed: ${linkedParents}`
  );

  /* ---------- 7. marks ---------- */

  const allStudents = await prisma.student.findMany({
    where: { classroomId: { in: classrooms.map((classroom) => classroom.id) } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      classroomId: true,
      status: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  let marksCreated = 0;
  let marksUpdated = 0;

  for (const student of allStudents) {
    const base = studentAbility({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      index: 0,
    });

    for (const subject of subjects) {
      const assignment = assignmentByClassSubject.get(
        `${student.classroomId}:${subject.id}`
      );

      if (!assignment) continue;

      const affinity = subjectAffinity(student.id, subject.code);

      for (let termIndex = 0; termIndex < terms.length; termIndex += 1) {
        const term = terms[termIndex];

        for (
          let sequenceIndex = 0;
          sequenceIndex < term.sequences.length;
          sequenceIndex += 1
        ) {
          const sequence = term.sequences[sequenceIndex];

          const generated = generateMark(
            base,
            affinity,
            termIndex,
            sequenceIndex
          );

          const existing = await prisma.mark.findUnique({
            where: {
              studentId_subjectId_sequenceId: {
                studentId: student.id,
                subjectId: subject.id,
                sequenceId: sequence.id,
              },
            },
            select: { id: true },
          });

          if (existing) {
            /* keep the grade/remark columns populated on older rows */
            await prisma.mark.update({
              where: { id: existing.id },
              data: { grade: generated.grade, remark: generated.remark },
            });

            marksUpdated += 1;
            continue;
          }

          await prisma.mark.create({
            data: {
              studentId: student.id,
              subjectId: subject.id,
              teacherId: assignment.teacherId,
              sequenceId: sequence.id,
              ca1: generated.ca1,
              ca2: generated.ca2,
              exam: generated.exam,
              average: generated.average,
              grade: generated.grade,
              remark: generated.remark,
            },
          });

          marksCreated += 1;
        }
      }
    }
  }

  console.log(
    `  marks created: ${marksCreated}, existing marks refreshed: ${marksUpdated}`
  );

  /* ---------- 8. attendance ---------- */

  let attendanceCreated = 0;

  for (const student of allStudents) {
    const roll = hash01(student.id, "attendance");

    /* a few students with a looser attendance record, for realistic data */
    const absenceRate = roll > 0.85 ? 0.25 : roll > 0.65 ? 0.1 : 0.04;
    const lateRate = roll > 0.7 ? 0.12 : 0.06;

    for (const subject of subjects) {
      const assignment = assignmentByClassSubject.get(
        `${student.classroomId}:${subject.id}`
      );

      if (!assignment) continue;

      const rows: {
        studentId: string;
        subjectId: string;
        teacherId: string;
        sequenceId: string;
        date: Date;
        status: AttendanceStatus;
      }[] = [];

      for (let index = 0; index < terms.length; index += 1) {
        const term = terms[index];
        const dates = LESSON_DATES.slice(index * 6, index * 6 + 6);

        for (
          let sequenceIndex = 0;
          sequenceIndex < term.sequences.length;
          sequenceIndex += 1
        ) {
          const sequence = term.sequences[sequenceIndex];
          const sequenceDates = dates.slice(
            sequenceIndex * 3,
            sequenceIndex * 3 + 3
          );

          for (const date of sequenceDates) {
            const rollStatus = rand();

            const status: AttendanceStatus =
              rollStatus < absenceRate
                ? AttendanceStatus.ABSENT
                : rollStatus < absenceRate + lateRate
                  ? AttendanceStatus.LATE
                  : rollStatus > 0.985
                    ? AttendanceStatus.EXCUSED
                    : AttendanceStatus.PRESENT;

            rows.push({
              studentId: student.id,
              subjectId: subject.id,
              teacherId: assignment.teacherId,
              sequenceId: sequence.id,
              date: new Date(`${date}T08:00:00Z`),
              status,
            });
          }
        }
      }

      const created = await prisma.attendance.createMany({
        data: rows,
        skipDuplicates: true,
      });

      attendanceCreated += created.count;
    }
  }

  console.log(`  attendance records created: ${attendanceCreated}`);

  /* ---------- 9. teacher availability (for the timetable generator) ---------- */

  const teacherIds = Array.from(
    new Set(
      Array.from(assignmentByClassSubject.values()).map(
        (assignment) => assignment.teacherId
      )
    )
  );

  let availabilityCreated = 0;

  for (const teacherId of teacherIds) {
    const existing = await prisma.teacherAvailability.count({
      where: { teacherId },
    });

    if (existing) continue;

    for (const day of [
      WeekDay.MONDAY,
      WeekDay.TUESDAY,
      WeekDay.WEDNESDAY,
      WeekDay.THURSDAY,
      WeekDay.FRIDAY,
    ]) {
      await prisma.teacherAvailability.create({
        data: {
          teacherId,
          day,
          startTime: "08:00",
          endTime: "16:00",
          status: AvailabilityStatus.APPROVED,
          note: "Submitted availability for 2026/2027.",
        },
      });

      availabilityCreated += 1;
    }
  }

  console.log(`  teacher availability slots created: ${availabilityCreated}`);

  /* ---------- 10. summary ---------- */

  const [studentsCount, marksCount, attendanceCount] = await Promise.all([
    prisma.student.count({
      where: { classroomId: { in: classrooms.map((classroom) => classroom.id) } },
    }),
    prisma.mark.count({
      where: {
        student: {
          classroomId: { in: classrooms.map((classroom) => classroom.id) },
        },
      },
    }),
    prisma.attendance.count({
      where: {
        student: {
          classroomId: { in: classrooms.map((classroom) => classroom.id) },
        },
      },
    }),
  ]);

  console.log(
    `\nDone. Form 2 / Form 3 students: ${studentsCount}, marks: ${marksCount}, attendance: ${attendanceCount}.`
  );
  console.log(
    `Run "npx tsx prisma/verify-form2-form3.ts" to verify the mark completeness.\n`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
