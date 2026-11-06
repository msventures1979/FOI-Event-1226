import "server-only";
import { db } from "@/lib/supabase/admin";
import { guestByToken } from "@/lib/event";

/**
 * Abmeldung von Mails zur Interessensabfrage.
 * Wer noch nicht geantwortet hat, wird als „nicht dabei“ vermerkt und bekommt keine Erinnerung mehr.
 * Eine vorhandene Antwort bleibt unverändert.
 */
export async function unsubscribe(token: string): Promise<"ok" | "unbekannt"> {
  const found = await guestByToken(token);
  if (!found) return "unbekannt";
  const supa = db();
  const { data: before } = await supa.from("event_interest").select("answer").eq("guest_id", found.guest.id).maybeSingle();
  if (!before) {
    await supa.from("event_interest").insert({
      guest_id: found.guest.id,
      event_id: found.guest.event_id,
      answer: "nicht",
      mode: "",
      track_group: "",
      vehicle: "",
      note: "Per Abmelde-Link aus der Mail",
      contact_email: "",
    });
  }
  await supa
    .from("status_log")
    .insert({ guest_id: found.guest.id, from_status: before?.answer ?? null, to_status: "abmeldung", actor: "gast" })
    .then(() => undefined, () => undefined);
  return "ok";
}
