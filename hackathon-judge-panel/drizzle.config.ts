import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts", // Path to your schema file
  out: "./drizzle",            // Where migrations will be stored
  dialect: "postgresql",       // Database type
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Neon DB URL from .env.local
  },
  verbose: true,
  strict: true,
});
