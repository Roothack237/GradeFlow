import "dotenv/config";
import bcrypt from "bcrypt";
import {
  AccountStatus,
  AttendanceStatus,
  AvailabilityStatus,
  Gender,
  PrismaClient,
  PublicationStatus,
  Role,
  SectionType,
  WeekDay,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({ adapter });

/**
 * Development/demo dataset for GradeFlow.
 *
 * Idempotent: when the demo admin account already exists the seed exits
 * immediately, so it never duplicates or resets data. The production seed
 * (prisma/seed.ts) remains the only script that runs automatically.
 *
 * Demo credentials (DEV/TEST ONLY — change or remove before production):
 *   Admin   admin@gradeflow.com  / admin123
 *   Teacher teacher1@gradeflow.com  / login code TCH001
 *   Parent  parent1@gradeflow.com  / login code PAR001
 */

const DEMO_ADMIN_EMAIL = "admin@gradeflow.com";

/* Deterministic pseudo-random generator so the dataset is reproducible. */
let seedState = 42;
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

const ANGLOPHONE_CLASSES = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth Arts",
  "Lower Sixth Science",
  "Upper Sixth Arts",
  "Upper Sixth Science",
];

const FRANCOPHONE_CLASSES = ["6ème", "5ème", "4ème", "3ème"];

const SUBJECTS = [
  { name: "Mathematics", code: "MATH", coefficient: 5 },
  { name: "English Language", code: "ENG", coefficient: 4 },
  { name: "French", code: "FRE", coefficient: 4 },
  { name: "Biology", code: "BIO", coefficient: 3 },
  { name: "Chemistry", code: "CHE", coefficient: 3 },
  { name: "Physics", code: "PHY", coefficient: 3 },
  { name: "History", code: "HIS", coefficient: 2 },
  { name: "Geography", code: "GEO", coefficient: 2 },
  { name: "Computer Science", code: "CSC", coefficient: 2 },
  { name: "Economics", code: "ECO", coefficient: 2 },
];

const TEACHERS = [
  { firstName: "John", lastName: "Smith", gender: "Male" },
  { firstName: "Sarah", lastName: "Johnson", gender: "Female" },
  { firstName: "Peter", lastName: "Ndifor", gender: "Male" },
  { firstName: "Mary", lastName: "Fomum", gender: "Female" },
  { firstName: "David", lastName: "Tchakounté", gender: "Male" },
  { firstName: "Grace", lastName: "Mbah", gender: "Female" },
  { firstName: "Paul", lastName: "Eyenga", gender: "Male" },
  { firstName: "Rose", lastName: "Ateba", gender: "Female" },
];

const PARENTS = [
  { firstName: "James", lastName: "Fonteh", gender: "Male" },
  { firstName: "Elizabeth", lastName: "Nkeng", gender: "Female" },
  { firstName: "Samuel", lastName: "Biya", gender: "Male" },
  { firstName: "Janet", lastName: "Ambe", gender: "Female" },
  { firstName: "Martin", lastName: "Ngo", gender: "Male" },
  { firstName: "Claire", lastName: "Tabi", gender: "Female" },
  { firstName: "Eric", lastName: "Fonda", gender: "Male" },
  { firstName: "Dora", lastName: "Che", gender: "Female" },
  { firstName: "Vincent", lastName: "Njoya", gender: "Male" },
  { firstName: "Amina", lastName: "Sali", gender: "Female" },
];

const STUDENT_FIRST_NAMES_M = [
  "Daniel", "Emmanuel", "Fritz", "Gerald", "Harris", "Ivan", "Junior", "Karl",
  "Leon", "Marvin", "Nathan", "Oscar", "Pascal", "Rodrigue", "Serge", "Thierry",
];
const STUDENT_FIRST_NAMES_F = [
  "Amanda", "Brenda", "Carine", "Delphine", "Estelle", "Fiona", "Gaëlle", "Hélène",
  "Iris", "Josiane", "Kelly", "Larissa", "Mireille", "Nadège", "Ophélie", "Pauline",
];
const STUDENT_LAST_NAMES = [
  "Abanda", "Belinga", "Che", "Dikongue", "Ebolo", "Fotso", "Gwanwa", "Heuschae",
  "Ilunga", "Jemea", "Kang", "Lontsi", "Mang", "Ngu", "Omgba", "Penda",
];

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_ADMIN_EMAIL },
    select: { id: true },
  });

  if (existing) {
    console.log("Dev seed already applied — nothing to do.");
    return;
  }

  console.log("Seeding the GradeFlow demo dataset…");

  /* ---------- 1. Active academic year + current term ---------- */

  const year = await prisma.academicYear.update({
    where: { name: "2026/2027" },
    data: { isActive: true },
    include: { terms: { orderBy: { order: "asc" } } },
  });

  await prisma.academicYear.updateMany({
    where: { id: { not: year.id } },
    data: { isActive: false },
  });

  const firstTerm = year.terms.find((term) => term.name === "First Term") ?? year.terms[0];

  await prisma.term.updateMany({
    where: { academicYearId: { not: year.id } },
    data: { isCurrent: false },
  });

  await prisma.term.update({
    where: { id: firstTerm.id },
    data: { isCurrent: true },
  });

  const sequences = await prisma.sequence.findMany({
    where: { termId: firstTerm.id },
    orderBy: { order: "asc" },
  });

  /* ---------- 2. Admin ---------- */

  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  const adminUser = await prisma.user.create({
    data: {
      firstName: "Ada",
      lastName: "Administrator",
      email: DEMO_ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      loginCode: "ADM001",
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
      administrator: {
        create: { fullName: "Ada Administrator" },
      },
    },
  });

  /* ---------- 3. Sections + classrooms ---------- */

  const anglophone = await prisma.section.findUniqueOrThrow({
    where: { name: SectionType.ANGLOPHONE },
  });
  const francophone = await prisma.section.findUniqueOrThrow({
    where: { name: SectionType.FRANCOPHONE },
  });

  const classrooms: { id: string; name: string; sectionId: string }[] = [];

  for (const name of ANGLOPHONE_CLASSES) {
    const classroom = await prisma.classroom.create({
      data: { name, sectionId: anglophone.id, academicYearId: year.id },
    });
    classrooms.push({
      id: classroom.id,
      name: classroom.name,
      sectionId: anglophone.id,
    });
  }

  for (const name of FRANCOPHONE_CLASSES) {
    const classroom = await prisma.classroom.create({
      data: { name, sectionId: francophone.id, academicYearId: year.id },
    });
    classrooms.push({
      id: classroom.id,
      name: classroom.name,
      sectionId: francophone.id,
    });
  }

  /* ---------- 4. Subjects ---------- */

  const subjects: { id: string; name: string; coefficient: number }[] = [];

  for (const subject of SUBJECTS) {
    const created = await prisma.subject.create({ data: subject });
    subjects.push({
      id: created.id,
      name: created.name,
      coefficient: created.coefficient,
    });
  }

  /* ---------- 5. Teachers ---------- */

  const teachers: { id: string; userId: string; fullName: string }[] = [];

  for (let index = 0; index < TEACHERS.length; index += 1) {
    const teacher = TEACHERS[index];
    const loginCode = `TCH${String(index + 1).padStart(3, "0")}`;

    const user = await prisma.user.create({
      data: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: `teacher${index + 1}@gradeflow.com`,
        loginCode,
        role: Role.TEACHER,
        status: AccountStatus.ACTIVE,
        teacher: {
          create: {
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            fullName: `${teacher.firstName} ${teacher.lastName}`,
            email: `teacher${index + 1}@gradeflow.com`,
            gender: teacher.gender,
            teacherId: loginCode,
            loginCode,
          },
        },
      },
      include: { teacher: true },
    });

    teachers.push({
      id: user.teacher!.id,
      userId: user.id,
      fullName: user.teacher!.fullName,
    });
  }

  /* ---------- 6. Teacher assignments (subject ↔ class ↔ teacher) ---------- */

  /* Every classroom gets every subject; teachers rotate over the grid. */
  let assignmentCursor = 0;

  for (const classroom of classrooms) {
    for (const subject of subjects) {
      const teacher = teachers[assignmentCursor % teachers.length];
      assignmentCursor += 1;

      await prisma.teacherAssignment.create({
        data: {
          teacherId: teacher.id,
          sectionId: classroom.sectionId,
          classroomId: classroom.id,
          subjectId: subject.id,
        },
      });
    }
  }

  /* ---------- 7. Parents ---------- */

  const parents: { id: string; userId: string; fullName: string }[] = [];

  for (let index = 0; index < PARENTS.length; index += 1) {
    const parent = PARENTS[index];
    const loginCode = `PAR${String(index + 1).padStart(3, "0")}`;

    const user = await prisma.user.create({
      data: {
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: `parent${index + 1}@gradeflow.com`,
        loginCode,
        role: Role.PARENT,
        status: AccountStatus.ACTIVE,
        parent: {
          create: {
            parentId: loginCode,
            fullName: `${parent.firstName} ${parent.lastName}`,
            lastName: parent.lastName,
            gender: parent.gender,
          },
        },
      },
      include: { parent: true },
    });

    parents.push({
      id: user.parent!.id,
      userId: user.id,
      fullName: user.parent!.fullName,
    });
  }

  /* ---------- 8. Students ---------- */

  let matriculeCounter = 1;
  const createdStudents: {
    id: string;
    name: string;
    classroomId: string;
    parentId: string;
  }[] = [];

  for (let classIndex = 0; classIndex < classrooms.length; classIndex += 1) {
    const classroom = classrooms[classIndex];

    /* A few classes are fully populated; the rest are lighter. */
    const size = [0, 3, 8].includes(classIndex) ? 12 : 6;

    for (let index = 0; index < size; index += 1) {
      const isMale = rand() > 0.5;
      const firstName = isMale
        ? pick(STUDENT_FIRST_NAMES_M)
        : pick(STUDENT_FIRST_NAMES_F);
      const lastName = pick(STUDENT_LAST_NAMES);

      /* First two students of the first classes are parented by parent1
         and parent2 so a parent can be shown with two children. */
      const parentIndex =
        classIndex === 0 && index < 2
          ? index
          : randInt(0, parents.length - 1);

      const parent = parents[parentIndex];

      const student = await prisma.student.create({
        data: {
          matricule: `GF2026${String(matriculeCounter).padStart(4, "0")}`,
          firstName,
          lastName,
          gender: isMale ? Gender.MALE : Gender.FEMALE,
          dateOfBirth: new Date(randInt(2005, 2013), randInt(0, 11), randInt(1, 28)),
          classroomId: classroom.id,
          parentId: parent.id,
        },
      });

      matriculeCounter += 1;

      createdStudents.push({
        id: student.id,
        name: `${firstName} ${lastName}`,
        classroomId: classroom.id,
        parentId: parent.id,
      });
    }
  }

  /* ---------- 9. Marks (both sequences of the first term) ---------- */

  /* Fully marked classes: Form 1 (0), Form 4 (3), Upper Sixth Science (8), 3ème (12). */
  const markedClassIds = new Set([
    classrooms[0].id,
    classrooms[3].id,
    classrooms[8].id,
    classrooms[12].id,
  ]);

  const markedStudents = createdStudents.filter((student) =>
    markedClassIds.has(student.classroomId)
  );

  const marksByStudent = new Map<string, number[]>();

  for (const sequence of sequences) {
    for (const student of markedStudents) {
      const marks: number[] = [];

      for (const subject of subjects) {
        /* Deterministic ability per student keeps trends realistic. */
        const ability = 8 + ((student.id.charCodeAt(2) + student.id.charCodeAt(5)) % 9);
        const mark = Math.max(2, Math.min(20, ability + randInt(-3, 3)));

        const ca1 = Math.max(0, Math.min(20, mark + randInt(-2, 2)));
        const ca2 = Math.max(0, Math.min(20, mark + randInt(-2, 2)));
        const exam = Math.max(0, Math.min(20, mark + randInt(-2, 2)));
        const average = Math.round(((ca1 + ca2 + exam) / 3) * 100) / 100;

        const assignment = await prisma.teacherAssignment.findFirst({
          where: { classroomId: student.classroomId, subjectId: subject.id },
          select: { teacherId: true },
        });

        if (!assignment) continue;

        await prisma.mark.create({
          data: {
            studentId: student.id,
            subjectId: subject.id,
            teacherId: assignment.teacherId,
            sequenceId: sequence.id,
            ca1,
            ca2,
            exam,
            average,
            remark: average >= 10 ? "Good work, keep it up." : "Needs more effort.",
          },
        });

        marks.push(average);
      }

      const existing = marksByStudent.get(student.id) ?? [];
      marksByStudent.set(student.id, [...existing, ...marks]);
    }
  }

  /* ---------- 10. Attendance ---------- */

  const attendanceClasses = [classrooms[3], classrooms[12]]; // Form 4 and 3ème
  const attendanceDates = ["2026-09-08", "2026-09-10", "2026-09-11", "2026-09-14", "2026-09-15"];

  /* Students flagged for absence alerts (5+ hours in one subject). */
  const flaggedStudents = new Set(
    markedStudents
      .filter((student) => attendanceClasses.some((c) => c.id === student.classroomId))
      .slice(0, 2)
      .map((student) => student.id)
  );

  for (const classroom of attendanceClasses) {
    const classStudents = createdStudents.filter(
      (student) => student.classroomId === classroom.id
    );

    for (const subject of subjects.slice(0, 6)) {
      const assignment = await prisma.teacherAssignment.findFirst({
        where: { classroomId: classroom.id, subjectId: subject.id },
        select: { teacherId: true },
      });

      if (!assignment) continue;

      for (const date of attendanceDates) {
        for (const student of classStudents) {
          let status: AttendanceStatus = AttendanceStatus.PRESENT;

          if (flaggedStudents.has(student.id)) {
            /* 5 hours absent in this subject across the 5 dates. */
            status = AttendanceStatus.ABSENT;
          } else if (rand() > 0.9) {
            status = AttendanceStatus.LATE;
          } else if (rand() > 0.94) {
            status = AttendanceStatus.ABSENT;
          }

          await prisma.attendance.create({
            data: {
              studentId: student.id,
              subjectId: subject.id,
              teacherId: assignment.teacherId,
              sequenceId: sequences[0].id,
              date: new Date(`${date}T00:00:00`),
              status,
            },
          });
        }
      }
    }
  }

  /* ---------- 11. Absence alert notifications (as the live system creates) ---------- */

  for (const studentId of flaggedStudents) {
    const student = createdStudents.find((entry) => entry.id === studentId)!;
    const parent = parents.find((entry) => entry.id === student.parentId)!;
    const subject = subjects[0];

    const message = `${student.name} has now been absent for 5 hours of ${subject.name}. Please follow up with the student.`;

    const recipients = [
      parent.userId,
      ...teachers.slice(0, 2).map((teacher) => teacher.userId),
      adminUser.id,
    ];

    for (const userId of recipients) {
      await prisma.notification.create({
        data: {
          userId,
          title: "Absence alert: 5+ hours missed",
          message,
          type: "ATTENDANCE_ALERT",
          relatedType: "ABSENCE_ALERT",
          relatedId: `${studentId}:${subject.id}:ABSENT`,
          actionUrl: userId === adminUser.id ? "/admin/attendance" : "/parent/attendance",
        },
      });
    }
  }

  /* ---------- 12. Submission notifications (Phase 12 examples) ---------- */

  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      title: "Marks submitted",
      message: `${teachers[0].fullName} submitted ${classrooms[3].name} Mathematics marks (First Sequence).`,
      type: "MARK_UPDATE",
      relatedType: "MARK",
      relatedId: classrooms[3].id,
      actionUrl: "/admin/results",
    },
  });

  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      title: "Attendance submitted",
      message: `${teachers[1].fullName} submitted attendance for ${classrooms[8].name}.`,
      type: "INFO",
      relatedType: "ATTENDANCE",
      relatedId: classrooms[8].id,
      actionUrl: "/admin/attendance",
    },
  });

  /* ---------- 13. Teacher availability ---------- */

  const slots = [
    { day: WeekDay.MONDAY, startTime: "08:00", endTime: "12:00" },
    { day: WeekDay.TUESDAY, startTime: "08:00", endTime: "12:00" },
    { day: WeekDay.WEDNESDAY, startTime: "10:00", endTime: "14:00" },
    { day: WeekDay.THURSDAY, startTime: "08:00", endTime: "12:00" },
    { day: WeekDay.FRIDAY, startTime: "08:00", endTime: "11:00" },
  ];

  for (const teacher of teachers) {
    for (const slot of slots) {
      await prisma.teacherAvailability.create({
        data: {
          teacherId: teacher.id,
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: AvailabilityStatus.APPROVED,
        },
      });
    }
  }

  /* ---------- 14. Timetable for Form 4 (published) + 3ème (draft) ---------- */

  const timetableClasses = [classrooms[3], classrooms[12]];
  const days = [
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
  ];
  const hours = [
    ["08:00", "09:00"],
    ["09:00", "10:00"],
    ["10:00", "11:00"],
    ["11:00", "12:00"],
  ];

  let roomCounter = 100;

  for (const classroom of timetableClasses) {
    let slotIndex = 0;

    for (const day of days) {
      for (const [startTime, endTime] of hours) {
        const subject = subjects[slotIndex % subjects.length];
        slotIndex += 1;

        const assignment = await prisma.teacherAssignment.findFirst({
          where: { classroomId: classroom.id, subjectId: subject.id },
          select: { teacherId: true },
        });

        if (!assignment) continue;

        await prisma.timetable.create({
          data: {
            classroomId: classroom.id,
            subjectId: subject.id,
            teacherId: assignment.teacherId,
            academicYearId: year.id,
            termId: firstTerm.id,
            day,
            startTime,
            endTime,
            room: `Room ${roomCounter}`,
          },
        });
      }
    }

    roomCounter += 10;

    await prisma.timetablePublication.create({
      data: {
        termId: firstTerm.id,
        classroomId: classroom.id,
        status:
          classroom.id === classrooms[3].id
            ? PublicationStatus.PUBLISHED
            : PublicationStatus.DRAFT,
        publishedById:
          classroom.id === classrooms[3].id ? adminUser.id : null,
        publishedAt:
          classroom.id === classrooms[3].id ? new Date() : null,
      },
    });
  }

  /* Notify the teachers of the published Form 4 timetable. */
  const form4Teachers = await prisma.timetable.findMany({
    where: { classroomId: classrooms[3].id },
    select: { teacherId: true },
  });

  const notifiedTeacherIds = Array.from(
    new Set(form4Teachers.map((entry) => entry.teacherId))
  );

  for (const teacher of teachers.filter((teacher) =>
    notifiedTeacherIds.includes(teacher.id)
  )) {
    await prisma.notification.create({
      data: {
        userId: teacher.userId,
        title: "Timetable published",
        message: `The ${classrooms[3].name} timetable for ${firstTerm.name} (${year.name}) has been published.`,
        type: "ANNOUNCEMENT",
        relatedType: "TIMETABLE_PUBLICATION",
        relatedId: classrooms[3].id,
        actionUrl: "/teacher/timetable",
      },
    });
  }

  /* ---------- 15. Report cards for the first term ---------- */

  for (const classroom of [
    classrooms[0],
    classrooms[3],
    classrooms[8],
    classrooms[12],
  ]) {
    const classStudents = createdStudents.filter(
      (student) => student.classroomId === classroom.id
    );

    const ranked = classStudents
      .map((student) => ({
        id: student.id,
        marks: marksByStudent.get(student.id) ?? [],
      }))
      .filter((student) => student.marks.length > 0)
      .map((student) => ({
        id: student.id,
        average:
          student.marks.reduce((total, mark) => total + mark, 0) /
          student.marks.length,
      }))
      .sort((a, b) => b.average - a.average);

    for (let index = 0; index < ranked.length; index += 1) {
      const entry = ranked[index];

      await prisma.reportCard.create({
        data: {
          studentId: entry.id,
          termId: firstTerm.id,
          average: Math.round(entry.average * 100) / 100,
          rank: index + 1,
          decision: entry.average >= 10 ? "PROMOTED" : "REPEAT",
          principalRemark: "Term results generated from recorded marks.",
        },
      });
    }

    /* Publish the results of Form 4 so parents can see them. */
    if (classroom.id === classrooms[3].id) {
      await prisma.resultPublication.create({
        data: {
          termId: firstTerm.id,
          classroomId: classroom.id,
          status: PublicationStatus.PUBLISHED,
          publishedById: adminUser.id,
          publishedAt: new Date(),
        },
      });
    }
  }

  /* ---------- 16. Forum categories + demo posts ---------- */

  const forumCategories = [
    {
      name: "Anglophone General Forum",
      slug: "anglophone-general",
      description: "School-wide discussions for the Anglophone section community.",
      scope: "ALL" as const,
      order: 1,
    },
    {
      name: "Francophone General Forum",
      slug: "francophone-general",
      description: "Discussions générales pour la communauté de la section francophone.",
      scope: "ALL" as const,
      order: 2,
    },
    {
      name: "Anglophone Staff Forum",
      slug: "anglophone-staff",
      description: "Private staff discussions for the Anglophone section.",
      scope: "STAFF" as const,
      order: 3,
    },
    {
      name: "Francophone Staff Forum",
      slug: "francophone-staff",
      description: "Espace privé du personnel de la section francophone.",
      scope: "STAFF" as const,
      order: 4,
    },
  ];

  const categories: { id: string; slug: string }[] = [];

  for (const category of forumCategories) {
    const created = await prisma.forumCategory.create({ data: category });
    categories.push({ id: created.id, slug: created.slug });
  }

  const general = categories[0];

  const posts = [
    {
      title: "Welcome to the new school year 2026/2027",
      body: "Welcome everyone! Sequences start next week. Please check the timetable and make sure every mark is recorded on time.",
      author: adminUser.id,
    },
    {
      title: "How can I support my child in Mathematics?",
      body: "My child struggles with Mathematics in Form 4. What can we do at home to help before the next sequence?",
      author: parents[0].userId,
    },
    {
      title: "Parent-teacher meeting — save the date",
      body: "The first parent-teacher meeting of the year will be announced soon. Stay tuned for the exact date.",
      author: teachers[0].userId,
    },
  ];

  for (const post of posts) {
    const created = await prisma.forumPost.create({
      data: {
        categoryId: general.id,
        authorId: post.author,
        title: post.title,
        body: post.body,
      },
    });

    await prisma.forumComment.create({
      data: {
        postId: created.id,
        authorId: teachers[1].userId,
        body: "Thank you for sharing this with us!",
      },
    });
  }

  console.log("Demo dataset created:");
  console.log(`  Admin:    ${DEMO_ADMIN_EMAIL} / admin123`);
  console.log(`  Teacher:  teacher1@gradeflow.com / TCH001`);
  console.log(`  Parent:   parent1@gradeflow.com / PAR001`);
  console.log(`  ${classrooms.length} classes, ${createdStudents.length} students, ${teachers.length} teachers, ${parents.length} parents`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
