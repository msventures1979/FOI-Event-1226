import { requireAdmin } from "@/lib/admin";
import { ImportForm } from "./form";

export default async function ImportPage() {
  await requireAdmin();
  return (
    <div className="max-w-[900px]">
      <h1 className="mb-3 font-display text-3xl font-semibold uppercase">Gäste importieren</h1>
      <p className="mb-6 text-muted">
        CSV (Semikolon oder Komma) oder XLSX. Erste Zeile = Spaltennamen: <code>Anrede, Titel, Vorname, Nachname, E-Mail, Unternehmen, Position, Notiz</code>. Jeder neue Gast bekommt automatisch einen Code. Doppelte E-Mail-Adressen werden übersprungen.
      </p>
      <ImportForm />
    </div>
  );
}
