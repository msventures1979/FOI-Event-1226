import Link from "next/link";
import { PageShell } from "@/components/site";

export default function NotFound() {
  return (
    <PageShell>
      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-20">
        <h1 className="font-display text-5xl font-bold uppercase leading-none">Seite nicht gefunden</h1>
        <p className="mt-6 text-[17px] text-[#d1d1d1]">
          Dieser Link ist nicht (mehr) gültig. Bei Fragen erreichen Sie uns unter <a href="mailto:info@frontlineofinnovation.de">info@frontlineofinnovation.de</a>.
        </p>
        <p className="mt-8">
          <Link href="/" className="btn-gold">Zur Startseite</Link>
        </p>
      </main>
    </PageShell>
  );
}
