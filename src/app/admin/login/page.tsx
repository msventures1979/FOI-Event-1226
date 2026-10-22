import { redirect } from "next/navigation";
import { authClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin-Login – FOI Racing", robots: { index: false } };

async function login(form: FormData) {
  "use server";
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  // Immer dieselbe Rückmeldung, damit nicht erkennbar ist, welche Adressen Admins sind
  if (await isAdminEmail(email)) {
    const supa = await authClient();
    await supa.auth.signInWithOtp({ email, options: { emailRedirectTo: `${env.siteUrl}/auth/callback`, shouldCreateUser: true } });
  }
  redirect("/admin/login?gesendet=1");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ gesendet?: string }> }) {
  const { gesendet } = await searchParams;
  return (
    <main className="mx-auto max-w-[480px] px-6 py-24">
      <p className="eyebrow mb-3">FOI Racing · Admin</p>
      <h1 className="font-display text-4xl font-bold uppercase">Anmelden</h1>
      {gesendet ? (
        <p className="mt-6 text-[17px] text-[#d1d1d1]">Wenn die Adresse freigeschaltet ist, kommt in wenigen Minuten ein Anmeldelink per E-Mail. Bitte öffnen Sie ihn im selben Browser, in dem Sie ihn angefordert haben.</p>
      ) : (
        <form action={login} className="mt-8">
          <label className="lbl" htmlFor="email">E-Mail-Adresse</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
          <button className="btn-gold mt-5">Anmeldelink senden</button>
        </form>
      )}
    </main>
  );
}
