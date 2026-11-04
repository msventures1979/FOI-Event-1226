import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/supabase/admin";
import { MAIL_LABEL } from "@/lib/mail/templates";
import { SendForm } from "./form";
import { DELIVERY_LABEL } from "@/lib/mail/delivery";
import { SubmitButton } from "@/components/submit-button";
import { checkDelivery } from "../../actions";

export default async function Versand({ searchParams }: { searchParams: Promise<{ zustellung?: string; fehler?: string }> }) {
  await requireAdmin();
  const { zustellung, fehler } = await searchParams;
  const { data: log } = await db().from("email_log").select("type,status,delivery").limit(5000);
  const { data: bounces } = await db()
    .from("email_log")
    .select("id,to_email,type,delivery,created_at,event_guests(first_name,last_name,company)")
    .in("delivery", ["unzustellbar", "beschwerde"])
    .order("created_at", { ascending: false })
    .limit(500);
  const del: Record<string, number> = {};
  for (const l of log ?? []) if (l.status === "gesendet") del[l.delivery ?? ""] = (del[l.delivery ?? ""] ?? 0) + 1;
  const [zc, zb, zo] = (zustellung ?? "").split("-").map(Number);
  const stats: Record<string, { ok: number; err: number }> = {};
  for (const l of log ?? []) {
    stats[l.type] ??= { ok: 0, err: 0 };
    if (l.status === "gesendet") stats[l.type].ok++;
    else stats[l.type].err++;
  }
  return (
    <div className="flex max-w-[900px] flex-col gap-10">
      <section>
        <h1 className="mb-3 font-display text-3xl font-semibold uppercase">Versand</h1>
        <p className="mb-6 text-muted">
          Mails werden in eine Warteschlange gelegt und im Rahmen des Tageslimits verschickt. Jeder Gast bekommt jede Mail nur einmal – außer Sie setzen „Erneut senden“.
        </p>
        <SendForm labels={MAIL_LABEL} />
      </section>
      <section id="zustellung" className="scroll-mt-24">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold uppercase">Zustellung</h2>
          <form action={checkDelivery}>
            <SubmitButton className="btn-ghost" pendingText="Wird abgefragt … (bis 2 Min.)">Zustellstatus abrufen</SubmitButton>
          </form>
        </div>
        <p className="mb-4 text-sm text-dim">
          Fragt bei Resend ab, ob die Mails angekommen sind. Unzustellbare Adressen werden beim Gast als „Bounce“ markiert und bekommen keine weiteren Massenmails. Je Klick bis zu 240 Mails – bei offenen Mails einfach erneut klicken.
        </p>
        {fehler && (
          <p className="mb-4 border-l-2 border-red-500 bg-card p-3 text-sm text-red-300">
            Resend meldet: {fehler}
            {/restricted|permission|unauthori|forbidden/i.test(fehler) ? " – der API-Schlüssel darf nur senden, nicht lesen. In Resend einen Schlüssel mit „Full access“ anlegen und in Vercel als RESEND_API_KEY hinterlegen." : ""}
          </p>
        )}
        {zustellung && (
          <p className="mb-4 border-l-2 border-gold bg-card p-3 text-sm">
            {zc} Mails geprüft, davon {zb} unzustellbar. {zo > 0 ? `Noch ${zo} ohne endgültigen Status – bitte erneut abrufen.` : "Alle Mails haben einen endgültigen Status."}
          </p>
        )}
        <div className="mb-6 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-5">
          {["zugestellt", "unzustellbar", "beschwerde", "verzoegert", ""].map((k) => (
            <div key={k} className="bg-black p-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-dim">{k === "" ? "Noch nicht geprüft" : DELIVERY_LABEL[k]}</div>
              <div className={`mt-1 font-display text-3xl font-semibold ${k === "unzustellbar" && del[k] ? "text-red-400" : ""}`}>{del[k] ?? 0}</div>
            </div>
          ))}
        </div>
        {(bounces ?? []).length > 0 && (
          <div className="overflow-x-auto border border-line">
            <table className="admin-table w-full min-w-[640px]">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Gast</th>
                  <th>Adresse</th>
                  <th>Mail</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(bounces ?? []).map((b, i) => {
                  const g = (Array.isArray(b.event_guests) ? b.event_guests[0] : b.event_guests) as { first_name: string; last_name: string; company: string } | null;
                  return (
                    <tr key={b.id}>
                      <td className="text-dim">{i + 1}</td>
                      <td>
                        {g ? `${g.first_name} ${g.last_name}` : "–"}
                        {g?.company ? <div className="text-xs text-dim">{g.company}</div> : null}
                      </td>
                      <td>{b.to_email}</td>
                      <td className="text-xs">{MAIL_LABEL[b.type as keyof typeof MAIL_LABEL] ?? b.type}</td>
                      <td className="text-red-400">{DELIVERY_LABEL[b.delivery]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold uppercase">Bisher versendet</h2>
        <table className="admin-table w-full">
          <thead>
            <tr>
              <th>Mail</th>
              <th>Gesendet</th>
              <th>Fehler</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(MAIL_LABEL).map(([k, v]) => (
              <tr key={k}>
                <td>{v}</td>
                <td>{stats[k]?.ok ?? 0}</td>
                <td>{stats[k]?.err ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
