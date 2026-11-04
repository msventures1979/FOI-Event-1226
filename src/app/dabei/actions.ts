"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { sendNow } from "@/lib/mail/queue";
import { getEvent, guestByToken } from "@/lib/event";
import { db } from "@/lib/supabase/admin";
import { ANSWERS, GROUPS, MODES, type InterestAnswer, type InterestMode, type TrackGroup } from "@/lib/interest";

export type InterestState = { error?: string } | undefined;

const s = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);

export async function saveInterest(_prev: InterestState, form: FormData): Promise<InterestState> {
  const token = s(form, "token", 80);
  if (token === "vorschau") {
    const a = s(form, "answer");
    redirect(`/dabei/vorschau?demo=${encodeURIComponent(a)}#danke`);
  }
  const found = await guestByToken(token);
  if (!found) return { error: "Dieser Link ist nicht gültig. Bitte nutzen Sie den Link aus Ihrer Mail." };
  const answer = s(form, "answer") as InterestAnswer;
  if (!ANSWERS.some((a) => a.value === answer)) return { error: "Bitte wählen Sie eine Antwort." };
  let mode = s(form, "mode") as InterestMode;
  if (answer === "nicht") mode = "";
  else if (!MODES.some((m) => m.value === mode)) return { error: "Bitte sagen Sie uns noch, wie Sie auf die Strecke möchten." };
  let track_group = s(form, "track_group") as TrackGroup;
  if (mode !== "own") track_group = "";
  else if (!GROUPS.some((g) => g.value === track_group)) return { error: "Bitte wählen Sie noch Ihre Gruppe auf der Strecke." };
  const email = s(form, "email", 200).toLowerCase();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Bitte prüfen Sie die Mailadresse." };

  const ev = await getEvent();
  const row = {
    guest_id: found.guest.id,
    event_id: ev.id,
    answer,
    mode,
    track_group,
    vehicle: mode === "own" ? s(form, "vehicle", 120) : "",
    note: s(form, "note", 1000),
    contact_email: email && email !== found.guest.email.toLowerCase() ? email : "",
  };
  const supa = db();
  const { data: before } = await supa.from("event_interest").select("answer").eq("guest_id", found.guest.id).maybeSingle();
  // Wer von „nicht/interessiert“ auf „dabei“ wechselt, reiht sich mit dem neuen Zeitpunkt ein
  const patch = before && before.answer !== "dabei" && answer === "dabei" ? { ...row, created_at: new Date().toISOString() } : row;
  const { error } = await supa.from("event_interest").upsert(patch, { onConflict: "guest_id" });
  if (error) return { error: "Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder schreiben Sie an info@frontlineofinnovation.de." };
  await supa.from("status_log").insert({ guest_id: found.guest.id, from_status: before?.answer ?? null, to_status: `interesse:${answer}`, actor: "gast" }).then(() => undefined, () => undefined);
  // Bestätigungsmail – nur bei neuer Vormerkung oder Wechsel zwischen „dabei“ und „interessiert“, nicht bei jeder kleinen Änderung
  if (answer !== "nicht" && before?.answer !== answer) {
    const guestId = found.guest.id;
    const eventId = found.guest.event_id;
    after(() => sendNow(eventId, guestId, "interesse_danke"));
  }
  redirect(`/dabei/${token}?gespeichert=1#danke`);
}
