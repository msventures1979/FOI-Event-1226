"use client";

import { startTransition, useActionState } from "react";
import { importGuests } from "../../actions";

export function ImportForm() {
  const [state, action, pending] = useActionState(importGuests, { msg: "" });
  // onSubmit statt form action: Datei und Häkchen bleiben nach der Vorschau erhalten
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 border border-line bg-card p-6">
      <input type="file" name="file" accept=".csv,.xlsx" required className="text-sm" />
      <label className="chk">
        <input type="checkbox" name="dry" defaultChecked /> Nur Vorschau (nichts speichern)
      </label>
      <button className="btn-gold self-start" disabled={pending}>{pending ? "Wird verarbeitet …" : "Datei verarbeiten"}</button>
      {state.msg && <p className="text-gold">{state.msg}</p>}
      {state.rows && state.rows.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Anrede</th>
              <th>Titel</th>
              <th>Vorname</th>
              <th>Nachname</th>
              <th>E-Mail</th>
              <th>Unternehmen</th>
              <th>Code</th>
            </tr>
          </thead>
          <tbody>
            {state.rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      )}
    </form>
  );
}
