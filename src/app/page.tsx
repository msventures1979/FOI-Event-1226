import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/site";
import { getPublicFreeSlots } from "@/lib/event";
import { PARTICIPATION } from "@/lib/types";

export const revalidate = 60;

const FAQ: { q: string; a: string }[] = [
  { q: "Was kostet die Teilnahme?", a: "Nichts. Die Partner des Tages übernehmen die Kosten." },
  { q: "Was brauche ich für die Fahrt mit dem eigenen Wagen?", a: "[Fahrzeugvoraussetzungen, Reifen, Helm, Kleidung – von School of Racing]" },
  { q: "Bin ich versichert?", a: "[Haftung und Versicherung – von School of Racing; Hinweis, dass die eigene Kfz-Versicherung auf der Rennstrecke meist nicht greift]" },
  { q: "Was passiert bei Regen oder Schnee?", a: "[Regelung – von School of Racing]" },
  { q: "Was ziehe ich an?", a: "[Strecke: warm und wetterfest; Dinner: Dresscode offen]" },
  { q: "Wie komme ich hin, wo parke ich?", a: "[Anfahrt, Parken, Treffpunkt]" },
  { q: "Kann ich eine Begleitung mitbringen?", a: "[offen – zählt sie zum Kontingent?]" },
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
            <h1 className="font-display text-[clamp(52px,8vw,112px)] font-bold uppercase leading-[0.95]">
              Die Weihnachts&shy;feier
              <br />
              <span className="text-gold">der anderen Art.</span>
            </h1>
            <p className="mt-8 max-w-[560px] text-[19px] leading-relaxed text-[#ddd]">
              Ein Nachmittag auf der Strecke, ein Abend in der Mercedes-Loge. Für die Gäste der Frontline of Innovation – auf persönliche Einladung.
            </p>
            <form action="/anmeldung" method="get" className="mt-10 flex max-w-[560px] flex-wrap gap-3">
              <label htmlFor="code-hero" className="sr-only">Einladungscode</label>
              <input
                id="code-hero"
                name="code"
                placeholder="FOI-XXXXXXXX"
                autoComplete="off"
                className="field !min-h-[52px] flex-[1_1_220px] !bg-black/60 font-display !text-xl tracking-[0.14em]"
              />
              <button type="submit" className="btn-gold">Startplatz sichern</button>
            </form>
            <p className="mt-3.5 text-[13px] text-[#a6a6a6]">Ihren persönlichen Code finden Sie in Ihrer Einladung. Die Teilnahme ist kostenfrei.</p>
          </div>
          <div className="border border-line-strong bg-[rgba(10,10,10,.92)]">
            <div aria-hidden className="checker-sm h-2.5 opacity-90" />
            <h2 className="px-7 pb-2.5 pt-6 font-display text-[13px] font-medium uppercase tracking-[0.2em] text-dim">Startaufstellung</h2>
            <dl className="grid grid-cols-2">
              <Stat value={showFree ? `${slots!.free}` : "80"} label={showFree ? "Plätze noch frei" : "Plätze, nicht mehr"} border="br" />
              <Stat value="3" label="Arten, die Strecke zu erleben" border="b" />
              <Stat value="0 €" label="für Sie, getragen von Partnern" border="r" />
              <Stat value="1" label="Überraschungsgast zum Dinner" gold />
            </dl>
          </div>
        </div>
      </section>

      {/* Partnerleiste */}
      <section aria-label="Partner" className="border-b border-line bg-[#050505]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-12 gap-y-6 px-6 py-7">
          <div className="flex flex-wrap items-center gap-5">
            <span className="font-display text-xs uppercase tracking-[0.22em] text-gold">Hauptpartner</span>
            <Image src="/images/lamborghini-stuttgart.png" alt="Lamborghini Stuttgart, Autohaus Gohm" width={102} height={56} className="h-14 w-auto" />
          </div>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
            <span className="font-display text-xs uppercase tracking-[0.22em] text-dim">Mit</span>
            <Image src="/images/billiger.png" alt="billiger.de" width={79} height={26} className="h-[26px] w-auto opacity-85" />
            <Image src="/images/unzer.png" alt="UNZER" width={97} height={22} className="h-[22px] w-auto opacity-85" />
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-b border-line">
        <p className="px-6 py-5 text-center font-display text-[22px] uppercase leading-relaxed tracking-[0.12em] text-[#8c8c8c]">
          {["Eigener Wagen", "Renntaxi", "Lamborghini", "Early Dinner", "Überraschungsgast", "Charity-Auktion"].map((w, i) => (
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
            Gemeinsam mit Paul Muck und der School of Racing laden wir Sie auf den Hockenheimring ein. Sie fahren Ihren eigenen Wagen und lernen ihn unter Anleitung erfahrener Instruktoren an seiner Grenze kennen. Oder Sie steigen als Beifahrer ins Renntaxi – oder selbst ans Steuer eines Lamborghini.
          </p>
          <p>Danach geht es weiter wie an jedem FOI-Abend: mit einem frühen Dinner, einem Überraschungsgast und Gesprächen, die es ohne diesen Tag nie gegeben hätte.</p>
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
          <h2 id="ablauf-h" className="h-section mb-10">Zwei Sektoren, ein Ziel</h2>
          <ol className="grid border-t-2 border-white md:grid-cols-3">
            <AgendaItem mark="Sektor 1" time="13:00" title="Eintreffen" text="Empfang, Fahrerbesprechung, Einteilung in die Gruppen." />
            <AgendaItem mark="Sektor 2" time="14:00" title="Racing" text="Fahrten in Gruppen, nach Teilnahmeart und Erfahrung, begleitet von der School of Racing." />
            <AgendaItem mark="Ziel" time="17:00" title="Early Dinner & Networking" text="In der Mercedes-Loge, mit Überraschungsgast und Charity-Auktion. Ende gegen [Uhrzeit]." gold last />
          </ol>
        </div>
      </section>

      {/* Teilnahme */}
      <section id="teilnahme" aria-labelledby="teilnahme-h" className="mx-auto max-w-[1240px] px-6 py-[72px]">
        <p className="eyebrow mb-3">Teilnahme</p>
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <h2 id="teilnahme-h" className="h-section">Wählen Sie Ihre Linie</h2>
          <p className="max-w-[420px] text-base leading-relaxed text-muted">Die Plätze je Art sind begrenzt und werden in der Reihenfolge der Anmeldung vergeben.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <TypeCard type="own" image="/images/card-own-car.jpg" alt="Sportwagen bei einem Trackday der School of Racing" foot="Voraussetzungen: [Fahrzeug, Reifen, Helm]" free={slots?.own.free} />
          <TypeCard type="taxi" image="/images/card-taxi.jpg" alt="Blick aus dem Cockpit auf die Rennstrecke bei einem Training der School of Racing" foot="[Fahrzeug, Rundenzahl]" free={slots?.taxi.free} />
          <TypeCard type="lambo" image="/images/card-lamborghini.jpg" alt="Lamborghini mit geöffneten Türen beim FOI-Dinner im Mai 2026" foot="[Modell, Runden]" free={slots?.lambo.free} gold />
        </div>
      </section>

      {/* Dinner */}
      <section id="dinner" aria-labelledby="dinner-h" className="border-t border-line">
        <div className="grid md:grid-cols-2">
          <div className="relative min-h-[420px]">
            <Image src="/images/dinner.jpg" alt="Gäste an gedeckten Tischen beim FOI-Dinner im Mai 2026" fill sizes="(min-width:768px) 50vw, 100vw" className="photo object-cover object-[60%_50%]" />
          </div>
          <div className="flex flex-col justify-center gap-6 bg-card px-6 py-14 md:px-14">
            <p className="eyebrow">Ab 17:00 · Mercedes-Loge</p>
            <h2 id="dinner-h" className="h-section">Nach der Zielflagge beginnt der Abend</h2>
            <p className="text-lg leading-relaxed text-[#d1d1d1]">Ein frühes Dinner in der Mercedes-Loge, Zeit für Gespräche – und ein Gast, den wir erst am Abend vorstellen.</p>
            <div className="mt-2 flex items-center gap-5 border border-dashed border-gold p-6">
              <span aria-hidden className="font-display text-6xl font-bold leading-none text-gold">?</span>
              <div>
                <h3 className="font-display text-xl font-semibold uppercase tracking-[0.04em]">Überraschungsgast</h3>
                <p className="mt-1 text-[15px] text-muted">Wer es ist, verraten wir in der Mercedes-Loge.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auktion */}
      <section aria-labelledby="auktion-h" className="mx-auto max-w-[1240px] px-6 py-[72px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">Charity-Auktion</p>
            <h2 id="auktion-h" className="h-section">Zwei Lose für den guten Zweck</h2>
          </div>
          <p className="max-w-[460px] text-base leading-relaxed text-muted">
            Während des Dinners versteigern wir zwei Stücke. Der Erlös geht vollständig an einen gemeinnützigen Verein; welcher, ist noch zu bestimmen. Geboten wird vor Ort.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Lot n="1" title="Horst Hamann" text="Ein Werk des Mannheimer Fotografen, bekannt für seine Serie „New York Vertical“." placeholder="[Abbildung des Werks]" />
          <Lot n="2" title="6 Monate Mercedes-AMG" text="Ein halbes Jahr Leasing eines Mercedes-AMG." placeholder="[Fahrzeugbild]" />
        </div>
        <p className="mt-4 text-[13px] text-dim">Beide Lose unter Vorbehalt – Details sind noch in Klärung.</p>
      </section>

      {/* Ort */}
      <section aria-labelledby="ort-h" className="border-t border-line">
        <div className="mx-auto grid max-w-[1240px] items-start gap-12 px-6 py-16 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Ort &amp; Anreise</p>
            <h2 id="ort-h" className="h-section mb-5">Hockenheimring</h2>
            <p className="mb-8 text-[17px] leading-relaxed text-[#d1d1d1]">
              Über Jahrzehnte Austragungsort der Formel 1, südlich von Mannheim gelegen. Gefahren wird auf [Streckenvariante]; das Dinner findet in der Mercedes-Loge statt.
            </p>
            <dl className="grid grid-cols-[minmax(110px,auto)_1fr] border-t border-line-strong text-base">
              {[
                ["Adresse", "Am Motodrom, 68766 Hockenheim"],
                ["Treffpunkt", "[Eingang / Fahrerlager]"],
                ["Parken", "[Hinweis]"],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="border-b border-line-strong py-3.5 pr-4 text-dim">{k}</dt>
                  <dd className="border-b border-line-strong py-3.5">{v}</dd>
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
        <div className="mb-5 flex flex-col items-center gap-3.5 border border-gold bg-card px-6 py-7">
          <span className="font-display text-[13px] uppercase tracking-[0.24em] text-gold">Hauptpartner</span>
          <Image src="/images/lamborghini-stuttgart.png" alt="Lamborghini Stuttgart, Autohaus Gohm" width={175} height={96} className="h-24 w-auto" />
          <p className="text-center text-[15px] text-muted">Autohaus Gohm stellt die Lamborghini für die Fahrten auf der Strecke.</p>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <PartnerTile><Image src="/images/billiger.png" alt="billiger.de" width={103} height={34} className="h-[34px] w-auto opacity-90" /></PartnerTile>
          <PartnerTile><Image src="/images/unzer.png" alt="UNZER" width={123} height={28} className="h-7 w-auto opacity-90" /></PartnerTile>
          <PartnerTile dashed>[Partner 4]</PartnerTile>
          <PartnerTile dashed>[Partner 5]</PartnerTile>
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
            80 Plätze, vergeben in der Reihenfolge der Anmeldung. Wer absagt, gibt seinen Platz an die Warteliste weiter.
          </p>
          <div className="mt-10">
            <Link href="/anmeldung" className="btn-gold">Mit Code anmelden</Link>
          </div>
          <p className="mt-5 text-sm text-[#a6a6a6]">
            Sie können nicht dabei sein? Bitte nutzen Sie den Link „Leider nicht dabei“ in Ihrer Einladung oder den Link in Ihrer Bestätigungsmail.
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

function AgendaItem({ mark, time, title, text, gold = false, last = false }: { mark: string; time: string; title: string; text: string; gold?: boolean; last?: boolean }) {
  return (
    <li className={`py-7 pb-2 md:px-7 ${last ? "" : "md:border-r md:border-line"} first:md:pl-0 last:md:pr-0`}>
      <div className={`font-display text-[13px] uppercase tracking-[0.2em] ${gold ? "text-gold" : "text-dim"}`}>{mark}</div>
      <div className={`mt-3 font-display text-[64px] font-semibold leading-none ${gold ? "text-gold" : ""}`}>{time}</div>
      <h3 className="mb-2 mt-4 text-xl font-semibold">{title}</h3>
      <p className="text-base leading-relaxed text-muted">{text}</p>
    </li>
  );
}

function TypeCard({ type, image, alt, foot, free, gold = false }: { type: "own" | "taxi" | "lambo"; image?: string; alt?: string; foot: string; free?: number; gold?: boolean }) {
  const p = PARTICIPATION[type];
  return (
    <article className={`flex flex-col border bg-card ${gold ? "border-gold" : "border-line-strong"}`}>
      {image ? (
        <div className="relative h-[170px]">
          <Image src={image} alt={alt ?? ""} fill sizes="(min-width:768px) 33vw, 100vw" className="photo object-cover" />
        </div>
      ) : (
        <div className="flex h-[170px] items-center justify-center bg-[#141414] p-4 text-center text-xs uppercase tracking-[0.12em] text-[#8c8c8c]">
          [Foto Renntaxi – von School of Racing]
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
          {type === "lambo" && <Image src="/images/lamborghini-stuttgart.png" alt="Lamborghini Stuttgart" width={73} height={40} className="h-10 w-auto" />}
        </div>
      </div>
    </article>
  );
}

function Lot({ n, title, text, placeholder }: { n: string; title: string; text: string; placeholder: string }) {
  return (
    <article className="grid border border-line-strong sm:grid-cols-2">
      <div className="flex min-h-[190px] items-center justify-center bg-[#141414] p-4 text-center text-xs uppercase tracking-[0.12em] text-[#8c8c8c]">{placeholder}</div>
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

function Person({ name, role, img, href }: { name: string; role: string; img: string; href: string }) {
  return (
    <li>
      <a href={href} target="_blank" rel="noopener" className="group flex min-h-16 items-center gap-4.5 border border-line-strong bg-black p-5 text-white no-underline hover:border-gold hover:text-white">
        <span aria-hidden className="relative size-16 flex-none overflow-hidden rounded-full border border-gold">
          <Image src={img} alt="" fill sizes="64px" className="photo object-cover" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[22px] font-semibold uppercase">{name}</span>
          <span className="mt-0.5 block text-sm text-muted">{role}</span>
        </span>
        <span className="flex flex-none items-center gap-1.5 text-[13px] text-dim group-hover:text-gold">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" />
          </svg>
          LinkedIn
        </span>
      </a>
    </li>
  );
}

function PartnerTile({ children, dashed = false }: { children: React.ReactNode; dashed?: boolean }) {
  return (
    <div className={`flex min-h-24 items-center justify-center p-6 ${dashed ? "border border-dashed border-[#4d4d4d] text-xs uppercase tracking-[0.12em] text-[#8c8c8c]" : "border border-line-strong"}`}>
      {children}
    </div>
  );
}
