"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/supabase/admin";
import { getEvent, guestByToken, normalizeCode } from "@/lib/event";
import { sendNow } from "@/lib/mail/queue";

const type = z.enum(["own", "taxi", "lambo"]);

const schema = z
  .object({
    code: z.string().min(4),
    participation_type: type,
    second_choice: z.union([type, z.literal("")]).optional(),
    extra_ride: z.boolean(),
    salutation: z.enum(["Herr", "Frau", ""]),
    title: z.string().max(40),
    first_name: z.string().trim().min(1, "Bitte Vornamen angeben"),
    last_name: z.string().trim().min(1, "Bitte Nachnamen angeben"),
    company: z.string().trim().min(1, "Bitte Unternehmen angeben"),
    position: z.string().trim().min(1, "Bitte Position angeben"),
    email: z.string().trim().email("Bitte gültige E-Mail angeben"),
    mobile: z.string().trim().min(6, "Bitte Mobilnummer angeben"),
    diet: z.string().max(60),
    allergies: z.string().max(500),
    consent_photo: z.boolean(),
    consent_terms: z.literal(true, { message: "Bitte Teilnahmebedingungen und Datenschutzhinweise akzeptieren" }),
    consent_waiver: z.boolean(),
    vehicle: z.record(z.string(), z.string()),
    experience: z.string().max(40),
    license_since: z.string().max(10),
    height_cm: z.string().max(10),
  })
  .superRefine((d, ctx) => {
    if (d.participation_type === "own") {
      for (const k of ["marke", "modell", "baujahr", "ps", "kennzeichen", "getriebe", "reifen"]) {
        if (!d.vehicle[k]) ctx.addIssue({ code: "custom", message: "Bitte alle Fahrzeugangaben ausfüllen", path: ["vehicle"] });
      }
      if (!d.license_since) ctx.addIssue({ code: "custom", message: "Bitte angeben, seit wann Sie den Führerschein haben", path: ["license_since"] });
    }
    if (d.participation_type === "lambo" && !d.license_since) {
      ctx.addIssue({ code: "custom", message: "Bitte angeben, seit wann Sie den Führerschein haben", path: ["license_since"] });
    }
    if (d.participation_type !== "lambo" && !d.consent_waiver) {
      ctx.addIssue({ code: "custom", message: "Bitte den Haftungsverzicht der School of Racing bestätigen", path: ["consent_waiver"] });
    }
    if (d.participation_type === "lambo" && !d.consent_waiver) {
      ctx.addIssue({ code: "custom", message: "Bitte die Nutzungsbedingungen des Autohauses Gohm bestätigen", path: ["consent_waiver"] });
    }
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
    vehicle: Object.fromEntries(
      ["marke", "modell", "baujahr", "ps", "kennzeichen", "getriebe", "reifen"].map((k) => [k, s(`vehicle_${k}`)]).filter(([, v]) => v),
    ),
    experience: s("experience"),
    license_since: s("license_since"),
    height_cm: s("height_cm"),
  };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Bitte prüfen Sie Ihre Angaben." };

  const { code, ...data } = parsed.data;
  const { data: res, error } = await db().rpc("register_guest", { p_code: code, p_data: data });
  if (error) {
    console.error(error);
    return { error: "Die Anmeldung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut." };
  }
  const r = res as { result: string; guest_id?: string; manage_token?: string };
  if (r.result === "invalid") return { error: "Dieser Code ist nicht gültig." };
  if (r.result === "closed") return { error: "Die Anmeldung ist geschlossen. Bitte melden Sie sich bei info@frontlineofinnovation.de." };
  if (r.result === "already") redirect(`/meine-teilnahme/${r.manage_token}`);

  const ev = await getEvent();
  if (r.result === "angemeldet") await sendNow(ev.id, r.guest_id!, "bestaetigung");
  if (r.result === "warteliste") await sendNow(ev.id, r.guest_id!, "warteliste");

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
    await import("@/lib/mail/queue").then((m) => m.processQueue({ max: 5 })).catch(() => {});
  }
  redirect(`/absage?code=${encodeURIComponent(code)}&erledigt=1`);
}

export async function declineByTokenAction(form: FormData) {
  const token = String(form.get("token") ?? "");
  const { data } = await db().rpc("decline_guest", { p_code: null, p_token: token });
  const r = data as { result: string; guest_id?: string };
  if (r?.guest_id && (r.result === "abgesagt" || r.result === "storniert")) {
    const ev = await getEvent();
    await sendNow(ev.id, r.guest_id, "absage");
    await import("@/lib/mail/queue").then((m) => m.processQueue({ max: 5 })).catch(() => {});
  }
  redirect(`/meine-teilnahme/${token}`);
}

export async function acceptOfferAction(form: FormData) {
  const token = String(form.get("token") ?? "");
  const { data } = await db().rpc("accept_offer", { p_token: token });
  const r = data as { result: string; guest_id?: string };
  if (r?.result === "angemeldet" && r.guest_id) {
    const ev = await getEvent();
    await sendNow(ev.id, r.guest_id, "bestaetigung");
  }
  redirect(`/meine-teilnahme/${token}`);
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
