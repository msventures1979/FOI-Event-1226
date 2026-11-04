import Image from "next/image";

/** Gastgeber-Karte mit Profilbild und LinkedIn-Link */
export function Person({ name, role, img, href }: { name: string; role: string; img: string; href: string }) {
  return (
    <li>
      <a href={href} target="_blank" rel="noopener" className="group flex min-h-16 items-center gap-4.5 border border-line-strong bg-black p-5 text-white no-underline hover:border-gold hover:text-white">
        <span aria-hidden className="relative size-16 flex-none overflow-hidden rounded-full border border-gold">
          <Image src={img} alt="" fill sizes="64px" className="photo object-cover" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[22px] font-semibold uppercase">{name}</span>
          <span className="mt-0.5 block text-sm text-muted">{role}</span>
        </span>
        <span className="flex flex-none items-center gap-1.5 text-[13px] text-dim group-hover:text-gold">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" />
          </svg>
          LinkedIn
        </span>
      </a>
    </li>
  );
}
