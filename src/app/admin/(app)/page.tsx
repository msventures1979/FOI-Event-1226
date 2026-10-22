import { db } from "@/lib/supabase/admin";
import { getEvent, getFreeSlots } from "@/lib/event";
import { env } from "@/lib/env";
import { sentToday } from "@/lib/mail/queue";
import { PARTICIPATION, PARTICIPATION_TYPES, STATUS_LABEL, type GuestStatus } from "@/lib/types";
import { runQueue, saveCapacity } from "../actions";

export default async function Overview({ searchParams }: { searchParams: Promise<{ queue?: string }> }) {
  const { queue } = await searchParams;
  const ev = await getEvent();
  const [slots, { data: guests }, { data: caps }, today, { count: pending }] = await Promise.all([
    getFreeSlots(ev.id),
    db().from("event_guests").select("status").eq("event_id", ev.id),
    db().from("event_capacity").select("*").eq("event_id", ev.id),
    sentToday(),
    db().from("email_queue").select("id", { count: "exact", head: true }).is("sent_at", null),
  ]);

  const counts: Record<string, number> = {};
  for (const g of guests ?? []) counts[g.status] = (counts[g.status] ?? 0) + 1;
  const capOf = (t: string) => caps?.find((c) => c.participation_type === t)?.max_slots ?? "";
  const deadline = ev.registration_deadline
    ? new Date(ev.registration_deadline).toLocaleString("sv-SE", { timeZone: "Europe/Berlin" }).replace(" ", "T").slice(0, 16)
    : "";

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h1 className="mb-6 font-display text-3xl font-semibold uppercase">Übersicht</h1>
        <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4 lg:grid-cols-5">
          <Tile label="Gäste gesamt" value={guests?.length ?? 0} />
          {(["eingeladen", "angemeldet", "bestaetigt", "warteliste", "angeboten", "abgesagt", "storniert", "eingecheckt", "verfallen"] as GuestStatus[]).map((s) => (
            <Tile key={s} label={STATUS_LABEL[s]} value={counts[s] ?? 0} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold uppercase">Plätze</h2>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-4">
          <Tile label="Belegt / gesamt" value={`${slots.taken} / ${slots.total}`} sub={`${slots.free} frei`} gold />
          {PARTICIPATION_TYPES.map((t) => (
            <Tile key={t} label={PARTICIPATION[t].short} value={`${slots[t].taken}${slots[t].max !== null ? ` / ${slots[t].max}` : ""}`} sub={`${slots[t].free} frei`} />
          ))}
        </div>
        <form action={saveCapacity} className="mt-5 flex flex-wrap items-end gap-4 border border-line bg-card p-5">
          <Num name="total" label="Gesamt" defaultValue={ev.total_capacity} />
          {PARTICIPATION_TYPES.map((t) => (
            <Num key={t} name={t} label={`Max. ${PARTICIPATION[t].short} (leer = ohne)`} defaultValue={capOf(t)} />
          ))}
          <div>
            <label className="lbl" htmlFor="deadline">Anmeldeschluss</label>
            <input id="deadline" name="deadline" type="datetime-local" defaultValue={deadline} className="field" />
          </div>
          <button className="btn-gold !min-h-12">Speichern</button>
        </form>
        <p className="mt-2 text-xs text-dim">Mehr Plätze lassen Wartende automatisch nachrücken (sie bekommen ein Angebot per Mail).</p>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold uppercase">Mails</h2>
        <div className="flex flex-wrap items-center gap-6">
          <span>Heute versendet: <b>{today}</b> / {env.mailDailyLimit}</span>
          <span>In der Warteschlange: <b>{pending ?? 0}</b></span>
          <form action={runQueue}>
            <button className="btn-ghost">Warteschlange jetzt abarbeiten</button>
          </form>
          {queue && <span className="text-gold">Letzter Lauf: {queue.split("-")[0]} gesendet, {queue.split("-")[1]} Fehler, {queue.split("-")[2]} auf morgen verschoben</span>}
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value, sub, gold = false }: { label: string; value: string | number; sub?: string; gold?: boolean }) {
  return (
    <div className="bg-black p-5">
      <div className="text-xs uppercase tracking-[0.1em] text-dim">{label}</div>
      <div className={`mt-2 font-display text-4xl font-semibold ${gold ? "text-gold" : ""}`}>{value}</div>
      {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
    </div>
  );
}

function Num({ name, label, defaultValue }: { name: string; label: string; defaultValue: number | string }) {
  return (
    <div className="w-40">
      <label className="lbl" htmlFor={name}>{label}</label>
      <input id={name} name={name} type="number" min={0} defaultValue={defaultValue} className="field" />
    </div>
  );
}
