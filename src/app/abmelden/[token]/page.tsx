import type { Metadata } from "next";
import { PageShell } from "@/components/site";
import { SubmitButton } from "@/components/submit-button";
import { guestByToken } from "@/lib/event";
import { abmelden } from "./actions";

export const metadata: Metadata = { title: "Abmelden – FOI Weihnachtsfeier", robots: { index: false, follow: false } };

export default async function Abmelden({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { token } = await params;
  const { ok } = await searchParams;
  const found = await guestByToken(token);
  return (
    <PageShell plain>
      <main className="mx-auto max-w-xl px-5 py-16 sm:py-24">
        <p className="eyebrow">FOI Weihnachtsfeier · 14. Dezember 2026</p>
        {!found ? (
          <>
            <h1 className="mt-3 font-display text-3xl font-semibold uppercase">Link nicht gültig</h1>
            <p className="mt-4 text-[#bbb]">Bitte schreiben Sie uns kurz an info@frontlineofinnovation.de – wir tragen Sie dann aus.</p>
          </>
        ) : ok ? (
          <>
            <h1 className="mt-3 font-display text-3xl font-semibold uppercase">Sie sind abgemeldet</h1>
            <p className="mt-4 text-[#bbb]">Sie erhalten zur Weihnachtsfeier keine weiteren Mails von uns. Falls Sie es sich anders überlegen, können Sie jederzeit <a className="underline" href={`/dabei/${token}`}>hier antworten</a>.</p>
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-3xl font-semibold uppercase">Keine weiteren Mails?</h1>
            <p className="mt-4 text-[#bbb]">Mit einem Klick tragen wir Sie aus: Sie erhalten zur Weihnachtsfeier keine Erinnerungen mehr.</p>
            <form action={abmelden} className="mt-8">
              <input type="hidden" name="token" value={token} />
              <SubmitButton className="btn-gold" pendingText="…">Abmelden</SubmitButton>
            </form>
            <p className="mt-6 text-sm text-[#888]">Lieber doch dabei? <a className="underline" href={`/dabei/${token}`}>Zur Antwort</a></p>
          </>
        )}
      </main>
    </PageShell>
  );
}
