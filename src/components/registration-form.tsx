"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction, type RegisterState } from "@/app/actions";
import { kurzanrede, PARTICIPATION, PARTICIPATION_TYPES, type FreeSlots, type Guest, type ParticipationType } from "@/lib/types";

const req = <span className="text-gold">*</span>;

export function RegistrationForm({ guest, slots }: { guest: Guest; slots: FreeSlots }) {
  const [state, action] = useActionState<RegisterState, FormData>(registerAction, undefined);
  const [art, setArt] = useState<ParticipationType>("own");
  const others = PARTICIPATION_TYPES.filter((t) => t !== art);

  return (
    <form action={action} aria-labelledby="form-h">
      <input type="hidden" name="code" value={guest.code} />
      <input type="hidden" name="participation_type" value={art} />

      <h1 id="form-h" className="font-display text-5xl font-bold uppercase leading-none">
        Willkommen, {kurzanrede(guest)}
      </h1>
      <p className="mb-2 mt-3.5 text-[17px] text-[#d1d1d1]">Bitte prüfen Sie Ihre Angaben und wählen Sie Ihre Teilnahmeart.</p>
      <p className="mb-10 text-[13px] text-[#a6a6a6]">{req} Pflichtangabe</p>

      <h2 className="mb-4 font-display text-[22px] font-semibold uppercase tracking-[0.04em]">Teilnahmeart {req}</h2>
      <div role="radiogroup" aria-label="Teilnahmeart" className="mb-5 grid gap-4 md:grid-cols-3">
        {PARTICIPATION_TYPES.map((t) => {
          const on = t === art;
          const free = slots[t].free;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setArt(t)}
              className={`flex min-h-[150px] flex-col gap-2 rounded-[2px] border p-5 text-left ${on ? "border-gold bg-[#1a1206]" : "border-[#4d4d4d] bg-card"}`}
            >
              <span className={`flex w-full justify-between font-display text-sm tracking-[0.16em] ${on ? "text-gold" : "text-[#a6a6a6]"}`}>
                {PARTICIPATION[t].num}
                <span className="text-[#a6a6a6]">{free === 0 ? "ausgebucht · Warteliste" : free < 10 ? `noch ${free} frei` : "Plätze frei"}</span>
              </span>
              <span className="font-display text-2xl font-semibold uppercase">{PARTICIPATION[t].title}</span>
              <span className="text-sm leading-normal text-muted">
                {t === "own" ? "Mit Instruktor der School of Racing." : t === "taxi" ? "Beifahrer, am Steuer ein Profi." : "Selbst fahren, mit dem Autohaus Gohm."}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mb-10 grid items-end gap-x-6 gap-y-4 md:grid-cols-2">
        <div>
          <label className="lbl" htmlFor="second_choice">Zweitwunsch, falls Ihre Erstwahl ausgebucht ist</label>
          <select id="second_choice" name="second_choice" className="field" key={art}>
            <option value="">kein Zweitwunsch</option>
            {others.map((t) => (
              <option key={t} value={t}>{PARTICIPATION[t].title}</option>
            ))}
          </select>
        </div>
        <label className="chk min-h-12">
          <input type="checkbox" name="extra_ride" /> Zusatzwunsch: Gern auch eine weitere Fahrt, falls vor Ort Plätze frei sind.
        </label>
      </div>

      {art === "own" && (
        <Box title="Ihr Fahrzeug" sub="Diese Angaben gehen an die School of Racing zur Gruppeneinteilung.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field name="vehicle_marke" label="Marke" required placeholder="z. B. Porsche" />
            <Field name="vehicle_modell" label="Modell" required placeholder="z. B. 911 Carrera S" />
            <Field name="vehicle_baujahr" label="Baujahr" required inputMode="numeric" />
            <Field name="vehicle_ps" label="Leistung (PS)" required inputMode="numeric" />
            <Field name="vehicle_kennzeichen" label="Kennzeichen" required />
            <Field name="license_since" label="Führerschein seit" required inputMode="numeric" placeholder="Jahr" />
            <Select name="vehicle_getriebe" label="Getriebe" required options={["Automatik", "Schaltgetriebe"]} />
            <Select name="vehicle_reifen" label="Bereifung am 14.12." required options={["Winterreifen", "Sommerreifen", "Semi-Slicks"]} />
            <Select name="experience" label="Rennstreckenerfahrung" required options={["keine", "einzelne Trackdays", "regelmäßig"]} />
          </div>
          <label className="chk mt-6">
            <input type="checkbox" name="consent_waiver" required /> <span>Ich habe den <a href="/haftungsverzicht" target="_blank">Haftungsverzicht der School of Racing</a> gelesen und akzeptiere ihn. {req}</span>
          </label>
        </Box>
      )}

      {art === "taxi" && (
        <Box title="Ihre Mitfahrt" sub="Diese Angaben gehen an die School of Racing.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field name="height_cm" label="Körpergröße in cm (falls für das Fahrzeug nötig)" inputMode="numeric" />
          </div>
          <label className="chk mt-6">
            <input type="checkbox" name="consent_waiver" required /> <span>Ich habe den <a href="/haftungsverzicht" target="_blank">Haftungsverzicht der School of Racing</a> gelesen und akzeptiere ihn. {req}</span>
          </label>
        </Box>
      )}

      {art === "lambo" && (
        <Box
          title="Ihre Lamborghini-Fahrt"
          sub="Diese Angaben gehen an das Autohaus Gohm und die School of Racing."
          logo
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field name="license_since" label="Führerschein seit" required inputMode="numeric" placeholder="Jahr" />
            <Select name="experience" label="Rennstreckenerfahrung" required options={["keine", "einzelne Trackdays", "regelmäßig"]} />
          </div>
          <label className="chk mt-6">
            <input type="checkbox" name="consent_waiver" required /> <span>Ich akzeptiere die <a href="/nutzungsbedingungen-gohm" target="_blank">Nutzungsbedingungen des Autohauses Gohm</a>. {req}</span>
          </label>
        </Box>
      )}

      <h2 className="mb-4 font-display text-[22px] font-semibold uppercase tracking-[0.04em]">Ihre Angaben</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select name="salutation" label="Anrede" required options={["Herr", "Frau", "ohne"]} labels={["Herr", "Frau", "ohne Anrede"]} defaultValue={guest.salutation || "ohne"} />
        <Field name="title" label="Titel" defaultValue={guest.title} placeholder="optional" />
        <Field name="first_name" label="Vorname" required defaultValue={guest.first_name} autoComplete="given-name" />
        <Field name="last_name" label="Nachname" required defaultValue={guest.last_name} autoComplete="family-name" />
        <Field name="company" label="Unternehmen" required defaultValue={guest.company} autoComplete="organization" />
        <Field name="position" label="Position" required defaultValue={guest.position} autoComplete="organization-title" />
        <Field name="email" label="E-Mail" required type="email" defaultValue={guest.email} autoComplete="email" />
        <Field name="mobile" label="Mobilnummer für den Veranstaltungstag" required type="tel" autoComplete="tel" />
        <Select name="diet" label="Ernährung" options={["keine Besonderheiten", "vegetarisch", "vegan"]} />
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="lbl" htmlFor="allergies">Allergien / Unverträglichkeiten</label>
          <textarea id="allergies" name="allergies" className="field" placeholder="optional" />
        </div>
      </div>

      <div className="mb-9 flex flex-col gap-3.5">
        <label className="chk">
          <input type="checkbox" name="consent_photo" /> Freiwillig: Ich bin einverstanden, dass Fotos und Videos von mir veröffentlicht werden.
        </label>
        <label className="chk">
          <input type="checkbox" name="consent_terms" required />
          <span>
            Ich akzeptiere die <a href="/teilnahmebedingungen" target="_blank">Teilnahmebedingungen</a> und die <a href="/datenschutz" target="_blank">Datenschutzhinweise</a>. Meine Fahrerdaten gehen an die School of Racing, bei Lamborghini-Fahrten an das Autohaus Gohm. {req}
          </span>
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="mb-6 border-l-2 border-gold bg-card p-4 text-[15px]">
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-gold" disabled={pending}>
      {pending ? "Wird gespeichert …" : "Startplatz sichern"}
    </button>
  );
}

function Box({ title, sub, children, logo = false }: { title: string; sub: string; children: React.ReactNode; logo?: boolean }) {
  return (
    <div className="mb-10 border border-line-strong bg-card p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="mb-1.5 font-display text-[22px] font-semibold uppercase tracking-[0.04em]">{title}</h2>
          <p className="text-sm text-[#a6a6a6]">{sub}</p>
        </div>
        {logo && <Image src="/images/lamborghini-stuttgart.png" alt="Lamborghini Stuttgart" width={88} height={48} className="h-12 w-auto" />}
      </div>
      {children}
    </div>
  );
}

function Field({ name, label, required = false, ...rest }: { name: string; label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="lbl" htmlFor={name}>
        {label} {required && req}
      </label>
      <input id={name} name={name} required={required} className="field" {...rest} />
    </div>
  );
}

function Select({
  name,
  label,
  options,
  labels,
  required = false,
  defaultValue,
}: {
  name: string;
  label: string;
  options: string[];
  labels?: string[];
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="lbl" htmlFor={name}>
        {label} {required && req}
      </label>
      <select id={name} name={name} required={required} className="field" defaultValue={defaultValue}>
        {options.map((o, i) => (
          <option key={o} value={o}>{labels?.[i] ?? o}</option>
        ))}
      </select>
    </div>
  );
}
