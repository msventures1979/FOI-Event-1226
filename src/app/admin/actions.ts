"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/supabase/admin";
import { generateCode, getEvent } from "@/lib/event";
import { enqueue, processQueue, sendNow } from "@/lib/mail/queue";
import { refreshDelivery } from "@/lib/mail/delivery";
import { mailReady, renderMail, type MailType } from "@/lib/mail/templates";
import { env } from "@/lib/env";
import { Resend } from "resend";
import type { Guest } from "@/lib/types";

/** „2026-11-30T23:59“ als Berliner Ortszeit → UTC (berücksichtigt Sommer-/Winterzeit). */
function berlinToUtc(local: string): Date {
  const asUtc = new Date(`${local}:00Z`);
  const berlin = new Date(asUtc.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const utc = new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(asUtc.getTime() - (berlin.getTime() - utc.getTime()));
}

export async function saveCapacity(form: FormData) {
  await requireAdmin();
  const ev = await getEvent();
  const errors: string[] = [];
  const total = Number(form.get("total"));
  if (!Number.isInteger(total) || total < 1) errors.push("Gesamtkontingent muss eine ganze Zahl ab 1 sein");
  else {
    const { error } = await db().from("events").update({ total_capacity: total }).eq("id", ev.id);
    if (error) errors.push(error.message);
  }
  for (const t of ["own", "taxi"]) {
    const raw = String(form.get(t) ?? "").trim();
    const val = raw === "" ? null : Number(raw);
    if (val !== null && (!Number.isInteger(val) || val < 0)) {
      errors.push(`Obergrenze ${t} ungültig`);
      continue;
    }
    const { error } = await db().from("event_capacity").update({ max_slots: val }).eq("event_id", ev.id).eq("participation_type", t);
    if (error) errors.push(error.message);
  }
  const deadline = String(form.get("deadline") ?? "");
  if (deadline) {
    const { error } = await db().from("events").update({ registration_deadline: berlinToUtc(deadline).toISOString() }).eq("id", ev.id);
    if (error) errors.push(error.message);
  }
  // Durch mehr Kapazität können Wartende nachrücken – und sollen es sofort erfahren
  for (let i = 0; i < 200; i++) {
    const { data } = await db().rpc("promote_next", { p_event: ev.id });
    if (!data) break;
  }
  await processQueue({ max: 20 }).catch(() => {});
  revalidatePath("/admin");
  redirect(errors.length ? `/admin?fehler=${encodeURIComponent(errors.join(" · "))}` : "/admin?gespeichert=1");
}

export async function runQueue(form?: FormData) {
  await requireAdmin();
  // Optional in Paketen versenden (bessere Zustellbarkeit als alles auf einmal)
  const max = Math.min(200, Math.max(1, Number(form?.get("max")) || 200));
  const r = await processQueue({ max });
  redirect(`/admin?queue=${r.sent}-${r.failed}-${r.deferred}`);
}

/** Import: CSV oder XLSX mit Spalten Anrede, Titel, Vorname, Nachname, E-Mail, Unternehmen, Position, Notiz */
export async function importGuests(_prev: unknown, form: FormData): Promise<{ msg: string; rows?: string[][] }> {
  await requireAdmin();
  const file = form.get("file") as File | null;
  const dry = form.get("dry") === "on";
  const update = form.get("update") === "on";
  if (!file || file.size === 0) return { msg: "Bitte eine Datei wählen." };

  let records: Record<string, string>[] = [];
  const buf = Buffer.from(await file.arrayBuffer());
  if (file.name.toLowerCase().endsWith(".xlsx")) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    const header: string[] = [];
    ws.getRow(1).eachCell({ includeEmpty: true }, (c, col) => (header[col - 1] = (c.text ?? "").trim()));
    ws.eachRow((row, i) => {
      if (i === 1) return;
      const rec: Record<string, string> = {};
      header.forEach((h, j) => {
        // .text liefert auch bei Formeln, Links und formatiertem Text den sichtbaren Wert
        rec[h] = row.getCell(j + 1).text ?? "";
      });
      records.push(rec);
    });
  } else {
    const parsed = Papa.parse<Record<string, string>>(buf.toString("utf8").replace(/^﻿/, ""), { header: true, skipEmptyLines: true, delimitersToGuess: [";", ",", "\t"] });
    records = parsed.data;
  }

  const pick = (r: Record<string, string>, ...keys: string[]) => {
    for (const k of Object.keys(r)) if (keys.includes(k.trim().toLowerCase())) return String(r[k] ?? "").trim();
    return "";
  };

  const ev = await getEvent();
  const { data: existing } = await db().from("event_guests").select("id,email,company,position,linkedin,note").eq("event_id", ev.id);
  const known = new Set((existing ?? []).map((g) => String(g.email).toLowerCase()));
  const byEmail = new Map((existing ?? []).map((g) => [String(g.email).toLowerCase(), g]));
  const updates: { id: string; patch: Record<string, string> }[] = [];

  const toInsert: Record<string, string>[] = [];
  const preview: string[][] = [];
  let invalid = 0,
    dupes = 0;
  for (const r of records) {
    const email = pick(r, "e-mail", "email", "mail").toLowerCase();
    const first = pick(r, "vorname", "first_name", "firstname");
    const last = pick(r, "nachname", "last_name", "lastname", "name");
    if (!/.+@.+\..+/.test(email) || !last) {
      invalid++;
      continue;
    }
    if (known.has(email)) {
      // Abgleich: vorhandene Gäste mit Unternehmen, Position und LinkedIn aus der Datei ergänzen
      const ex = byEmail.get(email);
      if (update && ex) {
        const patch: Record<string, string> = {};
        const company = pick(r, "unternehmen", "firma", "company");
        const position = pick(r, "position", "funktion");
        const li = cleanLinkedin(pick(r, "linkedin", "linkedin-profil", "url"));
        if (company && company !== ex.company) {
          patch.company = company;
          // bisherige (oft handschriftliche) Firmenangabe nicht verlieren
          if (ex.company && !company.toLowerCase().includes(String(ex.company).toLowerCase())) patch.note = [ex.note, `Früher erfasst: ${ex.company}`].filter(Boolean).join(" · ");
        }
        if (position && position !== ex.position) patch.position = position;
        if (li && li !== ex.linkedin) patch.linkedin = li;
        if (Object.keys(patch).length) updates.push({ id: ex.id as string, patch });
      }
      dupes++;
      continue;
    }
    known.add(email);
    const anrede = pick(r, "anrede", "salutation").toLowerCase();
    const row = {
      event_id: ev.id,
      salutation: anrede === "herr" ? "Herr" : anrede === "frau" ? "Frau" : "",
      title: pick(r, "titel", "title"),
      first_name: first,
      last_name: last,
      email,
      company: pick(r, "unternehmen", "firma", "company"),
      position: pick(r, "position", "funktion"),
      note: pick(r, "notiz", "note", "bemerkung"),
      linkedin: cleanLinkedin(pick(r, "linkedin", "linkedin-profil")),
      code: generateCode(),
    };
    toInsert.push(row);
    if (preview.length < 15) preview.push([row.salutation, row.title, row.first_name, row.last_name, row.email, row.company, row.code]);
  }

  if (!dry && updates.length) {
    for (const u of updates) await db().from("event_guests").update(u.patch).eq("id", u.id);
  }
  if (!dry && toInsert.length) {
    for (let i = 0; i < toInsert.length; i += 200) {
      const { error } = await db().from("event_guests").insert(toInsert.slice(i, i + 200));
      if (error) return { msg: `Fehler beim Import: ${error.message}` };
    }
    revalidatePath("/admin/gaeste");
  }
  return {
    msg: `${dry ? "Vorschau – noch nichts gespeichert. " : ""}${toInsert.length} neue Gäste${dry ? " würden importiert" : " importiert"}, ${dupes} schon vorhanden${update ? ` (davon ${updates.length} ${dry ? "würden aktualisiert" : "aktualisiert"})` : ""}, ${invalid} ohne gültige E-Mail/Nachname übersprungen.`,
    rows: preview,
  };
}

export async function queueMails(_prev: unknown, form: FormData): Promise<{ msg: string }> {
  const admin = await requireAdmin();
  const type = String(form.get("type")) as MailType;
  const group = String(form.get("group"));
  const force = form.get("force") === "on";
  const test = form.get("test") === "on";
  const ev = await getEvent();

  const testToRaw = String(form.get("testTo") ?? "").trim().toLowerCase();
  const testTo = test && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testToRaw) ? testToRaw : "";
  // Testempfänger auf der Gästeliste: dessen Daten verwenden, sonst den ersten Gast
  const { data: own } = testTo ? await db().from("event_guests").select("*").eq("event_id", ev.id).eq("email", testTo).limit(1).maybeSingle() : { data: null };
  const { data: first } = own ? { data: null } : await db().from("event_guests").select("*").eq("event_id", ev.id).limit(1).maybeSingle();
  // Testmail ohne eigenen Gasteintrag: Beispieldaten mit Vorschau-Link, damit kein Klick die Antwort eines echten Gastes verändert
  const sample = own ?? (test ? null : first);
  const g: Guest = (sample as Guest) ?? ({ salutation: "Herr", title: "", first_name: "Max", last_name: "Mustermann", code: "FOI-TEST0101", manage_token: "vorschau" } as Guest);
  const notReady = mailReady(type, { guest: g, siteUrl: env.siteUrl, participationType: "own", freeSlots: 12, interest: { answer: "dabei", mode: "own", track_group: "rookie", vehicle: "" } });
  if (notReady) return { msg: `Nicht versandbereit – ${notReady}. Bitte zuerst die Texte ergänzen.` };

  if (test) {
    const { count: dabeiCount } = await db().from("event_interest").select("guest_id", { count: "exact", head: true }).eq("event_id", ev.id).eq("answer", "dabei");
    const testFree = type === "interesse_erinnerung" ? (ev.total_capacity ?? 100) - (dabeiCount ?? 0) : 12;
    const mail = renderMail(type, { guest: g, siteUrl: env.siteUrl, participationType: "own", freeSlots: testFree, interest: { answer: "dabei", mode: "own", track_group: "rookie", vehicle: "" } });
    const r = await new Resend(env.resendKey).emails.send({ from: mail.from ?? env.mailFrom, to: testTo || admin, replyTo: env.mailReplyTo, subject: `[TEST] ${mail.subject}`, html: mail.html, text: mail.text });
    return { msg: r.error ? `Fehler: ${r.error.message}` : `Testmail an ${testTo || admin} gesendet (Daten von ${g.first_name} ${g.last_name}).` };
  }

  const statuses: Record<string, string[]> = {
    alle: ["eingeladen", "angemeldet", "bestaetigt", "warteliste", "angeboten"],
    eingeladen: ["eingeladen"],
    angemeldet: ["angemeldet", "bestaetigt"],
    warteliste: ["warteliste"],
    eingecheckt: ["eingecheckt"],
  };
  let ids: string[];
  if (group === "ohne_antwort") {
    // Interessensabfrage: Gäste ohne Antwort (unabhängig vom Anmeldestatus)
    const [{ data: gs }, { data: answered }] = await Promise.all([
      db().from("event_guests").select("id").eq("event_id", ev.id).eq("status", "eingeladen"),
      db().from("event_interest").select("guest_id").eq("event_id", ev.id),
    ]);
    const done = new Set((answered ?? []).map((a) => a.guest_id as string));
    ids = (gs ?? []).map((g) => g.id as string).filter((id) => !done.has(id));
  } else {
    const { data: guests } = await db().from("event_guests").select("id").eq("event_id", ev.id).in("status", statuses[group] ?? []);
    ids = (guests ?? []).map((g) => g.id as string);
  }
  const r = await enqueue(ev.id, ids, type, { force });
  revalidatePath("/admin/versand");
  return { msg: `${r.queued} Mails eingereiht, ${r.skipped} übersprungen (schon erhalten oder Bounce). Versand im Tageslimit über „Warteschlange abarbeiten“ oder den täglichen Job.` };
}

export async function guestAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const what = String(form.get("what"));
  const ev = await getEvent();
  const { data: g } = await db().from("event_guests").select("*").eq("id", id).single();
  if (!g) return;

  if (what === "einladung") await enqueue(ev.id, [id], "einladung", { priority: 2, force: true });
  if (what === "absagen") {
    const { data } = await db().rpc("decline_guest", { p_code: null, p_token: g.manage_token });
    const r = data as { result?: string } | null;
    if (r?.result === "abgesagt" || r?.result === "storniert") {
      await sendNow(ev.id, id, "absage");
      await processQueue({ max: 10 }).catch(() => {});
    }
  }
  if (what === "checkin" && ["angemeldet", "bestaetigt"].includes(g.status)) {
    await db().from("event_guests").update({ status: "eingecheckt" }).eq("id", id);
    await db().from("event_registrations").update({ checked_in_at: new Date().toISOString() }).eq("guest_id", id);
  }
  if (what === "checkout" && g.status === "eingecheckt") {
    const { data: reg } = await db().from("event_registrations").select("confirmed_at").eq("guest_id", id).maybeSingle();
    await db().from("event_guests").update({ status: reg?.confirmed_at ? "bestaetigt" : "angemeldet" }).eq("id", id);
    await db().from("event_registrations").update({ checked_in_at: null }).eq("guest_id", id);
  }
  if (what === "loeschen" && g.status === "eingeladen") await db().from("event_guests").delete().eq("id", id);

  revalidatePath("/admin/gaeste");
  revalidatePath("/admin/checkin");
  // Aktionen von der Gast-Detailseite: zurück dorthin bzw. nach dem Löschen zur Liste
  const back = String(form.get("back") ?? "");
  if (back === "detail") redirect(what === "loeschen" ? "/admin/gaeste" : `/admin/gaeste/${id}?ok=aktion`);
}

export async function checkDelivery() {
  await requireAdmin();
  const r = await refreshDelivery();
  revalidatePath("/admin/versand");
  redirect(`/admin/versand?zustellung=${r.checked}-${r.bounced}-${r.open}${r.error ? `&fehler=${encodeURIComponent(r.error)}` : ""}#zustellung`);
}

const s = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);

/** Nur echte LinkedIn-Profil-Links übernehmen, ohne Tracking-Parameter */
function cleanLinkedin(v: string): string {
  const m = v.trim().match(/^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([^/?#\s]+)/i);
  return m ? `https://www.linkedin.com/in/${m[1]}` : "";
}

export async function updateGuest(form: FormData) {
  await requireAdmin();
  const id = s(form, "id", 64);
  const { data: g } = await db().from("event_guests").select("email,bounced").eq("id", id).single();
  if (!g) redirect("/admin/gaeste");
  const email = s(form, "email").toLowerCase();
  const last = s(form, "last_name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !last) redirect(`/admin/gaeste/${id}?fehler=${encodeURIComponent("Bitte gültige E-Mail-Adresse und Nachname angeben.")}`);
  const sal = s(form, "salutation");
  const emailChanged = email !== String(g.email).toLowerCase();
  const patch = {
    salutation: sal === "Herr" || sal === "Frau" ? sal : "",
    title: s(form, "title", 40),
    first_name: s(form, "first_name", 80),
    last_name: last,
    email,
    company: s(form, "company"),
    position: s(form, "position"),
    linkedin: cleanLinkedin(s(form, "linkedin", 300)),
    note: s(form, "note", 2000),
    bounced: emailChanged || form.get("unbounce") === "on" ? false : g.bounced,
  };
  const { error } = await db().from("event_guests").update(patch).eq("id", id);
  if (error) {
    const msg = /duplicate|unique/i.test(error.message) ? "Diese E-Mail-Adresse gehört schon zu einem anderen Gast." : error.message;
    redirect(`/admin/gaeste/${id}?fehler=${encodeURIComponent(msg)}`);
  }
  await db().from("status_log").insert({ guest_id: id, from_status: emailChanged ? String(g.email) : null, to_status: emailChanged ? `email:${email}` : "bearbeitet", actor: "admin" }).then(() => undefined, () => undefined);
  revalidatePath("/admin/gaeste");
  redirect(`/admin/gaeste/${id}?ok=1`);
}

export async function resendInterestMail(form: FormData) {
  await requireAdmin();
  const id = s(form, "id", 64);
  const ev = await getEvent();
  const { data: g } = await db().from("event_guests").select("bounced").eq("id", id).single();
  if (!g || g.bounced) redirect(`/admin/gaeste/${id}?fehler=${encodeURIComponent("Adresse ist als unzustellbar markiert.")}`);
  await sendNow(ev.id, id, "interesse");
  revalidatePath(`/admin/gaeste/${id}`);
  redirect(`/admin/gaeste/${id}?ok=mail`);
}

export async function sendDigestNow() {
  await requireAdmin();
  const ev = await getEvent();
  const { sendDigest } = await import("@/lib/mail/digest");
  const r = await sendDigest(ev.id, ev.total_capacity).catch((e) => ({ sent: false, changes: -1, error: String(e) }));
  redirect(`/admin/interesse?digest=${r.sent ? "ok" : r.changes === 0 ? "leer" : "fehler"}`);
}

/** Bestätigung an alle Vorgemerkten (dabei/interessiert), die noch keine bekommen haben – z. B. für Antworten vor Einführung der Bestätigungsmail. */
export async function sendMissingConfirmations() {
  await requireAdmin();
  const ev = await getEvent();
  const supa = db();
  const { data: open } = await supa.from("event_interest").select("guest_id").eq("event_id", ev.id).in("answer", ["dabei", "interessiert"]);
  const { data: done } = await supa.from("email_log").select("guest_id").eq("event_id", ev.id).eq("type", "interesse_danke").eq("status", "gesendet");
  const { data: queued } = await supa.from("email_queue").select("guest_id").eq("type", "interesse_danke").is("sent_at", null);
  const skip = new Set([...(done ?? []), ...(queued ?? [])].map((r) => r.guest_id as string));
  const ids = (open ?? []).map((r) => r.guest_id as string).filter((id) => !skip.has(id));
  const q = await enqueue(ev.id, ids, "interesse_danke", { priority: 2, force: true });
  const r = await processQueue({ max: 200 });
  redirect(`/admin/interesse?bestaetigt=${q.queued}-${r.sent}-${r.failed}`);
}
