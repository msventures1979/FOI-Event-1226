import "server-only";
import { Resend } from "resend";
import { db } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { buildIcs } from "@/lib/ics";
import { renderMail, type MailType } from "@/lib/mail/templates";
import type { Guest, Registration } from "@/lib/types";

/** Mails, die nur ein Mal pro Gast verschickt werden (außer manuell erzwungen). */
const ONCE: MailType[] = ["save_the_date", "einladung", "erinnerung", "letzte_infos", "vorabend", "danke"];

/** Puffer, der im Tageslimit für transaktionale Mails (Bestätigung, Warteliste …) frei bleibt. */
const TRANSACTIONAL_RESERVE = 20;

export async function enqueue(
  eventId: string,
  guestIds: string[],
  type: MailType,
  opts: { priority?: number; scheduledFor?: Date; force?: boolean } = {},
): Promise<{ queued: number; skipped: number }> {
  if (guestIds.length === 0) return { queued: 0, skipped: 0 };
  const supa = db();
  const { data: guests } = await supa.from("event_guests").select("id,email,bounced").in("id", guestIds);
  let skip = new Set<string>();
  if (!opts.force && ONCE.includes(type)) {
    const [{ data: sent }, { data: pending }] = await Promise.all([
      supa.from("email_log").select("guest_id").eq("type", type).in("guest_id", guestIds),
      supa.from("email_queue").select("guest_id").eq("type", type).is("sent_at", null).in("guest_id", guestIds),
    ]);
    skip = new Set([...(sent ?? []), ...(pending ?? [])].map((r) => r.guest_id as string));
  }
  const rows = (guests ?? [])
    .filter((g) => !skip.has(g.id) && !g.bounced)
    .map((g) => ({
      event_id: eventId,
      guest_id: g.id,
      to_email: g.email,
      type,
      priority: opts.priority ?? 5,
      scheduled_for: (opts.scheduledFor ?? new Date()).toISOString(),
    }));
  if (rows.length) {
    const { error } = await supa.from("email_queue").insert(rows);
    if (error) throw error;
  }
  return { queued: rows.length, skipped: guestIds.length - rows.length };
}

function startOfBerlinDay(): Date {
  const now = new Date();
  const berlin = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const offset = now.getTime() - berlin.getTime();
  berlin.setHours(0, 0, 0, 0);
  return new Date(berlin.getTime() + offset);
}

export async function sentToday(): Promise<number> {
  const { count } = await db()
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfBerlinDay().toISOString())
    .eq("status", "gesendet");
  return count ?? 0;
}

/** Arbeitet die Warteschlange ab. Transaktionale Mails (Priorität 1) immer, Massenmails bis zum Tageslimit. */
export async function processQueue(opts: { guestId?: string; max?: number } = {}): Promise<{ sent: number; failed: number; deferred: number }> {
  const supa = db();
  const resend = new Resend(env.resendKey);
  const limit = env.mailDailyLimit;
  let today = await sentToday();

  let q = supa
    .from("email_queue")
    .select("*")
    .is("sent_at", null)
    .lte("scheduled_for", new Date().toISOString())
    .lt("attempts", 5)
    .order("priority")
    .order("scheduled_for")
    .limit(opts.max ?? 200);
  if (opts.guestId) q = q.eq("guest_id", opts.guestId);
  const { data: jobs, error } = await q;
  if (error) throw error;

  let sent = 0,
    failed = 0,
    deferred = 0;

  for (const job of jobs ?? []) {
    const isTransactional = job.priority <= 1;
    if (today >= limit || (!isTransactional && today >= limit - TRANSACTIONAL_RESERVE)) {
      deferred++;
      continue;
    }

    const { data: row } = await supa.from("event_guests").select("*, event_registrations(*)").eq("id", job.guest_id).single();
    if (!row) {
      await supa.from("email_queue").update({ sent_at: new Date().toISOString(), last_error: "Gast gelöscht" }).eq("id", job.id);
      continue;
    }
    const { event_registrations, ...guest } = row as Guest & { event_registrations: Registration | Registration[] | null };
    const reg = Array.isArray(event_registrations) ? event_registrations[0] : event_registrations;

    // Mails, die zu einem bestimmten Status gehören, verwerfen, wenn er nicht mehr passt
    const st = (guest as Guest).status;
    const stale =
      (["einladung", "erinnerung"].includes(job.type) && st !== "eingeladen") ||
      (["letzte_infos", "vorabend"].includes(job.type) && !["angemeldet", "bestaetigt"].includes(st)) ||
      (job.type === "platz_frei" && st !== "angeboten");
    if (stale) {
      await supa.from("email_queue").update({ sent_at: new Date().toISOString(), last_error: `übersprungen (Status ${st})` }).eq("id", job.id);
      continue;
    }

    let free: number | null = null;
    if (job.type === "erinnerung") {
      const { data: fs } = await supa.rpc("free_slots", { p_event: job.event_id });
      free = (fs as { free: number } | null)?.free ?? null;
    }

    const mail = renderMail(job.type as MailType, {
      guest: guest as Guest,
      siteUrl: env.siteUrl,
      participationType: reg?.participation_type ?? null,
      offerExpiresAt: (guest as Guest).offer_expires_at,
      freeSlots: free,
    });

    const attachments =
      job.type === "bestaetigung"
        ? [
            {
              filename: "FOI-Racing-2026.ics",
              content: Buffer.from(buildIcs({ uid: (guest as Guest).id, url: `${env.siteUrl}/meine-teilnahme/${(guest as Guest).manage_token}` })).toString("base64"),
            },
          ]
        : undefined;

    const res = await resend.emails.send({
      from: env.mailFrom,
      to: job.to_email,
      replyTo: env.mailReplyTo,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments,
      headers: { "X-Entity-Ref-ID": `${job.type}-${job.id}` },
    });

    if (res.error) {
      failed++;
      await supa.from("email_queue").update({ attempts: job.attempts + 1, last_error: res.error.message }).eq("id", job.id);
      await supa.from("email_log").insert({ event_id: job.event_id, guest_id: job.guest_id, to_email: job.to_email, type: job.type, status: "fehler", error: res.error.message });
      if (/rate|limit|quota/i.test(res.error.message)) break;
      continue;
    }

    sent++;
    today++;
    await supa.from("email_queue").update({ sent_at: new Date().toISOString(), attempts: job.attempts + 1 }).eq("id", job.id);
    await supa.from("email_log").insert({ event_id: job.event_id, guest_id: job.guest_id, to_email: job.to_email, type: job.type, resend_id: res.data?.id ?? null });
    // Resend erlaubt wenige Requests pro Sekunde
    await new Promise((r) => setTimeout(r, 550));
  }

  return { sent, failed, deferred };
}

/** Transaktionale Mail sofort einreihen und verschicken (Fehler blockieren die Anmeldung nicht). */
export async function sendNow(eventId: string, guestId: string, type: MailType): Promise<void> {
  try {
    await enqueue(eventId, [guestId], type, { priority: 1, force: true });
    await processQueue({ guestId });
  } catch (e) {
    console.error("Mailversand fehlgeschlagen", type, guestId, e);
  }
}
