/** Kalendereintrag für FOI Racing (14.12.2026, 13:00–21:00 Europe/Berlin) */
export function buildIcs(opts: { uid: string; url: string; title?: string }): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Frontline of Innovation//FOI Racing//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@frontlineofinnovation.de`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    "DTSTART:20261214T120000Z",
    "DTEND:20261214T200000Z",
    `SUMMARY:${opts.title ?? "FOI Racing – Die Weihnachtsfeier der anderen Art"}`,
    "LOCATION:Hockenheimring\\, Am Motodrom\\, 68766 Hockenheim",
    "DESCRIPTION:13:00 Eintreffen · 14:00 Racing · 17:00 Early Dinner in der Mercedes-Loge.\\nFrontline of Innovation in Zusammenarbeit mit School of Racing.",
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
