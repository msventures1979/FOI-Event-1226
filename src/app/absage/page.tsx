import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/site";
import { declineByCodeAction } from "@/app/actions";
import { env } from "@/lib/env";
import { guestByCode } from "@/lib/event";
import { kurzanrede } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Absage – FOI Racing", robots: { index: false } };

/**
 * Absage aus der Einladungsmail. Bewusst mit Bestätigungs-Button statt Ein-Klick-GET,
 * damit Link-Scanner von Mailprogrammen keine Absagen auslösen.
 */
export default async function Absage({ searchParams }: { searchParams: Promise<{ code?: string; fehler?: string }> }) {
  const { code, fehler } = await searchParams;
  if (!code || !env.hasDb) redirect("/");
  const guest = await guestByCode(code);

  let content: React.ReactNode;
  if (!guest) {
    content = <p className="text-[17px]">Dieser Link ist nicht gültig. Bitte schreiben Sie uns an <a href="mailto:info@frontlineofinnovation.de">info@frontlineofinnovation.de</a>.</p>;
  } else if (fehler || ["eingecheckt", "verfallen"].includes(guest.status)) {
    content = (
      <p className="text-[17px]">
        Für Ihre Teilnahme ist eine Absage über diesen Link nicht mehr möglich. Bitte schreiben Sie uns an <a href="mailto:info@frontlineofinnovation.de">info@frontlineofinnovation.de</a>.
      </p>
    );
  } else if (["abgesagt", "storniert"].includes(guest.status)) {
    content = (
      <>
        <h1 className="font-display text-5xl font-bold uppercase leading-none">Ihre Absage ist angekommen.</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-[#d1d1d1]">
          Vielen Dank für die Rückmeldung, {kurzanrede(guest)}. Schade, dass Sie diesmal nicht dabei sein können – wir freuen uns, Sie bei einer der nächsten Runden der Frontline of Innovation zu sehen.
        </p>
      </>
    );
  } else {
    content = (
      <form action={declineByCodeAction}>
        <input type="hidden" name="code" value={guest.code} />
        <h1 className="font-display text-5xl font-bold uppercase leading-none">Leider nicht dabei?</h1>
        <p className="mb-8 mt-5 text-[17px] leading-relaxed text-[#d1d1d1]">
          {kurzanrede(guest)}, bitte bestätigen Sie Ihre Absage für FOI Racing am 14. Dezember. {["angemeldet", "bestaetigt"].includes(guest.status) && "Ihr Platz geht dann an den nächsten Gast auf der Warteliste."}
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn-gold">Absage bestätigen</button>
          <Link href={`/anmeldung?code=${guest.code}`} className="btn-ghost">Doch anmelden</Link>
        </div>
      </form>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-20">{content}</main>
    </PageShell>
  );
}
