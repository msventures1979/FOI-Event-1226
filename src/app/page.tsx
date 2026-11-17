import { Person } from "@/components/person";
import Image from "next/image";
import { Timeline } from "@/components/timeline";
import { PageShell } from "@/components/site";
import { getPublicFreeSlots } from "@/lib/event";
import { PARTICIPATION } from "@/lib/types";

export const revalidate = 60;

const FAQ: { q: string; a: string }[] = [
  { q: "Was kostet die Teilnahme?", a: "Nichts. Die Partner des Tages übernehmen die Kosten." },
  { q: "Was brauche ich für die Fahrt mit dem eigenen Wagen?", a: "Für die Fahrt mit dem eigenen Wagen füllen Sie vorab eine Verzichtserklärung der School of Racing aus. Die Unterlagen dazu erhalten Sie nach Ihrer Anmeldung, zusammen mit allen Hinweisen zu Fahrzeug und Ausrüstung." },
  { q: "Bin ich versichert?", a: "Wer mit dem eigenen Wagen fährt, unterzeichnet vorab eine Verzichtserklärung der School of Racing; sie kommt nach der Anmeldung. Bitte prüfen Sie außerdem, ob Ihre Kfz-Versicherung Fahrten auf der Rennstrecke abdeckt – das ist meist nicht der Fall." },
  { q: "Was passiert bei Regen oder Schnee?", a: "Darüber informieren wir Sie rechtzeitig vor dem Termin." },
  { q: "Was ziehe ich an?", a: "Für die Strecke warme, wetterfeste Kleidung – es ist Dezember. Alles Weitere zum Abend geben wir rechtzeitig bekannt." },
  { q: "Wie komme ich hin, wo parke ich?", a: "Der Hockenheimring liegt Am Motodrom, 68766 Hockenheim. Treffpunkt und Parken geben wir rechtzeitig vor dem Termin bekannt." },
  { q: "Kann ich eine Begleitung mitbringen?", a: "Die Einladung gilt persönlich. Wenn Sie eine Begleitung mitbringen möchten, schreiben Sie uns bitte vorab an info@frontlineofinnovation.de." },
  {
    q: "Was, wenn ich doch nicht kommen kann?",
    a: "Nutzen Sie den Link „Leider nicht dabei“ in Ihrer Einladung oder den Link in Ihrer Bestätigungsmail. Ihr Platz geht dann an den nächsten Gast auf der Warteliste.",
  },
];

export default async function Home() {
  const slots = await getPublicFreeSlots();
  const showFree = slots !== null && slots.free < 20;

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative border-b border-line">
        <Image src="/images/hero-track.jpg" alt="" aria-hidden fill priority sizes="100vw" className="photo object-cover object-[70%_50%]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.96)_0%,rgba(0,0,0,.86)_48%,rgba(0,0,0,.4)_100%)]" />
        <div className="relative mx-auto grid max-w-[1240px] items-end gap-14 px-6 pb-16 pt-[72px] md:grid-cols-2">
          <div>
            <p className="eyebrow mb-6 !text-[15px] !tracking-[0.22em]">FOI Racing · Montag, 14. Dezember 2026 · Hockenheimring</p>
            <h1 className="font-display text-[clamp(42px,5vw,72px)] font-bold uppercase leading-[0.95]">
              Die Weihnachts&shy;feier
              <br />
              <span className="text-gold">der anderen Art.</span>
            </h1>
            <p className="mt-8 max-w-[560px] text-[19px] leading-relaxed text-[#ddd]">
              Ein Nachmittag auf der Strecke, ein Abend in der Loge. Für die Gäste der Frontline of Innovation – auf persönliche Einladung.
            </p>
            <p className="mt-10 max-w-[560px] border-l-2 border-gold bg-black/60 px-5 py-4 text-[16px] leading-relaxed text-[#ddd]">
              Die Teilnahme ist nur auf persönliche Einladung möglich. Eingeladene Gäste finden hier alle Informationen zum Tag – angemeldet wird über den Link in der Einladung.
            </p>
          </div>
          <div className="border border-line-strong bg-[rgba(10,10,10,.92)]">
            <div aria-hidden className="checker-sm h-2.5 opacity-90" />
            <h2 className="px-7 pb-2.5 pt-6 font-display text-[13px] font-medium uppercase tracking-[0.2em] text-dim">Startaufstellung</h2>
            <dl className="grid grid-cols-2">
              <Stat value={showFree ? `${slots!.free}` : "100"} label={showFree ? "Plätze noch frei" : "Plätze, nicht mehr"} border="br" />
              <Stat value="3" label="Arten, dabei zu sein" border="b" />
              <Stat value="1" label="Charity-Auktion für den guten Zweck" border="r" />
              <Stat value="7" label="Partner, die den Tag möglich machen" gold />
            </dl>
          </div>
        </div>
      </section>

      {/* Partnerleiste */}
      <section aria-label="Partner" className="border-b border-line bg-[#050505]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-12 gap-y-6 px-6 py-7">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
            <span className="font-display text-xs uppercase tracking-[0.22em] text-gold">Partner</span>
            <a href="https://www.school-of-racing.de" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/school-of-racing.svg" alt="School of Racing" width={55} height={44} unoptimized className="h-[44px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
            <a href="https://kosklima.de" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/kos-klima.png" alt="KOS Klima" width={118} height={20} className="h-5 w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
            <a href="https://www.unzer.com/de/" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/unzer.png" alt="UNZER" width={97} height={22} className="h-[22px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
            <a href="https://www.billiger.de" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/billiger.png" alt="billiger.de" width={79} height={26} className="h-[26px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
            <a href="https://ox8-cf.com" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/ox8.png" alt="ox8 Corporate Finance" width={54} height={34} className="h-[34px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
            <a href="https://covado.de/" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/covado.png" alt="COVADO Trusted Advisor" width={108} height={30} className="h-[30px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
            <a href="https://rohdebaier.de/" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/rohde-baier.png" alt="ROHDE BAIER" width={152} height={16} className="h-[16px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-b border-line">
        <p className="px-6 py-5 text-center font-display text-[22px] uppercase leading-relaxed tracking-[0.12em] text-[#8c8c8c]">
          {["Eigener Wagen", "Drift-Beifahrer", "Early Dinner", "Charity-Auktion"].map((w, i) => (
            <span key={w}>
              {i > 0 && <span aria-hidden className="text-gold"> / </span>}
              {w}
            </span>
          ))}
        </p>
      </div>

      {/* Anlass */}
      <section aria-labelledby="anlass-h" className="mx-auto grid max-w-[1240px] gap-14 px-6 py-20 md:grid-cols-2">
        <h2 id="anlass-h" className="h-section">Zum Jahresende tauschen wir den Tisch gegen die Strecke.</h2>
        <div className="flex flex-col gap-5 text-lg leading-[1.65] text-[#d1d1d1]">
          <p>Zweimal im Jahr bringt Frontline of Innovation Entscheiderinnen und Entscheider aus Wirtschaft, Sport, Wissenschaft und Politik an einen Tisch. Im Dezember feiern wir anders.</p>
          <p>
            Gemeinsam mit Paul Muck und der School of Racing laden wir Sie auf den Hockenheimring ein. Sie fahren mit Ihrem eigenen Auto auf die Strecke. Wer zum ersten Mal Rennstreckenluft schnuppert, fährt geführt – mit Tipps per Funk direkt ins Auto, Runde für Runde. Oder Sie steigen als Beifahrer zu einem Profi in den Drift-Wagen. Und wer nur zum Abend kommen möchte, ist beim Dinner herzlich willkommen.
          </p>
          <p>Danach geht es weiter wie an jedem FOI-Abend: mit einem frühen Dinner, einer Charity-Auktion und Gesprächen, die es ohne diesen Tag nie gegeben hätte.</p>
        </div>
      </section>

      <div className="relative h-[340px] overflow-hidden border-t border-line">
        <Image src="/images/band-trackday.jpg" alt="Sportwagen auf dem Hockenheimring bei einem Trackday der School of Racing" fill sizes="100vw" className="photo object-cover object-[50%_60%]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_35%,rgba(0,0,0,.88)_100%)]" />
        <p className="absolute inset-x-0 bottom-9 mx-auto max-w-[1240px] px-6 font-display text-[clamp(28px,3.6vw,48px)] font-semibold uppercase leading-[1.05]">
          4,574 km. 17 Kurven. <span className="text-gold">Ein Nachmittag.</span>
        </p>
      </div>

      {/* Ablauf */}
      <section id="ablauf" aria-labelledby="ablauf-h" className="border-y border-line bg-card">
        <div className="mx-auto max-w-[1240px] px-6 py-16">
          <p className="eyebrow mb-3">Ablauf · Montag, 14. Dezember</p>
          <h2 id="ablauf-h" className="h-section mb-10">Vom Check-in bis zum Dinner</h2>
          <Timeline
            steps={[
              { who: "Selbstfahrer", time: "13:00", title: "Ankunft & Check-in", text: "Fahrzeug, Unterlagen und Einteilung in die Gruppen." },
              { who: "Selbstfahrer", time: "13:45", title: "Drivers Briefing", badge: "Pflicht", text: "Für alle, die selbst fahren, verpflichtend. Ohne Briefing keine Fahrt auf der Strecke – bitte pünktlich sein." },
              { who: "Drift-Beifahrer", time: "14:15", title: "Ankunft & Check-in", text: "Für alle, die als Beifahrer mit einem Profi fahren." },
              { who: "Strecke", time: "14:30", title: "Start auf der Strecke", text: "Fahrten in den Gruppen Rookie, Performance und Race – und Drift-Fahrten mit einem Profi am Steuer." },
              { who: "Strecke", time: "16:30", title: "Ende der Fahrzeit", text: "Letzte Runden, dann geht es weiter in die Loge." },
              { who: "Loge", time: "17:00", title: "Empfang in der Loge", text: "Ankunft der Dinner-Gäste. Ankommen, aufwärmen, erste Gespräche." },
              { who: "Loge", time: "18:00", title: "Early Dinner", text: "Dinner, Charity-Auktion und Networking – mit den Menschen, die Frontline of Innovation ausmachen.", gold: true },
            ]}
          />
        </div>
      </section>

      {/* Teilnahme */}
      <section id="teilnahme" aria-labelledby="teilnahme-h" className="mx-auto max-w-[1240px] px-6 py-[72px]">
        <p className="eyebrow mb-3">Teilnahme</p>
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <h2 id="teilnahme-h" className="h-section">Drei Arten, dabei zu sein</h2>
          <p className="max-w-[420px] text-base leading-relaxed text-muted">Ihre Teilnahmeart wählen Sie bei der Anmeldung über den persönlichen Link in Ihrer Einladung.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <TypeCard type="own" image="/images/card-own-car.jpg" alt="Sportwagen bei einem Trackday der School of Racing" foot="Ankunft 13:00 · Briefing 13:45 (Pflicht)" free={slots?.own.free} />
          <TypeCard type="taxi" image="/images/card-taxi.jpg" alt="Blick aus dem Cockpit auf die Rennstrecke bei einem Training der School of Racing" foot="Ankunft 14:15 · Profi am Steuer" free={slots?.taxi.free} />
          <TypeCard type="dinner" image="/images/dinner.jpg" alt="Gäste an gedeckten Tischen beim FOI-Dinner im Mai 2026" foot="Ankunft 17:00 · Dinner 18:00" free={slots?.dinner.free} />
        </div>
      </section>

      {/* Dinner */}
      <section id="dinner" aria-labelledby="dinner-h" className="border-t border-line">
        <div className="grid md:grid-cols-2">
          <div className="relative min-h-[420px]">
            <Image src="/images/dinner.jpg" alt="Gäste an gedeckten Tischen beim FOI-Dinner im Mai 2026" fill sizes="(min-width:768px) 50vw, 100vw" className="photo object-cover object-[60%_50%]" />
          </div>
          <div className="flex flex-col justify-center gap-6 bg-card px-6 py-14 md:px-14">
            <p className="eyebrow">Ab 17:00 · Loge · Early Dinner um 18:00</p>
            <h2 id="dinner-h" className="h-section">Nach der Zielflagge beginnt der Abend</h2>
            <p className="text-lg leading-relaxed text-[#d1d1d1]">Ein frühes Dinner in der Loge, Zeit für Gespräche mit den Menschen, die Frontline of Innovation ausmachen – und eine Charity-Auktion für den guten Zweck.</p>
          </div>
        </div>
      </section>

      {/* Auktion */}
      <section aria-labelledby="auktion-h" className="mx-auto max-w-[1240px] px-6 py-[72px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">Charity-Auktion</p>
            <h2 id="auktion-h" className="h-section">Ein Los für den guten Zweck</h2>
          </div>
          <p className="max-w-[460px] text-base leading-relaxed text-muted">
            Während des Dinners versteigern wir ein Werk von Horst Hamann. Der Erlös geht vollständig an einen regionalen gemeinnützigen Verein. Geboten wird vor Ort.
          </p>
        </div>
        <div className="max-w-[720px]">
          <Lot n="1" title="Horst Hamann" text="Ein Werk des Mannheimer Fotografen, bekannt für seine Serie „New York Vertical“." image="/images/horst-hamann.jpg" alt="Porträt des Fotografen Horst Hamann" />
        </div>
        <p className="mt-4 text-[13px] text-dim">Unter Vorbehalt – Details sind noch in Klärung.</p>
      </section>

      {/* Ort */}
      <section aria-labelledby="ort-h" className="border-t border-line">
        <div className="mx-auto grid max-w-[1240px] items-start gap-12 px-6 py-16 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Ort &amp; Anreise</p>
            <h2 id="ort-h" className="h-section mb-5">Hockenheimring</h2>
            <p className="mb-8 text-[17px] leading-relaxed text-[#d1d1d1]">
              Über Jahrzehnte Austragungsort der Formel 1, südlich von Mannheim gelegen. Die genaue Streckenvariante geben wir rechtzeitig bekannt; das Dinner findet in der Loge statt.
            </p>
            <dl className="grid grid-cols-[minmax(110px,auto)_1fr] border-t border-line-strong text-base">
              {[
                ["Adresse", "Am Motodrom, 68766 Hockenheim"],
                ["Treffpunkt", ""],
                ["Parken", ""],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="border-b border-line-strong py-3.5 pr-4 text-dim">{k}</dt>
                  <dd className="border-b border-line-strong py-3.5">{v || <span className="italic text-dim">Geben wir rechtzeitig vor dem Termin bekannt.</span>}</dd>
                </div>
              ))}
            </dl>
          </div>
          <figure className="flex flex-col">
            {/* Statische Karte (selbst gehostet, keine Drittanbieter-Einbindung); Klick öffnet die Route */}
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Hockenheimring%2C%20Am%20Motodrom%2C%2068766%20Hockenheim"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block min-h-[300px] flex-1 overflow-hidden border border-line-strong"
              aria-label="Route zum Hockenheimring in Google Maps öffnen"
            >
              <Image src="/images/karte-hockenheimring.jpg" alt="Karte: Hockenheimring an der A6 östlich von Hockenheim" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
              <span className="absolute bottom-4 left-4 bg-black/85 px-4 py-2.5 text-sm text-white group-hover:text-gold">Route planen →</span>
            </a>
            <figcaption className="mt-2 text-xs text-dim">
              Karte: ©{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-dim underline">
                OpenStreetMap
              </a>
              -Mitwirkende
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Gastgeber */}
      <section aria-label="Gastgeber" className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-6 pb-12 pt-16 md:grid-cols-2">
          <HostBlock
            image="/images/foi-saal.jpg"
            alt="Der Saal in der Alten Schildkrötfabrik beim FOI-Dinner im Mai 2026"
            dim
            eyebrow="Gastgeber"
            title="Frontline of Innovation"
            text="Matthias Storch und Süleyman Acar bringen zweimal im Jahr Menschen zusammen, die sonst selten am selben Tisch sitzen. Gäste zahlen nichts, jeder Gast wird persönlich eingeladen, und keine Runde gleicht der vorigen."
            link={["https://frontlineofinnovation.de", "frontlineofinnovation.de"]}
          />
          <HostBlock
            image="/images/sor-team.jpg"
            alt="Das Instruktoren-Team der School of Racing"
            eyebrow="Gastgeber auf der Strecke"
            title="Paul Muck, School of Racing"
            text="Paul Muck ist Chef-Instruktor der School of Racing aus Heidelberg. Seit 2010 trainiert sein Team Einsteiger und erfahrene Fahrer auf dem Hockenheimring, dem Nürburgring und weiteren Strecken in vier Ländern."
            link={["https://www.schoolofracing.com/ueber-uns/", "schoolofracing.com"]}
          />
        </div>
        <div className="mx-auto max-w-[1240px] px-6 pb-16">
          <h3 className="mb-5 font-display text-sm font-medium uppercase tracking-[0.24em] text-dim">Ihre Gastgeber am 14. Dezember</h3>
          <ul className="grid gap-4 md:grid-cols-3">
            <Person name="Matthias Storch" role="Gastgeber, Frontline of Innovation" img="/images/matthias-storch.jpg" href="https://www.linkedin.com/in/matthiasstorch/" />
            <Person name="Süleyman Acar" role="Gastgeber, Frontline of Innovation" img="/images/sueleyman-acar.jpg" href="https://www.linkedin.com/in/sueleyman-acar/" />
            <Person name="Paul Muck" role="Chef-Instruktor, School of Racing" img="/images/paul-muck.jpg" href="https://www.linkedin.com/in/paul-muck-46a189152/" />
          </ul>
        </div>
      </section>

      {/* Partner */}
      <section aria-labelledby="partner-h" className="mx-auto max-w-[1240px] px-6 py-16">
        <h2 id="partner-h" className="mb-2 text-center font-display text-sm font-medium uppercase tracking-[0.24em] text-gold">Partner</h2>
        <p className="mb-8 text-center text-base text-muted">Dieser Tag wird von unseren Partnern getragen. Für Sie ist er kostenfrei.</p>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-7">
          <PartnerTile><a href="https://www.school-of-racing.de" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/school-of-racing.svg" alt="School of Racing" width={95} height={76} unoptimized className="h-[76px] w-auto opacity-90 transition-opacity group-hover:opacity-100" /></a></PartnerTile>
          <PartnerTile><a href="https://kosklima.de" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/kos-klima.png" alt="KOS Klima" width={153} height={26} className="h-[26px] w-auto opacity-90 transition-opacity group-hover:opacity-100" /></a></PartnerTile>
          <PartnerTile><a href="https://www.unzer.com/de/" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/unzer.png" alt="UNZER" width={123} height={28} className="h-7 w-auto opacity-90 transition-opacity group-hover:opacity-100" /></a></PartnerTile>
          <PartnerTile><a href="https://www.billiger.de" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/billiger.png" alt="billiger.de" width={103} height={34} className="h-[34px] w-auto opacity-90 transition-opacity group-hover:opacity-100" /></a></PartnerTile>
          <PartnerTile><a href="https://ox8-cf.com" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/ox8.png" alt="ox8 Corporate Finance" width={73} height={46} className="h-[46px] w-auto opacity-90 transition-opacity group-hover:opacity-100" /></a></PartnerTile>
          <PartnerTile><a href="https://covado.de/" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/covado.png" alt="COVADO Trusted Advisor" width={144} height={40} className="h-[40px] w-auto opacity-90 transition-opacity group-hover:opacity-100" /></a></PartnerTile>
          <PartnerTile><a href="https://rohdebaier.de/" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/rohde-baier.png" alt="ROHDE BAIER" width={133} height={14} className="h-[14px] w-auto opacity-90 transition-opacity group-hover:opacity-100" /></a></PartnerTile>
        </div>
      </section>

      {/* FAQ */}
      <section id="fragen" aria-labelledby="fragen-h" className="border-t border-line">
        <div className="mx-auto max-w-[900px] px-6 py-16">
          <h2 id="fragen-h" className="h-section mb-7">Häufige Fragen</h2>
          {FAQ.map((f, i) => (
            <details key={f.q} className={`border-t border-line-strong py-4 ${i === FAQ.length - 1 ? "border-b" : ""}`}>
              <summary className="flex min-h-7 justify-between gap-4 text-lg font-semibold">
                {f.q}
                <span aria-hidden className="plus text-[22px] leading-none text-gold">+</span>
              </summary>
              <p className="mt-3.5 text-base leading-relaxed text-[#c4c4c4]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Abschluss */}
      <section aria-labelledby="abschluss-h" className="relative overflow-hidden border-t border-line">
        <div aria-hidden className="checker absolute inset-x-0 top-0 h-10 opacity-90" />
        <div className="mx-auto max-w-[1240px] px-6 pb-[72px] pt-24 text-center">
          <h2 id="abschluss-h" className="font-display text-[clamp(44px,6vw,88px)] font-bold uppercase leading-[0.98]">
            Ihr Platz
            <br />
            <span className="text-gold">auf der Strecke.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[520px] text-lg leading-relaxed text-[#d1d1d1]">
            100 Plätze, ausschließlich auf persönliche Einladung. Wer absagt, gibt seinen Platz an die Warteliste weiter.
          </p>
          <p className="mx-auto mt-8 max-w-[560px] text-[17px] leading-relaxed text-white">
            Eingeladene Gäste melden sich über den persönlichen Link in ihrer Einladungsmail an.
          </p>
          <p className="mt-5 text-sm text-[#a6a6a6]">
            Link nicht gefunden oder Sie können nicht dabei sein? Schreiben Sie uns an{" "}
            <a href="mailto:info@frontlineofinnovation.de">info@frontlineofinnovation.de</a>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ value, label, border = "", gold = false }: { value: string; label: string; border?: string; gold?: boolean }) {
  return (
    <div className={`flex flex-col-reverse border-t border-line px-7 py-5 ${border.includes("r") ? "border-r" : ""}`}>
      <dt className="mt-1.5 text-sm text-[#b3b3b3]">{label}</dt>
      <dd className={`font-display text-[56px] font-semibold leading-none ${gold ? "text-gold" : ""}`}>{value}</dd>
    </div>
  );
}

function TypeCard({ type, image, alt, foot, free, gold = false }: { type: "own" | "taxi" | "dinner"; image?: string; alt?: string; foot: string; free?: number; gold?: boolean }) {
  const p = PARTICIPATION[type];
  return (
    <article className={`flex flex-col border bg-card ${gold ? "border-gold" : "border-line-strong"}`}>
      {image ? (
        <div className="relative h-[170px]">
          <Image src={image} alt={alt ?? ""} fill sizes="(min-width:768px) 33vw, 100vw" className="photo object-cover" />
        </div>
      ) : (
        <div className="flex h-[170px] items-center justify-center bg-[#141414] p-4 text-center text-xs uppercase tracking-[0.12em] text-[#8c8c8c]">
          [Foto]
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3.5 px-7 pb-7 pt-6">
        <div className="flex items-center justify-between">
          <span aria-hidden className={`font-display text-[44px] font-bold leading-none ${gold ? "text-gold-dark" : "text-[#333]"}`}>{p.num}</span>
          <span className={`border px-2.5 py-1.5 text-xs uppercase tracking-[0.14em] ${gold ? "border-gold-dark text-gold" : "border-[#3a3a3a] text-[#a6a6a6]"}`}>
            {free !== undefined && free < 10 ? (free === 0 ? "ausgebucht" : `noch ${free} frei`) : "begrenzt"}
          </span>
        </div>
        <h3 className="mt-1 font-display text-[30px] font-semibold uppercase">{p.title}</h3>
        <p className="text-base leading-relaxed text-[#c4c4c4]">{p.text}</p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
          <span className="text-[13px] text-dim">{foot}</span>
        </div>
      </div>
    </article>
  );
}

function Lot({ n, title, text, image, alt }: { n: string; title: string; text: string; image: string; alt: string }) {
  return (
    <article className="grid border border-line-strong sm:grid-cols-[280px_1fr]">
      <div className="relative aspect-[642/900] w-full">
        <Image src={image} alt={alt} fill sizes="(min-width:640px) 280px, 100vw" className="photo object-cover object-top" />
      </div>
      <div className="flex flex-col gap-2.5 p-7">
        <span className="font-display text-sm tracking-[0.2em] text-dim">LOS {n}</span>
        <h3 className="font-display text-[28px] font-semibold uppercase">{title}</h3>
        <p className="text-[15px] leading-relaxed text-[#c4c4c4]">{text}</p>
      </div>
    </article>
  );
}

function HostBlock({ image, alt, eyebrow, title, text, link, dim = false }: { image: string; alt: string; eyebrow: string; title: string; text: string; link: [string, string]; dim?: boolean }) {
  return (
    <div className="flex flex-col">
      <div className="relative mb-6 h-[170px] overflow-hidden">
        <Image src={image} alt={alt} fill sizes="(min-width:768px) 50vw, 100vw" className={`${dim ? "photo-dim" : "photo"} object-cover object-[50%_60%]`} />
        {dim && <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(0,0,0,0)_35%,rgba(0,0,0,.75)_100%),linear-gradient(180deg,rgba(0,0,0,.85)_0%,rgba(0,0,0,0)_45%)]" />}
      </div>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="mb-5 font-display text-[40px] font-semibold uppercase leading-[1.05]">{title}</h2>
      <p className="text-[17px] leading-relaxed text-[#d1d1d1]">{text}</p>
      <p className="mt-5">
        <a href={link[0]} target="_blank" rel="noopener" className="inline-block py-3 text-[15px]">{link[1]}</a>
      </p>
    </div>
  );
}

function PartnerTile({ children, dashed = false }: { children: React.ReactNode; dashed?: boolean }) {
  return (
    <div className={`flex min-h-24 items-center justify-center p-6 ${dashed ? "border border-dashed border-[#4d4d4d] text-xs uppercase tracking-[0.12em] text-[#8c8c8c]" : "border border-line-strong"}`}>
      {children}
    </div>
  );
}
