import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { user, session, account, verification, rateLimit } from "@/db/schema";

// Register Google only when credentials exist, so the app still boots without
// them (no provider configured yet) instead of crashing every auth route.
const hasGoogle =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification, rateLimit },
  }),
  socialProviders: hasGoogle
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          // Calendar read access (+ a refresh token via offline/consent).
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
          ],
          accessType: "offline",
          prompt: "consent",
        },
      }
    : {},
  // Durable rate limiting in Postgres (survives serverless instance churn).
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 100,
  },
  // nextCookies() must be last: lets Server Actions persist auth cookies.
  plugins: [nextCookies()],
});
