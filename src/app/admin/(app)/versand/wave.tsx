"use client";

import { startTransition, useActionState, useState } from "react";
import { startInviteWave } from "../../actions";

export function WaveForm({ dabei, free, started }: { dabei: number; free: number; started: number }) {
  const [state, action, pending] = useActionState(startInviteWave, { msg: "" });
  const [confirmed, setConfirmed] = useState(false);
  const reserve = Math.min(dabei, free);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setConfirmed(false);
    startTransition(() => action(fd));
  };
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 border border-gold bg-card p-6">
      <p className="text-[15px] leading-relaxed text-[#ddd]">
        Die ersten <b className="text-white">{reserve}</b> Gäste mit „Ich bin dabei“ (in Reihenfolge der Vormerkung) bekommen einen reservierten Platz und die
        Einladung mit persönlichem Anmeldelink. Die übrigen <b className="text-white">{Math.max(dabei - reserve, 0)}</b> kommen auf die Warteliste und rücken
        automatisch nach, wenn jemand absagt oder die Frist verstreicht.
        {started > 0 && <span className="mt-2 block text-gold">Bereits {started} reservierte Plätze offen – ein erneuter Start betrifft nur Gäste, die noch nicht eingeladen sind.</span>}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="lbl" htmlFor="deadline">Frist erste Welle</label>
          <input id="deadline" name="deadline" type="datetime-local" defaultValue="2026-11-23T23:59" className="field" required />
        </div>
        <div>
          <label className="lbl" htmlFor="offer_hours">Frist beim Nachrücken (Stunden)</label>
          <input id="offer_hours" name="offer_hours" type="number" min={12} max={336} defaultValue={72} className="field" required />
        </div>
      </div>
      <label className="chk">
        <input type="checkbox" name="confirm" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> Plätze reservieren und {reserve} Einladungen in die Warteschlange legen
      </label>
      <div>
        <button className="btn-gold" disabled={!confirmed || pending || reserve === 0}>{pending ? "Läuft …" : "Erste Welle starten"}</button>
      </div>
      {state.msg && <p role="status" className="border-l-2 border-gold pl-3 text-[15px]">{state.msg}</p>}
    </form>
  );
}
