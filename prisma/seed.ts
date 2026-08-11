import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@gradeflow.com";
  const password = "Admin@12345";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: {
      email,
    },

    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },

    create: {
      firstName: "School",
      lastName: "Administrator",
      email,
      passwordHash,

      // Admin does not use a login code,
      // but the field currently exists in our schema.
      loginCode: "ADMIN",

      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("Admin account created:");
  console.log("Email:", admin.email);
  console.log("Password:", password);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });