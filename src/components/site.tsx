import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-black/95 backdrop-blur">
      <nav aria-label="Hauptnavigation" className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-4 no-underline">
          <Image src="/images/foi-logo.png" alt="Frontline of Innovation" width={97} height={40} className="h-10 w-auto" priority />
          <span aria-hidden className="h-7 w-px bg-[#333]" />
          <span className="text-[12px] uppercase leading-snug tracking-[0.12em] text-dim">
            in Zusammenarbeit mit
            <br />
            <span className="font-semibold text-white">School of Racing</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/#ablauf" className="py-3 text-[#ccc] no-underline hover:text-white">Ablauf</Link>
          <Link href="/#teilnahme" className="py-3 text-[#ccc] no-underline hover:text-white">Teilnahme</Link>
          <Link href="/#dinner" className="py-3 text-[#ccc] no-underline hover:text-white">Dinner &amp; Auktion</Link>
          <Link href="/#fragen" className="py-3 text-[#ccc] no-underline hover:text-white">Fragen</Link>
          <Link href="/anmeldung" className="btn-gold !min-h-11 !px-5 text-sm">Mit Code anmelden</Link>
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-6 px-6 py-10 text-sm text-dim">
        <div className="flex flex-wrap items-center gap-4">
          <Image src="/images/foi-logo.png" alt="Frontline of Innovation" width={78} height={32} className="h-8 w-auto" />
          <span>in Zusammenarbeit mit School of Racing</span>
        </div>
        <span>
          <a href="mailto:info@frontlineofinnovation.de">info@frontlineofinnovation.de</a>
        </span>
        <span className="flex flex-wrap gap-5">
          <Link href="/impressum" className="text-dim">Impressum</Link>
          <Link href="/datenschutz" className="text-dim">Datenschutz</Link>
          <span>Bildnachweis: School of Racing, Frontline of Innovation</span>
        </span>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
