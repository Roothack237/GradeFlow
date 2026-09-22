// This file configures Prisma CLI.

import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local first
dotenv.config({
  path: ".env.local",
});

// Also load .env if it exists
dotenv.config({
  path: ".env",
});

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
