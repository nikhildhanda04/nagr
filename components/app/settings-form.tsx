"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/field";
import { Card, Mono } from "@/components/ui/card";

type Settings = {
  timezone: string | null;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  receiveShame: boolean;
  morningDigestHour: number | null;
  nightDigestHour: number | null;
};

const toHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const toMin = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [tz, setTz] = useState(initial.timezone ?? "");
  const [quietOn, setQuietOn] = useState(initial.quietHoursStart != null);
  const [quietStart, setQuietStart] = useState(
    toHHMM(initial.quietHoursStart ?? 22 * 60),
  );
  const [quietEnd, setQuietEnd] = useState(toHHMM(initial.quietHoursEnd ?? 8 * 60));
  const [receiveShame, setReceiveShame] = useState(initial.receiveShame);
  const [morning, setMorning] = useState(
    initial.morningDigestHour == null ? "" : String(initial.morningDigestHour),
  );
  const [night, setNight] = useState(
    initial.nightDigestHour == null ? "" : String(initial.nightDigestHour),
  );
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-fill the timezone from the browser if it was never set.
  useEffect(() => {
    if (!tz) setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [tz]);

  async function save() {
    setPending(true);
    setSaved(false);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        timezone: tz || null,
        quietHoursStart: quietOn ? toMin(quietStart) : null,
        quietHoursEnd: quietOn ? toMin(quietEnd) : null,
        receiveShame,
        morningDigestHour: morning === "" ? null : Number(morning),
        nightDigestHour: night === "" ? null : Number(night),
      }),
    });
    setPending(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <Mono>Preferences</Mono>
      <div className="mt-4 space-y-5">
        <div>
          <Label>Timezone</Label>
          <p className="text-ink">{tz || "—"}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Used for quiet hours, due times, and digests. Auto-detected.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={quietOn}
              onChange={(e) => setQuietOn(e.target.checked)}
              className="accent-accent"
            />
            Quiet hours — hold nags while you sleep
          </label>
          {quietOn && (
            <div className="mt-3 flex items-center gap-2 text-sm text-ink">
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white/60 px-2 py-1 [color-scheme:light]"
              />
              <span className="text-ink-muted">to</span>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white/60 px-2 py-1 [color-scheme:light]"
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label>Morning digest</Label>
            <Select value={morning} onChange={(e) => setMorning(e.target.value)}>
              <option value="">Off</option>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {toHHMM(h * 60)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <Label>Evening digest</Label>
            <Select value={night} onChange={(e) => setNight(e.target.value)}>
              <option value="">Off</option>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {toHHMM(h * 60)}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={receiveShame}
            onChange={(e) => setReceiveShame(e.target.checked)}
            className="accent-accent"
          />
          Receive friends&apos; failure blasts
        </label>

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          {saved && (
            <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
              Saved
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
