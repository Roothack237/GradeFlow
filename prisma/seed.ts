import prisma from "../lib/prisma";

async function main() {
  console.log("🌱 Starting seed...");

  // =========================================================
  // 1. FIND ACADEMIC YEAR
  // =========================================================

  const academicYear = await prisma.academicYear.findUnique({
    where: {
      name: "2026/2027",
    },
  });

  if (!academicYear) {
    throw new Error(
      "Academic year 2026/2027 does not exist in the database."
    );
  }

  console.log(`✅ Academic year found: ${academicYear.name}`);

  // =========================================================
  // 2. CREATE TERMS
  // =========================================================

  const terms = [
    {
      name: "FIRST_TERM",
      order: 1,
      isCurrent: true,
    },
    {
      name: "SECOND_TERM",
      order: 2,
      isCurrent: false,
    },
    {
      name: "THIRD_TERM",
      order: 3,
      isCurrent: false,
    },
  ];

  for (const termData of terms) {
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
          isCurrent: termData.isCurrent,
          academicYearId: academicYear.id,
        },
      });

      console.log(`✅ Created term: ${term.name}`);
    } else {
      console.log(`ℹ️ Term already exists: ${term.name}`);
    }

    // =======================================================
    // 3. CREATE SEQUENCE FOR THE TERM
    // =======================================================

    const existingSequence = await prisma.sequence.findFirst({
      where: {
        termId: term.id,
      },
    });

    if (!existingSequence) {
      const sequence = await prisma.sequence.create({
        data: {
          name: "Sequence 1",
          order: 1,
          termId: term.id,
        },
      });

      console.log(
        `✅ Created ${sequence.name} for ${term.name}`
      );
    } else {
      console.log(
        `ℹ️ Sequence already exists for ${term.name}: ${existingSequence.name}`
      );
    }
  }

  console.log("========================================");
  console.log("🎉 Seed completed successfully!");
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });