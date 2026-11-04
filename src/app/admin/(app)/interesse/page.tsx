import { getEvent } from "@/lib/event";
import { ANSWER_SHORT, interestCounts, GROUP_SHORT, MODE_SHORT, type Interest } from "@/lib/interest";
import { db } from "@/lib/supabase/admin";
import type { Guest } from "@/lib/types";

export const metadata = { title: "Interesse – Admin" };

type Row = Interest & { event_guests: Pick<Guest, "first_name" | "last_name" | "title" | "email" | "company"> };

export default async function InteressePage({ searchParams }: { searchParams: Promise<{ a?: string }> }) {
  const { a = "" } = await searchParams;
  const ev = await getEvent();
  const supa = db();
  const [counts, { count: invited }, { data }] = await Promise.all([
    interestCounts(ev.id),
    supa.from("event_guests").select("id", { count: "exact", head: true }).eq("event_id", ev.id),
    supa.from("event_interest").select("*, event_guests(first_name,last_name,title,email,company)").eq("event_id", ev.id).order("created_at"),
  ]);
  const all = (data ?? []) as Row[];
  const rows = a ? all.filter((r) => r.answer === a) : all;
  const answered = counts.dabei + counts.interessiert + counts.nicht;
  const modes = (k: string) => all.filter((r) => r.answer !== "nicht" && r.mode === k).length;
  const cap = ev.total_capacity ?? 100;
  let pos = 0;

  return (
    <div>
      <h1 className="font-display text-4xl font-bold uppercase">Interessensabfrage</h1>
      <p className="mt-2 text-sm text-dim">
        {invited ?? 0} Gäste in der Liste · {answered} geantwortet · {Math.max(0, cap - counts.dabei)} von {cap} Plätzen frei
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-px bg-line sm:grid-cols-4 lg:grid-cols-7">
        {[
          ["Dabei", counts.dabei, "dabei"],
          ["Interessiert", counts.interessiert, "interessiert"],
          ["Nicht dabei", counts.nicht, "nicht"],
          ["Eigener Wagen", modes("own"), ""],
          ["Renntaxi", modes("taxi"), ""],
          ["Noch offen", modes("offen"), ""],
          ["Ohne Antwort", Math.max(0, (invited ?? 0) - answered), ""],
        ].map(([l, n, k]) => (
          <li key={String(l)} className="bg-black p-4">
            {k ? (
              <a href={a === k ? "/admin/interesse" : `/admin/interesse?a=${k}`} className={`block no-underline ${a === k ? "text-gold" : "text-white"}`}>
                <span className="block text-[11px] uppercase tracking-[0.16em] text-dim">{l}</span>
                <span className="font-display text-3xl font-bold">{n}</span>
              </a>
            ) : (
              <>
                <span className="block text-[11px] uppercase tracking-[0.16em] text-dim">{l}</span>
                <span className="font-display text-3xl font-bold">{n}</span>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-6">
        {/* Download-Route, kein Seitenwechsel */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/admin/export/interesse" className="btn-ghost">Excel-Export</a>
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.14em] text-dim">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Unternehmen</th>
              <th className="py-2 pr-3">Antwort</th>
              <th className="py-2 pr-3">Strecke</th>
              <th className="py-2 pr-3">Fahrzeug</th>
              <th className="py-2 pr-3">Anmerkung</th>
              <th className="py-2">Zeit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = r.answer === "dabei" ? ++pos : null;
              const g = r.event_guests;
              return (
                <tr key={r.guest_id} className="border-b border-line align-top">
                  <td className="py-2 pr-3 text-dim">{p ? (p > cap ? `WL ${p - cap}` : p) : ""}</td>
                  <td className="py-2 pr-3">
                    {[g.title, g.first_name, g.last_name].filter(Boolean).join(" ")}
                    <span className="block text-xs text-dim">{r.contact_email || g.email}</span>
                  </td>
                  <td className="py-2 pr-3">{g.company}</td>
                  <td className="py-2 pr-3">{ANSWER_SHORT[r.answer]}</td>
                  <td className="py-2 pr-3">{MODE_SHORT[r.mode]}{r.track_group ? ` · ${GROUP_SHORT[r.track_group]}` : ""}</td>
                  <td className="py-2 pr-3">{r.vehicle}</td>
                  <td className="max-w-[260px] py-2 pr-3 text-xs">{r.note}</td>
                  <td className="whitespace-nowrap py-2 text-xs text-dim">{new Date(r.updated_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <p className="mt-4 text-sm text-dim">Noch keine Antworten.</p>}
      </div>
    </div>
  );
}
