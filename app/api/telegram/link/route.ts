import { NextResponse } from "next/server";
import { getApiUser, unauthorized, route } from "@/lib/http";
import { getLink, createLinkToken, unlink } from "@/lib/telegram/link";
import { getBotUsername } from "@/lib/telegram/service";

export const GET = route(async () => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const link = await getLink(user.id);
  return NextResponse.json({
    status: link?.status ?? "unlinked",
    linked: link?.status === "linked",
    chatId: link?.chatId ?? null,
    username: link?.username ?? null,
  });
});

export const POST = route(async () => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const token = await createLinkToken(user.id);
  const botUsername = await getBotUsername();
  return NextResponse.json({
    deepLink: `https://t.me/${botUsername}?start=${token}`,
    botUsername,
  });
});

export const DELETE = route(async () => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  await unlink(user.id);
  return NextResponse.json({ ok: true });
});
