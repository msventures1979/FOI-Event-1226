import "server-only";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const e = email.toLowerCase();
  if (env.adminEmails.includes(e)) return true;
  const { data } = await db().from("admin_users").select("email").eq("email", e).maybeSingle();
  return Boolean(data);
}

/** Für alle Admin-Seiten und -Aktionen: leitet auf den Login, wenn kein Admin angemeldet ist. */
export async function requireAdmin(): Promise<string> {
  const supa = await authClient();
  const { data } = await supa.auth.getUser();
  const email = data.user?.email;
  if (!(await isAdminEmail(email))) redirect("/admin/login");
  return email!;
}
