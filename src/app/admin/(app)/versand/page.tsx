import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/supabase/admin";
import { MAIL_LABEL } from "@/lib/mail/templates";
import { SendForm } from "./form";

export default async function Versand() {
  await requireAdmin();
  const { data: log } = await db().from("email_log").select("type,status").limit(5000);
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
