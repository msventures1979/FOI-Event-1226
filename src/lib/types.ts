export type ParticipationType = "own" | "taxi";

export const PARTICIPATION: Record<ParticipationType, { num: string; title: string; short: string; text: string }> = {
  own: {
    num: "01",
    title: "Mit dem eigenen Wagen",
    short: "Eigener Wagen",
    text: "Sie fahren Ihr eigenes Fahrzeug, in einer von drei Gruppen von Rookie bis Race. Wer zum ersten Mal auf der Rennstrecke ist, fährt geführt – mit Tipps per Funk direkt ins Auto.",
  },
  taxi: {
    num: "02",
    title: "Renntaxi",
    short: "Renntaxi",
    text: "Sie sitzen auf dem Beifahrersitz, am Steuer ein Profi. Mehrere Runden im Renntempo, ohne selbst fahren zu müssen.",
  },
};

export const PARTICIPATION_TYPES: ParticipationType[] = ["own", "taxi"];

export type GuestStatus =
  | "eingeladen"
  | "angemeldet"
  | "bestaetigt"
  | "warteliste"
  | "angeboten"
  | "abgesagt"
  | "storniert"
  | "eingecheckt"
  | "verfallen";

export const STATUS_LABEL: Record<GuestStatus, string> = {
  eingeladen: "Eingeladen",
  angemeldet: "Angemeldet",
  bestaetigt: "Bestätigt",
  warteliste: "Warteliste",
  angeboten: "Platz angeboten",
  abgesagt: "Abgesagt",
  storniert: "Storniert",
  eingecheckt: "Eingecheckt",
  verfallen: "Angebot verfallen",
};

export interface Guest {
  id: string;
  event_id: string;
  salutation: "Herr" | "Frau" | "";
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  position: string;
  linkedin: string;
  note: string;
  code: string;
  manage_token: string;
  status: GuestStatus;
  waitlist_position: number | null;
  offer_expires_at: string | null;
  bounced: boolean;
  created_at: string;
}

export interface Registration {
  guest_id: string;
  requested_type: ParticipationType;
  participation_type: ParticipationType | null;
  second_choice: ParticipationType | null;
  extra_ride: boolean;
  mobile: string;
  vehicle: Record<string, string>;
  experience: string;
  license_since: string;
  height_cm: string;
  diet: string;
  allergies: string;
  companion: string;
  consent_photo: boolean;
  start_number: number | null;
  confirmed_at: string | null;
  checked_in_at: string | null;
}

export interface EventRow {
  id: string;
  slug: string;
  name: string;
  starts_at: string;
  location: string;
  registration_deadline: string | null;
  total_capacity: number;
  status: string;
}

export interface FreeSlots {
  total: number;
  taken: number;
  free: number;
  own: { max: number | null; taken: number; free: number };
  taxi: { max: number | null; taken: number; free: number };
}

/** „Sehr geehrter Herr Dr. Müller“ / „Sehr geehrte Frau Müller“ / „Guten Tag Max Müller“ */
export function briefanrede(g: Pick<Guest, "salutation" | "title" | "first_name" | "last_name">): string {
  const name = (...p: (string | null | undefined)[]) => p.map((x) => x?.trim()).filter(Boolean).join(" ");
  if (g.salutation === "Herr") return `Sehr geehrter ${name("Herr", g.title, g.last_name)}`;
  if (g.salutation === "Frau") return `Sehr geehrte ${name("Frau", g.title, g.last_name)}`;
  return `Guten Tag ${name(g.title, g.first_name, g.last_name)}`;
}

/** „Herr Müller“ für die Bestätigungsseite */
export function kurzanrede(g: Pick<Guest, "salutation" | "title" | "first_name" | "last_name">): string {
  const name = (...p: (string | null | undefined)[]) => p.map((x) => x?.trim()).filter(Boolean).join(" ");
  if (g.salutation) return name(g.salutation, g.title, g.last_name);
  return name(g.title, g.first_name, g.last_name);
}
