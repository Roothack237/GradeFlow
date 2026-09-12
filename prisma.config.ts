// This file configures Prisma CLI.

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

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
    url: process.env.DATABASE_URL ?? "",
  },
});