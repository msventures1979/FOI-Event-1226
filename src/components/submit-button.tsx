"use client";

import { useFormStatus } from "react-dom";

/** Button, der während der Verarbeitung gesperrt ist (verhindert Doppelklicks). */
export function SubmitButton({ children, pendingText = "Wird verarbeitet …", className = "btn-gold", disabled = false }: { children: React.ReactNode; pendingText?: string; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
