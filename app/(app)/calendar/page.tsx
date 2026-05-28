import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/dal";
import { getUserTasks } from "@/lib/tasks";
import { db } from "@/db";
import { calendarEvent } from "@/db/schema";
import { CalendarView } from "@/components/app/calendar-view";
import { Mono } from "@/components/ui/card";

export default async function CalendarPage() {
  const user = await requireUser();
  const tasks = await getUserTasks(user.id);
  const events = await db
    .select()
    .from(calendarEvent)
    .where(eq(calendarEvent.userId, user.id));

  return (
    <div>
      <Mono className="mb-4">Calendar</Mono>
      <CalendarView tasks={tasks} events={events} />
    </div>
  );
}
