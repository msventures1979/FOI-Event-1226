"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { saveInterest, type InterestState } from "../actions";

const ANSWERS = [
  { value: "dabei", label: "Ja, ich bin dabei – bitte einen Platz für mich vormerken." },
  { value: "interessiert", label: "Ich bin interessiert, kann den Termin aber noch nicht zusagen." },
  { value: "nicht", label: "Diesmal leider nicht – halten Sie mich für das nächste Event auf dem Laufenden." },
] as const;
const MODES = [
  { value: "own", label: "Mit meinem eigenen Fahrzeug." },
  { value: "taxi", label: "Als Beifahrer im Renntaxi, mit einem Profi am Steuer." },
  { value: "offen", label: "Das entscheide ich später." },
] as const;
const GROUPS = [
  { value: "rookie", label: "Rookie", text: "Mit wenig oder keiner Rennstreckenerfahrung drehen Sie hier dank Überholverbot entspannt Ihre Runden – auf Wunsch geführt, mit Tipps per Funk direkt ins Auto." },
  { value: "performance", label: "Performance", text: "Sie haben Trackday-Erfahrung, kennen die Strecke und beherrschen Ihr Fahrzeug auch unter Stress." },
  { value: "race", label: "Race / Drift", text: "Sie haben viel Rennstreckenerfahrung und können auch mit Fahrzeugen ohne Straßenzulassung teilnehmen." },
] as const;

export function InterestForm({
  waitlist = false,
  cap = 100,
  token,
  name,
  email,
  initial,
}: {
  waitlist?: boolean;
  cap?: number;
  token: string;
  name: string;
  email: string;
  initial: { answer: string; mode: string; track_group: string; vehicle: string; note: string };
}) {
  const [state, action, pending] = useActionState<InterestState, FormData>(saveInterest, undefined);
  const [answer, setAnswer] = useState(initial.answer);
  const [mode, setMode] = useState(initial.mode);
  const [group, setGroup] = useState(initial.track_group);
  const errRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state?.error) errRef.current?.focus();
  }, [state]);
  const coming = answer === "dabei" || answer === "interessiert";

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  const option = (group: string, value: string, label: string, checked: boolean, onChange: () => void) => (
    <label key={value} className={`flex cursor-pointer items-start gap-4 border p-5 transition-colors ${checked ? "border-gold bg-[#141008]" : "border-line hover:border-line-strong"}`}>
      <input type="radio" name={group} value={value} checked={checked} onChange={onChange} required className="mt-1 h-5 w-5 shrink-0 accent-[#E6941A]" />
      <span className="text-[17px] leading-snug">{label}</span>
    </label>
  );

  return (
    <form onSubmit={onSubmit} aria-labelledby="frage-h">
      <input type="hidden" name="token" value={token} />
      <h2 id="frage-h" className="font-display text-4xl font-bold uppercase leading-none">
        Sind Sie dabei?
      </h2>
      <p className="mt-3 text-[16px] text-[#bbb]">Eine Minute, drei Klicks. Ihre Antwort ist unverbindlich und lässt sich jederzeit über Ihren Link ändern.</p>
      {waitlist && (
        <p className="mt-6 border-l-2 border-gold bg-card p-5 text-[16px] leading-relaxed text-[#ddd]">
          <b className="text-white">Alle {cap} Plätze sind vorgemerkt.</b> Es lohnt sich trotzdem, zuzusagen: Sie kommen auf die Warteliste, und sobald jemand absagt, rücken Sie in der Reihenfolge der Antworten nach.
        </p>
      )}

      <fieldset className="mt-8 flex flex-col gap-3">
        <legend className="sr-only">Ihre Antwort</legend>
        {ANSWERS.map((a) =>
          option("answer", a.value, waitlist && a.value === "dabei" ? "Ja, ich bin dabei – bitte auf die Warteliste setzen." : a.label, answer === a.value, () => setAnswer(a.value)),
        )}
      </fieldset>

      {coming && (
        <fieldset className="mt-10 flex flex-col gap-3">
          <legend className="mb-4 font-display text-2xl font-semibold uppercase">Wie möchten Sie auf die Strecke?</legend>
          {MODES.map((m) => option("mode", m.value, m.label, mode === m.value, () => setMode(m.value)))}
          {mode === "own" && (
            <fieldset className="mt-4 flex flex-col gap-3">
              <legend className="mb-3 mt-4 font-display text-xl font-semibold uppercase text-gold">In welcher Gruppe möchten Sie fahren?</legend>
              {GROUPS.map((gr) => (
                <label key={gr.value} className={`flex cursor-pointer items-start gap-4 border p-5 transition-colors ${group === gr.value ? "border-gold bg-[#141008]" : "border-line hover:border-line-strong"}`}>
                  <input type="radio" name="track_group" value={gr.value} checked={group === gr.value} onChange={() => setGroup(gr.value)} required className="mt-1 h-5 w-5 shrink-0 accent-[#E6941A]" />
                  <span>
                    <span className="block font-display text-xl font-semibold uppercase leading-tight">{gr.label}</span>
                    <span className="mt-1 block text-[15px] leading-snug text-[#bbb]">{gr.text}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {mode === "own" && (
            <div className="mt-2">
              <label className="lbl" htmlFor="vehicle">
                Ihr Fahrzeug <span className="font-normal normal-case tracking-normal text-dim">(optional)</span>
              </label>
              <input id="vehicle" name="vehicle" defaultValue={initial.vehicle} maxLength={120} placeholder="z. B. Porsche 911 Carrera S" className="field" />
            </div>
          )}
        </fieldset>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div>
          <span className="lbl">Name</span>
          <p className="field flex items-center !bg-transparent text-[#ddd]">{name}</p>
        </div>
        <div>
          <label className="lbl" htmlFor="email">E-Mail</label>
          <input id="email" name="email" type="email" defaultValue={email} autoComplete="email" className="field" />
        </div>
        <div className="sm:col-span-2">
          <label className="lbl" htmlFor="note">
            Anmerkung <span className="font-normal normal-case tracking-normal text-dim">(optional)</span>
          </label>
          <textarea id="note" name="note" defaultValue={initial.note} rows={3} maxLength={1000} className="field" />
        </div>
      </div>

      {state?.error && (
        <p ref={errRef} tabIndex={-1} role="alert" className="mt-6 border-l-2 border-gold bg-card p-4 text-[15px] text-gold">
          {state.error}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button type="submit" className="btn-gold" disabled={pending}>
          {pending ? "Wird gesendet …" : "Antwort senden"}
        </button>
        <span className="text-sm text-dim">Unverbindliche Vormerkung. Die verbindliche Einladung folgt, sobald das Event feststeht.</span>
      </div>
      <p className="mt-8 text-xs leading-relaxed text-dim">
        Wir speichern Ihre Antwort nur für die Planung dieses Events und löschen sie spätestens drei Monate danach. Mehr in der{" "}
        <Link href="/datenschutz" className="text-dim underline">Datenschutzerklärung</Link>.
      </p>
    </form>
  );
}
