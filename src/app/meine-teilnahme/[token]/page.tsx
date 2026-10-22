import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/site";
import { ParticipationSummary } from "@/components/participation-summary";
import { acceptOfferAction, confirmAttendanceAction, declineByTokenAction } from "@/app/actions";
import { guestByToken } from "@/lib/event";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meine Teilnahme – FOI Racing", robots: { index: false } };

export default async function MeineTeilnahme({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ bestaetigen?: string; absagen?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const found = await guestByToken(token);
  if (!found) notFound();
  const { guest, registration } = found;
  const s = guest.status;

  const texts: Record<string, [string, string]> = {
    angemeldet: ["Ihr Platz ist reserviert.", "{name}, Sie sind angemeldet. Hier können Sie Ihre Teilnahme bestätigen oder absagen."],
    bestaetigt: ["Wir sehen uns auf der Strecke.", "{name}, vielen Dank – Ihre Teilnahme ist bestätigt."],
    eingecheckt: ["Willkommen am Hockenheimring.", "{name}, Sie sind eingecheckt."],
    warteliste: ["Sie stehen auf der Warteliste.", "{name}, sobald ein Platz frei wird, schreiben wir Ihnen."],
    angeboten: ["Ein Platz ist frei.", "{name}, für Sie ist ein Platz frei geworden. Bitte nehmen Sie ihn an."],
    abgesagt: ["Ihre Absage ist angekommen.", "{name}, schade, dass Sie diesmal nicht dabei sind."],
    storniert: ["Ihre Absage ist angekommen.", "{name}, Ihr Platz geht an einen anderen Gast. Vielen Dank für die Rückmeldung."],
    verfallen: ["Das Angebot ist abgelaufen.", "{name}, leider ist die Frist für den freien Platz verstrichen. Bitte schreiben Sie uns an info@frontlineofinnovation.de."],
    eingeladen: ["Ihre Einladung ist noch offen.", "{name}, Sie haben sich noch nicht angemeldet."],
  };
  const [headline, intro] = texts[s] ?? texts.eingeladen;
  const canDecline = ["angemeldet", "bestaetigt", "warteliste", "angeboten"].includes(s);

  return (
    <PageShell>
      <main className="mx-auto max-w-[1040px] px-6 pb-24 pt-16">
        <ParticipationSummary guest={guest} registration={registration} headline={headline} intro={intro} />

        <div className="mt-6 flex flex-wrap items-start gap-3">
          {s === "angeboten" && (
            <form action={acceptOfferAction}>
              <input type="hidden" name="token" value={token} />
              <button className="btn-gold">Platz annehmen</button>
              {guest.offer_expires_at && (
                <p className="mt-2 text-sm text-[#a6a6a6]">
                  Bis {new Date(guest.offer_expires_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "full", timeStyle: "short" })} Uhr
                </p>
              )}
            </form>
          )}
          {s === "angemeldet" && (
            <form action={confirmAttendanceAction}>
              <input type="hidden" name="token" value={token} />
              <button className={sp.bestaetigen ? "btn-gold" : "btn-ghost"}>Ich bin dabei – Teilnahme bestätigen</button>
            </form>
          )}
          {["angemeldet", "bestaetigt"].includes(s) && (
            <a href={`/api/ics/${token}`} className="btn-ghost">In den Kalender eintragen</a>
          )}
          {s === "eingeladen" && (
            <Link href={`/anmeldung?code=${guest.code}`} className="btn-gold">Jetzt anmelden</Link>
          )}
        </div>

        {canDecline && (
          <div className="mt-14 border-t border-line pt-8">
            {sp.absagen ? (
              <form action={declineByTokenAction} className="max-w-[560px]">
                <input type="hidden" name="token" value={token} />
                <p className="mb-4 text-[17px]">Möchten Sie Ihre Teilnahme wirklich absagen? Ihr Platz geht dann an den nächsten Gast auf der Warteliste.</p>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-gold">Ja, absagen</button>
                  <Link href={`/meine-teilnahme/${token}`} className="btn-ghost">Nein, zurück</Link>
                </div>
              </form>
            ) : (
              <Link href={`/meine-teilnahme/${token}?absagen=1`} className="text-[15px] text-[#a6a6a6]">
                Ich kann leider doch nicht kommen
              </Link>
            )}
          </div>
        )}
      </main>
    </PageShell>
  );
}
