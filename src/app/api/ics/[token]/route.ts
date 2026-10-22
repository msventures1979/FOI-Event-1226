import { NextResponse } from "next/server";
import { guestByToken } from "@/lib/event";
import { env } from "@/lib/env";
import { buildIcs } from "@/lib/ics";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await guestByToken(token);
  if (!found) return new NextResponse("Nicht gefunden", { status: 404 });
  const ics = buildIcs({ uid: found.guest.id, url: `${env.siteUrl}/meine-teilnahme/${token}` });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="FOI-Racing-2026.ics"',
    },
  });
}
