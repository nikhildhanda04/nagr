import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { telegramLink, type TelegramLink } from "@/db/schema";
import type { TgUser } from "./api";

export async function getLink(userId: string): Promise<TelegramLink | undefined> {
  const [row] = await db
    .select()
    .from(telegramLink)
    .where(eq(telegramLink.userId, userId))
    .limit(1);
  return row;
}

/** (Re)generate a one-time link token, resetting any existing link to pending. */
export async function createLinkToken(userId: string): Promise<string> {
  const token = randomBytes(16).toString("hex");
  await db
    .insert(telegramLink)
    .values({ userId, linkToken: token, status: "pending" })
    .onConflictDoUpdate({
      target: telegramLink.userId,
      set: {
        linkToken: token,
        status: "pending",
        chatId: null,
        telegramUserId: null,
        username: null,
        linkedAt: null,
        updatedAt: new Date(),
      },
    });
  return token;
}

/** Consume a token from `/start <token>` and bind the chat to the user. */
export async function completeLink(
  token: string,
  chatId: string,
  tgUser?: TgUser,
): Promise<TelegramLink | null> {
  const [pending] = await db
    .select()
    .from(telegramLink)
    .where(eq(telegramLink.linkToken, token))
    .limit(1);
  if (!pending) return null;

  const [updated] = await db
    .update(telegramLink)
    .set({
      chatId,
      telegramUserId: tgUser ? String(tgUser.id) : null,
      username: tgUser?.username ?? null,
      status: "linked",
      linkToken: null,
      linkedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(telegramLink.userId, pending.userId))
    .returning();
  return updated ?? null;
}

export async function unlink(userId: string): Promise<void> {
  await db.delete(telegramLink).where(eq(telegramLink.userId, userId));
}
