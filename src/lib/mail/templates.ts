import { briefanrede, PARTICIPATION, type Guest, type ParticipationType } from "../types";

export type MailType =
  | "save_the_date"
  | "einladung"
  | "erinnerung"
  | "bestaetigung"
  | "warteliste"
  | "platz_frei"
  | "absage"
  | "letzte_infos"
  | "vorabend"
  | "danke";

export const MAIL_LABEL: Record<MailType, string> = {
  save_the_date: "1 · Save the Date",
  einladung: "2 · Einladung mit Code",
  erinnerung: "3 · Erinnerung Code",
  bestaetigung: "4 · Anmeldebestätigung",
  warteliste: "5 · Warteliste",
  platz_frei: "6 · Platz frei geworden",
  absage: "7 · Absagebestätigung",
  letzte_infos: "8 · Letzte Infos + bestätigen",
  vorabend: "9 · Am Montag geht es los",
  danke: "10 · Danke & Fotos",
};

export interface MailContext {
  guest: Pick<Guest, "salutation" | "title" | "first_name" | "last_name" | "code" | "manage_token"> & Partial<Pick<Guest, "status">>;
  siteUrl: string;
  participationType?: ParticipationType | null;
  offerExpiresAt?: string | null;
  freeSlots?: number | null;
}

export interface RenderedMail {
  subject: string;
  html: string;
  text: string;
  /** Abweichender Absender (z. B. neutral für das Save the Date) */
  from?: string;
}

/** Für das Save the Date: nichts darf auf Auto/Rennen hindeuten – auch nicht Absender, Links oder Bildadressen. */
export const TEASER_FROM = `"Matthias Storch | Frontline of Innovation" <info@frontlineofinnovation.de>`;
const TEASER_ASSETS = "https://foi-event-1226.vercel.app";

const GRUSS = "Herzliche Grüße aus Mannheim\nMatthias Storch und Süleyman Acar";
const FAKTEN = "Montag, 14. Dezember 2026 · Hockenheimring\n13:00 Eintreffen · 14:00 Racing · 17:00 Early Dinner in der Mercedes-Loge";

type Block =
  | { p: string }
  | { ps: string }
  | { hero: { kicker: string; line1: string; line2: string; image?: string } }
  | { facts: string }
  | { code: string }
  | { buttons: { label: string; href: string; primary?: boolean }[] };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", { timeZone: "Europe/Berlin", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + " Uhr";
}

export function renderMail(type: MailType, ctx: MailContext): RenderedMail {
  const g = ctx.guest;
  const anrede = `${briefanrede(g)},`;
  const anmelden = `${ctx.siteUrl}/anmeldung?code=${encodeURIComponent(g.code)}`;
  const absagen = `${ctx.siteUrl}/absage?code=${encodeURIComponent(g.code)}`;
  const verwalten = `${ctx.siteUrl}/meine-teilnahme/${g.manage_token}`;
  const art = ctx.participationType ? PARTICIPATION[ctx.participationType].title : "";

  let subject = "";
  let preheader = "";
  let from: string | undefined;
  let assets = ctx.siteUrl;
  let footer = "Frontline of Innovation · in Zusammenarbeit mit School of Racing";
  let blocks: Block[] = [];

  switch (type) {
    case "save_the_date": {
      // Bewusst neutral: kein Bild, kein Ort, kein Link zur Event-Seite
      const gcal =
        "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=" + encodeURIComponent("Frontline of Innovation – Die Weihnachtsfeier der anderen Art") +
        "&dates=20261214/20261215" +
        "&details=" + encodeURIComponent("Save the Date. Die persönliche Einladung mit allen Details folgt im November.");
      subject = "14.12. – mehr verraten wir noch nicht";
      preheader = "Die Weihnachtsfeier der anderen Art: Bitte merken Sie sich den Termin schon heute vor.";
      from = TEASER_FROM;
      assets = TEASER_ASSETS;
      footer = "Frontline of Innovation";
      blocks = [
        { hero: { kicker: "Save the Date · Montag, 14. Dezember 2026", line1: "Die Weihnachtsfeier", line2: "der anderen Art." } },
        { p: "das Jahr neigt sich dem Ende zu – und wir möchten es gern gemeinsam mit Ihnen ausklingen lassen. Allerdings nicht ganz so, wie man es von einer Weihnachtsfeier erwartet." },
        { p: "Was genau wir vorhaben, verraten wir noch nicht. Nur so viel: Es wird ein Nachmittag und Abend, wie Sie ihn mit der Frontline of Innovation noch nicht erlebt haben – mit guten Gesprächen, ein paar Überraschungen und einem Zweck, der über den Tag hinausgeht." },
        { facts: "Montag, 14. Dezember 2026 · Nachmittag und Abend\nIn der Region Rhein-Neckar\nIhre persönliche Einladung mit allen Details folgt im November" },
        { p: "Bitte merken Sie sich den Termin schon heute vor – wir würden uns sehr freuen, wenn Sie dabei sind. Den Kalendereintrag finden Sie auch im Anhang dieser Mail." },
        { buttons: [{ label: "In Outlook / Apple Kalender eintragen", href: `${TEASER_ASSETS}/api/ics/save-the-date`, primary: true }, { label: "Google Kalender", href: gcal }] },
        { ps: "P.S. Einen kleinen Hinweis, was Sie erwartet, schicken wir Ihnen Anfang November. Und wenn Sie sich den Termin schon notiert haben, freuen wir uns über eine kurze Antwort auf diese Mail." },
      ];
      break;
    }
    case "einladung":
      subject = "Ihre Einladung: FOI Racing am 14. Dezember";
      blocks = [
        { p: "wir laden Sie herzlich zur Weihnachtsfeier der anderen Art ein: FOI Racing auf dem Hockenheimring." },
        { facts: FAKTEN + ", mit einem Überraschungsgast und einer Charity-Auktion" },
        { p: "Sie fahren Ihren eigenen Wagen oder einen Lamborghini, oder Sie steigen ins Renntaxi. Die Teilnahme ist für Sie kostenfrei. Es gibt 80 Plätze; sie werden in der Reihenfolge der Anmeldung vergeben." },
        { code: g.code },
        { buttons: [{ label: "Jetzt anmelden", href: anmelden, primary: true }, { label: "Leider nicht dabei", href: absagen }] },
      ];
      break;
    case "erinnerung":
      subject = "Erinnerung: Ihr Platz bei FOI Racing";
      blocks = [
        { p: "Ihre Einladung zur FOI-Weihnachtsfeier am 14. Dezember ist noch offen. " + (ctx.freeSlots != null && ctx.freeSlots < 20 ? `Es sind noch ${ctx.freeSlots} Plätze frei.` : "Die Plätze sind begrenzt.") },
        { code: g.code },
        { buttons: [{ label: "Jetzt anmelden", href: anmelden, primary: true }, { label: "Leider nicht dabei", href: absagen }] },
      ];
      break;
    case "bestaetigung":
      subject = "Anmeldung bestätigt: FOI Racing am 14. Dezember";
      blocks = [
        { p: "vielen Dank für Ihre Anmeldung – Ihr Startplatz ist für Sie reserviert." },
        { facts: `Teilnahmeart: ${art}\nMontag, 14. Dezember 2026, Eintreffen 13:00 Uhr\nHockenheimring, Am Motodrom, 68766 Hockenheim` },
        { p: "Alle Details zu Treffpunkt, Parken und Ablauf schicken wir Ihnen eine Woche vor dem Termin." },
        { p: "Den Kalendereintrag finden Sie im Anhang. Falls sich Ihre Pläne ändern, sagen Sie bitte über diesen Link ab, damit wir den Platz weitergeben können." },
        { buttons: [{ label: "Teilnahme verwalten", href: verwalten }] },
      ];
      break;
    case "warteliste":
      subject = "Warteliste: FOI Racing am 14. Dezember";
      blocks = [
        { p: "vielen Dank für Ihre Anmeldung. Die Plätze für Ihre Wahl sind derzeit vergeben; wir haben Sie auf die Warteliste gesetzt." },
        { p: "Sobald ein Platz frei wird, schreiben wir Ihnen. Sie haben dann einige Zeit, ihn anzunehmen." },
        { buttons: [{ label: "Meine Anmeldung ansehen", href: verwalten }] },
      ];
      break;
    case "platz_frei":
      subject = "Ein Platz ist frei: FOI Racing am 14. Dezember";
      blocks = [
        { p: `für Sie ist ein Platz bei FOI Racing frei geworden${art ? ` (${art})` : ""}.` },
        { p: ctx.offerExpiresAt ? `Bitte nehmen Sie ihn bis ${fmtDate(ctx.offerExpiresAt)} an. Danach geht er an den nächsten Gast auf der Warteliste.` : "Bitte nehmen Sie ihn zeitnah an." },
        { buttons: [{ label: "Platz annehmen", href: verwalten, primary: true }] },
      ];
      break;
    case "absage":
      subject = "Ihre Absage: FOI Racing am 14. Dezember";
      blocks = [
        { p: "schade, dass Sie diesmal nicht dabei sein können. Ihre Absage ist bei uns angekommen" + (g.status === "storniert" ? "; Ihr Platz geht an einen anderen Gast." : ".") },
        { p: "Wir freuen uns, Sie bei einer der nächsten Runden der Frontline of Innovation zu sehen." },
      ];
      break;
    case "letzte_infos":
      subject = "In einer Woche: FOI Racing am 14. Dezember";
      blocks = [
        { p: "in einer Woche sehen wir uns auf dem Hockenheimring." },
        { facts: `Eintreffen 13:00 Uhr · Treffpunkt [Eingang] · Parken [Hinweis]\nIhre Teilnahme: ${art}` },
        { p: "Bitte denken Sie an [warme, wetterfeste Kleidung; Helm/Reifen bei eigenem Wagen].." },
        { p: "Bitte bestätigen Sie kurz, dass es bei Ihrer Teilnahme bleibt. Bitte geben Sie uns bis zum 10. Dezember Bescheid." },
        { buttons: [{ label: "Ich bin dabei", href: `${verwalten}?bestaetigen=1`, primary: true }, { label: "Ich muss leider absagen", href: `${verwalten}?absagen=1` }] },
      ];
      break;
    case "vorabend":
      subject = "Am Montag geht es los: FOI Racing";
      blocks = [
        { p: "am Montag ist es so weit. Wir freuen uns auf Sie." },
        { facts: `Eintreffen 13:00 Uhr · [Treffpunkt]\nIhre Teilnahme: ${art}\nBei Fragen am Tag: [Telefonnummer vor Ort]` },
        { buttons: [{ label: "Meine Teilnahme", href: verwalten }] },
      ];
      break;
    case "danke":
      subject = "Danke für einen besonderen Tag – FOI Racing";
      blocks = [
        { p: "vielen Dank, dass Sie dabei waren. Wir hoffen, der Tag auf der Strecke und der Abend in der Mercedes-Loge bleiben Ihnen in Erinnerung." },
        { p: "Die Fotos des Tages finden Sie hier: [Link zur Galerie]" },
      ];
      break;
  }

  const text = toText(anrede, blocks);
  // Sicherung: Mails mit offenen Platzhaltern wie „[Treffpunkt]“ werden nie verschickt
  const open = text.match(/\[[^\]\n]{2,}\]/g);
  if (open) throw new MailPlaceholderError(`Mail „${MAIL_LABEL[type]}“ enthält noch Platzhalter: ${[...new Set(open)].join(", ")}`);
  return { subject, html: toHtml(anrede, blocks, assets, preheader, footer, type === "save_the_date"), text: text.replace("—\nFrontline of Innovation · info@frontlineofinnovation.de", `—\n${footer} · info@frontlineofinnovation.de`), from };
}

export class MailPlaceholderError extends Error {}

/** Prüft, ob eine Mail versandbereit ist (für Admin-Hinweise). */
export function mailReady(type: MailType, ctx: MailContext): string | null {
  try {
    renderMail(type, ctx);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toText(anrede: string, blocks: Block[]): string {
  const hero = blocks.find((b) => "hero" in b) as { hero: { kicker: string; line1: string; line2: string } } | undefined;
  const parts = hero ? [`${hero.hero.kicker.toUpperCase()}\n${hero.hero.line1} ${hero.hero.line2}`, anrede] : [anrede];
  for (const b of blocks) {
    if ("p" in b) parts.push(b.p);
    if ("facts" in b) parts.push(b.facts);
    if ("code" in b) parts.push(`Ihr persönlicher Code: ${b.code}`);
    if ("buttons" in b) parts.push(b.buttons.map((x) => `${x.label}: ${x.href}`).join("\n"));
  }
  parts.push(GRUSS);
  for (const b of blocks) if ("ps" in b) parts.push(b.ps);
  parts.push("—\nFrontline of Innovation · info@frontlineofinnovation.de");
  return parts.join("\n\n");
}

function toHtml(anrede: string, blocks: Block[], siteUrl: string, preheader = "", footer = "Frontline of Innovation · in Zusammenarbeit mit School of Racing", neutral = false): string {
  const heroBlock = blocks.find((b) => "hero" in b) as { hero: { kicker: string; line1: string; line2: string; image?: string } } | undefined;
  const hero = heroBlock
    ? `${heroBlock.hero.image ? `<tr><td style="background:#000;line-height:0"><img src="${esc(heroBlock.hero.image)}" width="600" alt="Sportwagen auf dem Hockenheimring" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>` : ""}
<tr><td style="background:#000;padding:22px 28px 28px;font-family:Arial,Helvetica,sans-serif">
<p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#E6941A">${esc(heroBlock.hero.kicker)}</p>
<p style="margin:0;font-family:Impact,'Arial Narrow Bold','Arial Black',Arial,sans-serif;font-size:38px;line-height:1.05;text-transform:uppercase;color:#ffffff">${esc(heroBlock.hero.line1)}<br><span style="color:#E6941A">${esc(heroBlock.hero.line2)}</span></p>
</td></tr>`
    : "";
  const ps = blocks.filter((b): b is { ps: string } => "ps" in b).map((b) => `<p style="margin:20px 0 0;font-size:15px;color:#444">${esc(b.ps)}</p>`).join("");
  const body = blocks
    .filter((b) => !("hero" in b) && !("ps" in b))
    .map((b) => {
      if ("p" in b) return `<p style="margin:0 0 16px">${esc(b.p)}</p>`;
      if ("facts" in b)
        return `<p style="margin:0 0 16px;padding:14px 16px;border-left:3px solid #E6941A;background:#f6f6f4;font-size:15px">${esc(b.facts).replace(/\n/g, "<br>")}</p>`;
      if ("code" in b)
        return `<p style="margin:0 0 16px">Ihr persönlicher Code:<br><span style="display:inline-block;margin-top:6px;padding:8px 14px;background:#000;color:#fff;font-family:'Courier New',monospace;font-size:20px;letter-spacing:3px">${esc(b.code)}</span></p>`;
      if (!("buttons" in b)) return "";
      return `<p style="margin:8px 0 20px">${b.buttons
        .map((x) =>
          x.primary
            ? `<a href="${esc(x.href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 22px;background:#E6941A;color:#000;font-weight:bold;text-decoration:none;border-radius:2px">${esc(x.label)}</a>`
            : `<a href="${esc(x.href)}" style="display:inline-block;margin:0 8px 8px 0;padding:11px 20px;border:1px solid #999;color:#333;text-decoration:none;border-radius:2px">${esc(x.label)}</a>`,
        )
        .join("")}</p>`;
    })
    .join("\n");

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#efefed">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#efefed">${esc(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efefed"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff">
<tr><td style="background:#000;padding:22px 28px"><img src="${siteUrl}/images/foi-logo.png" alt="Frontline of Innovation" height="36" style="display:block;height:36px"></td></tr>
${hero}
${neutral ? `<tr><td style="height:4px;background:#E6941A;line-height:4px;font-size:0">&nbsp;</td></tr>` : `<tr><td style="height:6px;background:repeating-linear-gradient(90deg,#000 0 6px,#fff 6px 12px)"></td></tr>`}
<tr><td style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#1a1a1a">
<p style="margin:0 0 16px">${esc(anrede)}</p>
${body}
<p style="margin:24px 0 0">${esc(GRUSS).replace(/\n/g, "<br>")}</p>
${ps}
</td></tr>
<tr><td style="padding:24px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#888">${esc(footer)} · <a href="mailto:info@frontlineofinnovation.de" style="color:#888">info@frontlineofinnovation.de</a></td></tr>
</table></td></tr></table></body></html>`;
}
