import Link from "next/link";
import { notFound } from "next/navigation";
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
  const waitlist = guest.status === "warteliste";

  return (
    <PageShell>
      <main className="mx-auto max-w-[1040px] px-6 pb-24 pt-16">
        <Progress step={3} />
        <ParticipationSummary
          guest={guest}
          registration={registration}
          headline={waitlist ? "Sie stehen auf der Warteliste." : "Wir sehen uns auf der Strecke."}
          intro={
            waitlist
              ? "Vielen Dank, {name}. Die Plätze für Ihre Wahl sind derzeit vergeben. Sobald ein Platz frei wird, schreiben wir Ihnen."
              : "Vielen Dank, {name}. Ihr Platz ist bestätigt. Die Bestätigung mit allen Details haben wir Ihnen per E-Mail geschickt."
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
