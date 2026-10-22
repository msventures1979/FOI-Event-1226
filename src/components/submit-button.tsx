"use client";

import { useFormStatus } from "react-dom";

/** Button, der während der Verarbeitung gesperrt ist (verhindert Doppelklicks). */
export function SubmitButton({ children, pendingText = "Wird verarbeitet …", className = "btn-gold" }: { children: React.ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
