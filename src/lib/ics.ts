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
    "LOCATION:Hockenheimring",
    "DESCRIPTION:13:00 Eintreffen · 14:00 Racing · 17:00 Early Dinner in der Mercedes-Loge.\\nFrontline of Innovation in Zusammenarbeit mit School of Racing.",
    `URL:${opts.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
