/**
 * Save the Date – Versand vor dem Go-live der Plattform, direkt über Resend.
 *
 *   npx tsx scripts/save-the-date.ts gaeste.csv --test=matthias@frontlineofinnovation.de
 *   npx tsx scripts/save-the-date.ts gaeste.csv --dry-run
 *   npx tsx scripts/save-the-date.ts gaeste.csv --send --limit=80
 *
 * CSV (Semikolon oder Komma, erste Zeile = Spaltennamen):
 *   Anrede;Titel;Vorname;Nachname;E-Mail[;Unternehmen;Position]
 *
 * Bereits versendete Adressen werden in scripts/.save-the-date-sent.json vermerkt und nie doppelt angeschrieben.
 * Benötigt RESEND_API_KEY (und optional MAIL_FROM, MAIL_REPLY_TO, NEXT_PUBLIC_SITE_URL) in .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { Resend } from "resend";
import { config } from "dotenv";
import { renderMail } from "../src/lib/mail/templates";

config({ path: ".env.local" });

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}`))?.split("=")[1] ?? (args.includes(`--${name}`) ? "true" : undefined);

if (!file) {
  console.error("Bitte CSV-Datei angeben: npx tsx scripts/save-the-date.ts gaeste.csv --dry-run");
  process.exit(1);
}

const STATE = path.join(__dirname, ".save-the-date-sent.json");
const sentBefore: Record<string, string> = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : {};

const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true, delimitersToGuess: [";", ",", "\t"] });

const pick = (r: Record<string, string>, ...keys: string[]) => {
  for (const k of Object.keys(r)) if (keys.some((x) => k.trim().toLowerCase() === x)) return (r[k] ?? "").trim();
  return "";
};

const guests = parsed.data
  .map((r) => ({
    salutation: (["herr", "frau"].includes(pick(r, "anrede").toLowerCase()) ? (pick(r, "anrede").toLowerCase() === "herr" ? "Herr" : "Frau") : "") as "Herr" | "Frau" | "",
    title: pick(r, "titel", "title"),
    first_name: pick(r, "vorname", "first_name", "firstname"),
    last_name: pick(r, "nachname", "last_name", "lastname", "name"),
    email: pick(r, "e-mail", "email", "mail").toLowerCase(),
  }))
  .filter((g) => /.+@.+\..+/.test(g.email));

const unique = [...new Map(guests.map((g) => [g.email, g])).values()];
const todo = unique.filter((g) => !sentBefore[g.email]);
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://racing.frontlineofinnovation.de").replace(/\/$/, "");

console.log(`CSV: ${guests.length} gültige Adressen, ${unique.length} eindeutig, ${unique.length - todo.length} schon versendet, ${todo.length} offen.`);
console.log(`Ohne Anrede (Anrede „Guten Tag …“): ${todo.filter((g) => !g.salutation).length}`);

async function main() {
  const testTo = flag("test");
  const send = flag("send") === "true";
  const limit = Number(flag("limit") ?? "90");
  const from = process.env.MAIL_FROM ?? "Frontline of Innovation <racing@frontlineofinnovation.de>";
  const replyTo = process.env.MAIL_REPLY_TO ?? "info@frontlineofinnovation.de";

  if (!testTo && !send) {
    const sample = todo[0];
    if (sample) {
      const m = renderMail("save_the_date", { guest: { ...sample, code: "", manage_token: "" }, siteUrl: site });
      console.log("\n--- Vorschau (erster Empfänger) ---\nAn: " + sample.email + "\nBetreff: " + m.subject + "\n\n" + m.text);
    }
    console.log("\nTrockenlauf. Zum Testen: --test=ihre@adresse.de · zum Versenden: --send [--limit=90]");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  if (testTo) {
    const g = todo[0] ?? unique[0];
    const m = renderMail("save_the_date", { guest: { ...g, code: "", manage_token: "" }, siteUrl: site });
    const r = await resend.emails.send({ from, to: testTo, replyTo, subject: "[TEST] " + m.subject, html: m.html, text: m.text });
    console.log(r.error ? `Fehler: ${r.error.message}` : `Testmail an ${testTo} gesendet (Anrede wie für ${g.email}).`);
    return;
  }

  let n = 0;
  for (const g of todo.slice(0, limit)) {
    const m = renderMail("save_the_date", { guest: { ...g, code: "", manage_token: "" }, siteUrl: site });
    const r = await resend.emails.send({ from, to: g.email, replyTo, subject: m.subject, html: m.html, text: m.text });
    if (r.error) {
      console.error(`✗ ${g.email}: ${r.error.message}`);
      if (/limit|quota|rate/i.test(r.error.message)) break;
      continue;
    }
    sentBefore[g.email] = new Date().toISOString();
    fs.writeFileSync(STATE, JSON.stringify(sentBefore, null, 2));
    n++;
    console.log(`✓ ${n} ${g.email}`);
    await new Promise((res) => setTimeout(res, 600));
  }
  console.log(`\nFertig: ${n} versendet, ${todo.length - n} offen (morgen erneut starten, bereits Versendete werden übersprungen).`);
}

main();
