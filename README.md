# FOI Event-Plattform – FOI Racing 2026

Landingpage, Einladungs- und Anmeldeprozess für **FOI Racing – Die Weihnachtsfeier der anderen Art**
(Montag, 14.12.2026, Hockenheimring). Erster Baustein der künftigen FOI-Plattform.

**Stack:** Next.js 15 (App Router, TypeScript, Tailwind) · Supabase (Postgres + Auth) · Resend · Vercel

## Was drin ist

| Bereich | Route | Inhalt |
| --- | --- | --- |
| Landingpage | `/` | One-Pager nach abgestimmtem Entwurf, zeigt „noch X frei“ ab < 20 freien Plätzen |
| Anmeldung | `/anmeldung?code=…` | Code prüfen → Formular je Teilnahmeart → atomare Platzvergabe (nie Überbuchung) |
| Bestätigung | `/anmeldung/bestaetigt?t=…` | Bestätigung oder Warteliste, Kalendereintrag |
| Absage | `/absage?code=…` | aus der Einladungsmail; mit Bestätigungs-Button (Schutz vor Link-Scannern) |
| Meine Teilnahme | `/meine-teilnahme/[token]` | Status, Teilnahme bestätigen, Nachrück-Angebot annehmen, absagen, .ics |
| Admin | `/admin` | Login per Magic Link · Übersicht & Kontingente · Gäste · Import · Versand · Export · Check-in |
| Cron | `/api/cron` | täglich: abgelaufene Angebote freigeben, (optional) Erinnerungen, Mail-Warteschlange |
| Rechtstexte | `/impressum`, `/datenschutz`, `/teilnahmebedingungen`, `/haftungsverzicht`, `/nutzungsbedingungen-gohm` | Platzhalter |

Datenbank: `supabase/migrations/` – Tabellen, RLS (alles gesperrt, Zugriff nur serverseitig mit Service-Role-Key)
und die Funktionen `register_guest`, `decline_guest`, `promote_next`, `accept_offer`, `expire_offers`, `free_slots`.

## Einrichtung

### 1. Supabase
- Projekt: `https://jjqdixmbmyfhfzrswqzu.supabase.co` (Organisation „FOI“, Free-Plan, Frankfurt)
- Migration einspielen: entweder automatisch über die GitHub-Integration (Push auf `main`)
  oder im Dashboard › **SQL Editor** den Inhalt von `supabase/migrations/20261022000000_init.sql` ausführen.
- **Authentication › URL Configuration:** Site URL `https://racing.frontlineofinnovation.de`,
  Redirect URLs `https://racing.frontlineofinnovation.de/auth/callback` und die Vercel-Preview-Domain `/auth/callback`.
- Schlüssel unter **Settings › API Keys**: `anon`/publishable Key und `service_role`/secret Key.

### 2. Resend
- Domain `frontlineofinnovation.de` (oder Subdomain) unter **Domains** hinzufügen, DNS-Einträge (SPF, DKIM) bei IONOS setzen, verifizieren.
- API-Key mit Sendeberechtigung anlegen.

### 3. Vercel
- **Add New › Project** → GitHub-Repo `msventures1979/FOI-Event-1226` importieren (Framework: Next.js, nichts ändern).
- **Settings › Environment Variables** – alle Werte aus `.env.example` eintragen.
- **Settings › Domains:** `racing.frontlineofinnovation.de` hinzufügen, CNAME bei IONOS setzen.
- Hinweis: Der Hobby-Plan ist laut Vercel nur für nicht-kommerzielle Nutzung; vor dem Go-live auf Pro wechseln.

### 4. Lokal
```bash
cp .env.example .env.local   # Werte eintragen
npm install
npm run dev                  # http://localhost:3000
```

## Save the Date (vor dem Go-live)
```bash
npm run save-the-date -- gaeste.csv              # Trockenlauf mit Vorschau
npm run save-the-date -- gaeste.csv --test=ihre@adresse.de
npm run save-the-date -- gaeste.csv --send --limit=90
```
CSV-Spalten: `Anrede;Titel;Vorname;Nachname;E-Mail`. Bereits Angeschriebene werden in
`scripts/.save-the-date-sent.json` vermerkt (nicht im Repo) und nie doppelt angeschrieben – bei mehr als 100
Empfängern einfach am nächsten Tag erneut starten (Resend-Free: 100 Mails/Tag).

## Ablauf im Admin
1. **Import:** Gästeliste (CSV/XLSX) hochladen – erst Vorschau, dann speichern. Jeder Gast bekommt einen Code `FOI-XXXXXX`.
2. **Übersicht:** Gesamtkontingent (80), Obergrenzen je Teilnahmeart, Anmeldeschluss.
3. **Versand:** Mail + Empfängergruppe wählen, Testmail an sich selbst, dann einreihen. Die Warteschlange läuft im Tageslimit
   (20 Plätze bleiben täglich für Bestätigungen reserviert).
4. **Export:** Fahrerliste (School of Racing), Lambo-Liste (Autohaus Gohm), Catering, Check-in.
5. **Check-in** am 14.12. auf dem Handy.

## Sicherheit
- Kein Secret im Repo – `.env*` ist ausgeschlossen. Gästelisten (`*.csv`, `*.xlsx`) ebenfalls.
- Alle Tabellen mit RLS gesperrt; der Browser spricht nie direkt mit der Datenbank.
- Codes und Verwaltungs-Tokens sind zufällig; Absagen brauchen einen Klick auf „Absage bestätigen“.
