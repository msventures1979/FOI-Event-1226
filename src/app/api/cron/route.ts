import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { getEvent } from "@/lib/event";
import { enqueue, processQueue } from "@/lib/mail/queue";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Täglicher Job (Vercel Cron, siehe vercel.json):
 * 1. abgelaufene Nachrück-Angebote freigeben (→ nächster Gast)
 * 2. automatische Erinnerungen einreihen – nur wenn AUTO_REMINDERS=true
 * 3. Warteschlange im Rahmen des Tageslimits abarbeiten
 */
export async function GET(req: Request) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const ev = await getEvent();
  const supa = db();
  const report: Record<string, unknown> = {};

  const { data: expired } = await supa.rpc("expire_offers", { p_event: ev.id });
  report.expiredOffers = expired;

  if (process.env.AUTO_REMINDERS === "true") {
    const now = new Date();
    const berlinDate = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" }); // YYYY-MM-DD

    // Mail 3: Erinnerung 7 Tage nach der Einladung an alle, die nicht reagiert haben
    const sevenDaysAgo = new Date(now.getTime() - 7 * 864e5).toISOString();
    const { data: invited } = await supa.from("email_log").select("guest_id").eq("type", "einladung").lte("created_at", sevenDaysAgo);
    const ids = [...new Set((invited ?? []).map((r) => r.guest_id as string))];
    if (ids.length) {
      const { data: open } = await supa.from("event_guests").select("id").eq("event_id", ev.id).eq("status", "eingeladen").in("id", ids);
      report.erinnerung = await enqueue(ev.id, (open ?? []).map((g) => g.id), "erinnerung");
    }

    const registered = async () =>
      ((await supa.from("event_guests").select("id").eq("event_id", ev.id).in("status", ["angemeldet", "bestaetigt"])).data ?? []).map((g) => g.id);

    // Mail 8: eine Woche vorher
    if (berlinDate >= "2026-12-07") report.letzteInfos = await enqueue(ev.id, await registered(), "letzte_infos");
    // Mail 9: Freitag davor
    if (berlinDate >= "2026-12-11") report.vorabend = await enqueue(ev.id, await registered(), "vorabend");
  }

  report.queue = await processQueue();
  return NextResponse.json(report);
}
