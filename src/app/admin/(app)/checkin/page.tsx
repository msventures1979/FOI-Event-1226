import { db } from "@/lib/supabase/admin";
import { getEvent } from "@/lib/event";
import { PARTICIPATION, type Guest, type Registration } from "@/lib/types";
import { guestAction } from "../../actions";

export default async function Checkin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const ev = await getEvent();
  const { data } = await db()
    .from("event_guests")
    .select("*, event_registrations(*)")
    .eq("event_id", ev.id)
    .in("status", ["angemeldet", "bestaetigt", "eingecheckt"])
    .order("last_name");
  const all = (data ?? []) as (Guest & { event_registrations: Registration | Registration[] | null })[];
  const term = q.trim().toLowerCase();
  const rows = term ? all.filter((g) => `${g.first_name} ${g.last_name} ${g.company}`.toLowerCase().includes(term)) : all;
  const done = all.filter((g) => g.status === "eingecheckt").length;

  return (
    <div className="max-w-[720px]">
      <h1 className="mb-2 font-display text-3xl font-semibold uppercase">Check-in</h1>
      <p className="mb-5 text-lg">
        <b className="text-gold">{done}</b> von {all.length} eingecheckt
      </p>
      <form className="mb-5">
        <input name="q" defaultValue={q} placeholder="Name oder Unternehmen" className="field !min-h-14 !text-lg" autoFocus />
      </form>
      <ul className="flex flex-col gap-2">
        {rows.map((g) => {
          const r = Array.isArray(g.event_registrations) ? g.event_registrations[0] : g.event_registrations;
          const inn = g.status === "eingecheckt";
          return (
            <li key={g.id} className={`flex items-center justify-between gap-3 border p-4 ${inn ? "border-gold bg-[#1a1206]" : "border-line bg-card"}`}>
              <div>
                <div className="text-lg font-semibold">
                  {g.last_name}, {g.first_name}
                </div>
                <div className="text-sm text-muted">
                  {g.company} · {r?.participation_type ? PARTICIPATION[r.participation_type].short : ""} {r?.start_number ? `· #${r.start_number}` : ""}
                </div>
              </div>
              <form action={guestAction}>
                <input type="hidden" name="id" value={g.id} />
                <input type="hidden" name="what" value={inn ? "checkout" : "checkin"} />
                <button className={inn ? "btn-ghost" : "btn-gold"}>{inn ? "Zurücksetzen" : "Einchecken"}</button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
