import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/site";
import { Progress } from "@/components/progress";
import { PartnerStrip } from "@/components/partners";
import { RegistrationForm } from "@/components/registration-form";
import { env } from "@/lib/env";
import { getEvent, getFreeSlots, guestByCode, guestByToken } from "@/lib/event";
import { interestOf } from "@/lib/interest";
import type { Guest, ParticipationType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anmeldung – FOI Racing" };

export default async function Anmeldung({ searchParams }: { searchParams: Promise<{ code?: string; t?: string }> }) {
  const { code, t } = await searchParams;

  if (!code && !t) return <CodeEntry />;

  // Vorschau ohne Gästedaten – zeigt das Formular so, wie es ein Gast mit reserviertem Platz sieht; nichts wird gespeichert
  if (t === "vorschau") {
    const ev = await getEvent().catch(() => null);
    const slots = ev ? await getFreeSlots(ev.id) : ({ total: 100, taken: 0, free: 100, own: { max: null, taken: 0, free: 100 }, taxi: { max: null, taken: 0, free: 100 }, dinner: { max: null, taken: 0, free: 100 } } as const);
    return (
      <PageShell>
        <main className="mx-auto max-w-[1040px] px-6 pb-24 pt-16">
          <p className="mb-8 border border-dashed border-gold p-3 text-sm text-gold">Vorschau – hier wird nichts gespeichert und keine Mail verschickt.</p>
          <PartnerStrip />
          <Progress step={2} />
          <RegistrationForm
            guest={{ code: "FOI-VORSCHAU", salutation: "Herr", title: "", first_name: "Max", last_name: "Mustermann", company: "Musterfirma GmbH", position: "Geschäftsführer", email: "max.mustermann@beispiel.de" }}
            slots={slots}
            initialArt="own"
            reservedUntil="2026-11-23T22:59:00Z"
          />
        </main>
      </PageShell>
    );
  }
  if (!env.hasDb) return <CodeEntry info="Die Anmeldung öffnet mit dem Versand der Einladungen Mitte November." />;

  // Persönlicher Link aus der Einladung (?t=…) – kein Code nötig; ?code=… bleibt als Ausweg
  let guest: Guest | null = null;
  let hasRegistration = false;
  if (t) {
    const found = await guestByToken(t);
    if (!found) return <CodeEntry error="Dieser Link ist nicht (mehr) gültig." />;
    guest = found.guest;
    hasRegistration = Boolean(found.registration);
  } else {
    guest = await guestByCode(code!);
    if (!guest) return <CodeEntry code={code} error="Dieser Link ist nicht gültig." />;
    hasRegistration = guest.status !== "eingeladen" && guest.status !== "angeboten";
  }

  // Reservierter Platz (Einladungswelle / Nachrücken ohne bisherige Anmeldung): Formular zeigen
  const reservedUntil =
    guest.status === "angeboten" && !hasRegistration && guest.offer_expires_at && new Date(guest.offer_expires_at) > new Date() ? guest.offer_expires_at : null;

  if (!reservedUntil && ["angemeldet", "bestaetigt", "eingecheckt", "warteliste", "angeboten"].includes(guest.status)) {
    redirect(`/meine-teilnahme/${guest.manage_token}`);
  }

  const ev = await getEvent();
  const closed = ev.status !== "aktiv" || (!reservedUntil && ev.registration_deadline !== null && new Date() > new Date(ev.registration_deadline));
  if (closed) {
    return <CodeEntry info="Die Anmeldung ist geschlossen." />;
  }
  const [slots, interest] = await Promise.all([getFreeSlots(ev.id), interestOf(guest.id)]);
  const initialArt: ParticipationType = interest?.mode === "taxi" ? "taxi" : interest?.mode === "dinner" ? "dinner" : "own";

  return (
    <PageShell>
      <main className="mx-auto max-w-[1040px] px-6 pb-24 pt-16">
        <PartnerStrip />
        <Progress step={2} />
        <RegistrationForm
          guest={{
            code: guest.code,
            salutation: guest.salutation,
            title: guest.title,
            first_name: guest.first_name,
            last_name: guest.last_name,
            company: guest.company,
            position: guest.position,
            email: guest.email,
          }}
          slots={slots}
          initialArt={initialArt}
          reservedUntil={reservedUntil}
        />
      </main>
    </PageShell>
  );
}

function CodeEntry({ error, info }: { code?: string; error?: string; info?: string }) {
  return (
    <PageShell>
      <main className="mx-auto max-w-[1040px] px-6 pb-24 pt-16">
        <Progress step={1} />
        <section className="max-w-[560px]">
          <h1 className="font-display text-[56px] font-bold uppercase leading-none">Ihre Einladung</h1>
          <p className="mb-8 mt-4 text-[17px] leading-relaxed text-[#d1d1d1]">
            Die Anmeldung läuft über den persönlichen Link in Ihrer Einladungsmail – er gilt für eine Person. Bitte öffnen Sie den Button
            „Jetzt verbindlich anmelden“ direkt in der Mail.
          </p>
          <p className="border-l-2 border-gold bg-card p-4 text-[15px] text-[#d1d1d1]">
            {error ?? info ?? "Die Teilnahme ist nur auf persönliche Einladung möglich."} Bei Fragen schreiben Sie uns an{" "}
            <a href="mailto:info@frontlineofinnovation.de" className="text-gold">info@frontlineofinnovation.de</a>.
          </p>
          <p className="mt-10 text-sm text-dim">
            <Link href="/" className="text-dim">Zurück zur Startseite</Link>
          </p>
        </section>
      </main>
    </PageShell>
  );
}
