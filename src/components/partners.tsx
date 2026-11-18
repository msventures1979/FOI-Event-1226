import Image from "next/image";

/** Partnerleiste (weiße Logos auf Schwarz) – Startseite oben, Anmeldeformular */
export const PARTNERS_TEXT = "School of Racing, KOS Klima, UNZER, billiger.de, ox8 Corporate Finance, COVADO, ROHDE BAIER und Lamborghini Stuttgart";

export function PartnerStrip({ label = "Möglich gemacht von unseren Partnern" }: { label?: string }) {
  return (
    <section aria-label="Partner" className="mb-10 border border-line bg-[#050505] px-6 py-7">
      <p className="mb-6 text-center font-display text-xs uppercase tracking-[0.22em] text-gold">{label}</p>
      <div className="grid grid-cols-2 place-items-center gap-x-8 gap-y-7 sm:grid-cols-4">
        <a href="https://www.school-of-racing.de" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/school-of-racing.svg" alt="School of Racing" width={50} height={40} unoptimized className="h-10 w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
        <a href="https://kosklima.de" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/kos-klima.png" alt="KOS Klima" width={118} height={20} className="h-5 w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
        <a href="https://www.unzer.com/de/" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/unzer.png" alt="UNZER" width={97} height={22} className="h-[22px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
        <a href="https://www.billiger.de" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/billiger.png" alt="billiger.de" width={79} height={26} className="h-[26px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
        <a href="https://ox8-cf.com" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/ox8.png" alt="ox8 Corporate Finance" width={54} height={34} className="h-[34px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
        <a href="https://covado.de/" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/covado.png" alt="COVADO Trusted Advisor" width={108} height={30} className="h-[30px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
        <a href="https://rohdebaier.de/" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/rohde-baier.png" alt="ROHDE BAIER" width={152} height={16} className="h-[16px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
        <a href="https://www.lamborghini-stuttgart.com/" target="_blank" rel="noopener noreferrer" className="group"><Image src="/images/lamborghini-stuttgart.png" alt="Lamborghini Stuttgart" width={84} height={46} className="h-[46px] w-auto opacity-85 transition-opacity group-hover:opacity-100" /></a>
      </div>
    </section>
  );
}
