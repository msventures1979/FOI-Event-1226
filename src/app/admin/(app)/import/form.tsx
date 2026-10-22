"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { importGuests } from "../../actions";

export function ImportForm() {
  const [state, action] = useActionState(importGuests, { msg: "" });
  return (
    <form action={action} className="flex flex-col gap-4 border border-line bg-card p-6">
      <input type="file" name="file" accept=".csv,.xlsx" required className="text-sm" />
      <label className="chk">
        <input type="checkbox" name="dry" defaultChecked /> Nur Vorschau (nichts speichern)
      </label>
      <Btn />
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

function Btn() {
  const { pending } = useFormStatus();
  return <button className="btn-gold self-start" disabled={pending}>{pending ? "Wird verarbeitet …" : "Datei verarbeiten"}</button>;
}
