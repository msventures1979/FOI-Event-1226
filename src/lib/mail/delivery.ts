import "server-only";
import { Resend } from "resend";
import { db } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export const DELIVERY_LABEL: Record<string, string> = {
  "": "offen",
  zugestellt: "Zugestellt",
  unzustellbar: "Unzustellbar",
  beschwerde: "Als Spam markiert",
  verzoegert: "Verzögert",
};

const FINAL = ["zugestellt", "unzustellbar", "beschwerde"];

function map(lastEvent: string | undefined): string {
  switch (lastEvent) {
    case "delivered":
    case "opened":
    case "clicked":
      return "zugestellt";
    case "bounced":
      return "unzustellbar";
    case "complained":
      return "beschwerde";
    case "delivery_delayed":
      return "verzoegert";
    default:
      return "";
  }
}

/**
 * Fragt bei Resend den Zustellstatus der verschickten Mails ab (letzte 14 Tage, noch ohne endgültigen Status).
 * Unzustellbare Adressen und Spam-Beschwerden werden beim Gast als „Bounce“ markiert – diese Gäste bekommen keine Massenmails mehr.
 * Resend erlaubt etwa 2 Anfragen pro Sekunde; daher höchstens `max` Abfragen je Lauf.
 */
export async function refreshDelivery(max = 240): Promise<{ checked: number; bounced: number; open: number }> {
  const supa = db();
  const resend = new Resend(env.resendKey);
  const since = new Date(Date.now() - 14 * 86400 * 1000).toISOString();
  const { data: rows } = await supa
    .from("email_log")
    .select("id,guest_id,resend_id,delivery")
    .not("resend_id", "is", null)
    .eq("status", "gesendet")
    .not("delivery", "in", `(${FINAL.join(",")})`)
    .gte("created_at", since)
    .order("delivery_checked_at", { ascending: true, nullsFirst: true })
    .limit(max);

  let checked = 0,
    bounced = 0;
  for (const r of rows ?? []) {
    const { data, error } = await resend.emails.get(r.resend_id as string);
    if (error) {
      if (/rate|limit/i.test(error.message)) break;
      continue;
    }
    const d = map((data as { last_event?: string } | null)?.last_event);
    await supa.from("email_log").update({ delivery: d, delivery_checked_at: new Date().toISOString() }).eq("id", r.id);
    if ((d === "unzustellbar" || d === "beschwerde") && r.guest_id) {
      await supa.from("event_guests").update({ bounced: true }).eq("id", r.guest_id);
      bounced++;
    }
    checked++;
    await new Promise((res) => setTimeout(res, 520));
  }
  const { count } = await supa
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .not("resend_id", "is", null)
    .eq("status", "gesendet")
    .not("delivery", "in", `(${FINAL.join(",")})`)
    .gte("created_at", since);
  return { checked, bounced, open: count ?? 0 };
}
