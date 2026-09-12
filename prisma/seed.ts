import "dotenv/config";
import {
  PrismaClient,
  SectionType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({ adapter });

/**
 * Every academic year GradeFlow should have on record, each with the same
 * First/Second/Third Term x 2-sequence structure (First..Sixth Sequence).
 *
 * IMPORTANT: this seed is purely additive. It only upserts/creates rows
 * that don't already exist — it never deletes or resets existing academic
 * data (see project rule: never touch 2025/2026 data, never migrate reset).
 */
const ACADEMIC_YEARS = [
  {
    name: "2025/2026",
    startDate: "2025-09-01",
    endDate: "2026-06-30",
  },
  {
    name: "2026/2027",
    startDate: "2026-09-01",
    endDate: "2027-06-30",
  },
];

const TERM_TEMPLATE = [
  { name: "First Term", order: 1 },
  { name: "Second Term", order: 2 },
  { name: "Third Term", order: 3 },
];

const SEQUENCE_TEMPLATE: Record<string, { name: string; order: number }[]> = {
  "First Term": [
    { name: "First Sequence", order: 1 },
    { name: "Second Sequence", order: 2 },
  ],
  "Second Term": [
    { name: "Third Sequence", order: 1 },
    { name: "Fourth Sequence", order: 2 },
  ],
  "Third Term": [
    { name: "Fifth Sequence", order: 1 },
    { name: "Sixth Sequence", order: 2 },
  ],
};

async function seedAcademicYear(yearData: {
  name: string;
  startDate: string;
  endDate: string;
}) {
  const academicYear = await prisma.academicYear.upsert({
    where: {
      name: yearData.name,
    },
    update: {},
    create: {
      name: yearData.name,
      startDate: new Date(yearData.startDate),
      endDate: new Date(yearData.endDate),
    },
  });

  console.log(
    `Academic year created/found: ${academicYear.name} (${academicYear.id})`
  );

  for (const termData of TERM_TEMPLATE) {
    let term = await prisma.term.findFirst({
      where: {
        name: termData.name,
        academicYearId: academicYear.id,
      },
    });

    if (!term) {
      term = await prisma.term.create({
        data: {
          name: termData.name,
          order: termData.order,
          academicYearId: academicYear.id,
        },
      });

      console.log(`  ${termData.name} created: ${term.id}`);
    } else {
      console.log(`  ${termData.name} already exists: ${term.id}`);
    }

    for (const sequenceData of SEQUENCE_TEMPLATE[termData.name]) {
      const existingSequence = await prisma.sequence.findFirst({
        where: {
          termId: term.id,
          order: sequenceData.order,
        },
      });

      if (existingSequence) {
        console.log(`    ${sequenceData.name} already exists.`);
        continue;
      }

      await prisma.sequence.create({
        data: {
          name: sequenceData.name,
          order: sequenceData.order,
          termId: term.id,
        },
      });

      console.log(`    ${sequenceData.name} created successfully.`);
    }
  }

  return academicYear;
}

async function main() {
  // --------------------------------------------------
  // 1. Create sections (global, shared by every year)
  // --------------------------------------------------

  await prisma.section.upsert({
    where: {
      name: SectionType.ANGLOPHONE,
    },
    update: {},
    create: {
      name: SectionType.ANGLOPHONE,
    },
  });

  await prisma.section.upsert({
    where: {
      name: SectionType.FRANCOPHONE,
    },
    update: {},
    create: {
      name: SectionType.FRANCOPHONE,
    },
  });

  console.log("Sections created successfully.");

  // --------------------------------------------------
  // 2. Create every academic year + its terms/sequences
  // --------------------------------------------------

  const createdYears = [];

  for (const yearData of ACADEMIC_YEARS) {
    const year = await seedAcademicYear(yearData);
    createdYears.push(year);
  }

  // --------------------------------------------------
  // 3. Make sure exactly one academic year is marked active.
  //    Never override an existing active year — only set one
  //    if none is currently active (first run / fresh DB).
  // --------------------------------------------------

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  });

  if (!activeYear) {
    const defaultActive = createdYears.find(
      (year) => year.name === "2025/2026"
    );

    if (defaultActive) {
      await prisma.academicYear.update({
        where: { id: defaultActive.id },
        data: { isActive: true },
      });

      console.log(`Marked ${defaultActive.name} as the active academic year.`);
    }
  } else {
    console.log(`Active academic year already set: ${activeYear.name}`);
  }

  console.log(
    "Academic years, terms, and sequences created successfully."
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
