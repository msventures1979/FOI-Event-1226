import "server-only";
import { Resend } from "resend";
import { db } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { INTEREST_FROM } from "@/lib/mail/templates";

const ANSWER: Record<string, string> = { dabei: "Dabei", interessiert: "Interessiert", nicht: "Nicht dabei" };
const MODE: Record<string, string> = { own: "Eigener Wagen", taxi: "Renntaxi", offen: "Noch offen", "": "" };
const GROUP: Record<string, string> = { rookie: "Rookie", performance: "Performance", race: "Race / Drift", "": "" };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export type DigestRow = {
  answer: string;
  mode: string;
  track_group: string;
  vehicle: string;
  note: string;
  created_at: string;
  updated_at: string;
  event_guests: { first_name: string; last_name: string; company: string } | { first_name: string; last_name: string; company: string }[] | null;
};

/** Morgendlicher Überblick der Interessensabfrage an info@ – nur wenn sich seit gestern etwas getan hat. */
export async function sendDigest(eventId: string, capacity: number): Promise<{ sent: boolean; changes: number }> {
  const supa = db();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [{ data: all }, { count: guests }, { count: bounces }] = await Promise.all([
    supa.from("event_interest").select("answer,mode,track_group,vehicle,note,created_at,updated_at,event_guests(first_name,last_name,company)").eq("event_id", eventId),
    supa.from("event_guests").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    supa.from("event_guests").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("bounced", true),
  ]);
  const rows = (all ?? []) as DigestRow[];
  const changed = rows.filter((r) => r.updated_at >= since || r.created_at >= since).sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  if (changed.length === 0) return { sent: false, changes: 0 };
  const { subject, html, text } = buildDigest({ rows, changed, guests: guests ?? 0, bounces: bounces ?? 0, capacity, siteUrl: env.siteUrl });
  const to = (process.env.DIGEST_TO || env.mailReplyTo).split(",").map((s) => s.trim()).filter(Boolean);
  const { error } = await new Resend(env.resendKey).emails.send({ from: INTEREST_FROM, to, subject, html, text });
  if (error) throw new Error(error.message);
  return { sent: true, changes: changed.length };
}

/** Baut den Überblick (ohne Datenbank – auch für Vorschauen nutzbar). */
export function buildDigest({ rows, changed, guests, bounces, capacity, siteUrl }: { rows: DigestRow[]; changed: DigestRow[]; guests: number; bounces: number; capacity: number; siteUrl: string }) {

  const c = (f: (r: DigestRow) => boolean) => rows.filter(f).length;
  const dabei = c((r) => r.answer === "dabei");
  const kpis: [string, string | number][] = [
    ["Vorgemerkt", `${dabei} / ${capacity}`],
    ["Interessiert", c((r) => r.answer === "interessiert")],
    ["Nicht dabei", c((r) => r.answer === "nicht")],
    ["Ohne Antwort", Math.max(0, guests - rows.length)],
  ];
  const active = rows.filter((r) => r.answer !== "nicht");
  const plan: [string, number][] = [
    ["Rookie", active.filter((r) => r.track_group === "rookie").length],
    ["Performance", active.filter((r) => r.track_group === "performance").length],
    ["Race / Drift", active.filter((r) => r.track_group === "race").length],
    ["Renntaxi", active.filter((r) => r.mode === "taxi").length],
    ["Noch offen", active.filter((r) => r.mode === "offen").length],
  ];

  const name = (r: DigestRow) => {
    const g = Array.isArray(r.event_guests) ? r.event_guests[0] : r.event_guests;
    return g ? `${g.first_name} ${g.last_name}${g.company ? ` (${g.company})` : ""}` : "–";
  };
  const detail = (r: DigestRow) => [MODE[r.mode], GROUP[r.track_group], r.vehicle].filter(Boolean).join(" · ");

  const subject = `Weihnachtsfeier: ${changed.length} neue Antwort${changed.length === 1 ? "" : "en"} · ${dabei}/${capacity} vorgemerkt`;
  const td = "padding:8px 10px;border-bottom:1px solid #eee;font-size:14px;vertical-align:top";
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff">
<tr><td style="background:#000;color:#fff;padding:18px 24px;font-size:13px;letter-spacing:2px;text-transform:uppercase">FOI Weihnachtsfeier · Tagesüberblick</td></tr>
<tr><td style="padding:24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${kpis
    .map(([k, v]) => `<td style="padding:10px;border:1px solid #eee;width:25%"><div style="font-size:11px;color:#777;text-transform:uppercase;letter-spacing:1px">${k}</div><div style="font-size:24px;font-weight:bold;margin-top:4px;color:${k === "Vorgemerkt" ? "#c97a0c" : "#111"}">${v}</div></td>`)
    .join("")}</tr></table>
<p style="margin:18px 0 6px;font-size:13px;color:#555">Für die Planung (alle Vorgemerkten und Interessierten): ${plan.map(([k, v]) => `<b>${k}</b> ${v}`).join(" · ")}${bounces ? ` · <span style="color:#c00">${bounces} unzustellbar</span>` : ""}</p>
<h2 style="font-size:16px;margin:22px 0 8px">Neu oder geändert seit gestern (${changed.length})</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${changed
    .map((r) => `<tr><td style="${td}"><b>${esc(name(r))}</b>${r.note ? `<div style="color:#777;font-size:13px">„${esc(r.note)}“</div>` : ""}</td><td style="${td};white-space:nowrap"><b style="color:${r.answer === "dabei" ? "#c97a0c" : r.answer === "nicht" ? "#999" : "#111"}">${ANSWER[r.answer]}</b></td><td style="${td};color:#555">${esc(detail(r))}</td></tr>`)
    .join("")}
</table>
<p style="margin:24px 0 0"><a href="${siteUrl}/admin/interesse" style="background:#000;color:#fff;padding:12px 18px;text-decoration:none;font-size:14px">Alle Antworten ansehen</a></p>
</td></tr></table></td></tr></table></body></html>`;
  const text = [
    subject,
    "",
    kpis.map(([k, v]) => `${k}: ${v}`).join(" · "),
    `Planung: ${plan.map(([k, v]) => `${k} ${v}`).join(" · ")}${bounces ? ` · ${bounces} unzustellbar` : ""}`,
    "",
    "Neu oder geändert seit gestern:",
    ...changed.map((r) => `- ${name(r)}: ${ANSWER[r.answer]}${detail(r) ? ` (${detail(r)})` : ""}${r.note ? ` – „${r.note}“` : ""}`),
    "",
    `${siteUrl}/admin/interesse`,
  ].join("\n");

  return { subject, html, text };
}
