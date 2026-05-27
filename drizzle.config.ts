import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit CLI doesn't auto-load .env (Next does for the app).
config();

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
