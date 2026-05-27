import { pgTable, text, integer, bigint } from "drizzle-orm/pg-core";

// Better Auth rate-limit storage (rateLimit storage: "database"). Field/property
// keys (id/key/count/lastRequest) must match Better Auth's model.
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key"),
  count: integer("count"),
  lastRequest: bigint("last_request", { mode: "number" }),
});
