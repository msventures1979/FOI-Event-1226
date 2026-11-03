import "server-only";
import { db } from "@/lib/supabase/admin";

export type InterestAnswer = "dabei" | "interessiert" | "nicht";
export type InterestMode = "" | "own" | "taxi" | "offen";

export interface Interest {
  guest_id: string;
  event_id: string;
  answer: InterestAnswer;
  mode: InterestMode;
  vehicle: string;
  note: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

export const ANSWERS: { value: InterestAnswer; label: string; hint?: string }[] = [
  { value: "dabei", label: "Ja, ich bin dabei – bitte einen Platz für mich vormerken." },
  { value: "interessiert", label: "Ich bin interessiert, kann den Termin aber noch nicht zusagen." },
  { value: "nicht", label: "Diesmal leider nicht – halten Sie mich für das nächste Event auf dem Laufenden." },
];

export const MODES: { value: Exclude<InterestMode, "">; label: string }[] = [
  { value: "own", label: "Mit meinem eigenen Fahrzeug – mit Instruktor an meiner Seite." },
  { value: "taxi", label: "Als Beifahrer im Renntaxi, mit einem Profi am Steuer." },
  { value: "offen", label: "Das entscheide ich später." },
];

export const ANSWER_SHORT: Record<InterestAnswer, string> = { dabei: "Dabei", interessiert: "Interessiert", nicht: "Nicht dabei" };
export const MODE_SHORT: Record<InterestMode, string> = { "": "", own: "Eigener Wagen", taxi: "Renntaxi", offen: "Noch offen" };

export async function interestCounts(eventId: string): Promise<{ dabei: number; interessiert: number; nicht: number }> {
  const supa = db();
  const count = async (a: InterestAnswer) =>
    (await supa.from("event_interest").select("guest_id", { count: "exact", head: true }).eq("event_id", eventId).eq("answer", a)).count ?? 0;
  const [dabei, interessiert, nicht] = await Promise.all([count("dabei"), count("interessiert"), count("nicht")]);
  return { dabei, interessiert, nicht };
}

export async function interestOf(guestId: string): Promise<Interest | null> {
  const { data } = await db().from("event_interest").select("*").eq("guest_id", guestId).maybeSingle();
  return (data as Interest) ?? null;
}

/** Position unter den „Dabei“-Antworten (nach Zeitpunkt der ersten Zusage) – für Hinweis „Warteliste“ */
export async function dabeiPosition(eventId: string, guestId: string): Promise<number | null> {
  const { data } = await db().from("event_interest").select("guest_id").eq("event_id", eventId).eq("answer", "dabei").order("created_at").order("guest_id");
  const i = (data ?? []).findIndex((r) => r.guest_id === guestId);
  return i < 0 ? null : i + 1;
}
