import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/site";
import { Progress } from "@/components/progress";
import { RegistrationForm } from "@/components/registration-form";
import { env } from "@/lib/env";
import { getEvent, getFreeSlots, guestByCode } from "@/lib/event";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anmeldung – FOI Racing" };

export default async function Anmeldung({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;

  if (!code) return <CodeEntry />;
  if (!env.hasDb) return <CodeEntry info="Die Anmeldung öffnet mit dem Versand der Einladungen Mitte November." />;

  const guest = await guestByCode(code);
  if (!guest) return <CodeEntry code={code} error="Dieser Code ist nicht gültig. Bitte prüfen Sie die Schreibweise in Ihrer Einladung." />;

  if (["angemeldet", "bestaetigt", "eingecheckt", "warteliste", "angeboten"].includes(guest.status)) {
    redirect(`/meine-teilnahme/${guest.manage_token}`);
  }

  const ev = await getEvent();
  const closed = ev.status !== "aktiv" || (ev.registration_deadline !== null && new Date() > new Date(ev.registration_deadline));
  if (closed) {
    return <CodeEntry info="Die Anmeldung ist geschlossen. Bitte schreiben Sie uns an info@frontlineofinnovation.de." />;
  }
  const slots = await getFreeSlots(ev.id);

  return (
    <PageShell>
      <main className="mx-auto max-w-[1040px] px-6 pb-24 pt-16">
        <Progress step={2} />
        <RegistrationForm guest={guest} slots={slots} />
      </main>
    </PageShell>
  );
}

function CodeEntry({ code = "", error, info }: { code?: string; error?: string; info?: string }) {
  return (
    <PageShell>
      <main className="mx-auto max-w-[1040px] px-6 pb-24 pt-16">
        <Progress step={1} />
        <section className="max-w-[560px]">
          <h1 className="font-display text-[56px] font-bold uppercase leading-none">Ihr Einladungscode</h1>
          <p className="mb-8 mt-4 text-[17px] leading-relaxed text-[#d1d1d1]">
            Den Code finden Sie in Ihrer persönlichen Einladung. Er gilt für eine Person und ist nach der Anmeldung verbraucht.
          </p>
          {info ? (
            <p className="border-l-2 border-gold bg-card p-4 text-[15px] text-[#d1d1d1]">{info}</p>
          ) : (
            <form action="/anmeldung" method="get">
              <label className="lbl" htmlFor="code">
                Einladungscode <span className="text-gold">*</span>
              </label>
              <input
                id="code"
                name="code"
                defaultValue={code}
                required
                autoComplete="off"
                placeholder="FOI-XXXXXXXX"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "code-err" : undefined}
                className="field !min-h-[60px] font-display !text-2xl tracking-[0.16em]"
              />
              {error && (
                <p id="code-err" role="alert" className="mt-3 text-[15px] text-gold">
                  {error}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <button type="submit" className="btn-gold">Weiter</button>
                <span className="text-sm text-[#a6a6a6]">Die Plätze sind auf 80 begrenzt.</span>
              </div>
            </form>
          )}
          <p className="mt-10 text-sm text-dim">
            <Link href="/" className="text-dim">Zurück zur Startseite</Link>
          </p>
        </section>
      </main>
    </PageShell>
  );
}
