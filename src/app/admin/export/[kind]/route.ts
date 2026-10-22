import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/supabase/admin";
import { getEvent } from "@/lib/event";
import { PARTICIPATION, STATUS_LABEL, type Guest, type Registration } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = Guest & { event_registrations: Registration | Registration[] | null };
const ACTIVE = ["angemeldet", "bestaetigt", "eingecheckt"];

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  await requireAdmin();
  const { kind } = await params;
  const ev = await getEvent();
  const { data } = await db().from("event_guests").select("*, event_registrations(*)").eq("event_id", ev.id).order("last_name");
  const rows = ((data ?? []) as Row[]).map((g) => ({ g, r: (Array.isArray(g.event_registrations) ? g.event_registrations[0] : g.event_registrations) ?? null }));

  const name = (g: Guest) => `${g.title ? g.title + " " : ""}${g.first_name} ${g.last_name}`;
  const type = (r: Registration | null) => (r?.participation_type ? PARTICIPATION[r.participation_type].short : r?.requested_type ? `(${PARTICIPATION[r.requested_type].short})` : "");
  const v = (r: Registration | null, k: string) => r?.vehicle?.[k] ?? "";

  let header: string[] = [];
  let body: (string | number)[][] = [];
  let title = "";

  switch (kind) {
    case "alle":
      title = "Alle Gäste";
      header = ["Anrede", "Titel", "Vorname", "Nachname", "E-Mail", "Unternehmen", "Position", "Code", "Status", "Warteliste #", "Teilnahme", "Zweitwunsch", "Zusatzwunsch", "Mobil", "Startnummer", "Ernährung", "Allergien", "Foto-Einwilligung", "Notiz"];
      body = rows.map(({ g, r }) => [
        g.salutation, g.title, g.first_name, g.last_name, g.email, g.company, g.position, g.code, STATUS_LABEL[g.status], g.waitlist_position ?? "",
        type(r), r?.second_choice ? PARTICIPATION[r.second_choice].short : "", r?.extra_ride ? "ja" : "", r?.mobile ?? "", r?.start_number ?? "",
        r?.diet ?? "", r?.allergies ?? "", r ? (r.consent_photo ? "ja" : "nein") : "", g.note,
      ]);
      break;
    case "fahrer":
      title = "Fahrerliste School of Racing";
      header = ["Startnummer", "Name", "Mobil", "Teilnahme", "Marke", "Modell", "Baujahr", "PS", "Getriebe", "Bereifung", "Kennzeichen", "Erfahrung", "Führerschein seit", "Körpergröße", "Zusatzwunsch"];
      body = rows
        .filter(({ g, r }) => ACTIVE.includes(g.status) && (r?.participation_type === "own" || r?.participation_type === "taxi"))
        .map(({ g, r }) => [r?.start_number ?? "", name(g), r?.mobile ?? "", type(r), v(r, "marke"), v(r, "modell"), v(r, "baujahr"), v(r, "ps"), v(r, "getriebe"), v(r, "reifen"), v(r, "kennzeichen"), r?.experience ?? "", r?.license_since ?? "", r?.height_cm ?? "", r?.extra_ride ? "ja" : ""]);
      break;
    case "lambo":
      title = "Lamborghini-Fahrten Autohaus Gohm";
      header = ["Startnummer", "Name", "Mobil", "E-Mail", "Führerschein seit", "Erfahrung"];
      body = rows
        .filter(({ g, r }) => ACTIVE.includes(g.status) && r?.participation_type === "lambo")
        .map(({ g, r }) => [r?.start_number ?? "", name(g), r?.mobile ?? "", g.email, r?.license_since ?? "", r?.experience ?? ""]);
      break;
    case "catering":
      title = "Ernährung Catering";
      header = ["Name", "Unternehmen", "Ernährung", "Allergien"];
      body = rows.filter(({ g }) => ACTIVE.includes(g.status)).map(({ g, r }) => [name(g), g.company, r?.diet ?? "", r?.allergies ?? ""]);
      break;
    case "checkin":
      title = "Check-in";
      header = ["✓", "Nachname", "Vorname", "Unternehmen", "Startnummer", "Teilnahme", "Mobil"];
      body = rows.filter(({ g }) => ACTIVE.includes(g.status)).map(({ g, r }) => [g.status === "eingecheckt" ? "✓" : "", g.last_name, g.first_name, g.company, r?.start_number ?? "", type(r), r?.mobile ?? ""]);
      break;
    default:
      return new NextResponse("Unbekannter Export", { status: 404 });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(title.slice(0, 31));
  ws.addRow(header).font = { bold: true };
  body.forEach((row) => ws.addRow(row));
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.columns.forEach((c) => (c.width = 18));
  ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:1" };

  const buf = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="FOI-Racing_${kind}_${date}.xlsx"`,
    },
  });
}
