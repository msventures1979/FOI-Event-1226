"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/supabase/admin";
import { generateCode, getEvent } from "@/lib/event";
import { enqueue, processQueue, sendNow } from "@/lib/mail/queue";
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
  for (const t of ["own", "taxi", "lambo"]) {
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
  for (let i = 0; i < 80; i++) {
    const { data } = await db().rpc("promote_next", { p_event: ev.id });
    if (!data) break;
  }
  await processQueue({ max: 20 }).catch(() => {});
  revalidatePath("/admin");
  redirect(errors.length ? `/admin?fehler=${encodeURIComponent(errors.join(" · "))}` : "/admin?gespeichert=1");
}

export async function runQueue() {
  await requireAdmin();
  const r = await processQueue();
  redirect(`/admin?queue=${r.sent}-${r.failed}-${r.deferred}`);
}

/** Import: CSV oder XLSX mit Spalten Anrede, Titel, Vorname, Nachname, E-Mail, Unternehmen, Position, Notiz */
export async function importGuests(_prev: unknown, form: FormData): Promise<{ msg: string; rows?: string[][] }> {
  await requireAdmin();
  const file = form.get("file") as File | null;
  const dry = form.get("dry") === "on";
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
  const { data: existing } = await db().from("event_guests").select("email").eq("event_id", ev.id);
  const known = new Set((existing ?? []).map((g) => String(g.email).toLowerCase()));

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
      code: generateCode(),
    };
    toInsert.push(row);
    if (preview.length < 15) preview.push([row.salutation, row.title, row.first_name, row.last_name, row.email, row.company, row.code]);
  }

  if (!dry && toInsert.length) {
    for (let i = 0; i < toInsert.length; i += 200) {
      const { error } = await db().from("event_guests").insert(toInsert.slice(i, i + 200));
      if (error) return { msg: `Fehler beim Import: ${error.message}` };
    }
    revalidatePath("/admin/gaeste");
  }
  return {
    msg: `${dry ? "Vorschau – noch nichts gespeichert. " : ""}${toInsert.length} neue Gäste${dry ? " würden importiert" : " importiert"}, ${dupes} schon vorhanden, ${invalid} ohne gültige E-Mail/Nachname übersprungen.`,
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

  const { data: sample } = await db().from("event_guests").select("*").eq("event_id", ev.id).limit(1).maybeSingle();
  const g: Guest = (sample as Guest) ?? ({ salutation: "Herr", title: "", first_name: "Max", last_name: "Mustermann", code: "FOI-TEST0101", manage_token: "test" } as Guest);
  const notReady = mailReady(type, { guest: g, siteUrl: env.siteUrl, participationType: "own", freeSlots: 12 });
  if (notReady) return { msg: `Nicht versandbereit – ${notReady}. Bitte zuerst die Texte ergänzen.` };

  if (test) {
    const mail = renderMail(type, { guest: g, siteUrl: env.siteUrl, participationType: "own", freeSlots: 12 });
    const r = await new Resend(env.resendKey).emails.send({ from: mail.from ?? env.mailFrom, to: admin, replyTo: env.mailReplyTo, subject: `[TEST] ${mail.subject}`, html: mail.html, text: mail.text });
    return { msg: r.error ? `Fehler: ${r.error.message}` : `Testmail an ${admin} gesendet (Daten von ${g.first_name} ${g.last_name}).` };
  }

  const statuses: Record<string, string[]> = {
    alle: ["eingeladen", "angemeldet", "bestaetigt", "warteliste", "angeboten"],
    eingeladen: ["eingeladen"],
    angemeldet: ["angemeldet", "bestaetigt"],
    warteliste: ["warteliste"],
    eingecheckt: ["eingecheckt"],
  };
  const { data: guests } = await db().from("event_guests").select("id").eq("event_id", ev.id).in("status", statuses[group] ?? []);
  const r = await enqueue(ev.id, (guests ?? []).map((g) => g.id), type, { force });
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
}
