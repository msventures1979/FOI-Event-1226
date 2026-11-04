import { env } from "@/lib/env";
import { buildWeihnachtsfeierIcs } from "@/lib/ics";

/** Kalendereintrag zur Save-the-Date-Mail. ?t= ist der persönliche Link-Token (nur für die Rücksprungadresse). */
export function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const url = /^[A-Za-z0-9_-]{16,80}$/.test(t) ? `${env.siteUrl}/dabei/${t}` : env.siteUrl;
  return new Response(buildWeihnachtsfeierIcs(url), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="FOI-Weihnachtsfeier-14-Dezember.ics"',
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
