import {
  PrismaClient,
  SectionType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // --------------------------------------------------
  // 1. Create sections
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
  // 2. Create Academic Year
  // --------------------------------------------------

  const academicYear = await prisma.academicYear.upsert({
    where: {
      name: "2025/2026",
    },
    update: {},
    create: {
      name: "2025/2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
    },
  });

  console.log(
    `Academic year created/found: ${academicYear.name}`
  );

  // --------------------------------------------------
  // 3. Create Terms
  // --------------------------------------------------

  const terms = [
    {
      name: "First Term",
      order: 1,
    },
    {
      name: "Second Term",
      order: 2,
    },
    {
      name: "Third Term",
      order: 3,
    },
  ];

  for (const termData of terms) {
    const term = await prisma.term.upsert({
      where: {
        // Term doesn't have a unique compound key,
        // so we find it below instead.
        id: `seed-${termData.order}`,
      },
      update: {},
      create: {
        name: termData.name,
        order: termData.order,
        academicYearId: academicYear.id,
      },
    }).catch(async () => {
      const existing = await prisma.term.findFirst({
        where: {
          name: termData.name,
          academicYearId: academicYear.id,
        },
      });

      if (existing) {
        return existing;
      }

      return prisma.term.create({
        data: {
          name: termData.name,
          order: termData.order,
          academicYearId: academicYear.id,
        },
      });
    });

    console.log(
      `${termData.name}: ${term.id}`
    );
  }

  // --------------------------------------------------
  // 4. Create Sequences
  // --------------------------------------------------

  const sequenceData = [
    {
      termName: "First Term",
      sequences: [
        {
          name: "First Sequence",
          order: 1,
        },
        {
          name: "Second Sequence",
          order: 2,
        },
      ],
    },
    {
      termName: "Second Term",
      sequences: [
        {
          name: "Third Sequence",
          order: 1,
        },
        {
          name: "Fourth Sequence",
          order: 2,
        },
      ],
    },
    {
      termName: "Third Term",
      sequences: [
        {
          name: "Fifth Sequence",
          order: 1,
        },
        {
          name: "Sixth Sequence",
          order: 2,
        },
      ],
    },
  ];

  for (const termData of sequenceData) {
    const term = await prisma.term.findFirst({
      where: {
        name: termData.termName,
        academicYearId: academicYear.id,
      },
    });

    if (!term) {
      throw new Error(
        `Term not found: ${termData.termName}`
      );
    }

    for (const sequenceDataItem of termData.sequences) {
      const existingSequence =
        await prisma.sequence.findFirst({
          where: {
            termId: term.id,
            order: sequenceDataItem.order,
          },
        });

      if (existingSequence) {
        console.log(
          `${sequenceDataItem.name} already exists.`
        );
        continue;
      }

      await prisma.sequence.create({
        data: {
          name: sequenceDataItem.name,
          order: sequenceDataItem.order,
          termId: term.id,
        },
      });

      console.log(
        `${sequenceDataItem.name} created successfully.`
      );
    }
  }

  console.log(
    "Academic year, terms, and sequences created successfully."
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