import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/supabase/admin";
import { STATUS_LABEL, type Guest, type GuestStatus } from "@/lib/types";
import { ANSWER_SHORT, GROUP_SHORT, MODE_SHORT, type Interest } from "@/lib/interest";
import { DELIVERY_LABEL } from "@/lib/mail/delivery";
import { MAIL_LABEL, type MailType } from "@/lib/mail/templates";
import { SubmitButton } from "@/components/submit-button";
import { guestAction, resendInterestMail, updateGuest } from "../../../actions";

export default async function GastBearbeiten({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; fehler?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { ok, fehler } = await searchParams;
  const { data } = await db().from("event_guests").select("*, event_interest(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const g = data as Guest & { event_interest: Interest | Interest[] | null };
  const i = Array.isArray(g.event_interest) ? g.event_interest[0] : g.event_interest;
  const { data: log } = await db().from("email_log").select("id,type,to_email,status,delivery,created_at").eq("guest_id", id).order("created_at", { ascending: false }).limit(20);

  return (
    <div className="max-w-[820px]">
      <Link href="/admin/gaeste" className="text-sm">← Zur Gästeliste</Link>
      <h1 className="mt-4 font-display text-3xl font-semibold uppercase">
        {[g.title, g.first_name, g.last_name].filter(Boolean).join(" ")}
      </h1>
      <p className="mt-2 text-sm text-dim">
        {STATUS_LABEL[g.status as GuestStatus]} · Code <span className="font-mono">{g.code}</span>
        {i ? ` · Antwort: ${ANSWER_SHORT[i.answer]}${i.answer !== "nicht" ? ` (${[MODE_SHORT[i.mode], GROUP_SHORT[i.track_group]].filter(Boolean).join(" · ")})` : ""}` : " · noch keine Antwort"}
        {g.bounced && <span className="ml-2 text-red-400">· Adresse unzustellbar</span>}
      </p>

      {ok && <p className="mt-6 border-l-2 border-gold bg-card p-3 text-sm">{ok === "mail" ? "Die Save-the-Date-Mail ist verschickt." : ok === "aktion" ? "Erledigt." : "Gespeichert."}</p>}
      {fehler && <p className="mt-6 border-l-2 border-red-500 bg-card p-3 text-sm text-red-300">{fehler}</p>}

      <form action={updateGuest} className="mt-8 grid gap-5 sm:grid-cols-2">
        <input type="hidden" name="id" value={g.id} />
        <div>
          <label className="lbl" htmlFor="salutation">Anrede</label>
          <select id="salutation" name="salutation" defaultValue={g.salutation} className="field">
            <option value="">–</option>
            <option>Herr</option>
            <option>Frau</option>
          </select>
        </div>
        <div>
          <label className="lbl" htmlFor="title">Titel</label>
          <input id="title" name="title" defaultValue={g.title} className="field" />
        </div>
        <div>
          <label className="lbl" htmlFor="first_name">Vorname</label>
          <input id="first_name" name="first_name" defaultValue={g.first_name} className="field" />
        </div>
        <div>
          <label className="lbl" htmlFor="last_name">Nachname *</label>
          <input id="last_name" name="last_name" defaultValue={g.last_name} required className="field" />
        </div>
        <div className="sm:col-span-2">
          <label className="lbl" htmlFor="email">E-Mail *</label>
          <input id="email" name="email" type="email" defaultValue={g.email} required className="field" />
          <p className="mt-1 text-xs text-dim">Wird die Adresse geändert, wird eine Bounce-Markierung automatisch aufgehoben. Der persönliche Link bleibt gleich.</p>
        </div>
        <div>
          <label className="lbl" htmlFor="company">Unternehmen</label>
          <input id="company" name="company" defaultValue={g.company} className="field" />
        </div>
        <div>
          <label className="lbl" htmlFor="position">Position</label>
          <input id="position" name="position" defaultValue={g.position} className="field" />
        </div>
        <div className="sm:col-span-2">
          <label className="lbl" htmlFor="linkedin">LinkedIn-Profil</label>
          <input id="linkedin" name="linkedin" type="url" defaultValue={g.linkedin} placeholder="https://www.linkedin.com/in/…" className="field" />
          {g.linkedin && (
            <a href={g.linkedin} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs">
              Profil öffnen ↗
            </a>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="lbl" htmlFor="note">Notiz (intern)</label>
          <textarea id="note" name="note" defaultValue={g.note} rows={3} className="field" />
        </div>
        {g.bounced && (
          <label className="flex items-center gap-3 text-sm sm:col-span-2">
            <input type="checkbox" name="unbounce" className="h-5 w-5 accent-[#E6941A]" /> Bounce-Markierung aufheben (Adresse ist doch erreichbar)
          </label>
        )}
        <div className="sm:col-span-2">
          <SubmitButton className="btn-gold" pendingText="Speichert …">Speichern</SubmitButton>
        </div>
      </form>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl font-semibold uppercase">Save the Date erneut senden</h2>
        <p className="mt-2 text-sm text-dim">Schickt die Mail mit der Interessensabfrage noch einmal an die oben gespeicherte Adresse – z. B. nach einer Korrektur. Der persönliche Link bleibt gleich.</p>
        <form action={resendInterestMail} className="mt-4">
          <input type="hidden" name="id" value={g.id} />
          <SubmitButton className="btn-ghost" pendingText="Wird verschickt …" disabled={g.bounced}>
            An {g.email} senden
          </SubmitButton>
          {g.bounced && <p className="mt-2 text-xs text-red-300">Erst die Adresse korrigieren oder die Bounce-Markierung aufheben.</p>}
        </form>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl font-semibold uppercase">Weitere Aktionen</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href={`/dabei/${g.manage_token}`} target="_blank" className="btn-ghost">Abfrage ansehen</Link>
          <Link href={`/meine-teilnahme/${g.manage_token}`} target="_blank" className="btn-ghost">Gastansicht</Link>
          <GuestAct id={g.id} what="einladung" label="Verbindliche Einladung senden" />
          {["angemeldet", "bestaetigt", "warteliste", "angeboten", "eingeladen"].includes(g.status) && <GuestAct id={g.id} what="absagen" label="Absagen" />}
          {g.status === "eingeladen" && <GuestAct id={g.id} what="loeschen" label="Gast löschen" danger />}
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="mb-3 font-display text-xl font-semibold uppercase">Mails an diesen Gast</h2>
        {(log ?? []).length === 0 ? (
          <p className="text-sm text-dim">Noch keine Mails.</p>
        ) : (
          <table className="admin-table w-full">
            <thead>
              <tr><th>Datum</th><th>Mail</th><th>Adresse</th><th>Zustellung</th></tr>
            </thead>
            <tbody>
              {(log ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-xs">{new Date(l.created_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="text-xs">{MAIL_LABEL[l.type as MailType] ?? l.type}</td>
                  <td className="text-xs">{l.to_email}</td>
                  <td className={`text-xs ${l.delivery === "unzustellbar" ? "text-red-400" : ""}`}>{l.status === "fehler" ? "Fehler" : DELIVERY_LABEL[l.delivery ?? ""]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function GuestAct({ id, what, label, danger = false }: { id: string; what: string; label: string; danger?: boolean }) {
  return (
    <form action={guestAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="what" value={what} />
      <input type="hidden" name="back" value="detail" />
      <SubmitButton className={danger ? "btn-ghost border-red-500/60 text-red-400" : "btn-ghost"} pendingText="…">
        {label}
      </SubmitButton>
    </form>
  );
}
