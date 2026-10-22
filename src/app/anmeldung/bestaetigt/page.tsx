import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/site";
import { Progress } from "@/components/progress";
import { ParticipationSummary } from "@/components/participation-summary";
import { guestByToken } from "@/lib/event";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anmeldung bestätigt – FOI Racing" };

export default async function Bestaetigt({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const found = t ? await guestByToken(t) : null;
  if (!found) notFound();
  const { guest, registration } = found;
  // nur direkt nach der Anmeldung sinnvoll – sonst die aktuelle Übersicht zeigen
  if (!["angemeldet", "bestaetigt", "warteliste"].includes(guest.status)) redirect(`/meine-teilnahme/${guest.manage_token}`);
  const waitlist = guest.status === "warteliste";

  return (
    <PageShell>
      <main className="mx-auto max-w-[1040px] px-6 pb-24 pt-16">
        <Progress step={3} />
        <ParticipationSummary
          guest={guest}
          registration={registration}
          headline={waitlist ? "Sie stehen auf der Warteliste." : "Ihr Platz ist reserviert."}
          intro={
            waitlist
              ? "Vielen Dank, {name}. Die Plätze für Ihre Wahl sind derzeit vergeben. Sobald ein Platz frei wird, schreiben wir Ihnen."
              : "Vielen Dank, {name}. Wir haben Ihren Startplatz für Sie reserviert. Alle Details haben wir Ihnen per E-Mail geschickt."
          }
        />
        <div className="mt-6 flex flex-wrap gap-3">
          {!waitlist && (
            <a href={`/api/ics/${guest.manage_token}`} className="btn-gold !min-h-12">In den Kalender eintragen</a>
          )}
          <Link href={`/meine-teilnahme/${guest.manage_token}`} className="btn-ghost">Teilnahme ändern oder absagen</Link>
        </div>
      </main>
    </PageShell>
  );
}
