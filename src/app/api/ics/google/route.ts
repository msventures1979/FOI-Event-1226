import { env } from "@/lib/env";
import { gcalWeihnachtsfeier } from "@/lib/ics";

export function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const url = /^[A-Za-z0-9_-]{16,80}$/.test(t) ? `${env.siteUrl}/dabei/${t}` : env.siteUrl;
  return Response.redirect(gcalWeihnachtsfeier(url), 302);
}
