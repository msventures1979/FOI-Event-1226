import { notFound } from "next/navigation";
import { PageShell } from "@/components/site";

/** Rechtstexte – Inhalte folgen (Platzhalter, bis die Texte vorliegen). */
const PAGES: Record<string, { title: string; body: string }> = {
  impressum: { title: "Impressum", body: "[Impressum – verantwortliche Gesellschaft, Anschrift, Vertretung, Registereintrag, Kontakt]" },
  datenschutz: {
    title: "Datenschutz",
    body: "[Datenschutzerklärung – Verantwortlicher, Zwecke (Einladung, Anmeldung, Durchführung), Empfänger (School of Racing, Autohaus Gohm, Supabase, Resend, Vercel), Speicherdauer (Fahrzeug- und Führerscheinangaben bis 3 Monate nach dem Event), Rechte der Betroffenen]",
  },
  teilnahmebedingungen: { title: "Teilnahmebedingungen", body: "[Teilnahmebedingungen FOI Racing]" },
  haftungsverzicht: { title: "Haftungsverzicht School of Racing", body: "[Text bzw. PDF der School of Racing]" },
  "nutzungsbedingungen-gohm": { title: "Nutzungsbedingungen Autohaus Gohm", body: "[Text des Autohauses Gohm für die Lamborghini-Fahrten]" },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${PAGES[slug]?.title ?? ""} – FOI Racing` };
}

export default async function Legal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();
  return (
    <PageShell>
      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-20">
        <h1 className="font-display text-5xl font-bold uppercase leading-none">{page.title}</h1>
        <p className="mt-8 text-[17px] leading-relaxed text-[#d1d1d1]">{page.body}</p>
      </main>
    </PageShell>
  );
}
