import { and, eq, or, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { friendship, user } from "@/db/schema";

export type FriendEntry = {
  friendshipId: string;
  id: string;
  name: string;
  email: string;
};

type UserLite = { id: string; name: string; email: string };

async function usersByIds(ids: string[]): Promise<Map<string, UserLite>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(inArray(user.id, ids));
  return new Map(rows.map((r) => [r.id, r]));
}

export async function listFriends(userId: string): Promise<FriendEntry[]> {
  const rows = await db
    .select()
    .from(friendship)
    .where(
      and(
        eq(friendship.status, "accepted"),
        or(eq(friendship.requesterId, userId), eq(friendship.addresseeId, userId)),
      ),
    );
  const otherId = (r: (typeof rows)[number]) =>
    r.requesterId === userId ? r.addresseeId : r.requesterId;
  const map = await usersByIds(rows.map(otherId));
  return rows.flatMap((r) => {
    const u = map.get(otherId(r));
    return u ? [{ friendshipId: r.id, ...u }] : [];
  });
}

export async function listIncoming(userId: string): Promise<FriendEntry[]> {
  const rows = await db
    .select()
    .from(friendship)
    .where(
      and(eq(friendship.status, "pending"), eq(friendship.addresseeId, userId)),
    );
  const map = await usersByIds(rows.map((r) => r.requesterId));
  return rows.flatMap((r) => {
    const u = map.get(r.requesterId);
    return u ? [{ friendshipId: r.id, ...u }] : [];
  });
}

export async function listOutgoing(userId: string): Promise<FriendEntry[]> {
  const rows = await db
    .select()
    .from(friendship)
    .where(
      and(eq(friendship.status, "pending"), eq(friendship.requesterId, userId)),
    );
  const map = await usersByIds(rows.map((r) => r.addresseeId));
  return rows.flatMap((r) => {
    const u = map.get(r.addresseeId);
    return u ? [{ friendshipId: r.id, ...u }] : [];
  });
}

/** Accepted friends' user ids (either direction). */
export async function friendIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({
      requesterId: friendship.requesterId,
      addresseeId: friendship.addresseeId,
    })
    .from(friendship)
    .where(
      and(
        eq(friendship.status, "accepted"),
        or(eq(friendship.requesterId, userId), eq(friendship.addresseeId, userId)),
      ),
    );
  return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}

export type RequestResult =
  | "requested"
  | "accepted"
  | "already_friends"
  | "already_pending"
  | "self"
  | "not_found";

export async function sendRequest(
  userId: string,
  email: string,
): Promise<RequestResult> {
  // Case-insensitive match regardless of how the email was stored.
  const [target] = await db
    .select({ id: user.id })
    .from(user)
    .where(sql`lower(${user.email}) = ${email.trim().toLowerCase()}`)
    .limit(1);
  if (!target) return "not_found";
  if (target.id === userId) return "self";

  const [existing] = await db
    .select()
    .from(friendship)
    .where(
      or(
        and(
          eq(friendship.requesterId, userId),
          eq(friendship.addresseeId, target.id),
        ),
        and(
          eq(friendship.requesterId, target.id),
          eq(friendship.addresseeId, userId),
        ),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.status === "accepted") return "already_friends";
    // Pending: if they already requested me, treat this as an accept.
    if (existing.addresseeId === userId) {
      await db
        .update(friendship)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(eq(friendship.id, existing.id));
      return "accepted";
    }
    return "already_pending";
  }

  await db
    .insert(friendship)
    .values({ requesterId: userId, addresseeId: target.id, status: "pending" });
  return "requested";
}

export async function acceptRequest(
  userId: string,
  friendshipId: string,
): Promise<boolean> {
  const res = await db
    .update(friendship)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(
      and(
        eq(friendship.id, friendshipId),
        eq(friendship.addresseeId, userId),
        eq(friendship.status, "pending"),
      ),
    )
    .returning({ id: friendship.id });
  return res.length > 0;
}

/** Remove a friend, decline an incoming request, or cancel an outgoing one. */
export async function removeFriend(
  userId: string,
  friendshipId: string,
): Promise<boolean> {
  const res = await db
    .delete(friendship)
    .where(
      and(
        eq(friendship.id, friendshipId),
        or(
          eq(friendship.requesterId, userId),
          eq(friendship.addresseeId, userId),
        ),
      ),
    )
    .returning({ id: friendship.id });
  return res.length > 0;
}
