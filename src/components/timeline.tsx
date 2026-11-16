"use client";

import { useRef } from "react";

export type TimelineStep = { time: string; title: string; text: string; who: string; gold?: boolean; badge?: string };

/** Komplette Tages-Timeline, horizontal scrollbar (Wischen, Pfeile, Tastatur) */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <span className="mr-2 text-sm text-dim md:hidden">Wischen für mehr →</span>
        <button type="button" onClick={() => scroll(-1)} aria-label="Zurück" className="hidden h-11 w-11 items-center justify-center border border-line-strong text-lg hover:border-gold md:flex">←</button>
        <button type="button" onClick={() => scroll(1)} aria-label="Weiter" className="hidden h-11 w-11 items-center justify-center border border-line-strong text-lg hover:border-gold md:flex">→</button>
      </div>
      <ol
        ref={ref}
        tabIndex={0}
        aria-label="Ablauf des Tages"
        className="flex snap-x snap-mandatory overflow-x-auto border-t-2 border-white pb-4 [scrollbar-color:#E6941A_#1a1a1a] [scrollbar-width:thin] focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
      >
        {steps.map((s, i) => (
          <li key={s.time + s.title} className={`w-[270px] shrink-0 snap-start py-7 pb-2 pr-7 ${i < steps.length - 1 ? "mr-7 border-r border-line" : ""}`}>
            <div className={`font-display text-[13px] uppercase tracking-[0.2em] ${s.gold ? "text-gold" : "text-dim"}`}>{s.who}</div>
            <div className={`mt-3 font-display text-[56px] font-semibold leading-none ${s.gold ? "text-gold" : ""}`}>{s.time}</div>
            <h3 className="mb-2 mt-4 flex flex-wrap items-center gap-2 text-xl font-semibold">
              {s.title}
              {s.badge && <span className="border border-gold px-2 py-0.5 font-display text-[11px] uppercase tracking-[0.2em] text-gold">{s.badge}</span>}
            </h3>
            <p className="text-base leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
