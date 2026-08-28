import { PrismaClient, SectionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });