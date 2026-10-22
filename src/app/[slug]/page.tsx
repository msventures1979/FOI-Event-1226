import { notFound } from "next/navigation";
import { PageShell } from "@/components/site";
import { Datenschutz, Impressum } from "@/content/legal";

/** Rechtstexte. Teilnahmebedingungen und Partnertexte folgen (Platzhalter, bis die Texte vorliegen). */
const PAGES: Record<string, { title: string; body: React.ReactNode }> = {
  impressum: { title: "Impressum", body: <Impressum /> },
  datenschutz: { title: "Datenschutz", body: <Datenschutz /> },
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
        <div className="mt-8 text-[17px] leading-relaxed text-[#d1d1d1]">{page.body}</div>
      </main>
    </PageShell>
  );
}
