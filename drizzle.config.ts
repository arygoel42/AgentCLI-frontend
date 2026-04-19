import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Use direct URL (port 5432) for migrations only
    url: process.env.DATABASE_DIRECT_URL!,
  },
})
