import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEvent, guestByToken } from "@/lib/event";
import { type Interest, dabeiPosition, interestCounts, interestOf } from "@/lib/interest";
import { DabeiView } from "./view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sind Sie dabei? – FOI Weihnachtsfeier", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Dabei({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ antwort?: string; gespeichert?: string; aendern?: string; demo?: string }> }) {
  const { token } = await params;
  const { antwort, gespeichert, aendern, demo } = await searchParams;
  // Vorschau ohne Gästedaten: /dabei/vorschau – nichts wird gespeichert
  if (token === "vorschau") {
    const answer = demo === "dabei" || demo === "interessiert" || demo === "nicht" ? demo : null;
    const mine = answer ? ({ guest_id: "", event_id: "", answer, mode: "", vehicle: "", note: "", contact_email: "", created_at: "", updated_at: "" } as Interest) : null;
    return <DabeiView token="vorschau" first="Max" fullName="Max Mustermann" email="max.mustermann@beispiel.de" cap={80} dabei={0} mine={mine} showThanks={Boolean(mine)} pos={1} antwort={antwort} preview />;
  }
  const found = await guestByToken(token);
  if (!found) notFound();
  const { guest } = found;
  const ev = await getEvent();
  const [counts, mine] = await Promise.all([interestCounts(ev.id), interestOf(guest.id)]);
  const cap = ev.total_capacity ?? 80;
  const first = guest.first_name.trim();
  const showThanks = Boolean(mine && (gespeichert || !aendern) && !antwort);
  const pos = mine?.answer === "dabei" ? await dabeiPosition(ev.id, guest.id) : null;

  return (
    <DabeiView
      token={token}
      first={first}
      fullName={[guest.title, guest.first_name, guest.last_name].filter(Boolean).join(" ")}
      email={mine?.contact_email || guest.email}
      cap={cap}
      dabei={counts.dabei}
      mine={mine}
      showThanks={showThanks}
      pos={pos}
      antwort={antwort}
    />
  );
}
