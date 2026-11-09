import { Person } from "@/components/person";
import Image from "next/image";
import { PageShell } from "@/components/site";
import { ANSWER_SHORT, type Interest } from "@/lib/interest";
import { InterestForm } from "./form";
import { ScrollIntoView } from "./scroll-into-view";

export interface DabeiProps {
  token: string;
  first: string;
  fullName: string;
  email: string;
  cap: number;
  dabei: number;
  mine: Interest | null;
  showThanks: boolean;
  pos: number | null;
  antwort?: string;
  preview?: boolean;
}

export function DabeiView({ token, first, fullName, email, cap, dabei, mine, showThanks, pos, antwort, preview = false }: DabeiProps) {
  const free = Math.max(0, cap - dabei);
  // Alle Plätze vorgemerkt und der Gast hat selbst noch keinen davon: Warteliste aktiv anbieten
  const waitlist = free <= 0 && !(mine?.answer === "dabei" && pos !== null && pos <= cap);
  return (
    <PageShell plain>
      {preview && (
        <p className="border-b border-gold bg-[#141008] px-6 py-2.5 text-center text-sm text-gold">
          Vorschau mit Beispieldaten – Antworten werden nicht gespeichert.
        </p>
      )}
      {/* Kopf */}
      <section className="relative border-b border-line">
        <Image src="/images/hero-track.jpg" alt="" aria-hidden fill priority sizes="100vw" className="photo object-cover object-[70%_50%]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.96)_0%,rgba(0,0,0,.85)_55%,rgba(0,0,0,.45)_100%)]" />
        <div className="relative mx-auto grid max-w-[1240px] items-end gap-10 px-6 pb-14 pt-14 md:grid-cols-[1.4fr_1fr] md:pt-20">
          <div>
            <p className="eyebrow mb-5 !text-[14px] !tracking-[0.22em]">Persönliche Einladung · Montag, 14. Dezember 2026 · Hockenheimring</p>
            <p className="font-display text-2xl uppercase tracking-[0.04em] text-[#ddd]">{first ? `Hallo ${first},` : "Guten Tag,"}</p>
            <h1 className="mt-2 font-display text-[clamp(40px,7.5vw,100px)] font-bold uppercase leading-[0.95]">
              Weihnachtsfeier
              <br />
              <span className="text-gold">mit Vollgas.</span>
            </h1>
            <p className="mt-7 max-w-[600px] text-[18px] leading-relaxed text-[#ddd]">
              Wir planen für den 14. Dezember eine FOI-Weihnachtsfeier auf dem Hockenheimring – und haben richtig Lust darauf. Noch steht nicht alles fest.
              Sagen Sie uns, ob Sie dabei sein möchten, dann wissen wir, für wen wir Gas geben.
            </p>
            {!(showThanks && mine) && (
              <a href="#antwort" className="btn-gold mt-8 inline-flex min-h-12 items-center gap-3">
                {waitlist ? "Auf die Warteliste" : "Jetzt antworten"} <span aria-hidden>↓</span>
              </a>
            )}
          </div>
          <div className="border border-line-strong bg-[rgba(10,10,10,.92)]">
            <div aria-hidden className="checker-sm h-2.5 opacity-90" />
            <div className="px-7 py-6">
              <p className="font-display text-[13px] uppercase tracking-[0.2em] text-dim">Startaufstellung</p>
              <p className="mt-2 font-display text-[64px] font-bold leading-none" aria-live="polite">
                {free}
                <span className="ml-2 text-2xl text-dim">/ {cap}</span>
              </p>
              <p className="mt-2 text-sm text-[#ccc]">{free > 0 ? "Plätze noch frei – vorgemerkt wird in der Reihenfolge der Antworten." : "Alle Plätze sind vorgemerkt. Setzen Sie sich auf die Warteliste – wird ein Platz frei, rücken Sie in der Reihenfolge der Antworten nach."}</p>
              <Track pct={Math.min(100, (dabei / cap) * 100)} />
            </div>
          </div>
        </div>
      </section>

      {/* Eckdaten */}
      <section aria-label="Was Sie erwartet" className="border-b border-line">
        <ul className="mx-auto grid max-w-[1240px] gap-px bg-line md:grid-cols-3">
          {[
            { k: "Ab 14 Uhr", t: "Auf der Strecke", d: "Mit Ihrem eigenen Wagen in einer von drei Gruppen, von Rookie bis Race – für Einsteiger geführt per Funk. Oder als Beifahrer im Renntaxi." },
            { k: "Früher Abend", t: "Dinner in der Loge", d: "Mit den Menschen, die Frontline of Innovation ausmachen." },
            { k: "Exklusiv & kostenfrei", t: `${cap} Plätze`, d: "Nur auf persönliche Einladung. Für Sie entstehen keine Kosten – getragen von unseren Partnern. Eintreffen ab 13 Uhr." },
          ].map((x) => (
            <li key={x.t} className="bg-black px-6 py-8">
              <p className="eyebrow !text-[12px]">{x.k}</p>
              <p className="mt-2 font-display text-2xl font-semibold uppercase">{x.t}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-[#bbb]">{x.d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Gastgeber */}
      <section aria-labelledby="gastgeber-h" className="border-b border-line">
        <div className="mx-auto max-w-[1240px] px-6 py-12">
          <h2 id="gastgeber-h" className="font-display text-sm font-medium uppercase tracking-[0.24em] text-gold">Ihre Gastgeber</h2>
          <p className="mt-3 max-w-[760px] text-[17px] leading-relaxed text-[#ddd]">
            Wir, Matthias Storch und Süleyman Acar, laden Sie gemeinsam mit Paul Muck von der School of Racing ein. Wir kennen jeden Gast persönlich oder über
            jemanden, dem wir vertrauen – und würden uns freuen, Sie am 14. Dezember auf der Strecke zu sehen.
          </p>
          <ul className="mt-7 grid gap-4 md:grid-cols-3">
            <Person name="Matthias Storch" role="Gastgeber, Frontline of Innovation" img="/images/matthias-storch.jpg" href="https://www.linkedin.com/in/matthiasstorch/" />
            <Person name="Süleyman Acar" role="Gastgeber, Frontline of Innovation" img="/images/sueleyman-acar.jpg" href="https://www.linkedin.com/in/sueleyman-acar/" />
            <Person name="Paul Muck" role="Chef-Instruktor, School of Racing" img="/images/paul-muck.jpg" href="https://www.linkedin.com/in/paul-muck-46a189152/" />
          </ul>
        </div>
      </section>

      <main id="antwort" className="mx-auto max-w-[860px] scroll-mt-6 px-6 pb-24 pt-14">
        {showThanks && mine ? (
          <>
          <ScrollIntoView id="danke" />
          <section id="danke" aria-labelledby="danke-h" className="scroll-mt-24 border-l-2 border-gold bg-card p-7">
            <h2 id="danke-h" className="font-display text-4xl font-bold uppercase leading-none">
              {mine.answer === "nicht" ? "Schade – danke für Ihre Antwort." : mine.answer === "interessiert" ? `Danke${first ? `, ${first}` : ""}!` : `Danke${first ? `, ${first}` : ""} – Sie sind vorgemerkt.`}
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-[#ddd]">
              {mine.answer === "nicht"
                ? "Wir halten Sie auf dem Laufenden und freuen uns, Sie beim nächsten Abend von Frontline of Innovation zu sehen."
                : mine.answer === "interessiert"
                  ? "Wir haben Sie als interessiert notiert. Sobald das Event steht, bekommen Sie die verbindliche Einladung."
                  : pos !== null && pos > cap
                    ? `Alle ${cap} Plätze sind bereits vorgemerkt – Sie stehen auf Platz ${pos - cap} der Warteliste. Sobald das Event steht, melden wir uns.`
                    : "Sobald das Event steht, gehören Sie zu den Ersten, die die verbindliche Einladung bekommen. Bis dahin: Termin schon mal freihalten."}
            </p>
            {mine.answer !== "nicht" && !preview && <p className="mt-3 text-sm text-dim">Eine Bestätigung mit allen Angaben ist per Mail an Sie unterwegs.</p>}
            {mine.answer !== "nicht" && (
              <a href={`/api/ics/weihnachtsfeier${preview ? "" : `?t=${token}`}`} className="btn-gold mt-6 inline-flex min-h-12 items-center">
                Termin in den Kalender
              </a>
            )}
            <p className="mt-6 text-sm text-dim">
              Ihre Antwort: <span className="text-white">{ANSWER_SHORT[mine.answer]}</span>
              {" · "}
              <a href={preview ? "/dabei/vorschau" : `/dabei/${token}?aendern=1`} className="inline-block py-2 text-gold">Antwort ändern</a>
            </p>
          </section>
          </>
        ) : (
          <InterestForm
            waitlist={waitlist}
            cap={cap}
            token={token}
            name={fullName}
            email={email}
            initial={{ answer: (antwort === "nicht" ? "nicht" : mine?.answer) ?? "", mode: mine?.mode ?? "", track_group: mine?.track_group ?? "", vehicle: mine?.vehicle ?? "", note: mine?.note ?? "" }}
          />
        )}
      </main>
    </PageShell>
  );
}

/** Fortschritt als Rennstrecke: Das Auto fährt mit jeder Zusage ein Stück weiter Richtung Zielflagge. */
function Track({ pct }: { pct: number }) {
  return (
    <div aria-hidden className="relative mt-10 pr-8">
      <div className="relative h-1.5 bg-[#1c1c1c]">
        <div className="track-fill h-full bg-gold" style={{ ["--p" as string]: `${pct}%` }} />
        <svg viewBox="0 0 64 32" className="track-car absolute -bottom-[1px] h-[30px] w-[60px] -translate-x-full" style={{ ["--p" as string]: `${pct}%` }}>
          {/* rundlicher Kleinwagen mit Weihnachtsbaum auf dem Dach – eigene Zeichnung */}
          <g transform="translate(-1 1.4) scale(1.04 1)">
            {/* Baum: Stamm hinten, Spitze nach vorn */}
            <rect x="11" y="8.6" width="6" height="2.2" rx="0.6" fill="#7a4a24" />
            <path d="M16 11.2 19.5 4.6l2.2 2.6 3.4-5 2.6 3.7 3.4-4.2 2.6 3.9 3.4-3.1 2 3.6 3.6-1.4-.6 3.2 5.2 1.6-5 1.9.6 1.6-6.6.4-2.8.9-5.2-.4-3.9.8-5-.6z" fill="#1f6b3a" />
            <path d="M21 9.5l4-1.6 3.2 1M30 8.2l4.4-1 3.6 1.2M38.6 9l4-.8" stroke="#2f8a4e" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            <circle cx="23.6" cy="7.6" r="1.1" fill="#E6941A" />
            <circle cx="30.4" cy="5.4" r="1" fill="#e2412f" />
            <circle cx="35.6" cy="9.4" r="1.1" fill="#E6941A" />
            <circle cx="41.2" cy="6.8" r="1" fill="#e2412f" />
            <circle cx="46.4" cy="9.2" r="0.9" fill="#E6941A" />
            {/* Spanngurte */}
            <path d="M26.5 6.5v6.2M39.5 6.5v6.2" stroke="#111" strokeWidth="1" />
          </g>
          {/* Karosserie */}
          <path d="M3 24.6c0-2.8 1.9-4.4 4.8-4.9l8.2-1.3 5.2-5.4c.9-.9 2.1-1.4 3.4-1.4h15.3c1.5 0 2.9.7 3.8 1.9l4 5 6.6 1.1c3.2.5 5.7 2.4 5.7 5v1.3c0 .9-.7 1.6-1.6 1.6H4.6c-.9 0-1.6-.7-1.6-1.6z" fill="#c8202f" />
          <path d="M22.6 18.6l3.4-4.4c.5-.6 1.2-.9 2-.9h4.2v5.3zM34 18.6v-5.3h5.6c.9 0 1.7.4 2.2 1.1l3.2 4.2z" fill="#111" />
          <path d="M5 22.2h53.5" stroke="#8f1420" strokeWidth="0.8" />
          <circle cx="59.6" cy="21.4" r="1.3" fill="#ffe7a8" />
          <circle cx="15.5" cy="27" r="4.6" fill="#111" />
          <circle cx="15.5" cy="27" r="2" fill="#ddd" />
          <circle cx="49.5" cy="27" r="4.6" fill="#111" />
          <circle cx="49.5" cy="27" r="2" fill="#ddd" />
        </svg>
      </div>
      {/* Zielflagge */}
      <div className="checker-sm absolute -top-3 right-0 h-[18px] w-4 opacity-90" />
    </div>
  );
}
