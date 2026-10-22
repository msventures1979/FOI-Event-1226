/**
 * Rechtstexte für racing.frontlineofinnovation.de
 * Impressum: Angaben wie auf frontlineofinnovation.de
 * Datenschutz: auf die tatsächliche Datenverarbeitung dieser Seite zugeschnitten (Stand Oktober 2026)
 */

const MAIL = "info@frontlineofinnovation.de";

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-12 font-display text-2xl font-semibold uppercase tracking-[0.02em] text-white">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-7 text-[17px] font-semibold text-white">{children}</h3>;
}

function Mail() {
  return <a href={`mailto:${MAIL}`}>{MAIL}</a>;
}

export function Impressum() {
  return (
    <>
      <H2>Angaben gemäß § 5 DDG</H2>
      <p>
        not a usual business GmbH
        <br />
        „Frontline of Innovation“
        <br />
        Stresemannstr. 23
        <br />
        10963 Berlin
      </p>

      <H2>Kontakt</H2>
      <p>
        E-Mail: <Mail />
      </p>

      <H2>Veranstaltung</H2>
      <p>
        FOI Racing – Die Weihnachtsfeier der anderen Art ist eine Veranstaltung der Frontline of Innovation in Zusammenarbeit mit der School of Racing.
      </p>

      <H2>Haftung für Inhalte und Links</H2>
      <p>
        Wir erstellen die Inhalte dieser Seite mit Sorgfalt, übernehmen für ihre Richtigkeit, Vollständigkeit und Aktualität aber keine Gewähr. Für Inhalte
        verlinkter externer Seiten sind ausschließlich deren Betreiber verantwortlich. Werden uns Rechtsverletzungen bekannt, entfernen wir die betreffenden
        Inhalte oder Links umgehend.
      </p>

      <H2>Bildnachweis</H2>
      <p>School of Racing, Frontline of Innovation, Lamborghini Stuttgart / Autohaus Gohm.</p>
    </>
  );
}

export function Datenschutz() {
  return (
    <>
      <p>
        Mit dieser Erklärung informieren wir Sie, welche personenbezogenen Daten wir im Zusammenhang mit FOI Racing am 14. Dezember 2026 verarbeiten, wozu
        wir das tun und welche Rechte Sie haben. Diese Seite setzt keine Analyse- oder Werbe-Cookies ein und bindet keine Inhalte von Drittanbietern wie
        Google Fonts, Karten oder Social-Media-Plugins ein.
      </p>

      <H2>1. Verantwortlicher</H2>
      <p>
        not a usual business GmbH („Frontline of Innovation“)
        <br />
        Stresemannstr. 23, 10963 Berlin
        <br />
        E-Mail: <Mail />
      </p>

      <H2>2. Welche Daten wir verarbeiten und wozu</H2>

      <H3>Einladung</H3>
      <p>
        Wir laden Gäste ein, die wir aus dem Netzwerk der Frontline of Innovation kennen. Dafür verwenden wir Anrede, Titel, Vor- und Nachname,
        E-Mail-Adresse, Unternehmen und Position sowie einen persönlichen Einladungscode. Rechtsgrundlage ist unser berechtigtes Interesse an der Pflege
        unseres Netzwerks (Art. 6 Abs. 1 lit. f DSGVO). Wenn Sie keine Einladungen mehr erhalten möchten, genügt eine kurze Nachricht an <Mail />.
      </p>

      <H3>Anmeldung und Durchführung der Veranstaltung</H3>
      <p>
        Bei der Anmeldung verarbeiten wir zusätzlich Ihre Mobilnummer, die gewählte Teilnahmeart und einen eventuellen Zweitwunsch, Ihre Angaben zur
        Ernährung, den Status Ihrer Anmeldung sowie den Zeitpunkt Ihrer Zustimmung zu den Teilnahmebedingungen. Je nach Teilnahmeart kommen hinzu: Angaben
        zu Ihrem Fahrzeug (Marke, Modell, Baujahr, Leistung, Kennzeichen, Getriebe, Bereifung), das Jahr Ihres Führerscheins, Ihre
        Rennstreckenerfahrung, Ihre Körpergröße für das Renntaxi und Ihre Bestätigung des Haftungsverzichts bzw. der Nutzungsbedingungen. Rechtsgrundlage
        ist die Durchführung der Veranstaltung, zu der Sie sich anmelden (Art. 6 Abs. 1 lit. b DSGVO).
      </p>

      <H3>Allergien und Unverträglichkeiten</H3>
      <p>
        Angaben zu Allergien oder Unverträglichkeiten sind Gesundheitsdaten. Sie sind freiwillig und dienen ausschließlich dazu, das Essen für Sie
        passend vorzubereiten. Rechtsgrundlage ist Ihre Einwilligung, die Sie mit der Angabe erteilen (Art. 9 Abs. 2 lit. a DSGVO). Sie können sie
        jederzeit mit Wirkung für die Zukunft widerrufen.
      </p>

      <H3>Fotos und Videos</H3>
      <p>
        Bei der Veranstaltung wird fotografiert und gefilmt. Aufnahmen, auf denen Sie erkennbar im Mittelpunkt stehen, veröffentlichen wir nur, wenn Sie
        bei der Anmeldung zugestimmt haben (Art. 6 Abs. 1 lit. a DSGVO). Die Zustimmung können Sie jederzeit widerrufen.
      </p>

      <H3>E-Mails zur Veranstaltung</H3>
      <p>
        Wir schicken Ihnen Einladung, Anmeldebestätigung mit Kalendereintrag, Erinnerungen, organisatorische Hinweise und gegebenenfalls Nachrichten zur
        Warteliste. Damit Mails nicht doppelt verschickt werden und wir Zustellprobleme erkennen, speichern wir, welche Mail wann an welche Adresse ging.
      </p>

      <H3>Aufruf der Website</H3>
      <p>
        Beim Aufruf der Seite verarbeitet unser Hosting-Anbieter technisch notwendige Daten wie IP-Adresse, Datum und Uhrzeit, aufgerufene Seite und
        Browserkennung, um die Seite auszuliefern und vor Missbrauch zu schützen (Art. 6 Abs. 1 lit. f DSGVO). Für Gäste werden keine Cookies gesetzt.
        Nur im internen Verwaltungsbereich verwenden wir technisch notwendige Cookies für die Anmeldung des Veranstaltungsteams.
      </p>

      <H2>3. Wer Ihre Daten erhält</H2>
      <p>Wir geben Daten nur weiter, soweit es für die Veranstaltung nötig ist:</p>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>
          <b className="text-white">School of Racing</b> (Mitveranstalter): Name, Mobilnummer, Teilnahmeart, Fahrzeug- und Fahrerangaben sowie
          Körpergröße – für Gruppeneinteilung, Sicherheitseinweisung und Ablauf auf der Strecke.
        </li>
        <li>
          <b className="text-white">Autohaus Gohm / Lamborghini Stuttgart</b>: bei Lamborghini-Fahrten Name, Mobilnummer, Führerscheinjahr und
          Rennstreckenerfahrung.
        </li>
        <li>
          <b className="text-white">Gastronomie am Veranstaltungsort</b>: Anzahl der Gäste sowie Ernährungswünsche und Allergien, soweit möglich ohne
          Namensbezug.
        </li>
      </ul>
      <p className="mt-4">Außerdem setzen wir Dienstleister ein, die Daten in unserem Auftrag und nach unseren Weisungen verarbeiten:</p>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>
          <b className="text-white">Vercel Inc.</b> (USA) – Hosting der Website, Rechenzentrum in Frankfurt am Main
        </li>
        <li>
          <b className="text-white">Supabase Inc.</b> (USA) – Datenbank für Gästeliste und Anmeldungen, Speicherort Frankfurt am Main
        </li>
        <li>
          <b className="text-white">Resend</b> (USA) – Versand der E-Mails, Versand über Server in Irland
        </li>
      </ul>
      <p className="mt-4">
        Mit allen Dienstleistern bestehen Verträge zur Auftragsverarbeitung. Soweit dabei Daten in die USA übermittelt werden können, geschieht dies auf
        Grundlage des EU-US Data Privacy Framework, soweit der Anbieter danach zertifiziert ist, und im Übrigen auf Grundlage der
        EU-Standardvertragsklauseln. Eine Weitergabe zu Werbezwecken findet nicht statt.
      </p>

      <H2>4. Wie lange wir Daten speichern</H2>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>Fahrzeug- und Fahrerangaben, Körpergröße sowie Allergien und Ernährungsangaben löschen wir spätestens drei Monate nach der Veranstaltung.</li>
        <li>Die übrigen Anmeldedaten löschen wir spätestens zwölf Monate nach der Veranstaltung.</li>
        <li>
          Name, Kontaktdaten, Unternehmen und Position behalten wir als Teil unseres Netzwerks, bis Sie widersprechen. Gesetzliche
          Aufbewahrungspflichten bleiben unberührt.
        </li>
        <li>Wenn Sie absagen, behalten wir nur, dass Sie eingeladen waren und abgesagt haben.</li>
      </ul>

      <H2>5. Ihre Rechte</H2>
      <p>
        Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
        Datenübertragbarkeit (Art. 20) sowie auf Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3). Soweit wir Daten auf
        Grundlage berechtigter Interessen verarbeiten, können Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit widersprechen
        (Art. 21). Eine kurze Nachricht an <Mail /> genügt.
      </p>
      <p className="mt-4">
        Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren. Für uns zuständig ist die Berliner Beauftragte für Datenschutz und
        Informationsfreiheit, Alt-Moabit 59–61, 10555 Berlin.
      </p>

      <H2>6. Pflicht zur Bereitstellung</H2>
      <p>
        Die im Anmeldeformular als Pflichtangabe gekennzeichneten Daten brauchen wir, um Ihnen einen Platz zu geben und die Veranstaltung sicher
        durchzuführen. Ohne sie ist eine Teilnahme nicht möglich. Alle übrigen Angaben sind freiwillig. Eine automatisierte Entscheidungsfindung findet
        nicht statt; die Plätze werden in der Reihenfolge der Anmeldung vergeben.
      </p>

      <p className="mt-12 text-sm text-dim">Stand: Oktober 2026</p>
    </>
  );
}
