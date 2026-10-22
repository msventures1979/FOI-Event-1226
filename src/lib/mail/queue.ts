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
  const guests: { id: string; email: string; bounced: boolean }[] = [];
  const skip = new Set<string>();
  // in Blöcken abfragen, damit die URL bei großen Listen nicht zu lang wird
  for (let i = 0; i < guestIds.length; i += 100) {
    const ids = guestIds.slice(i, i + 100);
    const { data } = await supa.from("event_guests").select("id,email,bounced").in("id", ids);
    guests.push(...(data ?? []));
    if (!opts.force && ONCE.includes(type)) {
      const [{ data: sent }, { data: pending }] = await Promise.all([
        supa.from("email_log").select("guest_id").eq("type", type).eq("status", "gesendet").in("guest_id", ids),
        supa.from("email_queue").select("guest_id").eq("type", type).is("sent_at", null).lt("attempts", 5).in("guest_id", ids),
      ]);
      [...(sent ?? []), ...(pending ?? [])].forEach((r) => skip.add(r.guest_id as string));
    }
  }
  const rows = guests
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

/** Gesendete Mails der letzten 24 Stunden (rollierend – so wird das Tageslimit nie überschritten, egal wie Resend zählt). */
export async function sentToday(): Promise<number> {
  const { count } = await db()
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
    .eq("status", "gesendet");
  return count ?? 0;
}

/** Arbeitet die Warteschlange ab. Transaktionale Mails (Priorität 1) immer, Massenmails bis zum Tageslimit. */
export async function processQueue(opts: { guestId?: string; max?: number } = {}): Promise<{ sent: number; failed: number; deferred: number }> {
  const supa = db();
  const resend = new Resend(env.resendKey);
  const limit = env.mailDailyLimit;
  let today = await sentToday();

  // Jobs reservieren (parallele Läufe bekommen nie dieselben Jobs)
  const { data: jobs, error } = await supa.rpc("claim_mail_jobs", { p_max: opts.max ?? 200, p_guest: opts.guestId ?? null });
  if (error) throw error;
  const release = (id: number) => supa.from("email_queue").update({ locked_at: null }).eq("id", id);

  let sent = 0,
    failed = 0,
    deferred = 0;

  for (const job of (jobs ?? []) as { id: number; event_id: string; guest_id: string; to_email: string; type: string; priority: number; attempts: number }[]) {
    const isTransactional = job.priority <= 1;
    if (today >= limit || (!isTransactional && today >= limit - TRANSACTIONAL_RESERVE)) {
      deferred++;
      await release(job.id);
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

    let mail;
    try {
      mail = renderMail(job.type as MailType, {
        guest: guest as Guest,
        siteUrl: env.siteUrl,
        participationType: reg?.participation_type ?? null,
        offerExpiresAt: (guest as Guest).offer_expires_at,
        freeSlots: free,
      });
    } catch (e) {
      // z. B. offene Platzhalter: nicht senden, Job bleibt sichtbar in der Warteschlange
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      await supa.from("email_queue").update({ attempts: 5, last_error: msg, locked_at: null }).eq("id", job.id);
      await supa.from("email_log").insert({ event_id: job.event_id, guest_id: job.guest_id, to_email: job.to_email, type: job.type, status: "fehler", error: msg });
      continue;
    }

    const attachments =
      job.type === "bestaetigung"
        ? [
            {
              filename: "FOI-Racing-2026.ics",
              contentType: "text/calendar; charset=utf-8; method=PUBLISH",
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
    }, { idempotencyKey: `foi-${job.type}-${job.id}` });

    if (res.error) {
      failed++;
      await supa.from("email_queue").update({ attempts: job.attempts + 1, last_error: res.error.message, locked_at: null }).eq("id", job.id);
      await supa.from("email_log").insert({ event_id: job.event_id, guest_id: job.guest_id, to_email: job.to_email, type: job.type, status: "fehler", error: res.error.message });
      if (/rate|limit|quota/i.test(res.error.message)) {
        for (const j of (jobs ?? []).slice((jobs ?? []).indexOf(job) + 1)) await release(j.id);
        break;
      }
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
