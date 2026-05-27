import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";
import { sendEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // requireEmailVerification stays OFF until a real email provider is wired
    // (RESEND_API_KEY), so signups keep working without one. Flip on for prod.
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your whatstodo password",
        html: `<p>Reset your password:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your whatstodo email",
        html: `<p>Verify your email:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  // Built-in rate limiting (in-memory). For multi-instance serverless, move to
  // database/secondary storage later. Stricter limits on credential endpoints.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 5 },
      "/forget-password": { window: 60, max: 5 },
    },
  },
  // nextCookies() must be last: lets Server Actions persist auth cookies.
  plugins: [nextCookies()],
});
