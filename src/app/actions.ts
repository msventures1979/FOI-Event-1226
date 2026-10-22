"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/supabase/admin";
import { getEvent, guestByToken, normalizeCode } from "@/lib/event";
import { processQueue, sendNow } from "@/lib/mail/queue";

const type = z.enum(["own", "taxi", "lambo"]);

const schema = z
  .object({
    code: z.string().min(4),
    participation_type: type,
    second_choice: z.union([type, z.literal("")]).optional(),
    extra_ride: z.boolean(),
    salutation: z.enum(["Herr", "Frau", ""]),
    title: z.string().max(40),
    first_name: z.string().trim().min(1, "Bitte Vornamen angeben").max(80),
    last_name: z.string().trim().min(1, "Bitte Nachnamen angeben").max(80),
    company: z.string().trim().min(1, "Bitte Unternehmen angeben").max(120),
    position: z.string().trim().min(1, "Bitte Position angeben").max(120),
    email: z.string().trim().email("Bitte gültige E-Mail angeben").max(160),
    mobile: z.string().trim().min(6, "Bitte Mobilnummer angeben").max(40),
    diet: z.string().max(60),
    allergies: z.string().max(500),
    consent_photo: z.boolean(),
    consent_terms: z.literal(true, { message: "Bitte Teilnahmebedingungen und Datenschutzhinweise akzeptieren" }),
    consent_waiver: z.boolean(),
    consent_gohm: z.boolean(),
    vehicle: z.record(z.string(), z.string().max(60)),
    experience: z.string().max(40),
    license_since: z.string().max(10),
    height_cm: z.string().max(10),
  })
  .superRefine((d, ctx) => {
    // Pflichtangaben gelten für Erstwahl UND Zweitwunsch – beide Plätze können vergeben werden
    const types = new Set([d.participation_type, d.second_choice].filter(Boolean));
    const issue = (message: string, path: string) => ctx.addIssue({ code: "custom", message, path: [path] });
    if (types.has("own") && ["marke", "modell", "baujahr", "ps", "kennzeichen", "getriebe", "reifen"].some((k) => !d.vehicle[k]))
      issue("Bitte alle Fahrzeugangaben ausfüllen", "vehicle");
    if ((types.has("own") || types.has("lambo")) && !d.license_since) issue("Bitte angeben, seit wann Sie den Führerschein haben", "license_since");
    if ((types.has("own") || types.has("lambo")) && !d.experience) issue("Bitte Ihre Rennstreckenerfahrung angeben", "experience");
    if ((types.has("own") || types.has("taxi")) && !d.consent_waiver) issue("Bitte den Haftungsverzicht der School of Racing bestätigen", "consent_waiver");
    if (types.has("lambo") && !d.consent_gohm) issue("Bitte die Nutzungsbedingungen des Autohauses Gohm bestätigen", "consent_gohm");
  });

export type RegisterState = { error?: string } | undefined;

export async function registerAction(_prev: RegisterState, form: FormData): Promise<RegisterState> {
  const s = (k: string) => String(form.get(k) ?? "").trim();
  const input = {
    code: normalizeCode(s("code")),
    participation_type: s("participation_type"),
    second_choice: s("second_choice"),
    extra_ride: form.get("extra_ride") === "on",
    salutation: s("salutation") === "ohne" ? "" : s("salutation"),
    title: s("title"),
    first_name: s("first_name"),
    last_name: s("last_name"),
    company: s("company"),
    position: s("position"),
    email: s("email"),
    mobile: s("mobile"),
    diet: s("diet"),
    allergies: s("allergies"),
    consent_photo: form.get("consent_photo") === "on",
    consent_terms: form.get("consent_terms") === "on",
    consent_waiver: form.get("consent_waiver") === "on",
    consent_gohm: form.get("consent_gohm") === "on",
    vehicle: Object.fromEntries(
      ["marke", "modell", "baujahr", "ps", "kennzeichen", "getriebe", "reifen"].map((k) => [k, s(`vehicle_${k}`)]).filter(([, v]) => v),
    ),
    experience: s("experience"),
    license_since: s("license_since"),
    height_cm: s("height_cm"),
  };

  const fail = (error: string): RegisterState => ({ error });

  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Bitte prüfen Sie Ihre Angaben.");

  const { code, ...data } = parsed.data;
  const { data: res, error } = await db().rpc("register_guest", { p_code: code, p_data: data });
  if (error) {
    console.error(error);
    return fail("Die Anmeldung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.");
  }
  const r = res as { result: string; guest_id?: string; manage_token?: string };
  if (r.result === "invalid") return fail("Dieser Code ist nicht gültig.");
  if (r.result === "closed") return fail("Die Anmeldung ist geschlossen. Bitte melden Sie sich bei info@frontlineofinnovation.de.");
  if (r.result === "already") redirect(`/meine-teilnahme/${r.manage_token}`);
  if (r.result !== "angemeldet" && r.result !== "warteliste") return fail("Bitte prüfen Sie Ihre Angaben.");

  const ev = await getEvent();
  await sendNow(ev.id, r.guest_id!, r.result === "angemeldet" ? "bestaetigung" : "warteliste");
  // ggf. Nachrück-Mails, die durch abgelaufene Angebote entstanden sind
  await processQueue({ max: 10 }).catch(() => {});

  redirect(`/anmeldung/bestaetigt?t=${r.manage_token}`);
}

export async function declineByCodeAction(form: FormData) {
  const code = normalizeCode(String(form.get("code") ?? ""));
  const { data } = await db().rpc("decline_guest", { p_code: code, p_token: null });
  const r = data as { result: string; guest_id?: string };
  if (r?.guest_id && (r.result === "abgesagt" || r.result === "storniert")) {
    const ev = await getEvent();
    await sendNow(ev.id, r.guest_id, "absage");
    // Nachrücker benachrichtigen (Mail wurde von promote_next eingereiht)
    await processQueue({ max: 10 }).catch(() => {});
  }
  redirect(`/absage?code=${encodeURIComponent(code)}${r?.result === "not_allowed" ? "&fehler=1" : ""}`);
}

export async function declineByTokenAction(form: FormData) {
  const token = String(form.get("token") ?? "");
  const { data } = await db().rpc("decline_guest", { p_code: null, p_token: token });
  const r = data as { result: string; guest_id?: string };
  if (r?.guest_id && (r.result === "abgesagt" || r.result === "storniert")) {
    const ev = await getEvent();
    await sendNow(ev.id, r.guest_id, "absage");
    await processQueue({ max: 10 }).catch(() => {});
  }
  redirect(`/meine-teilnahme/${token}${r?.result === "not_allowed" ? "?hinweis=nicht_moeglich" : ""}`);
}

export async function acceptOfferAction(form: FormData) {
  const token = String(form.get("token") ?? "");
  const { data } = await db().rpc("accept_offer", { p_token: token });
  const r = data as { result: string; guest_id?: string };
  if (r?.result === "angemeldet" && r.guest_id) {
    const ev = await getEvent();
    await sendNow(ev.id, r.guest_id, "bestaetigung");
    redirect(`/meine-teilnahme/${token}`);
  }
  redirect(`/meine-teilnahme/${token}?hinweis=${r?.result === "expired" ? "abgelaufen" : "nicht_moeglich"}`);
}

export async function confirmAttendanceAction(form: FormData) {
  const token = String(form.get("token") ?? "");
  const found = await guestByToken(token);
  if (found && found.guest.status === "angemeldet") {
    await db().from("event_guests").update({ status: "bestaetigt" }).eq("id", found.guest.id);
    await db().from("event_registrations").update({ confirmed_at: new Date().toISOString() }).eq("guest_id", found.guest.id);
  }
  redirect(`/meine-teilnahme/${token}`);
}
