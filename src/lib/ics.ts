/** Ablauf je Teilnahmeart – für Bestätigungsmail und Kalendereintrag */
export function ablauf(dinnerOnly: boolean): string[] {
  return dinnerOnly
    ? ["17:00 Eintreffen in der Loge", "Early Dinner und Charity-Auktion"]
    : ["13:00 Eintreffen, Begrüßung und Fahrerbesprechung", "14:00 Auf der Strecke – in Gruppen mit der School of Racing", "17:00 Early Dinner in der Loge, mit Charity-Auktion"];
}

/**
 * Kalendereintrag nach der Anmeldung. Gleiche UID wie der Eintrag aus der Interessensabfrage, damit Outlook/Apple
 * den vorgemerkten Termin aktualisieren statt einen zweiten anzulegen (SEQUENCE höher).
 */
export function buildIcs(opts: { uid?: string; url: string; title?: string; dinnerOnly?: boolean }): string {
  const dinner = Boolean(opts.dinnerOnly);
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
    dinner ? "DTSTART:20261214T160000Z" : "DTSTART:20261214T120000Z",
    "DTEND:20261214T200000Z",
    `SUMMARY:${opts.title ?? "FOI Weihnachtsfeier · Hockenheimring"}`,
    "LOCATION:Hockenheimring\\, Am Motodrom\\, 68766 Hockenheim",
    `DESCRIPTION:Ihre Anmeldung ist bestätigt.\\n${ablauf(dinner).join("\\n")}\\n\\nFrontline of Innovation in Zusammenarbeit mit School of Racing.\\nIhre Teilnahme: ${opts.url}`,
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
    `DESCRIPTION:Persönliche Einladung von Frontline of Innovation und School of Racing.\\nAb 13 Uhr · auf der Strecke ab 14 Uhr · Dinner am frühen Abend in der Loge.\\nNoch unverbindlich – die verbindliche Einladung folgt.\\n\\nIhre Antwort: ${url}`,
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
    "&details=" + encodeURIComponent("Persönliche Einladung von Frontline of Innovation und School of Racing.\nAb 13 Uhr · auf der Strecke ab 14 Uhr · Dinner am frühen Abend in der Loge.\nNoch unverbindlich – die verbindliche Einladung folgt.\n\nIhre Antwort: " + link)
  );
}

/** Google-Kalender-Link nach der Anmeldung */
export function gcalAnmeldung(link: string, dinnerOnly: boolean) {
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent("FOI Weihnachtsfeier · Hockenheimring") +
    "&dates=" + (dinnerOnly ? "20261214T160000Z" : "20261214T120000Z") + "/20261214T200000Z" +
    "&location=" + encodeURIComponent("Hockenheimring, Am Motodrom, 68766 Hockenheim") +
    "&details=" + encodeURIComponent("Ihre Anmeldung ist bestätigt.\n" + ablauf(dinnerOnly).join("\n") + "\n\nIhre Teilnahme: " + link)
  );
}
