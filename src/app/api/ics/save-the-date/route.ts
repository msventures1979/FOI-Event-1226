import { buildTeaserIcs } from "@/lib/ics";

/** Neutraler Kalendereintrag für das Save the Date (Outlook, Apple Kalender). */
export function GET() {
  return new Response(buildTeaserIcs(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Save-the-Date-14-Dezember.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
