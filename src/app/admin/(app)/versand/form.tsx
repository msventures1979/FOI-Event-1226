"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { queueMails } from "../../actions";

const GROUPS: [string, string][] = [
  ["eingeladen", "Noch nicht reagiert (eingeladen)"],
  ["angemeldet", "Angemeldet / bestätigt"],
  ["warteliste", "Warteliste"],
  ["eingecheckt", "Eingecheckt (nach dem Event)"],
  ["alle", "Alle aktiven Gäste"],
];

export function SendForm({ labels }: { labels: Record<string, string> }) {
  const [state, action] = useActionState(queueMails, { msg: "" });
  const [confirmed, setConfirmed] = useState(false);
  return (
    <form action={action} className="flex flex-col gap-4 border border-line bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="lbl" htmlFor="type">Mail</label>
          <select id="type" name="type" className="field">
            {Object.entries(labels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="lbl" htmlFor="group">Empfänger</label>
          <select id="group" name="group" className="field">
            {GROUPS.map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="chk">
        <input type="checkbox" name="test" defaultChecked /> Nur Testmail an mich (mit Daten eines echten Gastes)
      </label>
      <label className="chk">
        <input type="checkbox" name="force" /> Erneut senden, auch wenn der Gast diese Mail schon bekommen hat
      </label>
      <label className="chk">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> Ich habe Mail und Empfängergruppe geprüft
      </label>
      <Btn disabled={!confirmed} />
      {state.msg && <p className="text-gold">{state.msg}</p>}
    </form>
  );
}

function Btn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-gold self-start" disabled={pending || disabled}>
      {pending ? "Wird verarbeitet …" : "Ausführen"}
    </button>
  );
}
