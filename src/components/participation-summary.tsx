import { kurzanrede, PARTICIPATION, STATUS_LABEL, type Guest, type Registration } from "@/lib/types";

export function ParticipationSummary({ guest, registration, headline, intro }: { guest: Guest; registration: Registration | null; headline: string; intro: string }) {
  const type = registration?.participation_type ?? registration?.requested_type ?? null;
  return (
    <section className="border border-line-strong bg-card">
      <div aria-hidden className="checker-sm h-2.5" />
      <div className="grid gap-10 p-8 md:grid-cols-2 md:p-12">
        <div>
          <p className="eyebrow mb-3">{STATUS_LABEL[guest.status]}</p>
          <h1 className="font-display text-[clamp(36px,5vw,52px)] font-bold uppercase leading-none">{headline}</h1>
          <p className="mt-5 text-[17px] leading-relaxed text-[#d1d1d1]">
            {intro.replace("{name}", kurzanrede(guest))}
          </p>
        </div>
        <dl className="grid content-start gap-x-6 gap-y-3.5 text-base [grid-template-columns:auto_1fr]">
          <dt className="text-[#a6a6a6]">Name</dt>
          <dd>{kurzanrede(guest)}</dd>
          {type && (
            <>
              <dt className="text-[#a6a6a6]">{registration?.participation_type ? "Teilnahme" : "Gewünscht"}</dt>
              <dd className="font-semibold">{PARTICIPATION[type].title}</dd>
            </>
          )}
          <dt className="text-[#a6a6a6]">Datum</dt>
          <dd>Montag, 14. Dezember 2026</dd>
          <dt className="text-[#a6a6a6]">Eintreffen</dt>
          <dd>13:00 Uhr</dd>
          <dt className="text-[#a6a6a6]">Ort</dt>
          <dd>Hockenheimring, Am Motodrom, 68766 Hockenheim</dd>
          {registration?.start_number && ["angemeldet", "bestaetigt", "eingecheckt"].includes(guest.status) && (
            <>
              <dt className="text-[#a6a6a6]">Startnummer</dt>
              <dd className="font-display text-[22px] text-gold">#{registration.start_number}</dd>
            </>
          )}
        </dl>
      </div>
    </section>
  );
}
