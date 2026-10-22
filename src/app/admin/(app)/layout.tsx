import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – FOI Racing", robots: { index: false } };

const NAV = [
  ["/admin", "Übersicht"],
  ["/admin/gaeste", "Gäste"],
  ["/admin/import", "Import"],
  ["/admin/versand", "Versand"],
  ["/admin/export", "Export"],
  ["/admin/checkin", "Check-in"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-line bg-[#050505]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-3">
          <span className="font-display text-sm uppercase tracking-[0.2em] text-gold">FOI Racing · Admin</span>
          <nav className="flex flex-wrap gap-1 text-sm">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className="px-3 py-2 text-[#ccc] no-underline hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
          <span className="text-xs text-dim">{email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-6 py-10">{children}</main>
    </div>
  );
}
