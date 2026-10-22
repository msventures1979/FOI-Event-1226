"use client";

import { startTransition, useActionState, useState } from "react";
import { queueMails } from "../../actions";

const GROUPS: [string, string][] = [
  ["eingeladen", "Noch nicht reagiert (eingeladen)"],
  ["angemeldet", "Angemeldet / bestätigt"],
  ["warteliste", "Warteliste"],
  ["eingecheckt", "Eingecheckt (nach dem Event)"],
  ["alle", "Alle aktiven Gäste"],
];

export function SendForm({ labels }: { labels: Record<string, string> }) {
  const [state, action, pending] = useActionState(queueMails, { msg: "" });
  const [confirmed, setConfirmed] = useState(false);
  // onSubmit statt form action: Auswahl bleibt erhalten; nach echtem Versand muss erneut bestätigt werden
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("test") !== "on") setConfirmed(false);
    startTransition(() => action(fd));
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 border border-line bg-card p-6">
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
      <button className="btn-gold self-start" disabled={pending || !confirmed}>
        {pending ? "Wird verarbeitet …" : "Ausführen"}
      </button>
      {state.msg && <p className="text-gold">{state.msg}</p>}
    </form>
  );
}
