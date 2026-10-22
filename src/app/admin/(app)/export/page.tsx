const EXPORTS: [string, string, string][] = [
  ["alle", "Alle Gäste", "Stammdaten, Status, Code, Teilnahme, Anmeldedaten"],
  ["fahrer", "Fahrerliste für School of Racing", "Eigener Wagen und Renntaxi: Name, Mobil, Fahrzeug, Bereifung, Erfahrung, Führerschein, Körpergröße"],
  ["lambo", "Liste für Autohaus Gohm", "Lamborghini-Fahrten: Name, Mobil, Führerschein seit, Erfahrung"],
  ["catering", "Ernährungsliste für das Catering", "Alle Angemeldeten mit Ernährung und Allergien"],
  ["checkin", "Check-in-Liste zum Ausdrucken", "Alphabetisch mit Startnummer und Teilnahmeart"],
];

export default function ExportPage() {
  return (
    <div className="max-w-[900px]">
      <h1 className="mb-6 font-display text-3xl font-semibold uppercase">Export</h1>
      <ul className="flex flex-col gap-3">
        {EXPORTS.map(([k, title, sub]) => (
          <li key={k} className="flex flex-wrap items-center justify-between gap-4 border border-line bg-card p-5">
            <div>
              <div className="font-semibold">{title}</div>
              <div className="text-sm text-muted">{sub}</div>
            </div>
            <a href={`/admin/export/${k}`} className="btn-ghost">Excel herunterladen</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
