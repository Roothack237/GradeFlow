// This file configures Prisma CLI.

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

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

  experimental: {
    adapter: true,
  },

  engine: "js",
  adapter: async () => new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
});
