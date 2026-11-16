type Art = "own" | "taxi" | "dinner" | null | undefined;

/** Ankunftszeit je Teilnahmeart (Absprache mit Paul Muck, 16.11.2026) */
export function ankunft(art: Art): string {
  return art === "dinner" ? "17:00 Uhr in der Loge" : art === "taxi" ? "14:15 Uhr" : "13:00 Uhr";
}

/** Ablauf je Teilnahmeart – gleiche Stationen wie die Timeline auf der Website.
 *  Für Bestätigungsmail, Kalendereintrag, Bestätigungsseite und „Meine Teilnahme“. */
export function ablauf(art: Art): string[] {
  const abend = ["17:00 Empfang in der Loge", "18:00 Early Dinner, Charity-Auktion und Networking"];
  if (art === "dinner") return ["17:00 Ankunft und Empfang in der Loge", "18:00 Early Dinner, Charity-Auktion und Networking"];
  if (art === "taxi")
    return ["14:15 Ankunft und Check-in", "14:30 Start der Drift-Fahrten, mit einem Profi am Steuer", "16:30 Ende der Fahrzeit, weiter in die Loge", ...abend];
  return [
    "13:00 Ankunft und Check-in: Fahrzeug, Unterlagen, Einteilung in die Gruppen",
    "13:45 Drivers Briefing (PFLICHT): ohne Briefing keine Fahrt auf der Strecke, bitte pünktlich sein",
    "14:30 Start auf der Strecke, in Ihrer Gruppe",
    "16:30 Ende der Fahrzeit, weiter in die Loge",
    ...abend,
  ];
}

const START: Record<string, string> = { own: "20261214T120000Z", taxi: "20261214T131500Z", dinner: "20261214T160000Z" };

/**
 * Kalendereintrag nach der Anmeldung. Gleiche UID wie der Eintrag aus der Interessensabfrage, damit Outlook/Apple
 * den vorgemerkten Termin aktualisieren statt einen zweiten anzulegen (SEQUENCE höher).
 */
export function buildIcs(opts: { uid?: string; url: string; title?: string; art?: Art }): string {
  const art = opts.art ?? "own";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Frontline of Innovation//FOI Racing//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:foi-weihnachtsfeier-2026-12-14@frontlineofinnovation.de",
    "SEQUENCE:1",
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${START[art] ?? START.own}`,
    "DTEND:20261214T200000Z",
    `SUMMARY:${opts.title ?? "FOI Weihnachtsfeier · Hockenheimring"}`,
    "LOCATION:Hockenheimring\\, Am Motodrom\\, 68766 Hockenheim",
    `DESCRIPTION:Ihre Anmeldung ist bestätigt.\\n${ablauf(art).join("\\n")}\\n\\nFrontline of Innovation in Zusammenarbeit mit School of Racing.\\nIhre Teilnahme: ${opts.url}`,
    `URL:${opts.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Neutraler Kalendereintrag für das Save the Date (ganztägig, ohne Ort). */
export function buildTeaserIcs(): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Frontline of Innovation//Save the Date//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:foi-2026-12-14-save-the-date@frontlineofinnovation.de",
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    "DTSTART;VALUE=DATE:20261214",
    "DTEND;VALUE=DATE:20261215",
    "SUMMARY:Frontline of Innovation – Die Weihnachtsfeier der anderen Art",
    "DESCRIPTION:Save the Date. Die persönliche Einladung mit allen Details folgt im November.",
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Save the Date Weihnachtsfeier (Interessensabfrage): fester Termin mit Ort, noch unverbindlich. */
export function buildWeihnachtsfeierIcs(url: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Frontline of Innovation//Weihnachtsfeier//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:foi-weihnachtsfeier-2026-12-14@frontlineofinnovation.de",
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    "DTSTART:20261214T120000Z",
    "DTEND:20261214T200000Z",
    "SUMMARY:FOI Weihnachtsfeier · Hockenheimring (Save the Date)",
    "LOCATION:Hockenheimring\\, Am Motodrom\\, 68766 Hockenheim",
    `DESCRIPTION:Persönliche Einladung von Frontline of Innovation und School of Racing.\\nAb 13 Uhr · auf der Strecke ab 14:30 Uhr · Early Dinner um 18 Uhr in der Loge.\\nNoch unverbindlich – die verbindliche Einladung folgt.\\n\\nIhre Antwort: ${url}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** RFC 5545 §3.1: Zeilen über 75 Oktette umbrechen (Fortsetzung beginnt mit einem Leerzeichen). */
function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74;
    if (enc.encode(cur + ch).length > limit) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n ");
}

/** Google-Kalender-Link zur Weihnachtsfeier (läuft über unsere Domain, damit alle Links der Mail zur Absenderdomain passen). */
export function gcalWeihnachtsfeier(link: string) {
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent("FOI Weihnachtsfeier · Hockenheimring (Save the Date)") +
    "&dates=20261214T120000Z/20261214T200000Z" +
    "&location=" + encodeURIComponent("Hockenheimring, Am Motodrom, 68766 Hockenheim") +
    "&details=" + encodeURIComponent("Persönliche Einladung von Frontline of Innovation und School of Racing.\nAb 13 Uhr · auf der Strecke ab 14:30 Uhr · Early Dinner um 18 Uhr in der Loge.\nNoch unverbindlich – die verbindliche Einladung folgt.\n\nIhre Antwort: " + link)
  );
}

/** Google-Kalender-Link nach der Anmeldung */
export function gcalAnmeldung(link: string, art: Art) {
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent("FOI Weihnachtsfeier · Hockenheimring") +
    "&dates=" + (START[art ?? "own"] ?? START.own) + "/20261214T200000Z" +
    "&location=" + encodeURIComponent("Hockenheimring, Am Motodrom, 68766 Hockenheim") +
    "&details=" + encodeURIComponent("Ihre Anmeldung ist bestätigt.\n" + ablauf(art).join("\n") + "\n\nIhre Teilnahme: " + link)
  );
}
