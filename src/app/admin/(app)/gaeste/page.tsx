import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { db } from "@/lib/supabase/admin";
import { getEvent } from "@/lib/event";
import { PARTICIPATION, STATUS_LABEL, type Guest, type GuestStatus, type Registration } from "@/lib/types";
import { guestAction } from "../../actions";

export default async function Gaeste({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();
  const { status = "", q = "" } = await searchParams;
  const ev = await getEvent();
  let query = db().from("event_guests").select("*, event_registrations(*)").eq("event_id", ev.id).order("last_name");
  if (status) query = query.eq("status", status);
  const term = q.replace(/[,()%*\\]/g, " ").trim();
  if (term) query = query.or(`last_name.ilike.%${term}%,first_name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%,code.ilike.%${term}%`);
  const { data } = await query.limit(1000);
  const rows = (data ?? []) as (Guest & { event_registrations: Registration | Registration[] | null })[];

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold uppercase">Gäste ({rows.length})</h1>
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="lbl" htmlFor="q">Suche</label>
          <input id="q" name="q" defaultValue={q} className="field !w-72" placeholder="Name, Firma, E-Mail, Code" />
        </div>
        <div>
          <label className="lbl" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status} className="field !w-56">
            <option value="">alle</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button className="btn-ghost">Filtern</button>
      </form>
      <div className="overflow-x-auto border border-line">
        <table className="admin-table w-full min-w-[1000px]">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unternehmen</th>
              <th>E-Mail</th>
              <th>Code</th>
              <th>Status</th>
              <th>Teilnahme</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => {
              const r = Array.isArray(g.event_registrations) ? g.event_registrations[0] : g.event_registrations;
              const t = r?.participation_type ?? r?.requested_type;
              return (
                <tr key={g.id}>
                  <td>
                    {g.salutation} {g.title} {g.first_name} {g.last_name}
                    {g.bounced && <span className="ml-2 text-xs text-gold">Bounce</span>}
                  </td>
                  <td>{g.company}</td>
                  <td>{g.email}</td>
                  <td className="font-mono text-xs">{g.code}</td>
                  <td>
                    {STATUS_LABEL[g.status as GuestStatus]}
                    {g.status === "warteliste" && g.waitlist_position ? ` #${g.waitlist_position}` : ""}
                  </td>
                  <td>
                    {t ? PARTICIPATION[t].short : "–"}
                    {r?.start_number ? <span className="text-dim"> · #{r.start_number}</span> : null}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Act id={g.id} what="einladung" label="Einladung senden" />
                      {["angemeldet", "bestaetigt", "warteliste", "angeboten", "eingeladen"].includes(g.status) && <Act id={g.id} what="absagen" label="Absagen" />}
                      {g.status === "eingeladen" && <Act id={g.id} what="loeschen" label="Löschen" />}
                      <Link href={`/meine-teilnahme/${g.manage_token}`} className="text-xs" target="_blank">Gastansicht</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Act({ id, what, label }: { id: string; what: string; label: string }) {
  return (
    <form action={guestAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="what" value={what} />
      <button className="border border-[#4d4d4d] px-2 py-1 text-xs text-[#ccc] hover:border-white hover:text-white">{label}</button>
    </form>
  );
}
