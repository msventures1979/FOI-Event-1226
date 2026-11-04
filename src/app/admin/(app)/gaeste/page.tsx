import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { db } from "@/lib/supabase/admin";
import { getEvent } from "@/lib/event";
import { ANSWER_SHORT, GROUP_SHORT, MODE_SHORT, type Interest } from "@/lib/interest";
import { PARTICIPATION, STATUS_LABEL, type Guest, type GuestStatus, type Registration } from "@/lib/types";
import { guestAction } from "../../actions";

type Row = Guest & {
  event_registrations: Registration | Registration[] | null;
  event_interest: Interest | Interest[] | null;
};

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

const STATUS_TONE: Partial<Record<GuestStatus, string>> = {
  angemeldet: "border-gold/60 text-gold",
  bestaetigt: "border-gold bg-gold/15 text-gold",
  eingecheckt: "border-gold bg-gold text-black",
  warteliste: "border-[#6b6b6b] text-[#ddd]",
  abgesagt: "border-[#3a3a3a] text-dim",
  storniert: "border-[#3a3a3a] text-dim",
};

const ANSWER_TONE: Record<string, string> = {
  dabei: "border-gold bg-gold/15 text-gold",
  interessiert: "border-gold/50 text-gold",
  nicht: "border-[#3a3a3a] text-dim",
};

function Badge({ children, tone = "border-[#3a3a3a] text-[#bbb]" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs ${tone}`}>{children}</span>;
}

export default async function Gaeste({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; antwort?: string; sort?: string; dir?: string }> }) {
  await requireAdmin();
  const { status = "", q = "", antwort = "", sort = "name", dir = "asc" } = await searchParams;
  const ev = await getEvent();
  let query = db().from("event_guests").select("*, event_registrations(*), event_interest(*)").eq("event_id", ev.id).order("last_name").order("first_name");
  if (status) query = query.eq("status", status);
  const term = q.replace(/[,()%*\\]/g, " ").trim();
  if (term) query = query.or(`last_name.ilike.%${term}%,first_name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%,code.ilike.%${term}%`);
  const { data } = await query.limit(2000);
  let rows = (data ?? []) as Row[];
  if (antwort === "keine") rows = rows.filter((g) => !one(g.event_interest));
  else if (antwort === "bounce") rows = rows.filter((g) => g.bounced);
  else if (antwort) rows = rows.filter((g) => one(g.event_interest)?.answer === antwort);

  // Sortierung (serverseitig, damit sie mit Filtern und Links kombinierbar bleibt)
  const ANSWER_ORDER: Record<string, number> = { dabei: 0, interessiert: 1, nicht: 2 };
  const keyOf: Record<string, (g: Row) => string | number> = {
    name: (g) => `${g.last_name} ${g.first_name}`.toLocaleLowerCase("de"),
    vorname: (g) => `${g.first_name} ${g.last_name}`.toLocaleLowerCase("de"),
    firma: (g) => (g.company || "\uffff").toLocaleLowerCase("de"),
    antwort: (g) => {
      const i = one(g.event_interest);
      return i ? `${ANSWER_ORDER[i.answer]}-${i.created_at}` : "9";
    },
    status: (g) => STATUS_LABEL[g.status as GuestStatus] ?? g.status,
    code: (g) => g.code,
    neu: (g) => g.created_at ?? "",
  };
  const k = keyOf[sort] ?? keyOf.name;
  const sign = dir === "desc" ? -1 : 1;
  rows = [...rows].sort((a, b) => {
    const x = k(a), y = k(b);
    return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "de")) * sign;
  });
  const base = { q, status, antwort };
  const head = (key: string, label: string, right = false) => {
    const active = sort === key;
    const nextDir = active && dir === "asc" ? "desc" : "asc";
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(base).filter(([, v]) => v)), sort: key, dir: nextDir });
    return (
      <th className={`px-4 py-3 font-medium ${right ? "text-right" : ""}`} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
        <Link href={`/admin/gaeste?${qs}`} className={`no-underline hover:text-white ${active ? "text-gold" : "text-dim"}`}>
          {label} {active ? (dir === "asc" ? "↑" : "↓") : <span className="text-[#444]">↕</span>}
        </Link>
      </th>
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold uppercase">
          Gäste <span className="text-dim">({rows.length})</span>
        </h1>
        {(q || status || antwort || sort !== "name") && (
          <Link href="/admin/gaeste" className="text-sm">
            Filter zurücksetzen
          </Link>
        )}
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 sm:flex-none">
          <label className="lbl" htmlFor="q">Suche</label>
          <input id="q" name="q" defaultValue={q} className="field sm:!w-72" placeholder="Name, Firma, E-Mail, Code" />
        </div>
        <div>
          <label className="lbl" htmlFor="antwort">Antwort</label>
          <select id="antwort" name="antwort" defaultValue={antwort} className="field !w-44">
            <option value="">alle</option>
            <option value="dabei">Dabei</option>
            <option value="interessiert">Interessiert</option>
            <option value="nicht">Nicht dabei</option>
            <option value="keine">Noch keine Antwort</option>
            <option value="bounce">Unzustellbar (Bounce)</option>
          </select>
        </div>
        <div>
          <label className="lbl" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status} className="field !w-48">
            <option value="">alle</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
        <button className="btn-ghost">Filtern</button>
        <span className="ml-auto self-center text-xs text-dim">
          Sortieren auch nach{" "}
          <Link href={`/admin/gaeste?${new URLSearchParams({ ...Object.fromEntries(Object.entries(base).filter(([, v]) => v)), sort: "vorname", dir: "asc" })}`}>Vorname</Link>
          {" · "}
          <Link href={`/admin/gaeste?${new URLSearchParams({ ...Object.fromEntries(Object.entries(base).filter(([, v]) => v)), sort: "neu", dir: "desc" })}`}>zuletzt hinzugefügt</Link>
        </span>
      </form>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[920px] border-collapse text-[14px]">
          <thead>
            <tr className="border-b border-line bg-[#0b0b0b] text-left text-[11px] uppercase tracking-[0.1em] text-dim">
              <th className="w-12 px-4 py-3 text-right font-medium">#</th>
              {head("name", "Gast")}
              {head("firma", "Unternehmen")}
              {head("antwort", "Antwort")}
              {head("status", "Status")}
              {head("code", "Code")}
              <th className="px-4 py-3 text-right font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g, idx) => {
              const r = one(g.event_registrations);
              const i = one(g.event_interest);
              const t = r?.participation_type ?? r?.requested_type;
              const track = i && i.answer !== "nicht" ? [MODE_SHORT[i.mode], GROUP_SHORT[i.track_group]].filter(Boolean).join(" · ") : "";
              return (
                <tr key={g.id} className="border-b border-[#1c1c1c] align-middle hover:bg-[#0d0d0d]">
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#666]">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">
                      <Link href={`/admin/gaeste/${g.id}`} className="text-white no-underline hover:text-gold">
                        {[g.title, g.first_name, g.last_name].filter(Boolean).join(" ")}
                      </Link>
                      {g.bounced && <span className="ml-2"><Badge tone="border-red-500/60 text-red-400">Bounce</Badge></span>}
                    </div>
                    <div className="mt-0.5 text-[13px] text-dim">{g.email}</div>
                  </td>
                  <td className="max-w-[260px] px-4 py-3 text-[#ccc]">
                    <span className="line-clamp-2">{g.company || <span className="text-[#555]">–</span>}</span>
                  </td>
                  <td className="px-4 py-3">
                    {i ? (
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={ANSWER_TONE[i.answer]}>{ANSWER_SHORT[i.answer]}</Badge>
                        {track && <span className="text-xs text-dim">{track}</span>}
                      </div>
                    ) : (
                      <span className="text-[#555]">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[g.status as GuestStatus]}>
                      {STATUS_LABEL[g.status as GuestStatus]}
                      {g.status === "warteliste" && g.waitlist_position ? ` #${g.waitlist_position}` : ""}
                    </Badge>
                    {t && (
                      <div className="mt-1 text-xs text-dim">
                        {PARTICIPATION[t].short}
                        {r?.start_number ? ` · #${r.start_number}` : ""}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[#bbb]">{g.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                      <Link href={`/dabei/${g.manage_token}`} target="_blank" className="text-xs">
                        Abfrage
                      </Link>
                      <Link href={`/meine-teilnahme/${g.manage_token}`} target="_blank" className="text-xs">
                        Gastansicht
                      </Link>
                      <details className="relative">
                        <summary className="cursor-pointer list-none border border-[#3a3a3a] px-2 py-0.5 text-xs text-[#ccc] hover:border-white hover:text-white [&::-webkit-details-marker]:hidden">
                          Mehr ▾
                        </summary>
                        <div className="absolute right-0 z-10 mt-1 flex w-48 flex-col gap-1 border border-line-strong bg-black p-2 shadow-xl">
                          <Link href={`/admin/gaeste/${g.id}`} className="px-2 py-1.5 text-xs text-[#ddd] no-underline hover:bg-[#1a1a1a]">Bearbeiten</Link>
                          <Act id={g.id} what="einladung" label="Verbindliche Einladung senden" />
                          {["angemeldet", "bestaetigt", "warteliste", "angeboten", "eingeladen"].includes(g.status) && <Act id={g.id} what="absagen" label="Absagen" />}
                          {g.status === "eingeladen" && <Act id={g.id} what="loeschen" label="Löschen" danger />}
                        </div>
                      </details>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-dim">
                  Keine Gäste gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Act({ id, what, label, danger = false }: { id: string; what: string; label: string; danger?: boolean }) {
  return (
    <form action={guestAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="what" value={what} />
      <button className={`w-full px-2 py-1.5 text-left text-xs hover:bg-[#1a1a1a] ${danger ? "text-red-400" : "text-[#ddd]"}`}>{label}</button>
    </form>
  );
}
