import "server-only";
import { db } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { EventRow, FreeSlots, Guest, Registration } from "@/lib/types";

export async function getEvent(): Promise<EventRow> {
  const { data, error } = await db().from("events").select("*").eq("slug", env.eventSlug).single();
  if (error || !data) throw new Error(`Event ${env.eventSlug} nicht gefunden: ${error?.message}`);
  return data as EventRow;
}

export async function getFreeSlots(eventId: string): Promise<FreeSlots> {
  const { data, error } = await db().rpc("free_slots", { p_event: eventId });
  if (error) throw error;
  return data as FreeSlots;
}

/** Freie Plätze für die öffentliche Seite – ohne Datenbank (z. B. lokal) einfach null. */
export async function getPublicFreeSlots(): Promise<FreeSlots | null> {
  if (!env.hasDb) return null;
  try {
    const ev = await getEvent();
    return await getFreeSlots(ev.id);
  } catch {
    return null;
  }
}

export function normalizeCode(code: string): string {
  // „foi k7mp q2xa“, „FOI-K7MPQ2XA“, „k7mpq2xa“ → „FOI-K7MPQ2XA“
  const raw = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const rest = raw.startsWith("FOI") && raw.length > 8 ? raw.slice(3) : raw;
  return rest ? `FOI-${rest}` : "";
}

export async function guestByCode(code: string): Promise<Guest | null> {
  const { data } = await db().from("event_guests").select("*").eq("code", normalizeCode(code)).maybeSingle();
  return (data as Guest) ?? null;
}

export async function guestByToken(token: string): Promise<{ guest: Guest; registration: Registration | null } | null> {
  if (!/^[a-f0-9]{20,64}$/.test(token)) return null;
  const { data } = await db()
    .from("event_guests")
    .select("*, event_registrations(*)")
    .eq("manage_token", token)
    .maybeSingle();
  if (!data) return null;
  const { event_registrations, ...guest } = data as Guest & { event_registrations: Registration | Registration[] | null };
  const registration = Array.isArray(event_registrations) ? event_registrations[0] ?? null : event_registrations;
  return { guest: guest as Guest, registration };
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne 0/O, 1/I

export function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8)); // 32^8 ≈ 10^12 Kombinationen
  return "FOI-" + Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}
