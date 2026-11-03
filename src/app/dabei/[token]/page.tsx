import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEvent, guestByToken } from "@/lib/event";
import { dabeiPosition, interestCounts, interestOf } from "@/lib/interest";
import { DabeiView } from "./view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sind Sie dabei? – FOI Weihnachtsfeier", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Dabei({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ antwort?: string; gespeichert?: string; aendern?: string }> }) {
  const { token } = await params;
  const { antwort, gespeichert, aendern } = await searchParams;
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
