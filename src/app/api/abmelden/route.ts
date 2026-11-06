import { unsubscribe } from "@/lib/unsubscribe";

/** One-Click-Abmeldung (RFC 8058): Mailprogramme schicken einen POST an diese Adresse. */
export async function POST(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  await unsubscribe(t);
  return new Response("OK", { status: 200 });
}

/** Ein Aufruf im Browser führt zur Bestätigungsseite – Link-Scanner melden so niemanden ab. */
export function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  return Response.redirect(new URL(`/abmelden/${encodeURIComponent(t)}`, req.url), 302);
}
