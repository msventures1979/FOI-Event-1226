export function Progress({ step }: { step: 1 | 2 | 3 }) {
  const items = ["1 Code", "2 Angaben", "3 Bestätigt"];
  return (
    <ol aria-label="Fortschritt" className="mb-12 flex flex-wrap gap-2 font-display text-[13px] uppercase tracking-[0.16em]">
      {items.map((label, i) => {
        const active = i + 1 <= step;
        return (
          <li
            key={label}
            aria-current={i + 1 === step ? "step" : undefined}
            className={`border px-3.5 py-2 ${active ? "border-gold text-white" : "border-[#4d4d4d] text-[#8c8c8c]"}`}
          >
            {label}
          </li>
        );
      })}
    </ol>
  );
}
