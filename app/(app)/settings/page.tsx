import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/dal";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { getLink } from "@/lib/telegram/link";
import { TelegramConnect } from "@/components/app/telegram-connect";
import { SettingsForm } from "@/components/app/settings-form";
import { CalendarSync } from "@/components/app/calendar-sync";
import { DeleteAccount } from "@/components/app/delete-account";
import { Mono } from "@/components/ui/card";

export default async function SettingsPage() {
  const user = await requireUser();
  const [settings] = await db
    .select({
      timezone: userTable.timezone,
      quietHoursStart: userTable.quietHoursStart,
      quietHoursEnd: userTable.quietHoursEnd,
      receiveShame: userTable.receiveShame,
      morningDigestHour: userTable.morningDigestHour,
      nightDigestHour: userTable.nightDigestHour,
      googleCalendarSync: userTable.googleCalendarSync,
      lastCalendarSyncAt: userTable.lastCalendarSyncAt,
    })
    .from(userTable)
    .where(eq(userTable.id, user.id))
    .limit(1);
  const link = await getLink(user.id);

  return (
    <div className="space-y-8">
      <div>
        <Mono>Account</Mono>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink">
          Settings
        </h1>
      </div>
      <TelegramConnect
        linked={link?.status === "linked"}
        username={link?.username ?? null}
      />
      <CalendarSync
        enabled={settings?.googleCalendarSync ?? false}
        lastSyncAt={settings?.lastCalendarSyncAt?.toISOString() ?? null}
      />
      <SettingsForm
        initial={
          settings ?? {
            timezone: null,
            quietHoursStart: null,
            quietHoursEnd: null,
            receiveShame: true,
            morningDigestHour: null,
            nightDigestHour: null,
          }
        }
      />
      <DeleteAccount />
    </div>
  );
}
