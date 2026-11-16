import Image from "next/image";

/** Partnerleiste (weiße Logos auf Schwarz) – Startseite oben, Anmeldeformular */
export const PARTNERS_TEXT = "School of Racing, KOS Klima, UNZER, billiger.de und ox8 Corporate Finance";

export function PartnerStrip({ label = "Möglich gemacht von unseren Partnern" }: { label?: string }) {
  return (
    <section aria-label="Partner" className="mb-10 border border-line bg-[#050505] px-6 py-5">
      <p className="mb-4 font-display text-xs uppercase tracking-[0.22em] text-gold">{label}</p>
      <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
        <Image src="/images/school-of-racing.svg" alt="School of Racing" width={50} height={40} unoptimized className="h-10 w-auto opacity-85" />
        <Image src="/images/kos-klima.png" alt="KOS Klima" width={118} height={20} className="h-5 w-auto opacity-85" />
        <Image src="/images/unzer.png" alt="UNZER" width={97} height={22} className="h-[22px] w-auto opacity-85" />
        <Image src="/images/billiger.png" alt="billiger.de" width={79} height={26} className="h-[26px] w-auto opacity-85" />
        <Image src="/images/ox8.png" alt="ox8 Corporate Finance" width={54} height={34} className="h-[34px] w-auto opacity-85" />
      </div>
    </section>
  );
}
