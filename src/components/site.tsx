import Image from "next/image";
import Link from "next/link";

export function Header({ plain = false }: { plain?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-black/95 backdrop-blur">
      <nav aria-label="Hauptnavigation" className="mx-auto flex max-w-[1240px] items-center justify-between gap-x-6 px-4 py-2.5 sm:px-6 md:py-3.5">
        <Link href="/" className="flex items-center gap-3 no-underline sm:gap-4">
          <Image src="/images/foi-logo.png" alt="Frontline of Innovation" width={97} height={40} className="h-8 w-auto sm:h-10" priority />
          <span aria-hidden className="hidden h-7 w-px bg-[#333] sm:block" />
          <span className="hidden text-[12px] uppercase leading-snug tracking-[0.12em] text-dim sm:block">
            in Zusammenarbeit mit
            <br />
            <span className="font-semibold text-white">School of Racing</span>
          </span>
        </Link>
        {plain ? null : (
        <div className="flex items-center gap-x-6 text-sm">
          {/* Auf dem Handy nur der Anmelde-Button, damit der feste Kopf flach bleibt */}
          <Link href="/#ablauf" className="hidden py-3 text-[#ccc] no-underline hover:text-white lg:inline">Ablauf</Link>
          <Link href="/#teilnahme" className="hidden py-3 text-[#ccc] no-underline hover:text-white lg:inline">Teilnahme</Link>
          <Link href="/#dinner" className="hidden py-3 text-[#ccc] no-underline hover:text-white lg:inline">Dinner &amp; Auktion</Link>
          <Link href="/#fragen" className="hidden py-3 text-[#ccc] no-underline hover:text-white lg:inline">Fragen</Link>
          <Link href="/anmeldung" className="btn-gold !min-h-11 !px-4 text-sm sm:!px-5">
            <span className="sm:hidden">Anmelden</span>
            <span className="hidden sm:inline">Mit Code anmelden</span>
          </Link>
        </div>
        )}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-12 text-sm text-dim md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Image src="/images/foi-logo.png" alt="Frontline of Innovation" width={78} height={32} className="h-8 w-auto" />
          <p className="mt-4 max-w-sm leading-relaxed">
            Die FOI-Weihnachtsfeier am Hockenheimring – gemeinsam mit der School of Racing. Auf persönliche Einladung.
          </p>
        </div>
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-dim">Kontakt</p>
          <p className="mt-3">
            <a href="mailto:info@frontlineofinnovation.de">info@frontlineofinnovation.de</a>
          </p>
          <p className="mt-2">
            <a href="https://frontlineofinnovation.de" className="inline-block py-1.5 text-dim hover:text-white">frontlineofinnovation.de</a>
          </p>
        </div>
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-dim">Rechtliches</p>
          <p className="mt-3 flex flex-col">
            <Link href="/impressum" className="inline-block py-1.5 text-dim hover:text-white">Impressum</Link>
            <Link href="/datenschutz" className="inline-block py-1.5 text-dim hover:text-white">Datenschutz</Link>
          </p>
        </div>
      </div>
      <div className="border-t border-[#1a1a1a]">
        <p className="mx-auto max-w-[1240px] px-6 py-5 text-xs text-[#666]">© 2026 Frontline of Innovation</p>
      </div>
    </footer>
  );
}

export function PageShell({ children, plain = false }: { children: React.ReactNode; plain?: boolean }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header plain={plain} />
      {children}
      <Footer />
    </div>
  );
}
