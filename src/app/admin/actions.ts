"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/supabase/admin";
import { generateCode, getEvent } from "@/lib/event";
import { enqueue, processQueue } from "@/lib/mail/queue";
import { renderMail, type MailType } from "@/lib/mail/templates";
import { env } from "@/lib/env";
import { Resend } from "resend";
import type { Guest } from "@/lib/types";

export async function saveCapacity(form: FormData) {
  await requireAdmin();
  const ev = await getEvent();
  const total = Number(form.get("total"));
  if (total > 0) await db().from("events").update({ total_capacity: total }).eq("id", ev.id);
  for (const t of ["own", "taxi", "lambo"]) {
    const raw = String(form.get(t) ?? "").trim();
    await db().from("event_capacity").update({ max_slots: raw === "" ? null : Number(raw) }).eq("event_id", ev.id).eq("participation_type", t);
  }
  const deadline = String(form.get("deadline") ?? "");
  // Eingabe ist deutsche Winterzeit (Event im November/Dezember)
  if (deadline) await db().from("events").update({ registration_deadline: new Date(`${deadline}:00+01:00`).toISOString() }).eq("id", ev.id);
  // Durch mehr Kapazität können Wartende nachrücken
  for (let i = 0; i < 80; i++) {
    const { data } = await db().rpc("promote_next", { p_event: ev.id });
    if (!data) break;
  }
  revalidatePath("/admin");
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
    const header = (ws.getRow(1).values as unknown[]).slice(1).map((v) => String(v ?? "").trim());
    ws.eachRow((row, i) => {
      if (i === 1) return;
      const vals = (row.values as unknown[]).slice(1);
      const rec: Record<string, string> = {};
      header.forEach((h, j) => {
        const v = vals[j] as unknown;
        rec[h] = typeof v === "object" && v && "text" in (v as object) ? String((v as { text: string }).text) : String(v ?? "");
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

  if (test) {
    const { data: sample } = await db().from("event_guests").select("*").eq("event_id", ev.id).limit(1).maybeSingle();
    const g: Guest = (sample as Guest) ?? ({ salutation: "Herr", title: "", first_name: "Max", last_name: "Mustermann", code: "FOI-TEST01", manage_token: "test" } as Guest);
    const mail = renderMail(type, { guest: g, siteUrl: env.siteUrl, participationType: "own", freeSlots: 12 });
    const r = await new Resend(env.resendKey).emails.send({ from: env.mailFrom, to: admin, replyTo: env.mailReplyTo, subject: `[TEST] ${mail.subject}`, html: mail.html, text: mail.text });
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
  if (what === "absagen") await db().rpc("decline_guest", { p_code: null, p_token: g.manage_token });
  if (what === "checkin") {
    await db().from("event_guests").update({ status: "eingecheckt" }).eq("id", id);
    await db().from("event_registrations").update({ checked_in_at: new Date().toISOString() }).eq("guest_id", id);
  }
  if (what === "checkout") {
    await db().from("event_guests").update({ status: "bestaetigt" }).eq("id", id);
    await db().from("event_registrations").update({ checked_in_at: null }).eq("guest_id", id);
  }
  if (what === "loeschen" && g.status === "eingeladen") await db().from("event_guests").delete().eq("id", id);

  revalidatePath("/admin/gaeste");
  revalidatePath("/admin/checkin");
}
