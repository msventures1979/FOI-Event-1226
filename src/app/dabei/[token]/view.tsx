import Image from "next/image";
import { PageShell } from "@/components/site";
import { ANSWER_SHORT, type Interest } from "@/lib/interest";
import { InterestForm } from "./form";

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
            <p className="eyebrow mb-5 !text-[14px] !tracking-[0.22em]">Save the Date · Montag, 14. Dezember 2026 · Hockenheimring</p>
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
          </div>
          <div className="border border-line-strong bg-[rgba(10,10,10,.92)]">
            <div aria-hidden className="checker-sm h-2.5 opacity-90" />
            <div className="px-7 py-6">
              <p className="font-display text-[13px] uppercase tracking-[0.2em] text-dim">Startaufstellung</p>
              <p className="mt-2 font-display text-[64px] font-bold leading-none" aria-live="polite">
                {free}
                <span className="ml-2 text-2xl text-dim">/ {cap}</span>
              </p>
              <p className="mt-2 text-sm text-[#ccc]">{free > 0 ? "Plätze noch frei – vorgemerkt wird in der Reihenfolge der Antworten." : "Alle Plätze sind vorgemerkt. Wer jetzt zusagt, kommt auf die Warteliste."}</p>
              <div className="mt-4 h-1.5 bg-[#1c1c1c]" aria-hidden>
                <div className="h-full bg-gold" style={{ width: `${Math.min(100, (dabei / cap) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eckdaten */}
      <section aria-label="Was Sie erwartet" className="border-b border-line">
        <ul className="mx-auto grid max-w-[1240px] gap-px bg-line md:grid-cols-3">
          {[
            { k: "Ab 14 Uhr", t: "Auf der Strecke", d: "Mit Ihrem eigenen Wagen und einem Instruktor der School of Racing an Ihrer Seite – oder als Beifahrer im Renntaxi." },
            { k: "Früher Abend", t: "Dinner in der Mercedes-Lodge", d: "Mit einem Überraschungsgast und den Menschen, die Frontline of Innovation ausmachen." },
            { k: "Kostenfrei", t: "80 Plätze", d: "Getragen von unseren Partnern. Eintreffen ab 13 Uhr am Hockenheimring." },
          ].map((x) => (
            <li key={x.t} className="bg-black px-6 py-8">
              <p className="eyebrow !text-[12px]">{x.k}</p>
              <p className="mt-2 font-display text-2xl font-semibold uppercase">{x.t}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-[#bbb]">{x.d}</p>
            </li>
          ))}
        </ul>
      </section>

      <main className="mx-auto max-w-[860px] px-6 pb-24 pt-14">
        {showThanks && mine ? (
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
                    ? `Alle 80 Plätze sind bereits vorgemerkt – Sie stehen auf Platz ${pos - cap} der Warteliste. Sobald das Event steht, melden wir uns.`
                    : "Sobald das Event steht, gehören Sie zu den Ersten, die die verbindliche Einladung bekommen. Bis dahin: Termin schon mal freihalten."}
            </p>
            <p className="mt-6 text-sm text-dim">
              Ihre Antwort: <span className="text-white">{ANSWER_SHORT[mine.answer]}</span>
              {" · "}
              <a href={preview ? "/dabei/vorschau" : `/dabei/${token}?aendern=1`} className="inline-block py-2 text-gold">Antwort ändern</a>
            </p>
          </section>
        ) : (
          <InterestForm
            token={token}
            name={fullName}
            email={email}
            initial={{ answer: (antwort === "nicht" ? "nicht" : mine?.answer) ?? "", mode: mine?.mode ?? "", vehicle: mine?.vehicle ?? "", note: mine?.note ?? "" }}
          />
        )}
      </main>
    </PageShell>
  );
}
